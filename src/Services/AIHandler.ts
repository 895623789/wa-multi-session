import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import https from 'https';
dotenv.config();

/**
 * Generates an image URL using Pollinations AI (free, no API key needed).
 * Returns the image as a downloadable URL.
 */
export async function generateImageFromPrompt(prompt: string): Promise<string | null> {
    try {
        const encodedPrompt = encodeURIComponent(prompt);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;

        // Pre-warm the URL (make request to generate image)
        await new Promise<void>((resolve, reject) => {
            https.get(imageUrl, (res) => {
                res.resume(); // consume memory
                if (res.statusCode === 200) resolve();
                else reject(new Error(`Image generation returned status ${res.statusCode}`));
            }).on('error', reject);
        });

        return imageUrl;
    } catch (err) {
        console.error("Pollinations AI Image generation failed:", err);
        return null;
    }
}


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

// ─── AI Tools Definition ──────────────────────────────────────────────────
const tools = [
    {
        functionDeclarations: [
            {
                name: "send_bulk_message",
                description: "Sends a specific message to a list of phone numbers. Can optionally include an image. Use this ONLY when the Boss/Owner explicitly commands you to message other people or start a campaign.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        numbers: {
                            type: SchemaType.ARRAY,
                            items: { type: SchemaType.STRING },
                            description: "Array of phone numbers (e.g. ['919999999999', '918888888888'])"
                        },
                        message: {
                            type: SchemaType.STRING,
                            description: "The actual message text to send to these numbers."
                        },
                        media: {
                            type: SchemaType.STRING,
                            description: "Optional base64 image data or URL if you want to send an image along with the text."
                        }
                    },
                    required: ["numbers", "message"]
                }
            },
            {
                name: "generate_image",
                description: "Generates a new image based on a text description. Use this when the user asks you to 'create an image', 'generate a logo', 'draw something', etc.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        prompt: {
                            type: SchemaType.STRING,
                            description: "Detailed description of the image to generate."
                        },
                        caption: {
                            type: SchemaType.STRING,
                            description: "Optional caption for the generated image."
                        },
                        sendTo: {
                            type: SchemaType.ARRAY,
                            items: { type: SchemaType.STRING },
                            description: "Optional array of phone numbers to send the generated image to."
                        }
                    },
                    required: ["prompt"]
                }
            },
            {
                name: "schedule_task",
                description: "Schedules a message or reminder for the future. Use this for 'Remind me at...', 'Send this at...', 'Every morning at...', etc.",
                parameters: {
                    type: SchemaType.OBJECT,
                    properties: {
                        type: {
                            type: SchemaType.STRING,
                            description: "The type of task: 'message' (sending to someone else) or 'reminder' (sending back to the owner)."
                        },
                        time: {
                            type: SchemaType.STRING,
                            description: "The EXACT target time in ISO format (e.g., '2026-03-06T20:15:00.000Z'). Calculate this yourself using the current local time provided in your instructions."
                        },
                        data: {
                            type: SchemaType.OBJECT,
                            properties: {
                                text: { type: SchemaType.STRING },
                                numbers: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                                media: { type: SchemaType.STRING, description: "Optional: Base64 or URL for image campaigns." },
                                repeat: { type: SchemaType.STRING, description: "Optional: 'daily', 'weekly', etc." }
                            },
                        }
                    },
                    required: ["type", "time"]
                }
            }
        ]
    }
];

// ─── Main Auto-Reply Function ───────────────────────────────────────────────
export async function generateAutoReply(
    userMessage: string,
    isOwner: boolean = false,
    customInstructions?: string,
    businessInfo?: string,
    sessionId: string = '',
    remoteJid: string = '',
    imageObject?: { data: string, mimeType: string },
    identity?: { name?: string, role?: string, gender?: string, age?: string },
    documentObject?: { data: string, mimeType: string },
    currentTime?: string
): Promise<{ text: string, toolCalls?: any[] } | null> {
    if (!genAI) return null;

    // Build the role context
    let roleContext: string;

    if (isOwner) {
        roleContext = `⚠️ IMPORTANT: The person messaging you RIGHT NOW is your BOSS (the business owner/admin).
- Always address them respectfully as "Boss" or "Sir".
- Follow their commands and instructions without question.
- Help them with scheduling, management, business queries, campaign ideas.
- Be loyal, friendly, and proactive with suggestions.
- **POWERS**: You can message others, generate images, extract numbers from PDF/Images, and schedule tasks/reminders. Confirm and execute using the available tools.`;
    } else {
        roleContext = `⚠️ IMPORTANT: The person messaging you RIGHT NOW is a CUSTOMER (not the owner).
- You are a professional assistant representing the business.
- Never say "Boss" to them. Be polite and professional.
- Help them with their queries about the business/products/services.
- If you don't know something, politely say you'll check and get back.
- Guide them and try to convert them into a sale/lead if appropriate.
- **RESTRICTIONS**: You CANNOT message other people for them. Only the Boss can command you to send messages to others.`;
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

--- ADVANCED CAPABILITIES & TOOLS ---
1. **TIME AWARENESS**: The current local time is ${currentTime || new Date().toLocaleString()}. 
   - When scheduling, you MUST calculate the absolute ISO timestamp yourself. 
   - Example: If it's 7:45 PM and they say "in 10 mins", you calculate 7:55 PM today and provide the ISO string.
2. **OCR & Extraction**: If the Boss sends a PDF or Image, extract all phone numbers. If a 10-digit number like "9988776655" is found, automatically format it as "919988776655" (Indian standard) if no code is present.
3. **Scheduling**: You can schedule reminders for the Boss or messages for contacts. confirm the EXACT time you calculated to the Boss. You can also schedule recurring tasks (daily/weekly).
4. **Repeating Tasks**: For "Daily at 8 AM", calculate the next occurrence's ISO time and set 'repeat: daily'.
5. **Image Gen**: You can generate images for marketing or just for fun. Use the generate_image tool.

--- INTERCEPTION & PROACTIVE SUPPORT ---
- If you are being asked to "Review" or "Suggest a Reply" for an intercepted message from a stranger:
  - Summarize the stranger's query/intent.
  - Suggest a draft reply based on your persona (${botRole}).
  - Ask the Boss for permission to send it.

--- FORMATTING & EXECUTION RULES ---
1. CHATTY & NATURAL: Speak natively. If they use Hindi, reply in Hindi. If English, use English. If Hinglish, use Hinglish.
2. EMOJIS: Use professional emojis natively to break up text.
3. FORMATTING: Use *bold* for emphasis or keywords.
4. FLOW: Use the '[SPLIT]' delimiter exactly once per response if the reply is longer than 2 sentences, to break the output into two natural, sequential WhatsApp messages.`;

    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: systemPrompt,
            tools: tools as any
        });

        // Load conversation history
        const key = chatKey(sessionId, remoteJid);
        const history = await loadHistory(key);

        // Start chat with only last AI_CONTEXT messages (saves tokens)
        const geminiHistory = toGeminiHistory(history);
        const chat = model.startChat({ history: geminiHistory });

        // Build multimodal parts
        const parts: any[] = [];
        if (imageObject) {
            parts.push({
                inlineData: {
                    data: imageObject.data,
                    mimeType: imageObject.mimeType
                }
            });
        }
        if (documentObject) {
            parts.push({
                inlineData: {
                    data: documentObject.data,
                    mimeType: documentObject.mimeType
                }
            });
        }

        // Add the user message text
        parts.push(userMessage ? userMessage : (imageObject ? "What is in this image?" : (documentObject ? "What is in this document?" : "")));

        // Generate reply
        const result = await chat.sendMessage(parts);

        const call = result.response.functionCalls()?.[0];
        const aiText = result.response.text() || (call ? "Got it Boss, I'm on it!" : "I'm sorry, I couldn't process that.");

        // Save both user msg + AI response to history (persistent)
        history.push(
            { role: 'user', text: userMessage ? userMessage : (imageObject ? "[Image Attached]" : (documentObject ? "[Document Attached]" : "[Media]")), ts: Date.now() },
            { role: 'model', text: aiText, ts: Date.now() }
        );
        await saveHistory(key, history);

        return {
            text: aiText,
            toolCalls: result.response.functionCalls()
        };
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
            model: 'gemini-1.5-flash',
            systemInstruction: (customInstructions || "You are an elite Business Growth Specialist and professional outreach expert.") + "\n\n" +
                "STRATEGIC FORMATTING RULES:\n" +
                "1. POWERFUL BOLDING: Bold ONLY the most important value propositions, keywords, or benefits (e.g. *20% discount*, *Instant Setup*, *Zero Maintenance*).\n" +
                "2. VISUAL HIERARCHY: Use professional emojis (🚀, 💎, ✅, 🛡️) at the start of key points to guide the eye.\n" +
                "3. NATURAL FLOW: Use the '[SPLIT]' delimiter exactly once to separate the hook/intro from the call-to-action.\n" +
                "4. PERSUASIVE COPY: Use the AIDA (Attention, Interest, Desire, Action) framework.\n" +
                "5. PERSONA & LANGUAGE: Speak in a warm, confident, and professional 'Hinglish' tone (mix of Hindi and English) as if you are a senior partner in an Indian tech firm, unless requested otherwise.",
        });

        const prompt = `BUSINESS PROFILE / CAMPAIGN CONTEXT:
${businessContext}

TASK:
Craft a high-conversion, personalized WhatsApp outreach message for this business. 
Focus on solving the client's problem and offering immediate value.
Remember to use '[SPLIT]' between the body and the call-to-action.`;
        const result = await model.generateContent(prompt);
        const response = result.response;

        return response.text() || "Namaste! I'd love to discuss how our solutions can help your business grow. [SPLIT] When can we chat?";
    } catch (error) {
        console.error("Gemini AI Outreach Error:", error);
        return null;
    }
}
