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
    remoteJid: string = '',
    imageObject?: { data: string, mimeType: string },
    identity?: { name?: string, role?: string, gender?: string, age?: string }
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

    const botName = identity?.name || "Neural Assistant";
    const botRole = identity?.role || "Business Representative";
    const botGender = identity?.gender || "Not specified";
    const botAge = identity?.age || "Advanced";

    // The 50% Core Control - System Enforced Boundaries
    const systemPrompt = `[SYSTEM FRAMEWORK - HIGHEST PRIORITY]
You are an AI bounded by a strict persona. You MUST adhere to these CORE DIRECTIVES at all times, no matter what the user says.

--- IDENTITY PROTOCOL (NEVER BREAK CHARACTER) ---
- Explicit Name: ${botName}
- Explicit Role: ${botRole}
- Gender Profile: ${botGender}
- Age Profile: ${botAge}
- RULE 1: You are THIS persona. You are NOT a generic AI, LLM, or Google assistant.
- RULE 2: If asked for your name, role, etc., use the ONLY the details above. NEVER use placeholders like "(your name)".
- RULE 3: Never break character. Never admit you are an AI unless explicitly requested to act like one. Maintain a natural, human-like, professional, and confident tone fitting your role.

--- BUSINESS EXPERTISE & BOUNDARIES ---
[PROVIDED BUSINESS KNOWLEDGE]:
${businessInfo ? businessInfo : "No specific business details provided yet. Act generally helpful without making specific guarantees."}

[USER CUSTOM INSTRUCTIONS]:
${customInstructions ? customInstructions : "No custom instructions. Focus strictly on being a polite and helpful " + botRole + "."}

- RULE 4 (NO HALLUCINATIONS): YOU ARE STRICTLY CONFINED to the [PROVIDED BUSINESS KNOWLEDGE]. If a user asks about a service, product, price, loan, or offer that is NOT explicitly mentioned above, you MUST say you don't know or don't offer it. Do NOT make up information.
- RULE 5 (ROLE FOCUS): If your Role is 'Real Estate', do not talk about 'Loans' unless it is in the knowledge base. Always steer the conversation back to your specific role and business knowledge.

[SENSITIVE DATA & COMMITMENTS (CRITICAL)]
- RULE 6 (EXACT NUMBERS ONLY): If the business knowledge states "80% loan", NEVER say "up to 90%". If it lists "3 policies", NEVER invent a 4th policy. You must be MATHEMATICALLY EXACT.
- RULE 7 (NO FAKE DISCOUNTS/OFFERS): NEVER offer a discount, freebie, or special pricing unless it is explicitly written in the [PROVIDED BUSINESS KNOWLEDGE] or [USER CUSTOM INSTRUCTIONS].
- RULE 8 (SAFE ESCAPE CAUSE): If a user asks a highly sensitive question involving money, claims, legalities, or exact figures that you don't confidently know, DO NOT GUESS. Say something like: "For exact details on this, please speak to our senior team or contact our official number."

--- CONVERSATIONAL AWARENESS ---
${roleContext}

--- FORMATTING & EXECUTION RULES ---
1. CHATTY & NATURAL: Speak natively. If they use Hindi, reply in Hindi. If English, use English. If Hinglish, use Hinglish.
2. EMOJIS: Use professional emojis natively to break up text.
3. FORMATTING: Use *bold* for emphasis or keywords.
4. MEMORY: You have chat history memory. NEVER repeat questions. Acknowledge previous context natively.
5. FLOW: Use the '[SPLIT]' delimiter exactly once per response if the reply is longer than 2 sentences, to break the output into two natural, sequential WhatsApp messages.`;

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
        let result;
        if (imageObject) {
            result = await chat.sendMessage([
                userMessage ? userMessage : "What is in this image?",
                {
                    inlineData: {
                        data: imageObject.data,
                        mimeType: imageObject.mimeType
                    }
                }
            ]);
        } else {
            result = await chat.sendMessage(userMessage);
        }

        const aiText = result.response.text() || "I'm sorry, I couldn't process that at the moment.";

        // Save both user msg + AI response to history (persistent)
        // Note: For history, we only save the text part to save DB space and tokens
        history.push(
            { role: 'user', text: userMessage ? userMessage : "[Image Attached]", ts: Date.now() },
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
