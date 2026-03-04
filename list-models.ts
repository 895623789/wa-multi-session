import * as dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY || '';

interface GeminiModel {
    name: string;
    displayName: string;
    version: string;
    description?: string;
}

async function run() {
    if (!API_KEY) {
        console.error('❌ GEMINI_API_KEY is not set in .env');
        return;
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
        );

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json() as { models: GeminiModel[] };

        console.log(`\n✅ Available Gemini Models (${data.models?.length || 0} total):\n`);
        data.models?.forEach((m: GeminiModel) => {
            console.log(`  📦 ${m.name}`);
            console.log(`     Display: ${m.displayName}`);
            console.log(`     Version: ${m.version}`);
            console.log();
        });
    } catch (error) {
        console.error('❌ Error listing models:', error);
    }
}

run();
