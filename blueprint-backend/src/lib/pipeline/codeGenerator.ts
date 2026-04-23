// src/lib/pipeline/codeGenerator.ts
import { generateJSONResponse } from "../ai/gemini.js";
import { SYSTEM_PROMPTS } from "../ai/prompts.js";
import type { Task } from "../../types/prd.js";
import { Type, type Schema } from "@google/genai";

// 1. Ask Gemini for a flat list of files (much easier for AI to generate reliably)
const codeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    files: {
      type: Type.ARRAY,
      description: "Generate the core files needed for this project based on the tasks. Include actual boilerplate code.",
      items: {
        type: Type.OBJECT,
        properties: {
          path: { type: Type.STRING, description: "Full file path, e.g., src/controllers/userController.ts" },
          name: { type: Type.STRING, description: "File name with extension, e.g., userController.ts" },
          language: { type: Type.STRING, description: "e.g., typescript, javascript, json, html, css" },
          content: { type: Type.STRING, description: "The actual source code boilerplate for this file. Must not be empty." }
        },
        required: ["path", "name", "language", "content"]
      }
    }
  },
  required: ["files"]
};

interface FlatFile {
  path: string;
  name: string;
  language: string;
  content: string;
}

// 2. Helper function to instantly convert flat AI output into the nested tree the frontend expects
function buildFileTree(files: FlatFile[]): any[] {
  const root: any[] = [];

  files.forEach(file => {
    const parts = file.path.split('/');
    let currentLevel = root;

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      let existingNode = currentLevel.find(n => n.name === part);

      if (existingNode) {
        if (!isFile) {
          currentLevel = existingNode.children; // Traverse deeper
        }
      } else {
        const newNode: any = {
          path: parts.slice(0, index + 1).join('/'),
          name: part,
          type: isFile ? 'file' : 'folder'
        };
        
        if (isFile) {
          newNode.language = file.language;
          newNode.content = file.content;
        } else {
          newNode.children = [];
        }
        
        currentLevel.push(newNode);
        
        if (!isFile) {
          currentLevel = newNode.children;
        }
      }
    });
  });

  return root;
}

// 3. The main export
export async function generateCode(tasks: Task[]): Promise<any[]> {
  console.log("-> Generating Code & File Structure...");
  
  const res = await generateJSONResponse<{ files: FlatFile[] }>(
    SYSTEM_PROMPTS.CODE_GENERATOR,
    JSON.stringify(tasks),
    codeSchema
  );
  
  // Transform the flat AI response into the nested UI tree
  return buildFileTree(res.files || []);
}