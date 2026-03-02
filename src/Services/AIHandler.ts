import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

// Default API Key from env if available
const apiKey = process.env.GEMINI_API_KEY || '';
let genAI: GoogleGenerativeAI | null = null;

if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
} else {
    console.warn("⚠️ GEMINI_API_KEY is not set in .env. Auto-responses will be disabled.");
}

export async function generateAutoReply(userMessage: string, isOwner: boolean = false): Promise<string | null> {
    if (!genAI) return null;

    const ownerInstruction = `You are a helpful Personal AI Assistant for the business owner. 
    You help with scheduling, management, and basic system queries. 
    Acknowledge the owner's authority. Be helpful and friendly. 
    If they ask about campaigns, mention they can use the Dashbord or !campaign command.`;

    const customerInstruction = `You are a professional WhatsApp business representative for BulkReply.io. 
    Your goal is to assist customers, answer questions, and highlight benefits of WhatsApp automation. 
    You represent the "Owner" who has built this system.`;

    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: (isOwner ? ownerInstruction : customerInstruction) + "\n\n" +
                "GENERAL CONVERSATIONAL RULES:\n" +
                "1. EMOJI RESPONSE: If the user sends ONLY emojis, reply with a relevant, friendly response.\n" +
                "2. CHATTY & NATURAL: Speak like a human. Use warm greetings.\n" +
                "3. LANGUAGE: Always respond in the SAME language the user is using (Hindi, English, or Hinglish).\n\n" +
                "FORMATTING RULES:\n" +
                "1. Use *bold text* for keywords.\n" +
                "2. Use professional emojis.\n" +
                "3. Use '[SPLIT]' delimiter to send response in two parts for a more human-like flow.",
        });

        const result = await model.generateContent(userMessage);
        const response = result.response;
        return response.text() || "I'm sorry, I couldn't process that request at the moment.";
    } catch (error) {
        console.error("Gemini AI API Error:", error);
        return null;
    }
}

/**
 * Generates a proactive outreach message for a new contact
 */
export async function generateOutreach(businessContext: string): Promise<string | null> {
    if (!genAI) return null;

    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: "You are a professional business developer for BulkReply.io. \n\n" +
                "FORMATTING & FLOW RULES:\n" +
                "1. Use *bold text* for keywords.\n" +
                "2. Use professional emojis (🚀, ✅, 🛡️).\n" +
                "3. Use the '[SPLIT]' delimiter to separate the introduction from the call to action.\n" +
                "4. Be confident, helpful, and concise.\n" +
                "5. Use Hindi/English (Hinglish) as preferred by Indian business owners if the context suggests so, or professional English.",
        });

        const prompt = `Business Context: ${businessContext}\n\nProject: BulkReply.io - WhatsApp Marketing Solutions.\nTask: Generate a professional, warm, and engaging introduction/outreach message to a potential client. Introduce the benefits of WhatsApp automation for their business specifically.`;
        const result = await model.generateContent(prompt);
        const response = result.response;

        return response.text() || "Hello! I'd love to discuss how BulkReply.io can help your business.";
    } catch (error) {
        console.error("Gemini AI Outreach Error:", error);
        return null;
    }
}
