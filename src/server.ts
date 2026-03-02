import express from "express";
import { Whatsapp, FirebaseAdapter } from "./index";
import { generateAutoReply, generateOutreach } from "./Services/AIHandler";
import { generateAdminReply } from "./Services/AdminHandler";
import { MessageQueue } from "./Services/MessageQueue";

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static("public"));

// Store session status in memory for the frontend test page
const sessionStatuses = new Map<string, { status: string, qr?: string }>();

// Initialize the WhatsApp engine with Firebase adapter
const whatsapp = new Whatsapp({
  adapter: new FirebaseAdapter(),
  onConnecting: (sessionId) => {
    console.log(`[${sessionId}] Connecting...`);
    sessionStatuses.set(sessionId, { status: 'connecting' });
  },
  onConnected: (sessionId) => {
    console.log(`[${sessionId}] Connected`);
    sessionStatuses.set(sessionId, { status: 'connected', qr: undefined });
  },
  onDisconnected: (sessionId) => {
    console.log(`[${sessionId}] Disconnected`);
    sessionStatuses.set(sessionId, { status: 'disconnected', qr: undefined });
  },
  onMessageReceived: async (msg) => {
    // 1. Log incoming message
    const remoteJid = msg.key.remoteJid;
    const isFromMe = msg.key.fromMe;
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

    console.log(`[${msg.sessionId}] New Message from ${remoteJid}: ${text || "Media/Other"}`);

    // 2. Ignore messages sent by us (to prevent infinite loops) or messages without text
    if (isFromMe || !text || !remoteJid) return;

    // 3. Skip status broadcast and groups for now
    if (remoteJid === 'status@broadcast' || remoteJid.includes('@g.us')) return;

    // --- OWNER COMMANDS LOGIC ---
    // Fetch owner number for THIS session from database
    const ownerNumber = await (whatsapp as any).adapter.readData(msg.sessionId, 'ownerNumber');
    const cleanJid = remoteJid.split('@')[0];

    if (ownerNumber && cleanJid === ownerNumber && text.startsWith('!campaign')) {
      console.log(`👑 Owner Command Detected: ${text}`);
      try {
        // Parse: !campaign [context] | [number1, number2...]
        const content = text.replace('!campaign', '').trim();
        const parts = content.split('|');

        if (parts.length < 2) {
          throw new Error("Invalid format. Use: !campaign Business Info | 91XXXXXXXXXX, 91YYYYYYYYYY");
        }

        const businessContext = parts[0].trim();
        const rawNumbers = parts[1].split(',').map(n => n.trim());

        // Generate and queue
        const outreachMessage = await generateOutreach(businessContext);
        if (!outreachMessage) throw new Error("AI failed to generate message.");

        for (const num of rawNumbers) {
          const cleanNum = num.replace(/[^\d]/g, "");
          await queue.push(msg.sessionId, cleanNum, outreachMessage);
        }

        await whatsapp.sendText({
          sessionId: msg.sessionId,
          to: remoteJid,
          text: `✅ *Campaign Started!*\n\n*Contacts:* ${rawNumbers.length}\n*Message:* ${outreachMessage.substring(0, 50)}...`,
          answering: msg
        });
        return; // Don't process as regular AI auto-reply
      } catch (err: any) {
        await whatsapp.sendText({
          sessionId: msg.sessionId,
          to: remoteJid,
          text: `❌ *Error:* ${err.message}`,
          answering: msg
        });
        return;
      }
    }
    // --- END OWNER COMMANDS ---

    // 4. Show typing status while AI "thinks"
    console.log(`⏳ Sending typing indicator to ${remoteJid}...`);
    await whatsapp.sendTypingIndicator({
      sessionId: msg.sessionId,
      to: remoteJid,
      duration: 3000 // Show typing for 3 seconds
    });

    // 5. Generate AI Reply
    const isOwner = ownerNumber && cleanJid === ownerNumber;
    const aiResponse = await generateAutoReply(text, !!isOwner);

    // 6. Send reply if AI responded
    if (aiResponse) {
      console.log(`🤖 AI is replying to ${remoteJid}...`);
      try {
        if (aiResponse.includes("[SPLIT]")) {
          const parts = aiResponse.split("[SPLIT]").map(p => p.trim()).filter(p => p.length > 0);

          // First part: Send as Tagged Reply
          await whatsapp.sendText({
            sessionId: msg.sessionId,
            to: remoteJid,
            text: parts[0],
            answering: msg
          });

          // Subsequent parts: Send as separate messages
          for (let i = 1; i < parts.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5s natural delay
            await whatsapp.sendText({
              sessionId: msg.sessionId,
              to: remoteJid,
              text: parts[i]
              // No answering/tagging here
            });
          }
        } else {
          // Single part: Just send as tagged reply
          await whatsapp.sendText({
            sessionId: msg.sessionId,
            to: remoteJid,
            text: aiResponse,
            answering: msg
          });
        }
      } catch (error) {
        console.error("Failed to send AI reply:", error);
      }
    }
  }
});

// Initialize Anti-Ban Message Queue
const queue = new MessageQueue(whatsapp);
queue.startWorker().catch(err => console.error("Queue Start Error:", err));

/**
 * Start a new WhatsApp session
 * POST http://localhost:3000/session/start
 * Body: { "sessionId": "my-user-1" }
 */
app.post("/session/start", async (req, res) => {
  const { sessionId, ownerNumber } = req.body;
  if (!sessionId) return res.status(400).json({ error: "sessionId is required" });

  try {
    const existing = await whatsapp.getSessionById(sessionId);
    if (existing && existing.status === 'connected') {
      sessionStatuses.set(sessionId, { status: 'connected' });
      return res.json({ message: `Session ${sessionId} is already active.` });
    }

    await whatsapp.startSession(sessionId, {
      printQR: true,
      ownerNumber: ownerNumber,
      onQRUpdated: (qr) => {
        sessionStatuses.set(sessionId, { status: 'scan_qr', qr });
      }
    });
    res.json({
      message: `Session ${sessionId} started.`,
      instruction: "Please scan the QR code displayed on the page."
    });
  } catch (error: any) {
    if (error.message.includes('already exist')) {
      return res.json({ message: `Session ${sessionId} is resuming...` });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get active session IDs
 * GET http://localhost:3000/session/list
 */
app.get("/session/list", async (req, res) => {
  const sessions = await whatsapp.getSessionsIds();
  res.json({ sessions });
});

/**
 * Get status of a specific session (For Frontend Polling)
 * GET http://localhost:3000/session/status/:sessionId
 */
app.get("/session/status/:sessionId", (req, res) => {
  const sessionId = req.params.sessionId;
  const status = sessionStatuses.get(sessionId) || { status: "disconnected" };
  res.json(status);
});

/**
 * Send a text message
 * POST http://localhost:3000/message/send
 * Body: { "sessionId": "my-user-1", "to": "91XXXXXXXXXX", "text": "Hello from API!" }
 */
app.post("/message/send", async (req, res) => {
  const { sessionId, to, text } = req.body;

  if (!sessionId || !to || !text) {
    return res.status(400).json({ error: "sessionId, to, and text are required" });
  }

  try {
    await queue.push(sessionId, to, text);
    res.json({
      message: "Message added to secure queue",
      detail: "It will be sent automatically with anti-ban delay (5-12s)."
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Start an AI Proactive Outreach Campaign
 * POST http://localhost:3000/campaign/start
 * Body: { "sessionId": "my-user-1", "numbers": ["91XXXXXXXXXX"], "businessContext": "Brief info about service" }
 */
app.post("/campaign/start", async (req, res) => {
  const { sessionId, numbers, businessContext } = req.body;

  if (!sessionId || !numbers || !Array.isArray(numbers) || !businessContext) {
    return res.status(400).json({ error: "sessionId, numbers (array), and businessContext are required" });
  }

  try {
    console.log(`🚀 Starting AI Campaign for ${numbers.length} numbers using session: ${sessionId}`);

    // Generate the outreach message (One message for the whole campaign to save tokens, 
    // or you could generate per-user if needed)
    const outreachMessage = await generateOutreach(businessContext);

    if (!outreachMessage) {
      throw new Error("Failed to generate AI outreach message.");
    }

    for (const number of numbers) {
      // Clean number (remove spaces, +, etc.)
      const cleanNumber = number.replace(/[^\d]/g, "");
      await queue.push(sessionId, cleanNumber, outreachMessage);
    }

    res.json({
      message: `Campaign started for ${numbers.length} contacts.`,
      detail: "AI messages have been generated and added to the Anti-Ban queue.",
      preview: outreachMessage
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Admin AI Chat (Management Dashboard)
 * POST http://localhost:3000/admin/chat
 * Body: { "query": "How many messages sent?", "sessionId": "my-user-1" }
 */
app.post("/admin/chat", async (req, res) => {
  const { query, sessionId } = req.body;

  try {
    const sessions = await whatsapp.getSessionsIds();
    const queueStats = await queue.getStats();
    const ownerNumber = await (whatsapp as any).adapter.readData(sessionId, 'ownerNumber');

    const reply = await generateAdminReply(query, {
      activeSessions: sessions,
      pendingMessages: queueStats.pending,
      sentMessages: queueStats.sent
    });

    res.json({ reply });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log("--------------------------------------------------");
  console.log(`🚀 BulkReply.io API is running at http://localhost:${port}`);
  console.log("--------------------------------------------------");
});
