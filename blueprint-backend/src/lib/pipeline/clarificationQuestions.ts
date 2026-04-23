import { generateJSONResponse } from "../ai/gemini.js";
import { SYSTEM_PROMPTS } from "../ai/prompts.js";
import type { Ambiguity, ClarificationQuestion } from "../../types/prd.js";
import { Type } from "@google/genai";

export async function generateClarifications(
  ambiguities: Ambiguity[]
): Promise<ClarificationQuestion[]> {

  if (!ambiguities.length) return [];

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            ambiguityId: { type: Type.STRING },
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["id", "ambiguityId", "question", "options"]
        }
      }
    },
    required: ["questions"]
  };

  const res = await generateJSONResponse(
    SYSTEM_PROMPTS.CLARIFICATION_GENERATOR,
    JSON.stringify(ambiguities),
    responseSchema
  ) as { questions: ClarificationQuestion[] };

  return res.questions;
}