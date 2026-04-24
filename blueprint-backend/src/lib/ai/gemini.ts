// src/lib/ai/gemini.ts
import { GoogleGenAI } from "@google/genai";
import type { Schema } from "@google/genai";

let ai: GoogleGenAI | null = null;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function generateJSONResponse<T>(
  systemInstruction: string,
  userPromptOrFile: any,
  responseSchema: Schema,
  retries: number = 3
): Promise<T> {

  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY missing from .env");
    ai = new GoogleGenAI({ apiKey });
  }

  let parts = [];
  if (typeof userPromptOrFile === "string") {
    parts = [{ text: userPromptOrFile }];
  } else if (Array.isArray(userPromptOrFile)) {
    parts = userPromptOrFile;
  } else {
    parts = [userPromptOrFile];
  }

  // Exclusive model as requested
  const modelName = "gemini-3-flash-preview";

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`\n🤖 AI Inference via ${modelName} (Attempt ${attempt}/${retries})`);
      
      const result = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.1,
        }
      });

      if (!result.text) throw new Error("No text returned from Gemini engine");
      return JSON.parse(result.text) as T;

    } catch (error: any) {
        const status = error?.status || error?.response?.status;
        const message = error?.message || "Internal AI Engine Error";

        // Structured logging for debugging
        console.error(`\n[GEMINI_ENGINE_ERROR] Model: ${modelName} | Attempt: ${attempt}/${retries}`);
        console.error(`Status: ${status || "N/A"} | Message: ${message}`);

        const isRateLimit = status === 429 || message.toLowerCase().includes("quota");
      
      if ((isRateLimit || status === 503) && attempt < retries) {
        const delay = attempt * 3000;
        await sleep(delay);
      } else {
        throw error; // Immediate failure for non-transient errors
      }
    }
  }

  throw new Error("Gemini Pipeline failed.");
}
