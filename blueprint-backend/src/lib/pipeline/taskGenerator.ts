// src/lib/pipeline/taskGenerator.ts
import { generateJSONResponse } from "../ai/gemini.js";
import { SYSTEM_PROMPTS } from "../ai/prompts.js";
import type { UserStory, Task } from "../../types/prd.js";
import { Type, type Schema } from "@google/genai";

const taskSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    tasks: {
      type: Type.ARRAY,
      description: "You are a Lead Full-Stack Architect. Break the provided user stories into comprehensive technical tasks covering frontend, backend, database, and infrastructure.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          storyId: { type: Type.STRING },
          // ADDED: Link the task back to the parent feature so the UI can count them!
          featureId: { type: Type.STRING, description: "The ID of the feature this task ultimately belongs to." },
          title: { type: Type.STRING, description: "A broad, comprehensive engineering task" },
          description: { type: Type.STRING },
          // UPDATED: Give the AI better instructions for type
          type: { type: Type.STRING, description: "Must be one of: Frontend, Backend, Infrastructure, UI/UX, or Database" },
          // ADDED: Tell the AI to generate a priority!
          priority: { type: Type.STRING, description: "Must be one of: Critical, High, Medium, Low" },
          complexity: { type: Type.INTEGER, description: "Story points (1, 2, 3, 5, 8)" }
        },
        required: ["id", "storyId", "featureId", "title", "description", "type", "priority", "complexity"]
      }
    }
  },
  required: ["tasks"]
};

export async function generateTasks(stories: UserStory[]): Promise<Task[]> {
  console.log("-> Generating Technical Tasks...");
  
  const res = await generateJSONResponse<{ tasks: Task[] }>(
    SYSTEM_PROMPTS.TASK_GENERATOR,
    JSON.stringify(stories),
    taskSchema
  );
  
  return res.tasks;
}