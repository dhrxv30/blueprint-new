import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY missing");
    const ai = new GoogleGenAI({ apiKey });
    try {
        const models = await ai.models.list();
        console.log("Available Models:", JSON.stringify(models, null, 2));
    } catch (e) {
        console.error("Error listing models:", e);
    }
}
listModels();
