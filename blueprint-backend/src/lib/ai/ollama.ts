// src/lib/ai/ollama.ts

// Helper to convert OpenAPI/Gemini schema into a concrete JSON example for local models
function schemaToExample(schema: any): any {
  if (!schema) return {};
  
  const typeStr = (schema.type || typeof schema).toLowerCase();
  
  if (typeStr === "array") {
    return [schemaToExample(schema.items)];
  }
  if (typeStr === "object") {
    const obj: any = {};
    if (schema.properties) {
      for (const key in schema.properties) {
        obj[key] = schemaToExample(schema.properties[key]);
      }
    }
    return obj;
  }
  
  return `<${typeStr}${schema.description ? ' - ' + schema.description : ''}>`;
}

export async function generateOllamaResponse<T>(
  systemInstruction: string,
  userPrompt: any,
  responseSchema: any 
): Promise<T> {
  const model = process.env.OLLAMA_MODEL || "llama3.1";
  const ollamaUrl = process.env.OLLAMA_HOST || "http://localhost:11434";

  console.log(`\n🦙 Attempting Ollama Fallback (${model})...`);

  // Extract text from userPrompt (could be string or Gemini part array)
  let promptText = "";
  if (!userPrompt) {
    promptText = "";
  } else if (typeof userPrompt === "string") {
    promptText = userPrompt;
  } else if (Array.isArray(userPrompt)) {
    promptText = userPrompt.map(p => p.text || "").join("\n");
  } else if (userPrompt.inlineData) {
    promptText = "[Binary data / PDF content provided]";
  } else {
    promptText = JSON.stringify(userPrompt);
  }

  const fullPrompt = `
  ${systemInstruction}
  
  USER DATA:
  ${promptText}
  
  OUTPUT INSTRUCTIONS:
  You must output a JSON object. Use the following JSON template as your exact structure.
  CRITICAL: Replace the placeholder values (like "<string>") with your actual generated data based on the USER DATA.
  Do not change the keys of the JSON object.
  
  JSON TEMPLATE:
  ${JSON.stringify(schemaToExample(responseSchema), null, 2)}
  
  CRITICAL: Return ONLY valid JSON. Do not include markdown formatting blocks like \`\`\`json. No preamble, no explanation.
  `;

  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model,
        prompt: fullPrompt,
        stream: false,
        format: "json"
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status} ${await response.text()}`);
    }

    const result = await response.json();
    let jsonString = result.response.trim();
    
    // Strip markdown formatting if the model still included it
    if (jsonString.startsWith("\`\`\`")) {
      jsonString = jsonString.replace(/^\`\`\`(json)?\n?/, "").replace(/\n?\`\`\`$/, "").trim();
    }
    
    return JSON.parse(jsonString) as T;
  } catch (error: any) {
    console.error("❌ Ollama Fallback Failed:", error.message);
    throw error;
  }
}
