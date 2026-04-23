// src/lib/pipeline/storyGenerator.ts
import { generateJSONResponse } from "../ai/gemini.js";
import { SYSTEM_PROMPTS } from "../ai/prompts.js";
import { Type } from "@google/genai";
import type { Schema } from "@google/genai";
import type { Feature, UserStory } from "../../types/prd.js"; // <-- Using your global types!

// 1. Define the STRICT Schema (Now including featureId)
const storySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    stories: {
      type: Type.ARRAY,
      description: "Generate high-level, Epic-style User Stories. Consolidate related flows. For example, combine all login, signup, and password reset flows into a single comprehensive 'Authentication' story. Limit to 1 or 2 dense stories per feature.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "e.g., US-01" },
          featureId: { type: Type.STRING },
          story: { type: Type.STRING },
          acceptanceCriteria: {
            type: Type.ARRAY,
            items: { type: Type.STRING, description: "List 3-5 broad acceptance criteria covering the grouped functionalities." }
          }
        },
        required: ["id", "featureId", "story", "acceptanceCriteria"]
      }
    }
  },
  required: ["stories"]
};

// 2. Accept Feature[] instead of string[]
export async function generateUserStories(features: Feature[]): Promise<UserStory[]> {
  console.log("-> Generating User Stories...");
  
  try {
    const res = await generateJSONResponse<{ stories: UserStory[] }>(
      SYSTEM_PROMPTS.STORY_GENERATOR,
      JSON.stringify(features),
      storySchema
    );
    
    return res.stories || [];
  } catch (error) {
    console.error("Failed to generate stories:", error);
    return [];
  }
}