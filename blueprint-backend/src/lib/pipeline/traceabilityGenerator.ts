// src/lib/pipeline/traceabilityGenerator.ts
import type { Feature, UserStory, Task, TraceabilityGraph } from "../../types/prd.js";

export function buildTraceability(
  features: Feature[] = [], 
  stories: UserStory[] = [], 
  tasks: Task[] = [],
  architecture: any = null,
  codeFiles: any[] = [],
  tests: any[] = []
): TraceabilityGraph {
  const nodes: any[] = [];
  const edges: any[] = [];

  // 1. Define Horizontal Layers (Story Flow: Top -> Bottom)
  const layers = [
    { id: 'layer-business', label: 'Layer 1: Business Strategy', color: '#3b82f6', y: 0, h: 250 },
    { id: 'layer-product', label: 'Layer 2: Product Specifications', color: '#8b5cf6', y: 300, h: 250 },
    { id: 'layer-core', label: 'Layer 3: Core Engineering Engine', color: '#ec4899', y: 600, h: 350 },
    { id: 'layer-integrations', label: 'Layer 4: Global Integrations', color: '#f59e0b', y: 1000, h: 250 }
  ];

  layers.forEach(layer => {
    nodes.push({
      id: layer.id,
      type: 'lane', // We reuse the lane component but orient it horizontally
      data: { label: layer.label, color: layer.color },
      position: { x: 0, y: layer.y },
      style: { width: 2500, height: layer.h, backgroundColor: 'rgba(24,24,27,0.4)', border: `1px solid ${layer.color}20`, borderRadius: '16px' }
    });
  });

  // 3. Map Features (Business Layer - TOP)
  features.forEach((f, idx) => {
    nodes.push({ 
      id: f.id, 
      parentId: 'layer-business',
      type: "trace", 
      data: { label: f.name, type: "feature", badge: "Goal", description: f.description }, 
      position: { x: 100 + (idx * 400), y: 80 } 
    });
  });

  // 4. Map Stories (Product Layer)
  stories.forEach((s, idx) => {
    nodes.push({ 
      id: s.id, 
      parentId: 'layer-product',
      type: "trace", 
      data: { 
        label: s.story.substring(0, 45) + "...", 
        type: "story", 
        badge: "Story",
        description: s.story + "\n\nAcceptance Criteria:\n" + (s.acceptanceCriteria?.join('\n') || 'None')
      }, 
      position: { x: 100 + (idx * 350), y: 80 } 
    });
    if (s.featureId) {
      edges.push({ 
        id: `e-${s.featureId}-${s.id}`, 
        source: s.featureId, 
        target: s.id, 
        animated: true, 
        type: 'smoothstep',
        style: { strokeWidth: 2, stroke: '#8b5cf6' }
      });
    }
  });

  // 5. Map Tasks (Technical Layer)
  tasks.forEach((t, idx) => {
    nodes.push({ 
      id: t.id, 
      parentId: 'layer-tech',
      type: "trace", 
      data: { 
        label: t.title, 
        type: "task", 
        badge: "Task",
        description: t.description || `Technical task for story ${t.storyId}`
      }, 
      position: { x: 100 + (idx * 320), y: 80 } 
    });
    if (t.storyId) {
      edges.push({ id: `e-${t.storyId}-${t.id}`, source: t.storyId, target: t.id, animated: true, type: 'smoothstep' });
    }
  });

  // 6. Map Architecture & Core Engines (Core Layer)
  if (architecture && architecture.nodes) {
    const archNodes = architecture.nodes.filter((n: any) => n.type !== 'group');
    archNodes.forEach((n: any, idx: number) => {
      const archId = `arch-${n.id}`;
      const isGolden = n.isGoldenPath || false;
      
      nodes.push({
        id: archId,
        parentId: 'layer-core',
        type: "trace",
        data: { 
          label: n.label, 
          type: n.type || "service", 
          badge: n.type?.toUpperCase() || "ENGINE",
          isGoldenPath: isGolden,
          description: n.description || `Core architectural component: ${n.label}`
        },
        position: { x: 100 + (idx * 450), y: 80 },
        className: isGolden ? 'ring-2 ring-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : ''
      });

      // Link Stories -> Architecture
      stories.forEach(s => {
        if (s.story.toLowerCase().includes(n.label.toLowerCase()) || (n.relatedTaskIds && n.relatedTaskIds.some((tid: string) => s.id.includes(tid)))) {
          edges.push({ 
            id: `e-${s.id}-${archId}`, 
            source: s.id, 
            target: archId, 
            animated: isGolden, 
            type: 'smoothstep',
            style: isGolden ? { stroke: '#f59e0b', strokeWidth: 4 } : { stroke: '#3f3f46', strokeWidth: 2 }
          });
        }
      });
    });

    // 5. Automation Loop (USP)
    // Find a monitoring node and link it back to AI/Policy node
    const monitorNode = archNodes.find((n: any) => n.label.toLowerCase().includes('monitor') || n.label.toLowerCase().includes('metric'));
    const aiNode = archNodes.find((n: any) => n.label.toLowerCase().includes('ai') || n.label.toLowerCase().includes('policy') || n.label.toLowerCase().includes('inference'));
    
    if (monitorNode && aiNode) {
      edges.push({
        id: 'loop-automation',
        source: `arch-${monitorNode.id}`,
        target: `arch-${aiNode.id}`,
        label: 'Continuous Learning Loop',
        animated: true,
        type: 'smoothstep',
        style: { stroke: '#10b981', strokeWidth: 3, strokeDasharray: '5,5' }
      });
    }
  }

  // 6. Map Integrations & External (Bottom Layer)
  const integrations = architecture?.nodes?.filter((n: any) => n.parentId === 'lane-external' || n.type === 'external') || [];
  integrations.forEach((n: any, idx: number) => {
    const intId = `int-${n.id}`;
    nodes.push({
      id: intId,
      parentId: 'layer-integrations',
      type: "trace",
      data: { label: n.label, type: "api", badge: "EXTERNAL" },
      position: { x: 100 + (idx * 400), y: 80 }
    });

    // Link Core -> Integrations
    const coreNode = nodes.find(node => node.parentId === 'layer-core' && !node.id.startsWith('layer'));
    if (coreNode) {
      edges.push({ id: `e-core-${intId}`, source: coreNode.id, target: intId, type: 'smoothstep' });
    }
  });

  return { nodes, edges }; 
}