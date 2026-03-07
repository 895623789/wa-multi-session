import { GoogleGenerativeAI, Part, FunctionDeclaration, SchemaType } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export interface SystemStats {
    activeSessions: string[];
    pendingMessages: number;
    sentMessages: number;
    agentNames?: Record<string, string>;
}

export interface FileAttachment {
    buffer: Buffer;
    mimeType: string;
    originalName: string;
}

export interface AgentReply {
    text: string;
    imageBase64?: string;           // If AI generated an image
    whatsappSent?: boolean;         // If AI sent a WhatsApp message
    askStorage?: boolean;           // If AI wants to save the file to Firebase Storage
    storageFileName?: string;       // File name for storage prompt
}

export interface AdminCallbacks {
    sendWhatsapp?: (sessionId: string, to: string, message: string) => Promise<void>;
    setBotStatus?: (sessionId: string, isActive: boolean) => Promise<void>;
    getChatHistory?: (sessionId: string, remoteJid: string) => Promise<any[]>;
    scheduleTask?: (type: string, time: string, data: any) => Promise<void>;
}

// ─── Function Declarations (Tools for Gemini) ─────────────────────────────────
const tools: FunctionDeclaration[] = [
    {
        name: 'sendWhatsappMessage',
        description: 'Sends a WhatsApp text message to one or more recipients. Use this ONLY when the user provides all necessary details: recipient(s), the message content, and which bot/session to use. If any part is missing, ASK the user first.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                sessionId: {
                    type: SchemaType.STRING,
                    description: 'The session ID (ID string) to send from. Must be one of the active session IDs provided in the context.'
                },
                to: {
                    type: SchemaType.ARRAY,
                    description: 'The recipient phone numbers in international format (e.g. ["919876543210"]).',
                    items: { type: SchemaType.STRING }
                },
                message: {
                    type: SchemaType.STRING,
                    description: 'The exact text message to send.'
                }
            },
            required: ['sessionId', 'to', 'message']
        }
    },
    {
        name: 'setBotStatus',
        description: 'Turn a specific bot ON or OFF. ⚠️ SAFETY RULE: You MUST ask the user for confirmation (e.g., "Boss, are you sure you want to turn OFF [Bot Name]?") before executing this.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                sessionId: { type: SchemaType.STRING, description: 'The session ID of the bot' },
                isActive: { type: SchemaType.BOOLEAN, description: 'True to turn ON (resume), False to turn OFF (pause)' }
            },
            required: ['sessionId', 'isActive']
        }
    },
    {
        name: 'getChatHistory',
        description: 'Fetch the recent message history for a specific customer on a specific bot to analyze their interest.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                sessionId: { type: SchemaType.STRING, description: 'The session ID of the bot' },
                remoteJid: { type: SchemaType.STRING, description: 'The customer phone number without symbols, e.g., 919876543210' }
            },
            required: ['sessionId', 'remoteJid']
        }
    },
    {
        name: 'scheduleTask',
        description: 'Schedule a future task, such as a follow-up message to a customer or a reminder for the owner.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                type: { type: SchemaType.STRING, description: "Type of task: 'message' (to customer) or 'reminder' (to owner)" },
                time: { type: SchemaType.STRING, description: "ISO target time or relative description, e.g., '2026-03-05T06:00:00Z', 'in 2 hours'" },
                data: {
                    type: SchemaType.OBJECT,
                    description: "For message: { numbers: ['91...'], text: 'Hello' }. For reminder: { text: 'Remind me to...' }",
                    properties: {
                        text: { type: SchemaType.STRING },
                        numbers: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
                    }
                }
            },
            required: ['type', 'time', 'data']
        }
    },
    {
        name: 'generateImage',
        description: 'Generate an image using AI based on a text description. Use this when the user asks to create, draw, or generate an image.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                prompt: {
                    type: SchemaType.STRING,
                    description: 'Detailed description of the image to generate'
                }
            },
            required: ['prompt']
        }
    },
    {
        name: 'saveToFirebaseStorage',
        description: 'Signal that this file should be saved to Firebase Storage. Only call this if the user explicitly confirms they want to save the file.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                reason: {
                    type: SchemaType.STRING,
                    description: 'Why this file should be saved'
                }
            },
            required: ['reason']
        }
    }
];

// ─── Main Agent Function ───────────────────────────────────────────────────────
export async function generateAdminReply(
    query: string,
    stats: SystemStats,
    file?: FileAttachment,
    callbacks?: AdminCallbacks,
    history?: any[],
    modelOverride?: string
): Promise<AgentReply> {
    const PRICING: Record<string, { input: number, output: number }> = {
        'gemini-2.0-flash': { input: 8.3, output: 33.2 },
        'gemini-2.0-flash-lite': { input: 6.2, output: 24.9 },
        'gemini-flash-latest': { input: 3.1, output: 12.4 },
        'gemini-flash-lite-latest': { input: 1.25, output: 5.0 },
        'gemini-pro-latest': { input: 104.0, output: 416.0 },
    };

    const trackAdminUsage = async (model: string, input: number, output: number) => {
        try {
            const pricing = PRICING[model] || PRICING['gemini-2.0-flash'];
            const cost = ((input / 1000000) * pricing.input) + ((output / 1000000) * pricing.output);
            const { getFirestore, FieldValue } = await import('firebase-admin/firestore');
            const db = getFirestore();
            await db.collection('usage_stats').doc(model).set({
                totalInputTokens: FieldValue.increment(input),
                totalOutputTokens: FieldValue.increment(output),
                totalCostINR: FieldValue.increment(cost),
                totalRequests: FieldValue.increment(1),
                lastUsed: Date.now()
            }, { merge: true });
        } catch (e) { console.error("Admin usage track error:", e); }
    };

    try {
        const modelToUse = modelOverride || 'gemini-2.0-flash';
        const botNamesContext = stats.agentNames
            ? Object.entries(stats.agentNames).map(([id, name]) => `- **${name}** (ID: ${id})`).join('\n')
            : 'None';

        const model = genAI.getGenerativeModel({
            model: modelToUse,
            systemInstruction: `You are the BulkReply.io AI Agent — a powerful multimodal assistant.

CURRENT SYSTEM STATE:
- Active Bots (Names & IDs):
${botNamesContext}
- Messages Pending in Queue: ${stats.pendingMessages}
- Total Messages Sent: ${stats.sentMessages}

YOUR CAPABILITIES:
1. VISION: Analyze shared photos/images.
2. AUDIO: Transcribe and understand audio files.
3. PDF: Read and summarize document contents.
4. SEND WHATSAPP: Send messages on behalf of the owner. **CRITICAL**: Before calling 'sendWhatsappMessage', ensure you have: (A) The numbers, (B) The message, and (C) The specific bot to use. If any of these are missing, DO NOT call the tool; instead, ASK the user for the missing details.
5. GENERATE IMAGES: Use 'generateImage' for image creation requests.
6. BOT CONTROL: Turn bots ON or OFF using 'setBotStatus'. **SAFETY**: Always ask "Boss, are you sure you want to turn [ON/OFF] [Bot Name]?" before calling this tool.
7. HISTORY INSPECTION: Read a customer's recent chats using 'getChatHistory' to see if they are interested or what they asked.
8. AUTOMATION: Use 'scheduleTask' to schedule follow-up messages or internal reminders.

RULES:
- Address the user as an Operations Manager. You are in control of all WhatsApp bots and automation.
- **IMPORTANT**: Always refer to bots by their NAMES (the bolded names in the context) to make it easier for the user. If they ask "Which bots are active?", list them by name.
- For WhatsApp numbers: ensure 91 prefix for Indian numbers.
- Use Hinglish if the user does, otherwise English.
- Proactively suggest analyzing customer chats or scheduling follow-ups to close sales.`,
        });

        // Convert history format if provided
        const formattedHistory: any[] = (history || []).map((msg: any) => ({
            role: msg.role === 'ai' ? 'model' : 'user',
            parts: [{ text: msg.text || '' }]
        }));

        // Build current content parts
        const currentParts: any[] = [{ text: query || 'Please analyze the attached file.' }];

        if (file) {
            currentParts.push({
                inlineData: {
                    data: file.buffer.toString('base64'),
                    mimeType: file.mimeType as any
                }
            });

            // If file seems important, prompt AI to ask about storage
            currentParts.push({
                text: `[SYSTEM NOTE: A file named "${file.originalName}" (${file.mimeType}) was attached. After responding, if this file seems important to keep permanently, ask the user if they want to save it to Firebase Storage.]`
            });
        }

        // Add current message to history
        formattedHistory.push({
            role: 'user',
            parts: currentParts
        });

        // First call
        const result = await model.generateContent({
            contents: formattedHistory,
            tools: [{ functionDeclarations: tools }]
        });

        const response = result.response;
        const candidate = response.candidates?.[0];
        if (!candidate) return { text: "No response from AI." };

        // Track Usage
        const usage = response.usageMetadata;
        if (usage) {
            await trackAdminUsage(modelToUse, usage.promptTokenCount || 0, usage.candidatesTokenCount || 0);
        }

        // Check for function calls
        const functionCalls = candidate.content?.parts?.filter(p => p.functionCall);

        if (functionCalls && functionCalls.length > 0) {
            const fc = functionCalls[0].functionCall!;

            // ── getChatHistory ───────────────────────────────────────────
            if (fc.name === 'getChatHistory' && callbacks?.getChatHistory) {
                const args = fc.args as { sessionId: string; remoteJid: string };
                try {
                    const logs = await callbacks.getChatHistory(args.sessionId, args.remoteJid);

                    // Add tool request to history state
                    formattedHistory.push({
                        role: 'model',
                        parts: [{ functionCall: { name: fc.name, args: fc.args } }]
                    });

                    // Add simulation of function response
                    formattedHistory.push({
                        role: 'user',
                        parts: [{ text: `[SYSTEM NOTE: Function call returned: ${JSON.stringify(logs)}]\nNow answer my original prompt using this data.` }]
                    });

                    // Call model again with the newly injected data
                    const multiResult = await model.generateContent({
                        contents: formattedHistory,
                        tools: [{ functionDeclarations: tools }]
                    });

                    const multiText = multiResult.response.candidates?.[0]?.content?.parts?.filter(p => p.text).map(p => p.text).join('') || "Analyzed history.";
                    return { text: multiText };
                } catch (err: any) {
                    return { text: `❌ Failed to fetch history: ${err.message}` };
                }
            }

            // ── setBotStatus ─────────────────────────────────────────────
            if (fc.name === 'setBotStatus' && callbacks?.setBotStatus) {
                const args = fc.args as { sessionId: string; isActive: boolean };
                try {
                    await callbacks.setBotStatus(args.sessionId, args.isActive);
                    return { text: `✅ Bot status successfully updated.\n\n**Bot ID:** ${args.sessionId}\n**Status:** ${args.isActive ? 'ON' : 'OFF'}` };
                } catch (err: any) {
                    return { text: `❌ Failed to update bot status: ${err.message}` };
                }
            }

            // ── scheduleTask ─────────────────────────────────────────────
            if (fc.name === 'scheduleTask' && callbacks?.scheduleTask) {
                const args = fc.args as { type: string; time: string; data: any };
                try {
                    await callbacks.scheduleTask(args.type, args.time, args.data);
                    return { text: `⏰ Task successfully scheduled.\n\n**Type:** ${args.type}\n**Time:** ${new Date(args.time).toLocaleString()}` };
                } catch (err: any) {
                    return { text: `❌ Failed to schedule task: ${err.message}` };
                }
            }

            // ── sendWhatsappMessage ──────────────────────────────────────
            if (fc.name === 'sendWhatsappMessage' && callbacks?.sendWhatsapp) {
                const args = fc.args as { sessionId: string; to: string[]; message: string };

                try {
                    let sentCount = 0;
                    const targets = Array.isArray(args.to) ? args.to : [args.to];

                    for (const rawNumber of targets) {
                        const to = rawNumber.includes('@') ? rawNumber : `${rawNumber}@s.whatsapp.net`;
                        await callbacks.sendWhatsapp(args.sessionId, to, args.message);
                        sentCount++;
                    }

                    return {
                        text: `✅ Message sent successfully!\n\n**To:** ${targets.join(', ')}\n**Session:** ${args.sessionId}\n**Message:** "${args.message}"\n\nThe message has been delivered to ${sentCount} recipient(s) via WhatsApp.`,
                        whatsappSent: true
                    };
                } catch (err: any) {
                    return { text: `❌ Failed to send WhatsApp message: ${err.message}` };
                }
            }

            // ── generateImage ─────────────────────────────────────────────
            if (fc.name === 'generateImage') {
                const args = fc.args as { prompt: string };
                try {
                    const imageModel = genAI.getGenerativeModel({ model: modelToUse });
                    const imgResult = await imageModel.generateContent({
                        contents: [{ role: 'user', parts: [{ text: args.prompt }] }],
                        generationConfig: { responseModalities: ['IMAGE', 'TEXT'] } as any
                    });

                    const imgCandidate = imgResult.response.candidates?.[0];
                    const imagePart = imgCandidate?.content?.parts?.find(p => p.inlineData);

                    if (imagePart?.inlineData) {
                        return {
                            text: `🎨 Here's your generated image!\n\n**Prompt:** "${args.prompt}"`,
                            imageBase64: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`
                        };
                    } else {
                        return { text: "Sorry, I couldn't generate the image. Please try again with a different description." };
                    }
                } catch (err: any) {
                    return { text: `❌ Image generation failed: ${err.message}` };
                }
            }

            // ── saveToFirebaseStorage (signal only) ────────────────────
            if (fc.name === 'saveToFirebaseStorage') {
                const textParts = candidate.content?.parts?.filter(p => p.text);
                const responseText = textParts?.map(p => p.text).join('') || "Should I save this file?";
                return {
                    text: responseText,
                    askStorage: true,
                    storageFileName: file?.originalName
                };
            }
        }

        // Normal text response
        const textParts = candidate.content?.parts?.filter(p => p.text);
        const text = textParts?.map(p => p.text).join('') || "I'm sorry, I couldn't process that.";

        // Check if AI is asking about storage in text (heuristic)
        const askStorage = text.toLowerCase().includes('firebase storage') ||
            text.toLowerCase().includes('save this file') ||
            text.toLowerCase().includes('store this') ||
            text.toLowerCase().includes('shall i save');

        return {
            text,
            askStorage: askStorage && !!file,
            storageFileName: file?.originalName
        };

    } catch (error: any) {
        console.error("Admin AI Error:", error);
        return { text: `API Error: ${error.message || JSON.stringify(error)}` };
    }
}
