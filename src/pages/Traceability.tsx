import { useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
  Zap, 
  FileText, 
  Server, 
  Code2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Loader2,
  Database
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { initialTraceNodes, initialTraceEdges, markerEnd } from "@/data/traceabilityData";
import { BACKEND_BASE } from "@/lib/config";

interface TraceNodeData extends Record<string, unknown> {
  label: string;
  type: string;
  badge: string;
  description?: string;
  status?: string;
  method?: string;
  endpoint?: string;
  highlighted?: boolean;
  dimmed?: boolean;
}

// ==========================================
// CUSTOM TRACEABILITY NODE
// ==========================================
const TraceNode = ({ data, selected }: any) => {
  const getStyles = () => {
    switch (data.type) {
      case 'requirement': 
      case 'feature': return { border: "border-blue-500", icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10" };
      case 'story': return { border: "border-purple-500", icon: Search, color: "text-purple-400", bg: "bg-purple-500/10" };
      case 'service': return { border: "border-indigo-500", icon: Server, color: "text-indigo-400", bg: "bg-indigo-500/10" };
      case 'api': return { border: "border-amber-500", icon: Code2, color: "text-amber-400", bg: "bg-amber-500/10" };
      case 'task': return { border: "border-green-500", icon: GitMerge, color: "text-green-400", bg: "bg-green-500/10" };
      default: return { border: "border-zinc-700", icon: Info, color: "text-zinc-400", bg: "bg-zinc-900" };
    }
  };

  const styles = getStyles();
  const Icon = styles.icon;

  return (
    <div className={`
      flex items-center gap-3 p-3 rounded-xl border-2 w-64 transition-all duration-300 bg-zinc-950 backdrop-blur-xl
      ${selected ? `${styles.border} shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] scale-105 z-20` : "border-zinc-800 hover:border-zinc-600 opacity-80"}
      ${data.highlighted ? `${styles.border} opacity-100 ring-4 ring-white/5` : ""}
      ${data.dimmed ? "opacity-30 grayscale-[0.5]" : ""}
    `}>
      <Handle type="target" position={Position.Left} className="w-2 h-2 bg-zinc-600 border-none" />

      <div className={`p-2.5 rounded-lg ${styles.bg}`}>
        <Icon className={`w-5 h-5 ${styles.color}`} />
      </div>

      <div className="flex flex-col overflow-hidden flex-1">
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-black uppercase tracking-wider ${styles.color}`}>{data.badge}</span>
          {data.type === 'task' && (
             <Badge variant="outline" className={`text-[8px] h-4 px-1 leading-none ${data.status === 'Done' ? 'text-green-400 border-green-500/20 bg-green-500/10' : 'text-zinc-500 border-zinc-700 bg-zinc-900'}`}>
                {data.status || 'Todo'}
             </Badge>
          )}
        </div>
        <span className="text-sm font-semibold text-white truncate leading-tight mt-0.5">{data.label}</span>
      </div>

      <Handle type="source" position={Position.Right} className="w-2 h-2 bg-zinc-600 border-none" />
      
      {data.highlighted && (data.type === 'requirement' || data.type === 'feature') && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-zinc-950 px-3 py-1 rounded-full text-[10px] font-bold shadow-xl animate-bounce whitespace-nowrap">
          IMPACT ANALYSIS ACTIVE
        </div>
      )}
    </div>
  );
};

const nodeTypes = { trace: TraceNode };

export default function Traceability() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");

  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [impactAnalysis, setImpactAnalysis] = useState(false);

  // Fetch Real Data
  const fetchData = useCallback(async () => {
    if (!projectId) {
      setNodes(initialTraceNodes);
      setEdges(initialTraceEdges);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    try {
      const response = await fetch(`${BACKEND_BASE}/api/projects/${projectId}/traceability`);
      if (response.ok) {
        const data = await response.json();
        if (data.nodes && data.edges) {
          setNodes(data.nodes);
          setEdges(data.edges);
        } else {
           throw new Error("Invalid data format");
        }
      } else {
        throw new Error("Failed to fetch");
      }
    } catch (err) {
      console.error("Traceability fetch error:", err);
      setError(true);
      if (!projectId) {
        setNodes(initialTraceNodes);
        setEdges(initialTraceEdges);
      } else {
        setNodes([]);
        setEdges([]);
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, setNodes, setEdges]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Impact Analysis (Recursive Discovery)
  const performImpactAnalysis = useCallback((nodeId: string) => {
    const affectedNodeIds = new Set<string>();
    const affectedEdgeIds = new Set<string>();

    const traverse = (id: string) => {
      affectedNodeIds.add(id);
      edges.forEach(edge => {
        if (edge.source === id) {
          affectedEdgeIds.add(edge.id);
          traverse(edge.target);
        }
      });
    };

    traverse(nodeId);

    setNodes(nds => nds.map(n => ({
      ...n,
      data: {
        ...n.data,
        highlighted: affectedNodeIds.has(n.id),
        dimmed: !affectedNodeIds.has(n.id)
      }
    })));

    setEdges(eds => eds.map(e => ({
      ...e,
      animated: affectedEdgeIds.has(e.id),
      style: affectedEdgeIds.has(e.id) ? { stroke: '#ffffff', strokeWidth: 3 } : { stroke: '#3f3f46', opacity: 0.2 },
      markerEnd: affectedEdgeIds.has(e.id) ? { ...markerEnd, color: '#ffffff' } : { ...markerEnd, color: '#3f3f46' }
    })));

    setImpactAnalysis(true);
    toast({
      title: "Impact Analysis Loaded",
      description: `Analysis complete. Downstream dependencies highlighted.`,
      variant: "default"
    });
  }, [edges, setNodes, setEdges, toast]);

  const resetAnalysis = useCallback(() => {
    setNodes(nds => nds.map(n => ({
      ...n,
      data: { ...n.data, highlighted: false, dimmed: false }
    })));
    setEdges(eds => eds.map(e => ({
      ...e,
      animated: false,
      style: { stroke: '#3f3f46', strokeWidth: 2 },
      markerEnd
    })));
    setImpactAnalysis(false);
  }, [setNodes, setEdges]);

  // Node Selection Handler
  const onNodeClick = (_: any, node: any) => {
    setSelectedNode(node);
    if (node.data.type === 'requirement' || node.data.type === 'feature') {
      performImpactAnalysis(node.id);
    }
  };

  const handleExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      projectId,
      nodes,
      edges
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `traceability-${projectId || "demo"}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Traceability Exported", description: "Downloaded traceability graph as JSON." });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <GitMerge className="w-8 h-8 text-primary" />
            Requirement Traceability
          </h1>
          <p className="text-zinc-400 mt-1">
            Map PRD requirements directly to services, APIs, and engineering tasks.
          </p>
        </div>
        <div className="flex gap-3">
          {impactAnalysis && (
            <Button 
              variant="outline" 
              onClick={resetAnalysis}
              className="bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white"
            >
              Reset View
            </Button>
          )}
          <Button
            className="bg-primary hover:brightness-110 text-white gap-2 shadow-[0_0_15px_-3px_rgba(249,115,22,0.4)]"
            onClick={handleExport}
          >
            Export Traceability Matrix
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-14rem)] min-h-[600px]">
        {/* Main Graph Panel */}
        <Card className="lg:col-span-3 bg-zinc-900 border-zinc-800 flex flex-col overflow-hidden relative">
          <CardHeader className="border-b border-zinc-800 bg-zinc-950/50 p-4 flex flex-row items-center justify-between z-10">
            <CardTitle className="text-white text-[10px] flex items-center gap-2 uppercase tracking-widest opacity-70">
              Lineage Graph Visualization
            </CardTitle>
            <div className="flex gap-4 text-[10px] font-bold uppercase overflow-x-auto pb-1 max-w-[50%]">
              <span className="flex items-center gap-1.5 shrink-0"><div className="w-2 h-2 rounded-full bg-blue-500" /> PRD</span>
              <span className="flex items-center gap-1.5 shrink-0"><div className="w-2 h-2 rounded-full bg-purple-500" /> Story</span>
              <span className="flex items-center gap-1.5 shrink-0"><div className="w-2 h-2 rounded-full bg-green-500" /> Task</span>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 bg-[#050505] relative">
             {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/50 backdrop-blur-sm z-20">
                  <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                  <p className="text-zinc-400 font-medium">Fetching real-time traceability data...</p>
                </div>
             ) : error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-8 text-center">
                  <AlertCircle className="w-12 h-12 text-red-500/50 mb-4" />
                  <h3 className="text-white font-bold mb-2">Failed to load live data</h3>
                  <p className="text-zinc-500 text-sm mb-6 max-w-xs">
                    {projectId
                      ? "We couldn't connect to the analysis engine for this project."
                      : "We couldn't connect to the analysis engine. Showing demo data for exploration."}
                  </p>
                  <Button onClick={fetchData} variant="outline" className="border-zinc-800">
                    Retry Connection
                  </Button>
                </div>
             ) : null}

             <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800 p-3 rounded-lg max-w-xs transition-all">
                  <h4 className="text-xs font-bold text-white mb-1 flex items-center gap-2">
                    <Zap className="w-3 h-3 text-amber-500" />
                    Impact Analysis Enabled
                  </h4>
                  <p className="text-[10px] text-zinc-400 leading-normal">
                    Click any <span className="text-blue-400 font-bold underline">Requirement or Feature node</span> to instantly see affected components.
                  </p>
                </div>
             </div>

            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              colorMode="dark"
              minZoom={0.2}
              maxZoom={1.5}
            >
              <Background color="#111" gap={20} size={1} />
              <Controls position="bottom-right" className="bg-zinc-900 border-zinc-800" />
            </ReactFlow>
          </CardContent>
        </Card>

        {/* Side Detail Panel */}
        <AnimatePresence>
          {selectedNode ? (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-md ${
                    (selectedNode.data.type === 'requirement' || selectedNode.data.type === 'feature') ? 'bg-blue-500/10 text-blue-400' :
                    selectedNode.data.type === 'story' ? 'bg-purple-500/10 text-purple-400' :
                    selectedNode.data.type === 'api' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-green-500/10 text-green-400'
                  }`}>
                    <Info className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Node Details</h3>
                </div>
                <button 
                  onClick={() => setSelectedNode(null)}
                  className="p-1 hover:bg-zinc-800 rounded-md transition-colors text-zinc-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase text-zinc-500 tracking-tighter">{selectedNode.data.badge || selectedNode.id}</span>
                    <Badge variant="outline" className="text-[9px] uppercase bg-zinc-950 border-zinc-800 text-zinc-400">
                      {selectedNode.data.type}
                    </Badge>
                  </div>
                  <h2 className="text-xl font-bold text-white leading-tight">{selectedNode.data.label}</h2>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-zinc-500">Overview</label>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {selectedNode.data.description || "No detailed description available for this node."}
                  </p>
                </div>

                {selectedNode.data.type === 'api' && (
                  <div className="space-y-3 p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500">Method:</span>
                      <span className="font-bold text-amber-400">{selectedNode.data.method}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500">Endpoint:</span>
                      <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-300 font-mono">{selectedNode.data.endpoint}</code>
                    </div>
                  </div>
                )}

                {selectedNode.data.type === 'task' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] uppercase font-bold text-zinc-500">Status</label>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${selectedNode.data.status === 'Done' ? 'bg-green-500' : 'bg-amber-500 animation-pulse'}`} />
                          <span className="text-sm text-white font-medium">{selectedNode.data.status || 'Todo'}</span>
                        </div>
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] uppercase font-bold text-zinc-500">Priority</label>
                        <div className="text-sm text-white font-medium">{selectedNode.data.badge || 'High'}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-zinc-800">
                   <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs h-9 gap-2">
                     <Search className="w-3 h-3" /> View in Documentation
                   </Button>
                </div>
              </div>

              {(selectedNode.data.type === 'requirement' || selectedNode.data.type === 'feature') && (
                <div className="p-4 bg-blue-500/5 border-t border-blue-500/20">
                  <p className="text-[10px] text-blue-400 font-medium leading-tight">
                    Selecting this node automatically performs a downstream impact analysis across the architecture.
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="lg:col-span-1 border-2 border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center p-8 text-center bg-zinc-950/20">
              <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mb-4 border border-zinc-800">
                <Search className="w-5 h-5 text-zinc-600" />
              </div>
              <p className="text-sm text-zinc-500 font-medium">Select a node to view traceability details and impact analysis.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
