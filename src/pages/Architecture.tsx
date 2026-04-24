import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Maximize2,
  LayoutDashboard,
  X
} from "lucide-react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useReactFlow,
  MarkerType,
  BaseEdge,
  getSmoothStepPath,
  EdgeProps,
  EdgeLabelRenderer
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { motion, AnimatePresence } from 'framer-motion';

// Import Custom Components
import { UnifiedNode } from "@/components/architecture/UnifiedNode";
import { LaneNode } from "@/components/architecture/LaneNode";
import { BACKEND_BASE } from "@/lib/config";

// ==========================================
// SWIMLANE LAYOUT LOGIC
// ==========================================
const LANE_CONFIG: Record<string, { x: number; y: number; w: number; h: number; order: number }> = {
  'lane-clients': { x: 0, y: 0, w: 400, h: 1000, order: 0 },
  'lane-edge': { x: 450, y: 0, w: 400, h: 1000, order: 1 },
  'lane-app': { x: 900, y: 0, w: 700, h: 1000, order: 2 },
  'lane-data': { x: 1650, y: 0, w: 400, h: 1000, order: 3 },
  'lane-external': { x: 2100, y: 0, w: 400, h: 1000, order: 4 },
  'lane-obs': { x: 0, y: 1050, w: 2500, h: 300, order: 5 },
};

const getLayoutedElements = (nodes: any[], edges: any[]) => {
  // 1. Initialize Global Graph for coordination
  const g = new dagre.graphlib.Graph({ compound: true });
  g.setGraph({
    rankdir: 'LR',
    nodesep: 80,
    ranksep: 150,
    marginx: 100,
    marginy: 100
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Separate lanes and actual content nodes
  const laneNodes = nodes.filter(n => n.type === 'lane');
  const contentNodes = nodes.filter(n => n.type === 'unified');

  // 2. Add content nodes to global graph for rank calculation
  contentNodes.forEach((node) => {
    g.setNode(node.id, { width: 200, height: 120 });
  });

  // 3. Add ALL edges for global coordination
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  // 4. Run Global Layout
  dagre.layout(g);

  // 5. Transform coordinates
  const processedContentNodes = contentNodes.map(node => {
    const pos = g.node(node.id);
    const laneId = node.parentId || 'lane-app';
    const config = LANE_CONFIG[laneId] || LANE_CONFIG['lane-app'];

    // Calculate horizontal variety within the lane based on dagre's rank (pos.x)
    // We group by rank to avoid overlap
    const laneNodes = contentNodes.filter(n => (n.parentId || 'lane-app') === laneId);
    const uniqueX = Array.from(new Set(laneNodes.map(n => g.node(n.id).x))).sort((a, b) => a - b);
    const rankIndex = uniqueX.indexOf(pos.x);
    const rankCount = uniqueX.length;

    // Distribute ranks evenly across the lane width
    const padding = 60;
    const availableWidth = config.w - 240; // 240 is approx node width + margin
    const xOffset = rankCount > 1
      ? (rankIndex / (rankCount - 1)) * availableWidth + padding
      : (config.w / 2) - 100;

    return {
      ...node,
      position: {
        x: xOffset,
        y: pos.y + 80 // Reduced offset for header
      },
    };
  });

  // 6. Position Lanes statically
  const processedLanes = laneNodes.map(lane => {
    const config = LANE_CONFIG[lane.id] || LANE_CONFIG['lane-app'];
    return {
      ...lane,
      position: { x: config.x, y: config.y },
      style: { width: config.w, height: config.h, pointerEvents: 'none' as const },
    };
  });

  return { nodes: [...processedLanes, ...processedContentNodes], edges };
};

// ==========================================
// CUSTOM EDGE
// ==========================================
const AntigravityEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  data,
  selected,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetPosition,
    targetX,
    targetY,
    borderRadius: 20,
  });

  const isHighlighted = (data as any)?.isHighlighted || selected;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: isHighlighted ? 2.5 : 1.5,
          stroke: isHighlighted ? '#ffffff' : (style.stroke || '#27272a'),
          opacity: isHighlighted ? 1 : (style.opacity || 0.3),
          transition: 'all 0.5s ease',
        }}
      />

      {/* SEMANTIC FLOW PARTICLES */}
      <circle r={isHighlighted ? "2.5" : "1.5"} fill={isHighlighted ? "#ffffff" : "#52525b"} style={{ filter: 'blur(1px)' }}>
        <animateMotion
          dur={isHighlighted ? "1.5s" : "4s"}
          repeatCount="indefinite"
          path={edgePath}
        />
      </circle>

      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 8,
              fontWeight: 900,
              pointerEvents: 'none',
            }}
            className={`px-2 py-1 bg-black border rounded uppercase tracking-tighter transition-colors duration-500 ${isHighlighted ? 'border-white/40 text-white' : 'border-white/10 text-zinc-600'}`}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

const nodeTypes = {
  unified: UnifiedNode,
  lane: LaneNode
};
const edgeTypes = { antigravity: AntigravityEdge };

function ArchitectureContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const { toast } = useToast();
  const { fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let architectureData = null;
      if (projectId) {
        const response = await fetch(`${BACKEND_BASE}/api/projects/${projectId}/architecture`);
        if (response.ok) architectureData = await response.json();
      }

      if (!architectureData) {
        const raw = localStorage.getItem("blueprint_project_data");
        if (raw) architectureData = JSON.parse(raw).architecture;
      }

      if (!architectureData || !architectureData.nodes) {
        toast({ variant: "destructive", title: "Error", description: "Analysis not found." });
        return;
      }

      const rawNodes = (architectureData.nodes || []).map((n: any) => {
        const label = (n.label || "").toLowerCase();
        const type = (n.type || "").toLowerCase();
        let pid = (n.parentId || "").toLowerCase();

        // Intelligent Lane Routing Heuristics
        let assignedLane = 'lane-app'; // Default

        // 1. Client Layer detection
        if (pid.includes('client') || label.includes('ui') || label.includes('extension') || label.includes('mobile') || label.includes('app') || type === 'client') {
          assignedLane = 'lane-clients';
        }
        // 2. Edge / Network Layer detection
        else if (pid.includes('edge') || label.includes('gateway') || label.includes('dns') || label.includes('load balancer') || label.includes('lb') || type === 'gateway') {
          assignedLane = 'lane-edge';
        }
        // 3. Data Layer detection
        else if (pid.includes('data') || pid.includes('db') || type === 'database' || type === 'cache' || type === 'storage' || label.includes('database') || label.includes('redis') || label.includes('sql')) {
          assignedLane = 'lane-data';
        }
        // 4. External Layer detection
        else if (pid.includes('external') || type === 'external' || label.includes('api') && !label.includes('gateway')) {
          assignedLane = 'lane-external';
        }
        // 5. Observability detection
        else if (pid.includes('obs') || label.includes('metrics') || label.includes('logging') || label.includes('tracing')) {
          assignedLane = 'lane-obs';
        }

        return {
          id: n.id,
          parentId: assignedLane,
          type: 'unified',
          data: {
            label: n.label,
            type: n.type || 'service',
            description: n.description
          },
          position: { x: 0, y: 0 },
          extent: 'parent' as const
        };
      });

      // Ensure lanes exist
      const lanes = Object.keys(LANE_CONFIG).map(lid => ({
        id: lid,
        type: 'lane',
        data: { label: lid.replace('lane-', '').toUpperCase() + ' LAYER' },
        position: { x: 0, y: 0 },
        selectable: false,
        draggable: false,
      }));

      // Filter out AI lanes if they exist, use our strict ones
      const finalNodes = [...lanes, ...rawNodes];

      const rawEdges = (architectureData.edges || []).map((e: any, i: number) => ({
        id: e.id || `edge-${i}`,
        source: e.source || e.from,
        target: e.target || e.to,
        label: e.label || "",
        type: 'antigravity',
        data: { animated: e.animated },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#ffffff' },
      })).filter((e: any) => e.source && e.target);

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(finalNodes, rawEdges);

      // Initially set all edges to be slightly animated but subtle
      const initialEdges = layoutedEdges.map(e => ({
        ...e,
        data: { ...e.data, isHighlighted: false }
      }));

      setNodes(layoutedNodes);
      setEdges(initialEdges);
      setTimeout(() => fitView({ padding: 0.1, duration: 1000 }), 200);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [projectId, fitView, toast, setNodes, setEdges]);

  useEffect(() => {
    loadData().then(() => {
      const focusId = searchParams.get("focus");
      if (focusId) {
        // Give time for nodes to be set and layouted
        setTimeout(() => {
          const node = nodes.find(n => n.id === focusId);
          if (node) {
            setSelectedNode(node);
            performAnalysis(node.id);
          }
        }, 1200);
      }
    });
  }, [loadData, searchParams]);

  // SEMANTIC TRACING LOGIC
  const performAnalysis = useCallback((nodeId: string) => {
    const affectedNodeIds = new Set<string>();
    const affectedEdgeIds = new Set<string>();

    const traverse = (id: string, visited: Set<string>) => {
      if (visited.has(id)) return;
      visited.add(id);
      affectedNodeIds.add(id);

      edges.forEach(edge => {
        if (edge.source === id) {
          affectedEdgeIds.add(edge.id);
          traverse(edge.target, visited);
        }
        if (edge.target === id) {
          affectedEdgeIds.add(edge.id);
          traverse(edge.source, visited);
        }
      });
    };

    traverse(nodeId, new Set());

    setNodes(nds => nds.map(n => {
      if (n.type === 'lane') return n;
      return {
        ...n,
        data: {
          ...n.data,
          highlighted: affectedNodeIds.has(n.id),
          dimmed: !affectedNodeIds.has(n.id)
        }
      };
    }));

    setEdges(eds => eds.map(e => {
      const isAffected = affectedEdgeIds.has(e.id);
      return {
        ...e,
        data: { ...e.data, isHighlighted: isAffected },
        style: {
          ...e.style,
          stroke: isAffected ? '#ffffff' : '#18181b',
          strokeWidth: isAffected ? 2.5 : 1,
          opacity: isAffected ? 1 : 0.05
        }
      };
    }));
  }, [edges, setNodes, setEdges]);

  const resetAnalysis = useCallback(() => {
    setNodes(nds => nds.map(n => ({
      ...n,
      data: { ...n.data, highlighted: false, dimmed: false }
    })));
    setEdges(eds => eds.map(e => ({
      ...e,
      data: { ...e.data, isHighlighted: false },
      style: { ...e.style, stroke: '#27272a', strokeWidth: 1.5, opacity: 0.3 }
    })));
  }, [setNodes, setEdges]);

  const onNodeClick = useCallback((_: any, node: any) => {
    if (node.type === 'lane') return;
    setSelectedNode(node);
    performAnalysis(node.id);
  }, [performAnalysis]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    resetAnalysis();
  }, [resetAnalysis]);

  if (loading) return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="w-16 h-16 border-4 border-white/5 border-t-white rounded-full animate-spin mb-4" />
        <p className="text-zinc-600 font-black uppercase tracking-[0.4em]">Rendering Topology</p>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-8 px-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
            ARCHITECTURE
          </h1>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => fitView({ padding: 0.1, duration: 500 })} variant="outline" className="h-10 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl">
            CENTER VIEW
          </Button>
          <Button 
            onClick={() => navigate(projectId ? `/dashboard/traceability?projectId=${projectId}` : "/dashboard/traceability")} 
            className="bg-primary hover:brightness-110 text-white gap-2 shadow-lg glow-orange h-10 px-6 rounded-xl font-bold"
          >
            VIEW TRACEABILITY
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-14rem)]">
        <div className="flex-1 bg-[#030303] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            colorMode="dark"
            fitView
          >
            <Background variant={BackgroundVariant.Dots} gap={40} size={1} color="#111" />
            <Controls className="!bg-zinc-900 !border-white/5 !fill-white rounded-xl translate-x-4 -translate-y-4" />
          </ReactFlow>
        </div>

        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="w-full lg:w-80 bg-zinc-900 border border-white/5 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-tighter">System Node</h3>
                </div>
                <button onClick={onPaneClick} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-4 h-4 text-zinc-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div>
                  <Badge variant="outline" className="border-white/10 text-zinc-500 text-[10px] uppercase mb-2">
                    {selectedNode.data.type}
                  </Badge>
                  <h2 className="text-2xl font-bold text-white tracking-tight leading-tight">
                    {selectedNode.data.label}
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Responsibility</span>
                      <LayoutDashboard className="w-3 h-3 text-zinc-700" />
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      {selectedNode.data.description || "Core architectural component responsible for handling system-level operations and data flow management."}
                    </p>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <h4 className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Topology Impact</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-[10px] text-zinc-600 uppercase mb-1">Fan-In</p>
                        <p className="text-lg font-bold text-white">3</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                        <p className="text-[10px] text-zinc-600 uppercase mb-1">Fan-Out</p>
                        <p className="text-lg font-bold text-white">2</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Button
                    onClick={() => navigate(projectId ? `/dashboard/traceability?projectId=${projectId}&focus=${selectedNode.id}` : `/dashboard/traceability?focus=${selectedNode.id}`)}
                    className="w-full bg-white text-black hover:bg-zinc-200 font-bold rounded-xl h-12"
                  >
                    Inspect Dependencies
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

export default function Architecture() {
  return <ReactFlowProvider><ArchitectureContent /></ReactFlowProvider>;
}