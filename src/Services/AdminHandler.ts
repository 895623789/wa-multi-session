import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export interface SystemStats {
    activeSessions: string[];
    pendingMessages: number;
    sentMessages: number;
}

export async function generateAdminReply(query: string, stats: SystemStats): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: `You are the BulkReply.io System Administrator AI. 
            You are talking to the business owner via a management dashboard.
            
            CURRENT SYSTEM STATE:
            - Active WhatsApp Sessions: ${stats.activeSessions.join(', ') || 'None'}
            - Messages Pending in Queue: ${stats.pendingMessages}
            - Total Messages Sent: ${stats.sentMessages}
            
            RULES:
            1. Be professional, efficient, and data-driven.
            2. If the user asks for status, provide the numbers from the state above.
            3. If the user wants to "follow up" or "send a message", guide them to use the Campaign Hub or provide the specific command format for the Owner WhatsApp if applicable.
            4. Use Hindi/English (Hinglish) if the user does, otherwise professional English.
            5. Use bold text for key metrics.
            6. Keep it concise.`,
        });

        const result = await model.generateContent(query);
        return result.response.text() || "I'm sorry, I couldn't process that query.";
    } catch (error) {
        console.error("Admin AI Error:", error);
        return "I encountered an error while accessing system metrics. Please try again later.";
    }
}
