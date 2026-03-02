import * as dotenv from 'dotenv';
dotenv.config();

const key = process.env.GEMINI_API_KEY || '';

async function run() {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const response = await fetch(url);
        const data = await response.json();
        console.log('Available Models:', JSON.stringify(data.models.map(m => m.name), null, 2));
    } catch (error) {
        console.error('FAILURE:', error.message);
    }
}

run();
