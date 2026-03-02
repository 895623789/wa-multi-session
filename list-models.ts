import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function run() {
    try {
        const modelList = await genAI.listModels();
        console.log('Available Models:');
        modelList.models.forEach(m => {
            console.log(`- Name: ${m.name}, Display: ${m.displayName}, Version: ${m.version}`);
        });
    } catch (error) {
        console.error('Error listing models:', error);
    }
}

run();
