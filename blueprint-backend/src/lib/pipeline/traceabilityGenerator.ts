// src/lib/pipeline/traceabilityGenerator.ts
import type { Feature, UserStory, Task, TraceabilityGraph } from "../../types/prd.js";

interface ArchitectureNode {
  id: string;
  label: string;
  type: string;
  description: string;
  relatedTaskIds?: string[];
}

interface CodeFile {
  path: string;
  name: string;
  language: string;
  content: string;
  relatedTaskId?: string;
}

export type RelationType = 'implements' | 'depends_on' | 'derived_from' | 'blocks' | 'validates' | 'contains';

export function buildTraceability(
  features: Feature[] = [], 
  stories: UserStory[] = [], 
  tasks: Task[] = [],
  architecture: { nodes: ArchitectureNode[] } | null = null,
  codeFiles: CodeFile[] = []
): TraceabilityGraph {
  const nodes: any[] = [];
  const edges: any[] = [];

  const COLUMN_WIDTH = 400;
  const ROW_HEIGHT = 140;

  // Track valid IDs for verification
  const validFeatureIds = new Set(features.map(f => f.id));
  const validStoryIds = new Set(stories.map(s => s.id));
  const validTaskIds = new Set(tasks.map(t => t.id));

  // 1. Map Features
  features.forEach((f, idx) => {
    nodes.push({ 
      id: f.id, 
      type: "trace", 
      data: { label: f.name, type: "feature", badge: "Business", description: f.description }, 
      position: { x: 0, y: idx * ROW_HEIGHT } 
    });
  });

  // 2. Map Stories
  stories.forEach((s, idx) => {
    nodes.push({ 
      id: s.id, 
      type: "trace", 
      data: { 
        label: s.story.length > 60 ? s.story.substring(0, 60) + "..." : s.story, 
        type: "story", 
        badge: "Product",
        description: s.acceptanceCriteria?.join("\n") || s.story
      }, 
      position: { x: COLUMN_WIDTH, y: idx * ROW_HEIGHT } 
    });
    
    // Feature -> Story: derived_from
    const fallbackIdx = Math.min(features.length - 1, Math.max(0, Math.floor(idx * features.length / (stories.length || 1))));
    const fallbackFeature = features[fallbackIdx];
    const sourceId = (s.featureId && validFeatureIds.has(s.featureId)) 
      ? s.featureId 
      : (features.length > 0 && fallbackFeature ? fallbackFeature.id : null);
    
    if (sourceId) {
      edges.push({ 
        id: `e-${sourceId}-${s.id}`, 
        source: sourceId, 
        target: s.id, 
        label: 'derived_from',
        data: { relation: 'derived_from' },
        type: 'traceEdge'
      });
    }
  });

  // 3. Map Tasks
  tasks.forEach((t, idx) => {
    nodes.push({ 
      id: t.id, 
      type: "trace", 
      data: { 
        label: t.title, 
        type: "task", 
        badge: t.type || "Dev",
        description: t.description,
        status: t.priority
      }, 
      position: { x: COLUMN_WIDTH * 2, y: idx * ROW_HEIGHT } 
    });
    
    // Story -> Task: implements
    const fallbackIdx = Math.min(stories.length - 1, Math.max(0, idx));
    const fallbackStory = stories[fallbackIdx];
    const sourceId = (t.storyId && validStoryIds.has(t.storyId))
      ? t.storyId
      : (stories.length > 0 && fallbackStory ? fallbackStory.id : null);

    if (sourceId) {
      edges.push({ 
        id: `e-${sourceId}-${t.id}`, 
        source: sourceId, 
        target: t.id, 
        label: 'implements',
        data: { relation: 'implements' },
        type: 'traceEdge'
      });
    }

    // Task -> Task dependencies: depends_on
    if (t.dependencies) {
      t.dependencies.forEach(depId => {
        if (validTaskIds.has(depId)) {
          edges.push({
            id: `e-dep-${depId}-${t.id}`,
            source: depId,
            target: t.id,
            label: 'depends_on',
            data: { relation: 'depends_on' },
            type: 'traceEdge'
          });
        }
      });
    }
  });

  // 4. Map Implementation
  let implIdx = 0;

  if (architecture && architecture.nodes) {
    architecture.nodes.forEach((node) => {
      const archId = `arch-${node.id}`;
      nodes.push({
        id: archId,
        type: "trace",
        data: { 
          label: node.label, 
          type: "service", 
          badge: (node.type || "service").toUpperCase(),
          description: node.description || ""
        },
        position: { x: COLUMN_WIDTH * 3, y: implIdx * ROW_HEIGHT }
      });
      implIdx++;

      // Task -> Architecture: implements
      let linked = false;
      if (node.relatedTaskIds) {
        node.relatedTaskIds.forEach(taskId => {
          if (validTaskIds.has(taskId)) {
            edges.push({ 
              id: `e-arch-${taskId}-${archId}`, 
              source: taskId, 
              target: archId,
              label: 'implements',
              data: { relation: 'implements' },
              type: 'traceEdge'
            });
            linked = true;
          }
        });
      }
      
      if (!linked && tasks.length > 0) {
        const safeIndex = Math.min(tasks.length - 1, Math.max(0, implIdx - 1));
        const fallbackTask = tasks[safeIndex];
        if (fallbackTask) {
          edges.push({ 
            id: `e-fallback-arch-${fallbackTask.id}-${archId}`, 
            source: fallbackTask.id, 
            target: archId,
            label: 'implements',
            data: { relation: 'implements' },
            type: 'traceEdge'
          });
        }
      }
    });
  }

  // Map Code Files
  codeFiles.forEach((file) => {
    const codeId = `code-${file.path.replace(/\//g, "-")}`;
    nodes.push({
      id: codeId,
      type: "trace",
      data: { 
        label: file.name, 
        type: "code", 
        badge: (file.language || "code").toUpperCase(),
        description: `Path: ${file.path}`
      },
      position: { x: COLUMN_WIDTH * 3, y: implIdx * ROW_HEIGHT }
    });
    implIdx++;

    // Task -> Code: implements
    if (file.relatedTaskId && validTaskIds.has(file.relatedTaskId)) {
      edges.push({ 
        id: `e-code-${file.relatedTaskId}-${codeId}`, 
        source: file.relatedTaskId, 
        target: codeId,
        label: 'implements',
        data: { relation: 'implements' },
        type: 'traceEdge'
      });
    } else if (tasks.length > 0) {
      const safeIndex = Math.min(tasks.length - 1, Math.max(0, implIdx - 1));
      const fallbackTask = tasks[safeIndex];
      if (fallbackTask) {
        edges.push({ 
          id: `e-fallback-code-${fallbackTask.id}-${codeId}`, 
          source: fallbackTask.id, 
          target: codeId,
          label: 'implements',
          data: { relation: 'implements' },
          type: 'traceEdge'
        });
      }
    }
  });

  return { nodes, edges }; 
}