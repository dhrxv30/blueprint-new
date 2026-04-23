import { generateJSONResponse } from "../ai/gemini.js";
import { SYSTEM_PROMPTS } from "../ai/prompts.js";
import type { Ambiguity } from "../../types/prd.js";
import { Type } from "@google/genai";

export async function detectAmbiguities(prdText: string): Promise<Ambiguity[]> {

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      ambiguities: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            description: { type: Type.STRING },
            severity: { type: Type.STRING }
          },
          required: ["id", "description", "severity"]
        }
      }
    },
    required: ["ambiguities"]
  };

  const res = await generateJSONResponse(
    SYSTEM_PROMPTS.AMBIGUITY_DETECTOR,
    prdText,
    responseSchema
  ) as { ambiguities: Ambiguity[] };

  return res.ambiguities;
}