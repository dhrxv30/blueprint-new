// src/lib/pipeline/traceabilityGenerator.ts
import type { Feature, UserStory, Task, TraceabilityGraph } from "../../types/prd.js";

export function buildTraceability(
  features: Feature[] = [], 
  stories: UserStory[] = [], 
  tasks: Task[] = []
): TraceabilityGraph {
  const nodes: any[] = [];
  const edges: any[] = [];

  // 1. Map Features (Column 1)
  features.forEach((f, idx) => {
    nodes.push({ 
      id: f.id, 
      type: "trace", // Match the frontend nodeTypes key
      data: { label: f.name, type: "feature", badge: "Business" }, 
      position: { x: 0, y: idx * 200 } 
    });
  });

  // 2. Map Stories (Column 2)
  stories.forEach((s, idx) => {
    nodes.push({ 
      id: s.id, 
      type: "trace", 
      data: { label: s.story.substring(0, 40) + "...", type: "story", badge: "Product" }, 
      position: { x: 400, y: idx * 180 } 
    });
    // Link Feature -> Story
    if (s.featureId) {
      edges.push({ id: `e-${s.featureId}-${s.id}`, source: s.featureId, target: s.id, animated: true });
    }
  });

  // 3. Map Tasks (Column 3)
  tasks.forEach((t, idx) => {
    nodes.push({ 
      id: t.id, 
      type: "trace", 
      data: { label: t.title, type: "task", badge: t.type }, 
      position: { x: 800, y: idx * 100 } 
    });
    // Link Story -> Task
    if (t.storyId) {
      edges.push({ id: `e-${t.storyId}-${t.id}`, source: t.storyId, target: t.id, animated: true });
    }
  });

  return { nodes, edges }; 
}