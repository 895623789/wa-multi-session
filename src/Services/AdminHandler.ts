import { GoogleGenerativeAI, Part, FunctionDeclaration, SchemaType } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export interface SystemStats {
    activeSessions: string[];
    pendingMessages: number;
    sentMessages: number;
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

// ─── Function Declarations (Tools for Gemini) ─────────────────────────────────
const tools: FunctionDeclaration[] = [
    {
        name: 'sendWhatsappMessage',
        description: 'Send a WhatsApp text message to a phone number using a connected session. Use this when the user asks to send a message to someone via WhatsApp.',
        parameters: {
            type: SchemaType.OBJECT,
            properties: {
                sessionId: {
                    type: SchemaType.STRING,
                    description: 'The session ID to send from. If the user does not specify, use the first available active session.'
                },
                to: {
                    type: SchemaType.ARRAY,
                    description: 'The recipient phone numbers in international format, e.g. ["919876543210"] (country code + number, no +). Can be multiple if asked to send to multiple people.',
                    items: { type: SchemaType.STRING }
                },
                message: {
                    type: SchemaType.STRING,
                    description: 'The text message to send'
                }
            },
            required: ['sessionId', 'to', 'message']
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
    sendWhatsappFn?: (sessionId: string, to: string, message: string) => Promise<void>,
    history?: any[]
): Promise<AgentReply> {
    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: `You are the BulkReply.io AI Agent — a powerful multimodal assistant for the business owner's dashboard.

CURRENT SYSTEM STATE:
- Active WhatsApp Sessions: ${stats.activeSessions.join(', ') || 'None'}
- Messages Pending in Queue: ${stats.pendingMessages}
- Total Messages Sent: ${stats.sentMessages}

YOUR CAPABILITIES:
1. VISION: If a photo/image is shared, you can see and analyze it in detail.
2. AUDIO: If an audio file is shared, you can transcribe and understand it.
3. PDF: If a PDF is shared, you can read and summarize its contents.
4. SEND WHATSAPP: You can send WhatsApp messages on behalf of the owner. Use the sendWhatsappMessage tool.
5. GENERATE IMAGES: If the user asks to create/draw/generate an image, use the generateImage tool.
6. SMART STORAGE: If a file seems important enough to keep permanently, you may ask the user (do NOT auto-save).

RULES:
- Be professional, efficient, concise.
- For WhatsApp number format: add country code 91 for Indian numbers if not present.
- Use Hinglish if the user does, otherwise English.
- Never hallucinate system data. Use bold for key metrics.
- If user sends a file without a question, proactively describe/analyze it.
- For storage: NEVER save automatically. If the file looks important, suggest saving and ask. Do not call saveToFirebaseStorage unless user explicitly confirms.`,
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

        // Check for function calls
        const functionCalls = candidate.content?.parts?.filter(p => p.functionCall);

        if (functionCalls && functionCalls.length > 0) {
            const fc = functionCalls[0].functionCall!;

            // ── sendWhatsappMessage ──────────────────────────────────────
            if (fc.name === 'sendWhatsappMessage' && sendWhatsappFn) {
                const args = fc.args as { sessionId: string; to: string[]; message: string };

                try {
                    let sentCount = 0;
                    const targets = Array.isArray(args.to) ? args.to : [args.to];

                    for (const rawNumber of targets) {
                        const to = rawNumber.includes('@') ? rawNumber : `${rawNumber}@s.whatsapp.net`;
                        await sendWhatsappFn(args.sessionId, to, args.message);
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
                    const imageModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp-image-generation' });
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
