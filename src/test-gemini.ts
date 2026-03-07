import { GoogleGenerativeAI } from '@google/generative-ai';

const key = "AIzaSyC58XAkjAyNoIBngTLIXCXrArb2kfcdEeU";
const MODELS = ["gemini-2.0-flash", "gemini-1.5-flash"];

async function runDiagnostics() {
    console.log("=== GEMINI API LATEST KEY TEST ===");
    console.log(`Testing Key: ${key.substring(0, 10)}...`);
    const genAI = new GoogleGenerativeAI(key);

    for (const m of MODELS) {
        process.stdout.write(`  -> Model ${m}: `);
        try {
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("Hi");
            const response = await result.response;
            console.log("✅ OK - " + response.text().substring(0, 50).replace(/\n/g, ' ') + "...");
        } catch (err: any) {
            console.log(`❌ ERROR: ${err.message.split('\n')[0].substring(0, 100)}`);
        }
    }
}

runDiagnostics();
