import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Maximize2,
  LayoutDashboard
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

    return {
      ...node,
      position: { 
        // We use the static lane X, but center the node within it
        x: (config.w / 2) - 100, 
        // Use the GLOBAL Y from dagre to ensure cross-lane alignment
        // (Offset by 100 for the lane header)
        y: pos.y + 100
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

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{ ...style, strokeWidth: 1.5, stroke: style.stroke || '#52525b' }} 
      />
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
            className="px-2 py-1 bg-black border border-white/10 rounded text-zinc-500 uppercase tracking-tighter"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
      {data?.animated && (
        <circle r="2" fill="#ffffff" filter="blur(1px)">
          <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
        </circle>
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
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
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
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      setTimeout(() => fitView({ padding: 0.2, duration: 1000 }), 200);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [projectId, fitView, toast, setNodes, setEdges]);

  useEffect(() => { loadData(); }, [loadData]);

  const onNodeMouseEnter = useCallback((_: any, node: any) => {
    if (node.type === 'unified') setHoveredNodeId(node.id);
  }, []);

  const onNodeMouseLeave = useCallback(() => setHoveredNodeId(null), []);

  const processedEdges = useMemo(() => {
    if (!hoveredNodeId) return edges;
    return edges.map(e => {
      const isConnected = e.source === hoveredNodeId || e.target === hoveredNodeId;
      return {
        ...e,
        style: { ...e.style, stroke: isConnected ? '#ffffff' : '#18181b', strokeWidth: isConnected ? 2 : 1, opacity: isConnected ? 1 : 0.1 }
      };
    });
  }, [edges, hoveredNodeId]);

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
            BLUEPRINT <span className="text-zinc-700">OS / ARCH</span>
          </h1>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => fitView({ padding: 0.1, duration: 500 })} variant="outline" className="h-10 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl">
             CENTER VIEW
          </Button>
          <Button onClick={() => navigate(`/dashboard/code?projectId=${projectId}`)} className="h-10 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl px-6">
            DEPLOY CODE
          </Button>
        </div>
      </div>

      <div className="h-[calc(100vh-14rem)] bg-[#030303] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        <ReactFlow
          nodes={nodes}
          edges={processedEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          colorMode="dark"
          fitView
        >
          <Background variant={BackgroundVariant.Dots} gap={40} size={1} color="#111" />
          <Controls className="!bg-zinc-900 !border-white/5 !fill-white rounded-xl translate-x-4 -translate-y-4" />
        </ReactFlow>
      </div>
    </DashboardLayout>
  );
}

export default function Architecture() {
  return <ReactFlowProvider><ArchitectureContent /></ReactFlowProvider>;
}