// src/lib/ai/gemini.ts
import { GoogleGenAI } from "@google/genai";
import type { Schema } from "@google/genai";

let ai: GoogleGenAI | null = null;

// Helper function to pause execution
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function generateJSONResponse<T>(
  systemInstruction: string,
  userPromptOrFile: any,
  responseSchema: Schema,
  retries: number = 5 // Increased retries for hackathon demo stability
): Promise<T> {

  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY missing from .env");
    ai = new GoogleGenAI({ apiKey });
  }

  // CRITICAL: Switching to gemini-3-flash-preview as requested to bypass rate limits
  const model = "gemini-2.5-flash";

  let parts = [];
  if (typeof userPromptOrFile === "string") {
    parts = [{ text: userPromptOrFile }];
  } else if (Array.isArray(userPromptOrFile)) {
    parts = userPromptOrFile;
  } else {
    parts = [userPromptOrFile];
  }

  // Retry Loop
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts }],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.1,
        },
      });

      if (!response.text) throw new Error("No text returned from Gemini");
      return JSON.parse(response.text) as T;

    } catch (error: any) {
      // LOG ERROR DETAILS TO TERMINAL
      const status = error?.status || error?.response?.status;
      const message = error?.message || "Internal AI Error";
      const details = error?.response?.data || error?.details || "No extra details";

      console.error(`\n❌ Gemini API Error (Attempt ${attempt}/${retries}):`, {
        status,
        message,
        details
      });

      const isRateLimit = status === 429;
      const isOverloaded = status === 503;

      if ((isRateLimit || isOverloaded) && attempt < retries) {
        const delay = attempt * 5000; // Wait 5s, then 10s, then 15s
        console.warn(`⚠️ Gemini API busy (${status}). Retrying in ${delay / 1000}s...`);
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }

  throw new Error("Pipeline failed after maximum retries.");
}