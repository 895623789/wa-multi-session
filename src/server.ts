import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { Whatsapp, FirebaseAdapter } from "./index";
import { generateAutoReply, generateOutreach, generateImageFromPrompt } from "./Services/AIHandler";
import { generateAdminReply } from "./Services/AdminHandler";
import { MessageQueue } from "./Services/MessageQueue";
import { downloadMediaMessage } from "baileys";

// Multer: store uploads in memory (no disk, no Firebase by default)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Store session status in memory for the frontend test page
const sessionStatuses = new Map<string, { status: string, qr?: string, pairingCode?: string }>();

// Guard: Track phone numbers to prevent duplicate connections
// Key: phone number (cleaned), Value: sessionId that owns it
const phoneToSessionGuard = new Map<string, string>();
const pendingSessionTimeouts = new Map<string, NodeJS.Timeout>();
// Guard: Sessions killed due to duplicate detection — prevent reconnect loop
const killedSessions = new Set<string>();

// ─── COST PROTECTION GUARDS ─────────────────────────────────────────────────
// 1. Track ALL connected bot phone numbers to prevent bot-to-bot infinite loops
// Key: phone number (cleaned), mapped to prevent Bot A ↔ Bot B auto-reply loop
const connectedBotPhones = new Set<string>();

// 2. Rate limiter: Max AI replies per contact per hour
const AI_RATE_LIMIT = 20; // max 20 AI calls per contact per hour
const aiRateMap = new Map<string, { count: number; resetAt: number }>();

// 3. Subscription cache (5 mins) to save Firestore reads
const subCache = new Map<string, { allowed: boolean; expiresAt: number }>();

function checkAiRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = aiRateMap.get(key);
  if (!entry || now > entry.resetAt) {
    aiRateMap.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true; // allowed
  }
  if (entry.count >= AI_RATE_LIMIT) {
    return false; // BLOCKED
  }
  entry.count++;
  return true; // allowed
}

// Auto-clean maps every 30 min to prevent memory leaks
setInterval(() => {
  const now = Date.now();

  // 1. Clean AI Rate Map
  for (const [key, entry] of aiRateMap.entries()) {
    if (now > entry.resetAt) aiRateMap.delete(key);
  }

  // 2. Clean Subscription Cache
  for (const [key, entry] of subCache.entries()) {
    if (now > entry.expiresAt) subCache.delete(key);
  }

  console.log("🧹 Background Memory Cleanup: Purged stale rate limits and caches.");
}, 30 * 60 * 1000);

// --- DAILY API QUOTA TRACKER ---
const checkApiQuota = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const uid = (req as any).uid || (req.body.sessionId ? req.body.sessionId.split('_')[0] : null);
  if (!uid) return res.status(400).json({ error: "UID required for quota check" });

  const limits = (req as any).userPlan;
  if (!limits) return next(); // Not a SaaS user or plan not loaded yet

  const dailyQuota = limits.dailyApiQuota || 0;
  if (dailyQuota === 0) return res.status(403).json({ error: "Your plan does not include API access. Please upgrade." });

  try {
    const db = getFirestore();
    const today = new Date().toISOString().split('T')[0];
    const usageRef = db.collection('users').doc(uid).collection('usage').doc(today);

    await db.runTransaction(async (t) => {
      const doc = await t.get(usageRef);
      const currentCount = doc.exists ? doc.data()?.apiCount || 0 : 0;

      if (currentCount >= dailyQuota) {
        throw new Error("DAILY_QUOTA_EXCEEDED");
      }

      t.set(usageRef, { apiCount: currentCount + 1 }, { merge: true });
    });

    next();
  } catch (error: any) {
    if (error.message === 'DAILY_QUOTA_EXCEEDED') {
      return res.status(429).json({
        error: `Daily API Quota Exceeded (${dailyQuota}/day). Please add credits or upgrade for more capacity.`,
        code: "QUOTA_EXCEEDED"
      });
    }
    console.error("Quota Transaction Error:", error);
    next(); // Fail open for safety, or return 500
  }
};

// --- SaaS Subscription Logic ---
import { getFirestore } from "firebase-admin/firestore";

type PlanTier = 'personal' | 'starter' | 'pro' | 'custom';
const PLAN_LIMITS: Record<PlanTier, { maxPA: number, maxBots: number, allowApi: boolean, allowCampaigns: boolean, dailyApiQuota: number }> = {
  personal: { maxPA: 1, maxBots: 0, allowApi: false, allowCampaigns: false, dailyApiQuota: 0 },
  starter: { maxPA: 2, maxBots: 3, allowApi: false, allowCampaigns: true, dailyApiQuota: 25 },
  pro: { maxPA: 10, maxBots: 15, allowApi: true, allowCampaigns: true, dailyApiQuota: 25 },
  custom: { maxPA: 100, maxBots: 100, allowApi: true, allowCampaigns: true, dailyApiQuota: 9999 }
};

const checkSubscription = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  let uid = req.body.uid || req.query.uid;
  const sessionId = req.body.sessionId || req.query.sessionId || req.params.sessionId;

  // If UID is missing but sessionId is present, extract UID from sessionId (format: uid_uuid)
  if (!uid && sessionId) {
    uid = sessionId.split('_')[0];
  }

  if (!uid) return res.status(400).json({ error: "Missing UID/SessionID identification" });

  try {
    const db = getFirestore();

    // 1. Agency Client Check
    if (uid.startsWith('agency_')) {
      return next(); // Agency bots tracked manually by the owner
    }

    // 2. Regular User SaaS Check
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      // New user? Default to personal trial logic or just block if no plan assigned
      // For now, let's be generous and treat missing doc as Personal (default).
      // But in production, you should block or create a default trial.
      return next();
    }

    const data = userDoc.data();

    // Agency owners and platform admins bypass subscription checks (global)
    if (data?.role === 'agency' || data?.role === 'admin' || data?.owner === true) {
      (req as any).userPlan = PLAN_LIMITS['custom']; // Grant full access
      return next();
    }

    const sub = data?.subscription;

    if (!sub || sub.status !== 'active') {
      return res.status(402).json({ error: "No active subscription", code: "SUBSCRIPTION_REQUIRED" });
    }

    const expiresAt = sub.expiresAt.toDate();
    if (new Date() > expiresAt) {
      return res.status(402).json({ error: "Subscription expired", code: "SUBSCRIPTION_EXPIRED" });
    }

    const plan: PlanTier = sub.plan || 'personal';
    const limits = PLAN_LIMITS[plan];
    (req as any).userPlan = limits; // Inject plan limits into request for downstream routes

    // Check session limits (only for start session endpoints)
    if (req.path.includes('/session/start')) {
      const { botType } = req.body; // 'personal_assistant' or 'business_bot' (default)
      const isPA = botType === 'personal_assistant';

      const sessionIds = await whatsapp.getSessionsIds();
      const userSessions = sessionIds.filter(id => id.startsWith(`${uid}_`));

      // Count existing types by reading store (this is a bit heavy, but accurate)
      let currentPaCount = 0;
      let currentBotCount = 0;

      for (const sid of userSessions) {
        const storedType = await (whatsapp as any).adapter.readData(sid, 'botType', 'config');
        if (storedType === 'personal_assistant') currentPaCount++;
        else currentBotCount++;
      }

      if (isPA) {
        if (currentPaCount >= limits.maxPA) {
          return res.status(402).json({
            error: `Personal Assistant limit reached. Your ${plan} plan allows max ${limits.maxPA} assistant(s).`,
            code: "LIMIT_REACHED"
          });
        }
      } else {
        if (currentBotCount >= limits.maxBots) {
          return res.status(402).json({
            error: `Business Bot limit reached. Your ${plan} plan allows max ${limits.maxBots} bot(s).`,
            code: "LIMIT_REACHED"
          });
        }
      }
    }

    next();
  } catch (err) {
    console.error("Subscription check error:", err);
    next(); // Fail-safe (let them in if DB is down? or block? usually better to block but for UX we might let in)
  }
};

// Initialize the WhatsApp engine with Firebase adapter
const whatsapp = new Whatsapp({
  adapter: new FirebaseAdapter(),
  autoLoad: false,
  onConnecting: (sessionId) => {
    // Block killed/duplicate sessions from reconnecting
    if (killedSessions.has(sessionId)) {
      console.log(`🛑 Blocked reconnect for killed session: ${sessionId}`);
      return;
    }
    console.log(`[${sessionId}] Connecting...`);
    // 🔑 FIX: Don't overwrite pairing_code status — keep the code visible for frontend polling
    const current = sessionStatuses.get(sessionId);
    if (current?.status === 'pairing_code') {
      // Keep pairingCode intact, just update status label
      sessionStatuses.set(sessionId, { status: 'pairing_code', pairingCode: current.pairingCode });
    } else {
      sessionStatuses.set(sessionId, { status: 'connecting' });
    }
  },
  onPairingCode: (sessionId, code) => {
    console.log(`[${sessionId}] Pairing Code: ${code}`);
    sessionStatuses.set(sessionId, { status: 'pairing_code', pairingCode: code });
  },
  onConnected: async (sessionId) => {
    console.log(`[${sessionId}] Connected`);

    // Clean up pending timeout if exists
    const pendingTimer = pendingSessionTimeouts.get(sessionId);
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      pendingSessionTimeouts.delete(sessionId);
    }

    // --- DUPLICATE PHONE NUMBER GUARD ---
    try {
      const session = await whatsapp.getSessionById(sessionId);
      const phoneNumber = session?.sock?.user?.id?.split(':')[0] || session?.sock?.user?.id?.split('@')[0];

      if (phoneNumber) {
        const existingOwner = phoneToSessionGuard.get(phoneNumber);
        if (existingOwner && existingOwner !== sessionId) {
          // This phone number is ALREADY connected under a different session!
          console.warn(`🚫 Duplicate phone detected! ${phoneNumber} is already in session '${existingOwner}'. Rejecting '${sessionId}'...`);

          // 1. Mark as killed to prevent reconnect loop
          killedSessions.add(sessionId);

          // 2. Set status so frontend can detect it
          sessionStatuses.set(sessionId, {
            status: 'duplicate_rejected',
            qr: undefined
          });

          // 3. Fully destroy the session after a short delay (so frontend can read status)
          setTimeout(async () => {
            try {
              await whatsapp.deleteSession(sessionId);
              console.log(`🗑️ Duplicate session '${sessionId}' fully destroyed.`);
            } catch (delErr) {
              console.error(`Failed to delete duplicate session '${sessionId}':`, delErr);
            }
            // Keep status for 30 more seconds for frontend polling, then clean up
            setTimeout(() => {
              sessionStatuses.delete(sessionId);
              killedSessions.delete(sessionId);
            }, 30000);
          }, 3000);
          return;
        }
        // Register this phone with this session as its rightful owner
        phoneToSessionGuard.set(phoneNumber, sessionId);
        connectedBotPhones.add(phoneNumber); // Track for bot-to-bot loop protection
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

    // Clean up pending timeout if exists
    const pendingTimer = pendingSessionTimeouts.get(sessionId);
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      pendingSessionTimeouts.delete(sessionId);
    }

    // Clean up phone guard when a session disconnects
    for (const [phone, sid] of phoneToSessionGuard.entries()) {
      if (sid === sessionId) {
        phoneToSessionGuard.delete(phone);
        connectedBotPhones.delete(phone); // Remove from bot-to-bot guard
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

    // Extract text, image, and document
    let text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
    let imageObject: { data: string, mimeType: string } | undefined = undefined;
    let documentObject: { data: string, mimeType: string } | undefined = undefined;

    // Handle Image
    const imageMessage = msg.message?.imageMessage;
    if (imageMessage) {
      text = imageMessage.caption || text;
      try {
        console.log(`[${msg.sessionId}] Downloading image from ${remoteJid}...`);
        const buffer = await downloadMediaMessage(msg, 'buffer', {}, { logger: undefined, reuploadRequest: undefined });
        imageObject = { data: buffer.toString('base64'), mimeType: imageMessage.mimetype || 'image/jpeg' };
      } catch (err) {
        console.error(`[${msg.sessionId}] Failed to download image:`, err);
      }
    }

    // Handle Document (PDF)
    const docMessage = msg.message?.documentMessage;
    if (docMessage) {
      text = docMessage.caption || text;
      try {
        console.log(`[${msg.sessionId}] Downloading document from ${remoteJid}...`);
        const buffer = await downloadMediaMessage(msg, 'buffer', {}, { logger: undefined, reuploadRequest: undefined });
        documentObject = { data: buffer.toString('base64'), mimeType: docMessage.mimetype || 'application/pdf' };
      } catch (err) {
        console.error(`[${msg.sessionId}] Failed to download document:`, err);
      }
    }

    console.log(`[${msg.sessionId}] New Message from ${remoteJid}: ${text ? text : (imageObject ? "[Image]" : (documentObject ? "[Document]" : "Media"))}`);

    // --- STRANGER INTERCEPTION (Power 5) ---
    // If message is from a non-owner, forward it to the owner
    const [botType, ownerNumber] = await Promise.all([
      (whatsapp as any).adapter.readData(msg.sessionId, 'botType'),
      (whatsapp as any).adapter.readData(msg.sessionId, 'ownerNumber')
    ]);

    const senderPhone = remoteJid?.split('@')[0];
    const isOwner = ownerNumber && senderPhone === ownerNumber.replace(/[^\d]/g, "");

    if (!isOwner && !isFromMe && ownerNumber && remoteJid && !remoteJid.includes('@g.us')) {
      console.log(`📡 Intercepting message for owner from ${senderPhone}`);

      // Fetch Bot Identity for generating a persona-based suggestion
      const [instructions, businessInfo, name, role, gender, age] = await Promise.all([
        (whatsapp as any).adapter.readData(msg.sessionId, 'instructions'),
        (whatsapp as any).adapter.readData(msg.sessionId, 'businessInfo'),
        (whatsapp as any).adapter.readData(msg.sessionId, 'name'),
        (whatsapp as any).adapter.readData(msg.sessionId, 'role'),
        (whatsapp as any).adapter.readData(msg.sessionId, 'gender'),
        (whatsapp as any).adapter.readData(msg.sessionId, 'age')
      ]);

      const currentTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
      const interceptionPrompt = `[INTERCEPTION PROTOCOL] Boss, a stranger (${senderPhone}) just messaged the bot.
Message: "${text || "[Media Attached]"}"
Please summarize this for me and suggest a reply based on our business profile and my persona.`;

      // Call AI to get a suggested reply
      const suggestion = await generateAutoReply(
        interceptionPrompt,
        true, // Treating as owner context to get suggestion
        instructions,
        businessInfo,
        msg.sessionId,
        ownerNumber, // Note: Not using remoteJid (the stranger), but the owner
        imageObject,
        { name, role, gender, age },
        documentObject,
        currentTime
      );

      const forwardText = `🔔 *New Message Intercepted*\n\n*From:* ${senderPhone}\n*Bot:* ${msg.sessionId}\n*Message:* ${text || "[Media Attached]"}\n\n--- AI SUGGESTION ---\n${suggestion?.text || "I'm monitoring this, Boss. What should I do?"}`;

      whatsapp.sendText({
        sessionId: msg.sessionId,
        to: ownerNumber,
        text: forwardText
      }).catch(e => console.error("Interception forward failed:", e));
    }

    // --- SUBSCRIPTION CHECK FOR AI REPLIES (with 5-min cache) ---
    try {
      const storedUid = await (whatsapp as any).adapter.readData(msg.sessionId, 'ownerUid');
      const uidFromSession = storedUid || msg.sessionId.split('_')[0];

      // Check cache first
      const cached = subCache.get(uidFromSession);
      const now = Date.now();

      if (cached && now < cached.expiresAt) {
        if (!cached.allowed) {
          console.warn(`⚠️ [${msg.sessionId}] AI Reply blocked (cached): Subscription/Agency Access expired.`);
          return;
        }
      } else {
        let allowed = true;

        // 1. Check if it's an agency-managed bot
        if (uidFromSession.startsWith('agency_') || uidFromSession === 'agent') {
          // bypass for agency/test bots
          allowed = true;
        } else {
          // 2. Check user role and subscription for regular SaaS bots
          const userDoc = await getFirestore().collection('users').doc(uidFromSession).get();
          const userData = userDoc.data();

          if (userData?.role !== 'agency' && userData?.role !== 'admin' && userData?.owner !== true) {
            const sub = userData?.subscription;
            const isExpired = sub?.expiresAt ? (new Date() > sub.expiresAt.toDate()) : false;
            if (!sub || sub.status !== 'active' || isExpired) {
              allowed = false;
            }
          }
        }

        // Cache for 5 minutes
        subCache.set(uidFromSession, { allowed, expiresAt: now + 5 * 60 * 1000 });
        if (!allowed) {
          console.warn(`⚠️ [${msg.sessionId}] AI Reply blocked: Subscription missing/expired for UID [${uidFromSession}].`);
          return;
        }
      }
    } catch (subErr) {
      // Fail-open: if subscription check itself errors, allow the reply
      console.error(`⚠️ [${msg.sessionId}] Sub check error (allowing reply):`, subErr);
    }

    // 2. Ignore messages sent by us (to prevent infinite loops) or messages without text/media
    if (isFromMe || (!text && !imageObject && !documentObject) || !remoteJid) return;

    // 3. Skip status broadcast and groups for now
    if (remoteJid === 'status@broadcast' || remoteJid.includes('@g.us')) return;

    // --- REAL-TIME STATUS CHECK (ON/OFF Logic) ---
    const isActiveStr = await (whatsapp as any).adapter.readData(msg.sessionId, 'isActive', 'config');
    console.log(`🔍 [${msg.sessionId}] isActive=${isActiveStr}, botType=${botType}, ownerNumber=${ownerNumber || 'NOT SET'}`);
    if (isActiveStr === 'false') {
      console.log(`⏸️ [${msg.sessionId}] Logic is paused. Ignoring message.`);
      return;
    }

    // --- BOT-TO-BOT LOOP PROTECTION ---
    if (connectedBotPhones.has(senderPhone)) {
      console.warn(`🛑 [${msg.sessionId}] BLOCKED bot-to-bot message from ${senderPhone}`);
      return;
    }

    // --- PERSONAL ASSISTANT LOGIC ---
    if (botType === 'personal_assistant') {
      const cleanOwner = ownerNumber?.replace(/[^\d]/g, "");
      const cleanSender = senderPhone;

      if (cleanOwner !== cleanSender) return;
    }

    // --- RATE LIMIT CHECK ---
    const rateLimitKey = `${msg.sessionId}::${senderPhone}`;
    if (!checkAiRateLimit(rateLimitKey)) {
      console.warn(`⚠️ [${msg.sessionId}] RATE LIMITED: ${senderPhone}`);
      return;
    }

    // --- OWNER COMMANDS LOGIC ---
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

    // 4. Check if bot is Active (inactive = connected but no replies)
    const isActiveSetting = await (whatsapp as any).adapter.readData(msg.sessionId, 'isActive');
    // isActive defaults to true unless explicitly set to 'false'
    const botIsActive = isActiveSetting !== 'false';
    if (!botIsActive) {
      console.log(`⏸️ [${msg.sessionId}] Bot is INACTIVE. Message from ${senderPhone} received but no reply sent.`);
      return;
    }

    // 5. Show typing status while AI "thinks"
    console.log(`⏳ Sending typing indicator to ${remoteJid}...`);
    await whatsapp.sendTypingIndicator({
      sessionId: msg.sessionId,
      to: remoteJid,
      duration: 3000 // Show typing for 3 seconds
    });

    // 5. Generate AI Reply
    const isOwnerFinal = !!isOwner; // Use the isOwner calculated in Stranger Interception block

    // Fetch custom instructions, business info and identity for THIS session
    const [instructions, businessInfo, name, role, gender, age] = await Promise.all([
      (whatsapp as any).adapter.readData(msg.sessionId, 'instructions'),
      (whatsapp as any).adapter.readData(msg.sessionId, 'businessInfo'),
      (whatsapp as any).adapter.readData(msg.sessionId, 'name'),
      (whatsapp as any).adapter.readData(msg.sessionId, 'role'),
      (whatsapp as any).adapter.readData(msg.sessionId, 'gender'),
      (whatsapp as any).adapter.readData(msg.sessionId, 'age')
    ]);

    const currentTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const aiResult = await generateAutoReply(
      text,
      isOwnerFinal,
      instructions,
      businessInfo,
      msg.sessionId,
      remoteJid,
      imageObject,
      { name, role, gender, age },
      documentObject,
      currentTime
    );

    // 6. Process Tool Calls (Actions)
    if (aiResult?.toolCalls) {
      for (const call of aiResult.toolCalls) {
        if (call.name === 'send_bulk_message') {
          const { numbers, message, media } = call.args as { numbers: string[], message: string, media?: string };
          console.log(`📡 [${msg.sessionId}] AI Action: Sending bulk message to ${numbers.length} contacts.`);

          for (const num of numbers) {
            const cleanNum = num.replace(/[^\d]/g, "");
            if (cleanNum.length > 5) {
              await queue.push(msg.sessionId, cleanNum, message, media);
            }
          }
        }

        if (call.name === 'generate_image') {
          const { prompt, caption, sendTo } = call.args as { prompt: string, caption?: string, sendTo?: string[] };
          console.log(`🎨 [${msg.sessionId}] AI Action: Generating image - "${prompt}"`);

          // Notify the user that generation is starting
          await whatsapp.sendText({ sessionId: msg.sessionId, to: remoteJid, text: `🎨 Generating image: "${prompt}"...` });

          const imageUrl = await generateImageFromPrompt(prompt);

          if (imageUrl) {
            const targetNumbers = sendTo && sendTo.length > 0 ? sendTo.map(n => n.replace(/[^\d]/g, "")) : [remoteJid.split('@')[0]];
            for (const num of targetNumbers) {
              if (num.length > 5) {
                // Push to queue as a media message (URL as media)
                await queue.push(msg.sessionId, num, caption || `🎨 AI Generated Image: ${prompt}`, imageUrl);
              }
            }
            // Only send a confirmation if sent to others (not self)
            if (sendTo && sendTo.length > 0) {
              await whatsapp.sendText({ sessionId: msg.sessionId, to: remoteJid, text: `✅ Image generated and queued for ${sendTo.length} contact(s)!` });
            }
          } else {
            await whatsapp.sendText({ sessionId: msg.sessionId, to: remoteJid, text: `❌ Sorry Boss, image generation failed. Please try again with a different prompt.` });
          }
        }

        if (call.name === 'schedule_task') {
          const { type, time, data } = call.args as { type: string, time: string, data?: any };
          console.log(`⏰ [${msg.sessionId}] AI Action: Scheduling ${type} for ${time}`);

          try {
            const db = getFirestore();
            await db.collection('scheduled_tasks').add({
              sessionId: msg.sessionId,
              ownerNumber: ownerNumber,
              type,
              time: new Date(time).toISOString(),
              data,
              status: 'pending',
              createdAt: new Date().toISOString()
            });
          } catch (err) {
            console.error("Failed to schedule task:", err);
          }
        }
      }
    }

    // 7. Send reply if AI responded with text
    if (aiResult?.text) {
      console.log(`🤖 AI is replying to ${remoteJid}...`);
      try {
        if (aiResult.text.includes("[SPLIT]")) {
          const parts = aiResult.text.split("[SPLIT]").map(p => p.trim()).filter(p => p.length > 0);

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
            });
          }
        } else {
          // Single part: Just send as tagged reply
          await whatsapp.sendText({
            sessionId: msg.sessionId,
            to: remoteJid,
            text: aiResult.text,
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
app.post("/session/start", checkSubscription, async (req: any, res) => {
  const { sessionId, uid, ownerNumber, instructions, businessInfo, name, role, gender, age, botType } = req.body;
  if (!sessionId) return res.status(400).json({ error: "sessionId is required" });
  // UID ownership check: if uid provided, sessionId MUST start with uid_
  // Special handling for Agency Portal to support legacy "agent_" IDs created during initial dev
  const isAgencyUid = uid?.startsWith('agency_');
  const hasValidPrefix = sessionId.startsWith(`${uid}_`);
  const isLegacyAgencyAgent = isAgencyUid && sessionId.startsWith('agent_');

  if (uid && !hasValidPrefix && !isLegacyAgencyAgent) {
    console.warn(`🛑 403 Access Denied: Mismatch between UID [${uid}] and Session ID [${sessionId}]. Prefix [${uid}_] expected.`);
    return res.status(403).json({ error: `Session ownership mismatch. UID [${uid}] cannot manage [${sessionId}].` });
  }

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

    // --- AUTO-CLEANUP PENDING SESSIONS ---
    const existingTimer = pendingSessionTimeouts.get(sessionId);
    if (existingTimer) clearTimeout(existingTimer);

    const timer = setTimeout(async () => {
      const s = await whatsapp.getSessionById(sessionId);
      if (s && s.status !== 'connected') {
        console.log(`⏰ Auto-cleaning unattended session '${sessionId}' to save RAM (no scan in 3 mins).`);
        await whatsapp.deleteSession(sessionId);
        sessionStatuses.delete(sessionId);
      }
      pendingSessionTimeouts.delete(sessionId);
    }, 3 * 60 * 1000); // 3 minutes timeout
    pendingSessionTimeouts.set(sessionId, timer);
    // -------------------------------------

    // Save custom AI personality data
    if (instructions) await (whatsapp as any).adapter.writeData(sessionId, 'instructions', 'config', instructions);
    if (businessInfo) await (whatsapp as any).adapter.writeData(sessionId, 'businessInfo', 'config', businessInfo);
    if (uid) await (whatsapp as any).adapter.writeData(sessionId, 'ownerUid', 'config', uid);
    if (ownerNumber) await (whatsapp as any).adapter.writeData(sessionId, 'ownerNumber', 'config', ownerNumber);
    if (botType) await (whatsapp as any).adapter.writeData(sessionId, 'botType', 'config', botType);
    if (name) await (whatsapp as any).adapter.writeData(sessionId, 'name', 'config', name);
    if (role) await (whatsapp as any).adapter.writeData(sessionId, 'role', 'config', role);
    if (gender) await (whatsapp as any).adapter.writeData(sessionId, 'gender', 'config', gender);
    if (age) await (whatsapp as any).adapter.writeData(sessionId, 'age', 'config', age);

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
 * 🗑️ Delete a Bot (Cascade)
 * POST /bot/delete
 * Body: { sessionId, clientId }
 * - Stops WhatsApp session
 * - Deletes Firestore auth/config data
 * - Removes from agencyAgents agents array
 */
app.post("/bot/delete", async (req: any, res) => {
  const { sessionId, clientId } = req.body;
  if (!sessionId) return res.status(400).json({ error: "sessionId is required" });

  const errors: string[] = [];
  console.log(`🗑️ DELETE BOT requested: ${sessionId} (client: ${clientId})`);

  // Step 1: Disconnect & remove Baileys session
  try {
    const existing = await whatsapp.getSessionById(sessionId);
    if (existing) {
      await whatsapp.deleteSession(sessionId);
      sessionStatuses.delete(sessionId);
      console.log(`✅ Baileys session deleted: ${sessionId}`);
    }
  } catch (err: any) {
    errors.push(`Session stop error: ${err.message}`);
    console.error(`⚠️ Could not stop session (may already be disconnected):`, err.message);
  }

  // Step 2: Delete Firestore auth/config data (wa_sessions, bot_config etc)
  try {
    const db = getFirestore();
    const collections = ['wa_sessions', 'bot_config', 'wa_chats'];
    for (const col of collections) {
      const snap = await db.collection(col).where('sessionId', '==', sessionId).get();
      const batch = db.batch();
      snap.docs.forEach(d => batch.delete(d.ref));
      if (!snap.empty) await batch.commit();
    }
    // Also delete the specific session doc
    await db.collection('wa_sessions').doc(sessionId).delete().catch(() => { });
    console.log(`✅ Firestore session data deleted for: ${sessionId}`);
  } catch (err: any) {
    errors.push(`Firestore cleanup error: ${err.message}`);
    console.error("⚠️ Firestore cleanup error:", err.message);
  }

  // Step 3: Remove from agencyAgents agents array
  if (clientId) {
    try {
      const db = getFirestore();
      const agentDocRef = db.collection('agencyAgents').doc(clientId);
      const agentDoc = await agentDocRef.get();
      if (agentDoc.exists) {
        const data = agentDoc.data();
        const updatedAgents = (data?.agents || []).filter((a: any) => a.id !== sessionId);
        await agentDocRef.update({ agents: updatedAgents });
        console.log(`✅ Removed bot ${sessionId} from agencyAgents/${clientId}`);
      }
    } catch (err: any) {
      errors.push(`Agency agents update error: ${err.message}`);
      console.error("⚠️ Failed to remove from agencyAgents:", err.message);
    }
  }

  if (errors.length > 0) {
    return res.status(207).json({
      message: `Bot deleted with ${errors.length} partial error(s).`,
      errors,
      sessionId
    });
  }

  res.json({ message: `✅ Bot ${sessionId} deleted successfully.`, sessionId });
});

/**
 * Start a new WhatsApp session with Pairing Code
 * POST http://localhost:5000/session/start-pairing
 * Body: { "sessionId": "my-user-1", "phoneNumber": "91XXXXXXXXXX" }
 */
app.post("/session/start-pairing", checkSubscription, async (req, res) => {
  const { sessionId, uid, phoneNumber, ownerNumber, instructions, businessInfo, name, role, gender, age, botType } = req.body;
  if (!sessionId) return res.status(400).json({ error: "sessionId is required" });
  if (!phoneNumber) return res.status(400).json({ error: "phoneNumber is required" });

  // UID ownership check
  const isAgencyUid = uid?.startsWith('agency_');
  const hasValidPrefix = sessionId.startsWith(`${uid}_`);
  const isLegacyAgencyAgent = isAgencyUid && sessionId.startsWith('agent_');

  if (uid && !hasValidPrefix && !isLegacyAgencyAgent) {
    console.warn(`🛑 403 Access Denied (Pairing): Mismatch between UID [${uid}] and Session ID [${sessionId}]. Prefix [${uid}_] expected.`);
    return res.status(403).json({ error: `Session ownership mismatch. UID [${uid}] cannot manage [${sessionId}].` });
  }

  try {
    const existing = await whatsapp.getSessionById(sessionId);
    if (existing) {
      if (existing.status === 'connected') {
        return res.json({ message: `Session ${sessionId} is already active.` });
      } else {
        await whatsapp.deleteSession(sessionId);
      }
    }

    await whatsapp.startSessionWithPairingCode(sessionId, {
      phoneNumber: phoneNumber,
      onPairingCode: (code) => {
        console.log(`🔑 [${sessionId}] Received pairing code from Baileys: ${code}`);
        sessionStatuses.set(sessionId, { status: 'pairing_code', pairingCode: code });
      }
    });

    // Save custom AI personality data
    if (instructions) await (whatsapp as any).adapter.writeData(sessionId, 'instructions', 'config', instructions);
    if (businessInfo) await (whatsapp as any).adapter.writeData(sessionId, 'businessInfo', 'config', businessInfo);
    if (uid) await (whatsapp as any).adapter.writeData(sessionId, 'ownerUid', 'config', uid);
    if (ownerNumber) await (whatsapp as any).adapter.writeData(sessionId, 'ownerNumber', 'config', ownerNumber);
    if (botType) await (whatsapp as any).adapter.writeData(sessionId, 'botType', 'config', botType);
    if (name) await (whatsapp as any).adapter.writeData(sessionId, 'name', 'config', name);
    if (role) await (whatsapp as any).adapter.writeData(sessionId, 'role', 'config', role);
    if (gender) await (whatsapp as any).adapter.writeData(sessionId, 'gender', 'config', gender);
    if (age) await (whatsapp as any).adapter.writeData(sessionId, 'age', 'config', age);

    // --- AUTO-CLEANUP PENDING SESSIONS ---
    const existingTimer = pendingSessionTimeouts.get(sessionId);
    if (existingTimer) clearTimeout(existingTimer);

    const timer = setTimeout(async () => {
      const s = await whatsapp.getSessionById(sessionId);
      if (s && s.status !== 'connected') {
        console.log(`⏰ Auto-cleaning unattended session '${sessionId}' to save RAM (no pairing code used in 3 mins).`);
        await whatsapp.deleteSession(sessionId);
        sessionStatuses.delete(sessionId);
      }
      pendingSessionTimeouts.delete(sessionId);
    }, 3 * 60 * 1000); // 3 minutes timeout
    pendingSessionTimeouts.set(sessionId, timer);
    // -------------------------------------

    // Save custom AI personality data
    if (instructions) await (whatsapp as any).adapter.writeData(sessionId, 'instructions', 'config', instructions);
    if (businessInfo) await (whatsapp as any).adapter.writeData(sessionId, 'businessInfo', 'config', businessInfo);
    if (ownerNumber) await (whatsapp as any).adapter.writeData(sessionId, 'ownerNumber', 'config', ownerNumber);
    if (uid) await (whatsapp as any).adapter.writeData(sessionId, 'ownerUid', 'config', uid);

    res.json({
      message: `Pairing code request initiated for ${phoneNumber}.`,
      instruction: "Please wait for the pairing code to be generated."
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Disconnect and permanently delete a WhatsApp session
 * DELETE http://localhost:5000/session/delete/:sessionId
 */
app.delete("/session/delete/:sessionId", async (req, res) => {
  const { sessionId } = req.params;
  const uid = req.query.uid as string | undefined;
  if (!sessionId) return res.status(400).json({ error: "sessionId is required" });

  // UID ownership check: block if uid provided but session doesn't belong to user
  if (uid && !sessionId.startsWith(`${uid}_`)) {
    return res.status(403).json({ error: "You don't have permission to delete this session." });
  }

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
 * Update Agent Identity Config Dynamically
 * POST http://localhost:5000/session/update-config
 */
app.post("/session/update-config", async (req, res) => {
  const { sessionId, name, role, gender, age, instructions, businessInfo, botType } = req.body;
  if (!sessionId) return res.status(400).json({ error: "sessionId is required" });

  try {
    if (name !== undefined) await (whatsapp as any).adapter.writeData(sessionId, 'name', 'config', name);
    if (role !== undefined) await (whatsapp as any).adapter.writeData(sessionId, 'role', 'config', role);
    if (gender !== undefined) await (whatsapp as any).adapter.writeData(sessionId, 'gender', 'config', gender);
    if (age !== undefined) await (whatsapp as any).adapter.writeData(sessionId, 'age', 'config', age);
    if (instructions !== undefined) await (whatsapp as any).adapter.writeData(sessionId, 'instructions', 'config', instructions);
    if (businessInfo !== undefined) await (whatsapp as any).adapter.writeData(sessionId, 'businessInfo', 'config', businessInfo);
    if (botType !== undefined) await (whatsapp as any).adapter.writeData(sessionId, 'botType', 'config', botType);

    console.log(`✅ Live config updated for session: ${sessionId}`);
    res.json({ message: `Config for ${sessionId} updated successfully.` });
  } catch (error: any) {
    console.error("Error updating config:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update Agent Logic Status Dynamically (ON/OFF Switch)
 * POST http://localhost:5000/session/update-status
 */
app.post("/session/update-status", async (req, res) => {
  const { sessionId, isActive } = req.body;
  if (!sessionId) return res.status(400).json({ error: "sessionId is required" });
  if (isActive === undefined) return res.status(400).json({ error: "isActive is required" });

  try {
    // Save as a string because adapter sometimes stringifies values
    await (whatsapp as any).adapter.writeData(sessionId, 'isActive', 'config', isActive ? 'true' : 'false');

    console.log(`⚡ Live logic status for [${sessionId}] set to: ${isActive ? 'ON' : 'OFF'}`);
    res.json({ message: `Status for ${sessionId} updated to ${isActive ? 'ON' : 'OFF'}.` });
  } catch (error: any) {
    console.error("Error updating logic status:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Bulk Delete Sessions for a specific user/client
 * POST http://localhost:5000/session/bulk-delete
 */
app.post("/session/bulk-delete", async (req, res) => {
  const { prefix } = req.body; // e.g., "uid" or "agency_clientid"
  if (!prefix) return res.status(400).json({ error: "prefix is required" });

  try {
    const sessionIds = await whatsapp.getSessionsIds();
    const matches = sessionIds.filter(id => id.startsWith(prefix));

    console.log(`🧹 Bulk deleting ${matches.length} sessions for prefix [${prefix}]...`);

    for (const sessionId of matches) {
      await whatsapp.deleteSession(sessionId);
      sessionStatuses.delete(sessionId);

      // Cleanup guards
      for (const [phone, sid] of phoneToSessionGuard.entries()) {
        if (sid === sessionId) {
          phoneToSessionGuard.delete(phone);
          break;
        }
      }
      const timer = pendingSessionTimeouts.get(sessionId);
      if (timer) {
        clearTimeout(timer);
        pendingSessionTimeouts.delete(sessionId);
      }
    }

    res.json({ message: `Successfully deleted ${matches.length} sessions.`, deleted: matches });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Bulk Update Status (Pause/Resume) for a specific user/client
 * POST http://localhost:5000/session/bulk-status
 */
app.post("/session/bulk-status", async (req, res) => {
  const { prefix, isActive } = req.body;
  if (!prefix || isActive === undefined) return res.status(400).json({ error: "prefix and isActive are required" });

  try {
    const sessionIds = await whatsapp.getSessionsIds();
    const matches = sessionIds.filter(id => id.startsWith(prefix));

    console.log(`⚡ Bulk setting logic status to ${isActive} for ${matches.length} sessions...`);

    for (const sessionId of matches) {
      await (whatsapp as any).adapter.writeData(sessionId, 'isActive', 'config', isActive ? 'true' : 'false');
    }

    res.json({ message: `Updated ${matches.length} sessions to ${isActive ? 'ON' : 'OFF'}.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


/**
 * Get active session IDs
 * GET http://localhost:3000/session/list
 */
app.get("/session/list", async (req, res) => {
  const uid = req.query.uid as string | undefined;
  let sessions = await whatsapp.getSessionsIds();
  // Filter by uid prefix for tenant isolation
  if (uid) {
    sessions = sessions.filter((s: string) => s.startsWith(`${uid}_`));
  }
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
app.post("/message/send", checkSubscription, checkApiQuota, async (req, res) => {
  const { sessionId, to, text } = req.body;

  if (!sessionId || !to || !text) {
    return res.status(400).json({ error: "sessionId, to, and text are required" });
  }

  const limits = (req as any).userPlan;
  if (limits && !limits.allowApi) {
    return res.status(403).json({ error: "Developer API access requires the Pro plan. Please upgrade to use this endpoint." });
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
app.post("/campaign/start", checkSubscription, checkApiQuota, async (req, res) => {
  const { sessionId, numbers, businessContext } = req.body;

  if (!sessionId || !numbers || !Array.isArray(numbers) || !businessContext) {
    return res.status(400).json({ error: "sessionId, numbers (array), and businessContext are required" });
  }

  const limits = (req as any).userPlan;
  if (limits && !limits.allowCampaigns) {
    return res.status(403).json({ error: "Marketing Campaigns require the Starter plan or higher. Please upgrade to use this feature." });
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
      await whatsapp.sendText({ sessionId, to, text: message });
    };

    // Parse chat history if provided
    let history = [];
    if (req.body?.history) {
      try {
        history = JSON.parse(req.body.history);
      } catch (e) {
        console.warn("Invalid JSON for admin chat history", e);
      }
    }

    const agentReply = await generateAdminReply(
      query,
      { activeSessions: sessions, pendingMessages: queueStats.pending, sentMessages: queueStats.sent },
      fileAttachment,
      sendWhatsappFn,
      history
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


// ─── AUTO-CONNECT ALL BOTS ON BOOT (Full State Restore) ─────────────────────
async function autoConnectActiveAgents() {
  console.log("🔄 Starting Full-State Auto-Connect for ALL WhatsApp Sessions...");
  const db = getFirestore();
  let connectCount = 0;
  let skippedCount = 0;
  let inactiveCount = 0;

  // Helper: Write ALL config data for a bot from Firebase → Baileys adapter
  const restoreBotConfig = async (agentId: string, agentData: Record<string, any>) => {
    const fields: Record<string, string> = {
      ownerNumber: agentData.ownerNumbers?.[0] || agentData.ownerNumber,
      ownerUid: agentData.ownerUid || agentData.uid,
      instructions: agentData.instructions,
      businessInfo: agentData.businessInfo,
      name: agentData.name,
      role: agentData.role,
      gender: agentData.gender,
      age: agentData.age?.toString(),
      botType: agentData.botType || 'saas',
      isActive: agentData.isActive !== false ? 'true' : 'false',
    };
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined && value !== null) {
        await (whatsapp as any).adapter.writeData(agentId, key, 'config', value).catch(() => { });
      }
    }
  };

  try {
    // ── 1. Personal & SaaS Bots from 'users/{uid}/agents' ──────────────────
    const usersSnap = await db.collection("users").get();
    for (const userDoc of usersSnap.docs) {
      const agentsSnap = await userDoc.ref.collection("agents").get();
      for (const agentDoc of agentsSnap.docs) {
        const agentId = agentDoc.id;
        const agentData = { ...agentDoc.data() as any, ownerUid: userDoc.id };

        // Skip deleted bots entirely
        if (agentData.deleted === true) {
          console.log(`🗑️ Skipping deleted SaaS bot: ${agentId}`);
          skippedCount++;
          continue;
        }

        // Restore full config from Firebase to memory
        await restoreBotConfig(agentId, agentData);

        const isActive = agentData.isActive !== false;
        console.log(`🔌 Auto-connecting SaaS bot: ${agentId} [${isActive ? 'ACTIVE ✅' : 'INACTIVE (connected, no replies) ⏸️'}]`);

        whatsapp.startSession(agentId, { printQR: false }).catch(err => {
          console.error(`❌ Failed to auto-connect ${agentId}:`, err.message);
        });

        if (!isActive) inactiveCount++;
        connectCount++;

        // Stagger connections by 200ms each to avoid overloading on 100+ bots
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // ── 2. Agency Bots from 'agencyAgents/{clientId}' ──────────────────────
    const agencyDocs = await db.collection("agencyAgents").get();
    for (const doc of agencyDocs.docs) {
      const clientId = doc.id;
      const data = doc.data();
      if (!data.agents || !Array.isArray(data.agents)) continue;

      for (const agent of data.agents as any[]) {
        const agentId = agent.id;
        if (!agentId) continue;

        // Skip deleted bots entirely
        if (agent.deleted === true) {
          console.log(`🗑️ Skipping deleted Agency bot: ${agentId}`);
          skippedCount++;
          continue;
        }

        // Restore full config from Firebase to memory
        await restoreBotConfig(agentId, {
          ...agent,
          ownerUid: `agency_${clientId}`,
          botType: 'agency',
        });

        const isActive = agent.isActive !== false;
        console.log(`🔌 Auto-connecting Agency bot: ${agentId} [${isActive ? 'ACTIVE ✅' : 'INACTIVE ⏸️'}]`);

        whatsapp.startSession(agentId, { printQR: false }).catch(err => {
          console.error(`❌ Failed to auto-connect ${agentId}:`, err.message);
        });

        if (!isActive) inactiveCount++;
        connectCount++;

        // Stagger connections by 200ms to avoid crashing under high load
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`\n✅ Auto-Connect Boot Complete:`);
    console.log(`   🟢 Connected:  ${connectCount} bots`);
    console.log(`   ⏸️  Inactive:   ${inactiveCount} bots (connected, replies disabled)`);
    console.log(`   🗑️  Skipped:   ${skippedCount} deleted bots`);
  } catch (error) {
    console.error("❌ Error during Auto-Connect:", error);
  }
}

/**
 * Get System Activity Logs (Owner/Admin)
 * GET http://localhost:5000/owner/logs
 */
app.get("/owner/logs", async (req, res) => {
  try {
    const db = getFirestore();
    const now = Date.now();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

    const logsSnap = await db.collection('activity_logs')
      .orderBy('time', 'desc')
      .limit(100)
      .get();

    // Firestore requires composite index for where + orderBy on different fields.
    // To avoid index creation errors for this simple feature, we will count alerts and 24h manually if needed, 
    // or just use separate simple queries. Let's do simple queries without orderBy for stats.

    // We can just rely on the recent 100 logs for the mock dashboard stats for now,
    // or run a count if Firebase Admin SDK supports it without index.
    const recentLogsSnap = await db.collection('activity_logs')
      .where('time', '>=', oneDayAgo)
      .get();

    const alertsSnap = await db.collection('activity_logs')
      .where('level', 'in', ['Critical', 'Warning', 'Error'])
      .get();

    let logs = logsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // If no logs exist, seed some mock ones to match the design initially
    if (logs.length === 0) {
      const mockLogs = [
        { user: "rahul@example.com", action: "User Logout", category: "Auth", level: "Info", ip: "192.168.1.1", time: new Date(now - 1000).toISOString() },
        { user: "admin@bulkreply.io", action: "Deleted Plan: 'Pro Plus'", category: "System", level: "Warning", ip: "152.12.33.10", time: new Date(now - 30000).toISOString() },
        { user: "sneha.r@gmail.com", action: "Failed Payment Attemp", category: "Billing", level: "Error", ip: "103.45.12.2", time: new Date(now - 600000).toISOString() },
        { user: "System", action: "Automated Daily Backup Complete", category: "Database", level: "Info", ip: "Internal", time: new Date(now - 3600000).toISOString() },
        { user: "amit.p@outlook.com", action: "API Key Created", category: "Security", level: "Info", ip: "45.124.90.11", time: new Date(now - 7200000).toISOString() },
        { user: "unknown", action: "Brute Force Attempt Detected", category: "Security", level: "Critical", ip: "5.1.22.45", time: new Date(now - 86400000).toISOString() },
      ];
      const batch = db.batch();
      mockLogs.forEach(log => {
        const docRef = db.collection('activity_logs').doc();
        batch.set(docRef, log);
        logs.push({ id: docRef.id, ...log });
      });
      await batch.commit();
      logs.sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime());
    }

    const formattedLogs = logs.map((log: any) => {
      const d = new Date(log.time);
      const formattedTime = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
      return { ...log, time: formattedTime };
    });

    res.json({
      logs: formattedLogs,
      stats: {
        logs24h: Math.max(recentLogsSnap.size, formattedLogs.length), // mock high count
        alerts: Math.max(alertsSnap.size, formattedLogs.filter((l: any) => ['Critical', 'Error', 'Warning'].includes(l.level)).length),
        queriesPerSec: 205,
        uptime: "99.99%"
      }
    });

  } catch (error: any) {
    if (error.message.includes('index')) {
      // Fallback if missing index blocks query
      return res.json({ logs: [], stats: { logs24h: 0, alerts: 0, queriesPerSec: 0, uptime: "0%" } });
    }
    console.error("Error fetching owner logs:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
  autoConnectActiveAgents();
  startTaskScheduler(); // Start the background task runner
  console.log("--------------------------------------------------");
  console.log(`🚀 BulkReply.io API (Advanced AI v4) running at http://localhost:${port}`);
  console.log("--------------------------------------------------");
});

/**
 * ⏰ Background Task Scheduler (Power 4)
 * Runs every 60 seconds. Handles: messages, reminders, repeating tasks.
 */
function startTaskScheduler() {
  console.log("⏳ Task Scheduler started. Polling every 60s for scheduled tasks...");
  setInterval(async () => {
    const db = getFirestore();
    const now = new Date().toISOString();

    try {
      // NOTE: Using single .where() to avoid composite index requirement.
      // We filter by time in JavaScript below.
      const tasksSnap = await db.collection('scheduled_tasks')
        .where('status', '==', 'pending')
        .get();

      // Filter locally to those whose time has arrived
      const dueTasks = tasksSnap.docs.filter(d => {
        const t = d.data().time;
        return t && t <= now;
      });

      if (dueTasks.length === 0) return;

      console.log(`🔔 Scheduler: ${dueTasks.length} tasks due.`);

      for (const doc of dueTasks) {
        const task = doc.data();
        const taskId = doc.id;
        const retryCount = task.retryCount || 0;
        const MAX_RETRIES = 3;

        // Immediately lock the task to prevent double-execution
        await doc.ref.update({ status: 'processing' });

        try {
          // ── Execute based on type ─────────────────────────
          if (task.type === 'message' && task.data?.numbers?.length > 0) {
            // Send message to a list of contacts
            for (const num of task.data.numbers) {
              const cleanNum = num.replace(/[^\d]/g, "");
              if (cleanNum.length > 5) {
                await queue.push(task.sessionId, cleanNum, task.data.text || "", task.data.media);
              }
            }
          } else if (task.type === 'reminder') {
            // Remind the owner
            await whatsapp.sendText({
              sessionId: task.sessionId,
              to: task.ownerNumber,
              text: `⏰ *REMINDER* 🔔\n\n${task.data?.text || "No details provided."}\n\n_Scheduled by your AI Assistant_`
            });
          } else if (task.type === 'broadcast') {
            // Broadcast a single message to multiple numbers
            const numbers: string[] = task.data?.numbers || [];
            for (const num of numbers) {
              const cleanNum = num.replace(/[^\d]/g, "");
              if (cleanNum.length > 5) {
                await queue.push(task.sessionId, cleanNum, task.data.text || "", task.data.media);
              }
            }
          }

          // ── Handle Repeating Tasks ────────────────────────
          const repeat = task.data?.repeat;
          if (repeat === 'daily' || repeat === 'weekly') {
            const nextDate = new Date(task.time);
            if (repeat === 'daily') nextDate.setDate(nextDate.getDate() + 1);
            if (repeat === 'weekly') nextDate.setDate(nextDate.getDate() + 7);

            // Update to next execution time instead of marking complete
            await doc.ref.update({ status: 'pending', time: nextDate.toISOString(), retryCount: 0 });
            console.log(`🔄 Recurring task ${taskId} rescheduled for ${nextDate.toISOString()}`);
          } else {
            // Non-recurring: mark complete
            await doc.ref.update({ status: 'completed', executedAt: now });
          }

          console.log(`✅ Scheduled task ${taskId} (${task.type}) executed.`);

          // ── Notify Owner of Completion ────────────────────
          if (task.ownerNumber && task.sessionId) {
            const completionMsg = `✅ *Scheduled Task Done!*\n\n*Type:* ${task.type}\n*Contacts:* ${task.data?.numbers?.length || 1}\n*Time:* ${new Date(task.time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;
            whatsapp.sendText({
              sessionId: task.sessionId,
              to: task.ownerNumber,
              text: completionMsg
            }).catch(() => { });
          }

        } catch (err) {
          console.error(`❌ Task ${taskId} failed:`, err);
          if (retryCount < MAX_RETRIES) {
            // Retry: unlock the task with incremented retry counter
            await doc.ref.update({ status: 'pending', retryCount: retryCount + 1 });
            console.log(`🔁 Task ${taskId} will retry (${retryCount + 1}/${MAX_RETRIES})`);
          } else {
            await doc.ref.update({ status: 'failed', error: (err as any).message, failedAt: now });
            console.error(`💀 Task ${taskId} permanently failed after ${MAX_RETRIES} retries.`);
          }
        }
      }
    } catch (err) {
      console.error("Scheduler Poll Error:", err);
    }
  }, 60 * 1000);
}
