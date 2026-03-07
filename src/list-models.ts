import { GoogleGenerativeAI } from '@google/generative-ai';

const key = "AIzaSyC58XAkjAyNoIBngTLIXCXrArb2kfcdEeU";

async function listModels() {
    console.log("=== LISTING AVAILABLE MODELS ===");
    const genAI = new GoogleGenerativeAI(key);
    try {
        // Note: The JS SDK doesn't have a direct listModels, we usually use the REST API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach((m: any) => {
                console.log(`- ${m.name} (DisplayName: ${m.displayName})`);
                console.log(`  Capabilities: ${m.supportedGenerationMethods.join(', ')}`);
            });
        } else {
            console.log("No models found or error in response:", JSON.stringify(data));
        }
    } catch (err: any) {
        console.error("Error:", err.message);
    }
}

listModels();
