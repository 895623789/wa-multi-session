import { GoogleGenerativeAI } from '@google/generative-ai';

const key = "AIzaSyC58XAkjAyNoIBngTLIXCXrArb2kfcdEeU";
const MODELS = [
    { id: "gemini-2.0-flash", name: "2.0 Flash" },
    { id: "gemini-2.0-flash-lite", name: "2.0 Flash-Lite" },
    { id: "gemini-flash-latest", name: "Flash Latest" },
    { id: "gemini-flash-lite-latest", name: "Flash-Lite Latest" }
];

async function runDiagnostics() {
    console.log("=== TESTING AVAILABLE MODELS ===");
    const genAI = new GoogleGenerativeAI(key);

    for (const m of MODELS) {
        process.stdout.write(`Testing Model: ${m.name} (${m.id})... `);
        try {
            const model = genAI.getGenerativeModel({ model: m.id });
            const result = await model.generateContent("Hi");
            await result.response;
            console.log(`✅ OK`);
        } catch (err: any) {
            console.log(`❌ FAILED: ${err.message.split('\n')[0]}`);
        }
    }
}

runDiagnostics();
