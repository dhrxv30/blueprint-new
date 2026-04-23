import { generateJSONResponse } from "../ai/gemini.js";
import { SYSTEM_PROMPTS } from "../ai/prompts.js";
import type { PipelineResult, ChangeImpactResult } from "../../types/prd.js";
import { Type } from "@google/genai";

export async function analyzeChangeImpact(
  oldResult: PipelineResult,
  newPrdText: string
): Promise<ChangeImpactResult> {

  const context = JSON.stringify({
    oldFeatures: oldResult.features,
    oldStories: oldResult.stories,
    oldTasks: oldResult.tasks
  });

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      changedFeatures: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      changedStories: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      changedTasks: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      impactedCodeFiles: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      impactedTests: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    },
    required: [
      "changedFeatures",
      "changedStories",
      "changedTasks",
      "impactedCodeFiles",
      "impactedTests"
    ]
  };

  const res = await generateJSONResponse(
    SYSTEM_PROMPTS.CHANGE_IMPACT_ANALYZER,
    `Old State:\n${context}\n\nNew PRD:\n${newPrdText}`,
    responseSchema
  ) as ChangeImpactResult;

  return res;
}