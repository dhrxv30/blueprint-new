import { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  GitMerge, 
  Search, 
  Info, 
  X, 
  FileText, 
  Server, 
  Code2, 
  Loader2,
  ArrowRightLeft
} from "lucide-react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { initialTraceNodes, initialTraceEdges } from "@/data/traceabilityData";
import { BACKEND_BASE } from "@/lib/config";

// ==========================================
// CUSTOM EDGE COMPONENT
// ==========================================
const TraceEdge = ({
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
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.25,
  });

  const relation = (data?.relation as string) || 'trace';
  const isHighlighted = (data as any)?.isHighlighted || selected;
  
  const getRelationStyle = () => {
    switch (relation) {
      case 'depends_on': 
        return { 
          strokeDasharray: '6,4', 
          stroke: isHighlighted ? '#ffffff' : '#52525b', 
          strokeWidth: isHighlighted ? 3 : 2 
        };
      case 'derived_from': 
        return { 
          stroke: isHighlighted ? '#ffffff' : '#3f3f46', 
          strokeDasharray: '4,4', 
          strokeWidth: isHighlighted ? 2.5 : 1.5, 
          opacity: isHighlighted ? 1 : 0.6
        };
      default: 
        return { 
          stroke: isHighlighted ? '#ffffff' : '#71717a', 
          strokeWidth: isHighlighted ? 3.5 : 2.5 
        };
    }
  };

  const finalStyle = { ...getRelationStyle(), ...style };

  return (
    <>
      <BaseEdge 
        id={id} 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{
          ...finalStyle,
          strokeLinecap: 'round',
          transition: 'all 0.5s ease',
        }} 
      />
      
      {/* FLOW PARTICLE ANIMATION */}
      <circle r="3" fill={isHighlighted ? "#fff" : "#a1a1aa"} style={{ filter: 'blur(1px)' }}>
        <animateMotion 
          dur={isHighlighted ? "1.5s" : "3s"} 
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
              pointerEvents: 'all',
            }}
            className="bg-zinc-900/90 text-zinc-500 px-1.5 py-0.5 rounded-full border border-zinc-800 font-bold uppercase tracking-tighter backdrop-blur-sm z-10"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

const edgeTypes = {
  traceEdge: TraceEdge,
};

interface TraceNodeData extends Record<string, unknown> {
  label: string;
  type: string;
  badge: string;
  description?: string;
  status?: string;
  highlighted?: boolean;
  dimmed?: boolean;
}

// ==========================================
// CUSTOM NODE COMPONENT
// ==========================================
const TraceNode = ({ data, id, selected }: { data: TraceNodeData; id: string; selected?: boolean }) => {
  const isRequirement = data.type === 'requirement' || data.type === 'feature';
  const isStory = data.type === 'story';
  const isTask = data.type === 'task';
  const isApi = data.type === 'api' || data.type === 'service';
  const isCode = data.type === 'code' || data.type === 'implementation';
  
  const getIcon = () => {
    if (isRequirement) return <FileText className="w-4 h-4" />;
    if (isStory) return <Search className="w-4 h-4" />;
    if (isTask) return <GitMerge className="w-4 h-4" />;
    if (isApi) return <Server className="w-4 h-4" />;
    if (isCode) return <Code2 className="w-4 h-4" />;
    return <Code2 className="w-4 h-4" />;
  };

  const getColorClass = () => {
    if (data.highlighted || selected) {
      if (isRequirement) return "border-blue-500 bg-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.6)] scale-110 z-50 ring-2 ring-blue-500/50";
      if (isStory) return "border-purple-500 bg-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.6)] scale-110 z-50 ring-2 ring-purple-500/50";
      if (isTask) return "border-green-500 bg-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.6)] scale-110 z-50 ring-2 ring-green-500/50";
      if (isApi) return "border-amber-500 bg-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.6)] scale-110 z-50 ring-2 ring-amber-500/50";
      if (isCode) return "border-orange-600 bg-orange-600/20 shadow-[0_0_20px_rgba(234,88,12,0.6)] scale-110 z-50 ring-2 ring-orange-600/50";
      return "border-primary bg-primary/20 shadow-[0_0_20px_rgba(249,115,22,0.6)] scale-110 z-50 ring-2 ring-primary/50";
    }
    if (data.dimmed) return "opacity-20 grayscale border-zinc-800 bg-zinc-950 scale-95";
    return "border-zinc-800 bg-zinc-950 hover:border-zinc-600 shadow-lg";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: data.dimmed ? 1 : 1.02 }}
      className={`
        px-4 py-3 rounded-xl border-2 transition-all duration-500 min-w-[240px] relative group
        ${getColorClass()}
      `}
    >
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-zinc-600 border-none" />
      
      <div className="flex items-center gap-3">
        <div className={`
          w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-300
          ${isRequirement ? 'bg-blue-500/10 text-blue-400' :
            isStory ? 'bg-purple-500/10 text-purple-400' :
            isTask ? 'bg-green-500/10 text-green-400' :
            isApi ? 'bg-amber-500/10 text-amber-400' :
            isCode ? 'bg-orange-500/10 text-orange-400' :
            'bg-primary/10 text-primary'}
          ${(data.highlighted || selected) ? 'brightness-150' : ''}
        `}>
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
              {data.badge || id.substring(0, 8)}
            </span>
            {(data.highlighted || selected) && (
              <Badge variant="outline" className="text-[8px] h-4 bg-white/10 border-white/20 text-white animate-pulse">
                Active Flow
              </Badge>
            )}
          </div>
          <h3 className="text-xs font-bold text-white truncate leading-tight group-hover:text-primary transition-colors">
            {data.label}
          </h3>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-zinc-600 border-none" />
    </motion.div>
  );
};

const nodeTypes = {
  trace: TraceNode,
};

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================
export default function Traceability() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const { toast } = useToast();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [traceMode, setTraceMode] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      if (!projectId) {
        setNodes(initialTraceNodes as any);
        setEdges(initialTraceEdges as any);
        return;
      }

      const response = await fetch(`${BACKEND_BASE}/api/projects/${projectId}/traceability`);
      if (!response.ok) throw new Error("Failed to fetch");
      
      const graph = await response.json();
      console.log("TRACEABILITY DATA LOADED:", graph);
      
      const validNodeIds = new Set((graph.nodes || []).map((n: any) => n.id));

      // STEP 1: Enable Continuous Flow Animation Globally
      const cleanEdges = (graph.edges || [])
        .filter((e: any) => validNodeIds.has(e.source) && validNodeIds.has(e.target))
        .map((edge: any) => ({
          ...edge,
          type: 'traceEdge',
          animated: true, // ✅ ALWAYS ON for "Magic Flow"
          data: edge.data || { relation: 'implements' },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#a1a1aa',
            width: 25,
            height: 25,
          },
          style: {
            stroke: '#a1a1aa',
            strokeWidth: 2,
          }
        }));

      setNodes(graph.nodes || []);
      setEdges(cleanEdges);

    } catch (err) {
      console.error("Fetch Error:", err);
      setError(true);
      setNodes(initialTraceNodes as any);
      setEdges(initialTraceEdges as any);
    } finally {
      setLoading(false);
    }
  }, [projectId, setNodes, setEdges]);

  useEffect(() => {
    fetchData().then(() => {
      const focusId = searchParams.get("focus");
      if (focusId) {
        setTimeout(() => {
          const node = nodes.find(n => n.id === focusId);
          if (node) {
            setSelectedNode(node);
            setTraceMode(true);
            performAnalysis(node.id);
          }
        }, 800);
      }
    });
  }, [fetchData, searchParams]);

  // BI-DIRECTIONAL IMPACT & ROOT CAUSE ANALYSIS
  const performAnalysis = useCallback((nodeId: string) => {
    const affectedNodeIds = new Set<string>();
    const affectedEdgeIds = new Set<string>();

    const traverseDown = (id: string) => {
      affectedNodeIds.add(id);
      edges.forEach(edge => {
        if (edge.source === id) {
          affectedEdgeIds.add(edge.id);
          traverseDown(edge.target);
        }
      });
    };

    const traverseUp = (id: string) => {
      affectedNodeIds.add(id);
      edges.forEach(edge => {
        if (edge.target === id) {
          affectedEdgeIds.add(edge.id);
          traverseUp(edge.source);
        }
      });
    };

    traverseDown(nodeId);
    traverseUp(nodeId);

    setNodes(nds => nds.map(n => ({
      ...n,
      data: {
        ...n.data,
        highlighted: affectedNodeIds.has(n.id),
        dimmed: !affectedNodeIds.has(n.id)
      }
    })));

    setEdges(eds => eds.map(e => {
      const isAffected = affectedEdgeIds.has(e.id);
      return {
        ...e,
        animated: isAffected,
        data: {
          ...e.data,
          isHighlighted: isAffected
        },
        style: isAffected 
          ? { stroke: '#ffffff', strokeWidth: 3, opacity: 1 } 
          : { stroke: '#27272a', strokeWidth: 1, opacity: 0.1 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isAffected ? '#ffffff' : '#27272a',
          width: isAffected ? 30 : 25,
          height: isAffected ? 30 : 25,
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
      animated: true,
      className: '',
      style: { 
        stroke: '#a1a1aa',
        strokeWidth: 2,
        opacity: 1 
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#a1a1aa',
        width: 25,
        height: 25,
      }
    })));
  }, [setNodes, setEdges]);

  const onNodeClick = (_: any, node: any) => {
    setSelectedNode(node);
    setTraceMode(true);
    performAnalysis(node.id);
  };

  const onPaneClick = () => {
    setSelectedNode(null);
    setTraceMode(false);
    resetAnalysis();
  };

  const handleExport = () => {
    const payload = { exportedAt: new Date().toISOString(), projectId, nodes, edges };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `traceability-${projectId || "demo"}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Traceability Exported", description: "Downloaded semantic traceability graph." });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <ArrowRightLeft className="w-8 h-8 text-primary" />
            Semantic Traceability Matrix
          </h1>
          <p className="text-zinc-400 mt-1">
            Map semantic relationships (implements, depends_on, derived_from) across the stack.
          </p>
        </div>
        <div className="flex gap-3">
          <Button className="bg-primary hover:brightness-110 text-white shadow-lg" onClick={handleExport}>
            Export Semantic Graph
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-14rem)] min-h-[600px]">
        <Card className="lg:col-span-3 bg-zinc-900 border-zinc-800 flex flex-col overflow-hidden relative">
          <CardHeader className="border-b border-zinc-800 bg-zinc-950/50 p-4 flex flex-row items-center justify-between z-10">
            <CardTitle className="text-white text-[10px] flex items-center gap-2 uppercase tracking-widest opacity-70">
              Lineage Graph Visualization
            </CardTitle>
            <div className="flex gap-4 text-[10px] font-bold uppercase overflow-x-auto pb-1 max-w-[50%]">
              <span className="flex items-center gap-1.5 shrink-0"><div className="w-2 h-2 rounded-full bg-blue-500" /> PRD</span>
              <span className="flex items-center gap-1.5 shrink-0"><div className="w-2 h-2 rounded-full bg-purple-500" /> Story</span>
              <span className="flex items-center gap-1.5 shrink-0"><div className="w-2 h-2 rounded-full bg-green-500" /> Task</span>
              <span className="flex items-center gap-1.5 shrink-0"><div className="w-2 h-2 rounded-full bg-amber-500" /> Service</span>
              <span className="flex items-center gap-1.5 shrink-0"><div className="w-2 h-2 rounded-full bg-orange-600" /> Code</span>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 bg-[#050505] relative">
             {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/50 backdrop-blur-sm z-20">
                  <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                </div>
             )}

            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              colorMode="dark"
            >
              <Background color="#111" gap={20} size={1} />
              <Controls position="bottom-right" className="bg-zinc-900 border-zinc-800" />
            </ReactFlow>
          </CardContent>
        </Card>

        <AnimatePresence>
          {selectedNode ? (
            <motion.div 
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="lg:col-span-1 bg-zinc-900 border border-zinc-800 flex flex-col h-full rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-tighter">Workflow Insight</h3>
                </div>
                <button onClick={() => { setSelectedNode(null); setTraceMode(false); resetAnalysis(); }} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-zinc-500 hover:text-white" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-8">
                <div className="space-y-2">
                  <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] uppercase font-black">
                    {selectedNode.data.type}
                  </Badge>
                  <h2 className="text-2xl font-bold text-white leading-tight tracking-tight">
                    {selectedNode.data.label}
                  </h2>
                  <p className="text-zinc-500 text-[10px] font-mono">{selectedNode.id}</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                    <label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Metadata</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-zinc-600 uppercase">Badge</p>
                        <p className="text-xs font-bold text-zinc-300">{selectedNode.data.badge}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-600 uppercase">Status</p>
                        <Badge variant="outline" className="text-[10px] border-zinc-800">
                          {selectedNode.data.status || 'Active'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Traceability Note</label>
                    <p className="text-sm text-zinc-400 leading-relaxed bg-zinc-950/30 p-3 rounded-lg border border-zinc-800/50">
                      {selectedNode.data.description || "This component is a critical node in the semantic lineage. Any changes here will impact the downstream API definitions and subsequent developer tasks."}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-zinc-800">
                    <Button 
                      variant="outline" 
                      className="w-full border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center gap-2"
                      onClick={() => {
                        navigate(`/dashboard/architecture?projectId=${projectId}&focus=${selectedNode.id}`);
                      }}
                    >
                      <GitMerge className="w-4 h-4" />
                      View Impact Graph
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="lg:col-span-1 border-2 border-dashed border-zinc-800/50 rounded-xl flex flex-col items-center justify-center p-8 text-center bg-zinc-900/20 backdrop-blur-sm">
              <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-6 border border-zinc-800">
                <Search className="w-6 h-6 text-zinc-600" />
              </div>
              <h3 className="text-white font-bold mb-2">Ready to Trace</h3>
              <p className="text-xs text-zinc-500 max-w-[200px] leading-relaxed">
                Click any node in the matrix to visualize its full semantic workflow and lineage.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-2 w-full">
                <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 text-left">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mb-2" />
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Impact Analysis</p>
                </div>
                <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 text-left">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mb-2" />
                  <p className="text-[10px] font-bold text-zinc-400 uppercase">Root Cause</p>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
