import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { Whatsapp, FirebaseAdapter } from "./index";
import { generateAutoReply, generateOutreach } from "./Services/AIHandler";
import { generateAdminReply } from "./Services/AdminHandler";
import { MessageQueue } from "./Services/MessageQueue";

// Multer: store uploads in memory (no disk, no Firebase by default)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Store session status in memory for the frontend test page
const sessionStatuses = new Map<string, { status: string, qr?: string }>();

// Guard: Track phone numbers to prevent duplicate connections
// Key: phone number (cleaned), Value: sessionId that owns it
const phoneToSessionGuard = new Map<string, string>();

// Initialize the WhatsApp engine with Firebase adapter
const whatsapp = new Whatsapp({
  adapter: new FirebaseAdapter(),
  onConnecting: (sessionId) => {
    console.log(`[${sessionId}] Connecting...`);
    sessionStatuses.set(sessionId, { status: 'connecting' });
  },
  onConnected: async (sessionId) => {
    console.log(`[${sessionId}] Connected`);

    // --- DUPLICATE PHONE NUMBER GUARD ---
    try {
      const session = await whatsapp.getSessionById(sessionId);
      const phoneNumber = session?.sock?.user?.id?.split(':')[0] || session?.sock?.user?.id?.split('@')[0];

      if (phoneNumber) {
        const existingOwner = phoneToSessionGuard.get(phoneNumber);
        if (existingOwner && existingOwner !== sessionId) {
          // This phone number is ALREADY connected under a different session!
          console.warn(`🚫 Duplicate phone detected! ${phoneNumber} is already in session '${existingOwner}'. Rejecting '${sessionId}'...`);
          sessionStatuses.set(sessionId, {
            status: 'duplicate_rejected',
            qr: undefined
          });

          // 🔥 IMMEDIATELY wipe Firebase credentials so this session won't reload on server restart
          try {
            await session?.store?.clearCreds();
            console.log(`🗑️ Firebase credentials cleared for duplicate session '${sessionId}'`);
          } catch (cleanErr) {
            console.error(`Failed to clear Firebase creds for '${sessionId}':`, cleanErr);
          }

          // After a delay, end the socket cleanly so frontend polling can detect status
          setTimeout(async () => {
            try {
              session?.sock?.end(undefined);
            } catch (_) { }
            sessionStatuses.delete(sessionId);
          }, 6000);
          return;
        }
        // Register this phone with this session as its rightful owner
        phoneToSessionGuard.set(phoneNumber, sessionId);
        console.log(`📱 Phone ${phoneNumber} registered to session '${sessionId}'`);
      }
    } catch (err) {
      console.error(`Guard check failed for session ${sessionId}:`, err);
    }
    // --- END GUARD ---

    sessionStatuses.set(sessionId, { status: 'connected', qr: undefined });
  },
  onDisconnected: (sessionId) => {
    console.log(`[${sessionId}] Disconnected`);
    // Clean up phone guard when a session disconnects
    for (const [phone, sid] of phoneToSessionGuard.entries()) {
      if (sid === sessionId) {
        phoneToSessionGuard.delete(phone);
        console.log(`🗑️ Phone guard cleared for session '${sessionId}'`);
        break;
      }
    }
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
    if (existing) {
      if (existing.status === 'connected') {
        sessionStatuses.set(sessionId, { status: 'connected' });
        return res.json({ message: `Session ${sessionId} is already active.` });
      } else {
        // Session exists but is NOT connected (stuck, rejected etc.) — force delete and restart fresh
        console.log(`♻️ Cleaning up stale/rejected session '${sessionId}' before restart...`);
        await whatsapp.deleteSession(sessionId);
        sessionStatuses.delete(sessionId);
      }
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
 * Disconnect and permanently delete a WhatsApp session
 * DELETE http://localhost:5000/session/delete/:sessionId
 */
app.delete("/session/delete/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  if (!sessionId) return res.status(400).json({ error: "sessionId is required" });

  try {
    const session = await whatsapp.getSessionById(sessionId);
    if (!session) {
      return res.status(404).json({ error: `Session '${sessionId}' not found.` });
    }

    console.log(`🔴 Disconnecting session '${sessionId}'...`);

    // Remove from phone guard
    for (const [phone, sid] of phoneToSessionGuard.entries()) {
      if (sid === sessionId) {
        phoneToSessionGuard.delete(phone);
        break;
      }
    }

    // Delete session (clears Firebase creds + ends socket)
    await whatsapp.deleteSession(sessionId);
    sessionStatuses.delete(sessionId);

    console.log(`✅ Session '${sessionId}' successfully disconnected and deleted.`);
    res.json({ message: `Session '${sessionId}' has been disconnected.` });
  } catch (error: any) {
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
app.post("/admin/chat", upload.single('file'), async (req: any, res) => {
  const query = req.body?.query || '';

  try {
    const sessions = await whatsapp.getSessionsIds();
    const queueStats = await queue.getStats();

    // Build optional file attachment
    let fileAttachment;
    if (req.file) {
      fileAttachment = {
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
        originalName: req.file.originalname
      };
    }

    // WhatsApp send function for AI function calling
    const sendWhatsappFn = async (sessionId: string, to: string, message: string) => {
      await whatsapp.sendText(sessionId, to, message);
    };

    const agentReply = await generateAdminReply(
      query,
      { activeSessions: sessions, pendingMessages: queueStats.pending, sentMessages: queueStats.sent },
      fileAttachment,
      sendWhatsappFn
    );

    res.json(agentReply);
  } catch (error: any) {
    res.status(500).json({ text: `Error: ${error.message}`, error: error.message });
  }
});

/**
 * Optional: Save a file to Firebase Storage
 * POST /admin/upload-to-storage
 */
app.post("/admin/upload-to-storage", upload.single('file'), async (req: any, res) => {
  if (!req.file) return res.status(400).json({ error: "No file provided" });
  try {
    const { getStorage } = await import('firebase-admin/storage');
    const storage = getStorage();
    const bucket = storage.bucket();
    const fileName = `admin-uploads/${Date.now()}-${req.file.originalname}`;
    const fileRef = bucket.file(fileName);
    await fileRef.save(req.file.buffer, { metadata: { contentType: req.file.mimetype } });
    await fileRef.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    res.json({ url: publicUrl, fileName });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log("--------------------------------------------------");
  console.log(`🚀 BulkReply.io API is running at http://localhost:${port}`);
  console.log("--------------------------------------------------");
});
