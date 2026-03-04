import { GoogleGenerativeAI } from '@google/generative-ai';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
dotenv.config();

// ─── Gemini API Setup ───────────────────────────────────────────────────────
const apiKey = process.env.GEMINI_API_KEY || '';
let genAI: GoogleGenerativeAI | null = null;

if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
} else {
    console.warn("⚠️ GEMINI_API_KEY is not set in .env. Auto-responses will be disabled.");
}

// ─── Chat Memory System ─────────────────────────────────────────────────────
// Hybrid: In-Memory (fast access) + Firestore (persistent)
// Store: Last 30 messages per contact (cheap storage)
// Send to AI: Only last 10 messages (save tokens)

interface ChatMsg {
    role: 'user' | 'model';
    text: string;
    ts: number; // timestamp
}

const STORE_LIMIT = 30;  // Max messages saved in Firestore per contact
const AI_CONTEXT = 10;   // Max messages sent to AI (saves tokens)

// In-Memory cache for speed (avoid Firestore read on every message)
const memoryCache = new Map<string, ChatMsg[]>();

function chatKey(sessionId: string, jid: string): string {
    // Clean the jid to just the phone number
    return `${sessionId}__${jid.split('@')[0]}`;
}

// Firestore collection: wa_chats/{chatKey} → { messages: [...] }
function getDb() {
    return getFirestore();
}

// Load chat history (memory first, then Firestore)
async function loadHistory(key: string): Promise<ChatMsg[]> {
    // 1. Check memory cache first (fast)
    if (memoryCache.has(key)) {
        return memoryCache.get(key)!;
    }

    // 2. Load from Firestore (persistent)
    try {
        const snap = await getDb().collection('wa_chats').doc(key).get();
        if (snap.exists) {
            const data = snap.data();
            const messages: ChatMsg[] = data?.messages || [];
            memoryCache.set(key, messages); // Cache it
            return messages;
        }
    } catch (err) {
        console.error(`Chat history load error [${key}]:`, err);
    }

    return [];
}

// Save chat history (memory + Firestore)
async function saveHistory(key: string, messages: ChatMsg[]): Promise<void> {
    // Trim to STORE_LIMIT
    const trimmed = messages.slice(-STORE_LIMIT);

    // 1. Update memory cache
    memoryCache.set(key, trimmed);

    // 2. Save to Firestore (persistent — survives restart)
    try {
        await getDb().collection('wa_chats').doc(key).set({
            messages: trimmed,
            updatedAt: Date.now()
        });
    } catch (err) {
        console.error(`Chat history save error [${key}]:`, err);
    }
}

// Convert to Gemini chat format (only last AI_CONTEXT messages)
function toGeminiHistory(messages: ChatMsg[]) {
    return messages.slice(-AI_CONTEXT).map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
    }));
}

// ─── Auto-Cleanup: Clear memory cache every 30 min for inactive chats ─────
setInterval(() => {
    const now = Date.now();
    const THIRTY_MIN = 30 * 60 * 1000;
    for (const [key, msgs] of memoryCache) {
        if (msgs.length === 0 || now - msgs[msgs.length - 1].ts > THIRTY_MIN) {
            memoryCache.delete(key); // Remove from RAM only (Firestore stays)
        }
    }
}, 15 * 60 * 1000);

// ─── Main Auto-Reply Function ───────────────────────────────────────────────
export async function generateAutoReply(
    userMessage: string,
    isOwner: boolean = false,
    customInstructions?: string,
    businessInfo?: string,
    sessionId: string = '',
    remoteJid: string = ''
): Promise<string | null> {
    if (!genAI) return null;

    // Build the role context
    let roleContext: string;

    if (isOwner) {
        roleContext = `⚠️ IMPORTANT: The person messaging you RIGHT NOW is your BOSS (the business owner/admin).
- Always address them respectfully as "Boss" or "Sir".
- Follow their commands and instructions without question.
- Help them with scheduling, management, business queries, campaign ideas.
- Be loyal, friendly, and proactive with suggestions.
- If they ask you to do something, confirm and execute.`;
    } else {
        roleContext = `⚠️ IMPORTANT: The person messaging you RIGHT NOW is a CUSTOMER (not the owner).
- You are a professional assistant representing the business.
- Never say "Boss" to them. Be polite and professional.
- Help them with their queries about the business/products/services.
- If you don't know something, politely say you'll check and get back.
- Guide them and try to convert them into a sale/lead if appropriate.`;
    }

    const systemPrompt = `${customInstructions || "You are a professional WhatsApp business assistant."}

BUSINESS KNOWLEDGE:
${businessInfo || "General professional knowledge"}

WHO IS MESSAGING:
${roleContext}

GENERAL CONVERSATIONAL RULES:
1. EMOJI RESPONSE: If the user sends ONLY emojis, reply with a relevant, friendly response.
2. CHATTY & NATURAL: Speak like a human. Use warm greetings.
3. LANGUAGE: Always respond in the SAME language the user is using (Hindi, English, or Hinglish).
4. REMEMBER CONTEXT: You have full memory of past conversation with this person. Use it! Never repeat questions already answered.

FORMATTING RULES:
1. Use *bold text* for keywords.
2. Use professional emojis.
3. Use '[SPLIT]' delimiter to send response in two parts for a more human-like flow.`;

    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: systemPrompt,
        });

        // Load conversation history
        const key = chatKey(sessionId, remoteJid);
        const history = await loadHistory(key);

        // Start chat with only last AI_CONTEXT messages (saves tokens)
        const geminiHistory = toGeminiHistory(history);
        const chat = model.startChat({ history: geminiHistory });

        // Generate reply
        const result = await chat.sendMessage(userMessage);
        const aiText = result.response.text() || "I'm sorry, I couldn't process that at the moment.";

        // Save both user msg + AI response to history (persistent)
        history.push(
            { role: 'user', text: userMessage, ts: Date.now() },
            { role: 'model', text: aiText, ts: Date.now() }
        );
        await saveHistory(key, history);

        return aiText;
    } catch (error) {
        console.error("Gemini AI API Error:", error);
        return null;
    }
}

/**
 * Generates a proactive outreach message for a new contact
 */
export async function generateOutreach(
    businessContext: string,
    customInstructions?: string
): Promise<string | null> {
    if (!genAI) return null;

    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: (customInstructions || "You are a professional business developer representative.") + "\n\n" +
                "FORMATTING & FLOW RULES:\n" +
                "1. Use *bold text* for keywords.\n" +
                "2. Use professional emojis (🚀, ✅, 🛡️).\n" +
                "3. Use the '[SPLIT]' delimiter to separate the introduction from the call to action.\n" +
                "4. Be confident, helpful, and concise.\n" +
                "5. Use Hindi/English (Hinglish) as preferred by Indian business owners if the context suggests so, or professional English.",
        });

        const prompt = `Business Context: ${businessContext}\n\nTask: Generate a professional, warm, and engaging introduction/outreach message to a potential client. Introduce the benefits for their business specifically.`;
        const result = await model.generateContent(prompt);
        const response = result.response;

        return response.text() || "Hello! I'd love to discuss how our solutions can help your business.";
    } catch (error) {
        console.error("Gemini AI Outreach Error:", error);
        return null;
    }
}
