// src/pages/Architecture.tsx
import { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Server,
  Database,
  Cloud,
  Globe,
  Lock,
  CreditCard,
  ArrowRight,
  Code2,
  Box,
  Loader2,
  AlertCircle
} from "lucide-react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  ReactFlowProvider,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';

const iconMap: Record<string, any> = {
  gateway: Globe,
  service: Server,
  database: Database,
  cache: Server,
  auth: Lock,
  payments: CreditCard,
  cloud: Cloud,
  default: Box
};

// ==========================================
// CUSTOM NODE
// ==========================================
const BlueprintNode = ({ data, selected }: any) => {
  // THE FIX: Safely fallback to an empty object if data is completely missing
  const safeData = data || {};
  const nodeType = safeData.type ? safeData.type.toLowerCase() : 'default';
  const Icon = iconMap[nodeType] || iconMap.default;

  return (
    <div className="flex flex-col items-center gap-2 group transition-all w-32">
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-primary border-none" />
      <div className={`
        w-16 h-16 rounded-xl border-2 flex items-center justify-center transition-all duration-200 bg-zinc-950
        ${selected
          ? "border-primary text-primary shadow-[0_0_20px_-5px_rgba(249,115,22,0.5)] scale-110 z-10"
          : "border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white"}
      `}>
        <Icon className="w-8 h-8" />
      </div>
      <span className={`text-[10px] font-medium px-2 py-1 rounded-md text-center truncate w-full ${selected ? "bg-primary/10 text-primary" : "bg-zinc-900 text-zinc-400"}`}>
        {safeData.label || "Unknown Node"}
      </span>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-primary border-none" />
    </div>
  );
};

const nodeTypes = { blueprint: BlueprintNode };

// ==========================================
// INTERNAL CONTENT COMPONENT
// ==========================================
function ArchitectureContent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const { toast } = useToast();
  const { getNodes } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeData, setSelectedNodeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let architectureData = null;

      if (projectId) {
        const response = await fetch(`http://localhost:5000/api/projects/${projectId}/architecture`);
        if (response.ok) {
          architectureData = await response.json();
        }
      }

      if (!architectureData) {
        const rawData = localStorage.getItem("blueprint_project_data");
        if (rawData) {
          const project = JSON.parse(rawData);
          if (typeof project.architecture === 'string') {
            architectureData = JSON.parse(project.architecture);
          } else {
            architectureData = project.architecture;
          }
        }
      }

      if (!architectureData || !architectureData.nodes) {
        toast({
          variant: "destructive",
          title: "Architecture Missing",
          description: "Run PRD analysis first."
        });
        return;
      }

      if (architectureData && architectureData.nodes?.length > 0) {
        // THE FIX: Bulletproof data mapping. We force everything into the 'data' object.
        const formattedNodes = architectureData.nodes
          .filter((n: any) => n && n.id) 
          .map((n: any, index: number) => {
            // Find the data payload whether the AI nested it or kept it flat
            const innerData = n.data || n; 

            return {
              id: n.id,
              type: 'blueprint', // This tells ReactFlow to use our custom component
              position: (n.position && typeof n.position.x === 'number')
                ? n.position
                : { x: (index % 3) * 250, y: Math.floor(index / 3) * 180 },
              // We explicitly build the required data object here
              data: {
                label: innerData.label || innerData.name || "Service Node",
                type: innerData.type || "service", 
                description: innerData.description || "",
                tech: innerData.tech || ""
              }
            };
          });

        // Safely format edges so they don't break if IDs are missing
        const formattedEdges = (architectureData.edges || []).map((e: any, i: number) => ({
            ...e,
            id: e.id || `edge-${i}-${e.source}-${e.target}`,
            animated: true,
            style: { stroke: '#52525b', strokeWidth: 2 }
        }));

        setNodes(formattedNodes);
        setEdges(formattedEdges);
        if (formattedNodes.length > 0) setSelectedNodeData(formattedNodes[0].data);
      }
    } catch (e) {
      console.error("Data Load Error", e);
    } finally {
      setLoading(false);
    }
  }, [setNodes, setEdges]);

  useEffect(() => { loadData(); }, [loadData]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: any) => {
    setSelectedNodeData(node.data);
  }, []);

  const handleExport = async () => {
    const currentNodes = getNodes();
    if (currentNodes.length === 0) return;

    const viewportWrap = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewportWrap) return;

    toast({
      title: "Exporting Diagram",
      description: "Preparing your architecture graph as a high-res PNG...",
    });

    try {
      const dataUrl = await toPng(viewportWrap, {
        backgroundColor: '#09090b',
        style: {
          width: '1200px',
          height: '800px',
          transform: 'none',
        },
      });

      const link = document.createElement('a');
      link.download = 'architecture-diagram.png';
      link.href = dataUrl;
      link.click();

      toast({
        title: "Success",
        description: "Architecture diagram exported successfully.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Export Failed",
        description: "There was an error generating the PNG. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-zinc-400">Loading system architecture...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (nodes.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <AlertCircle className="w-12 h-12 text-zinc-600 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Architecture Not Found</h2>
          <p className="text-zinc-400 mb-6">We couldn't find a generated architecture for this project.</p>
          <Button onClick={() => navigate("/dashboard/upload")} className="bg-primary">
            Upload PRD
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            System Architecture
          </h1>
          <p className="text-zinc-400 mt-1">Interactive map of generated services and databases.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleExport} variant="outline" className="bg-zinc-950 border-zinc-700 text-white hover:bg-zinc-800 gap-2">
             Export PNG
          </Button>
          <Button onClick={() => navigate(`/dashboard/code${projectId ? `?projectId=${projectId}` : ''}`)} className="bg-primary hover:brightness-110 text-white gap-2">
            <Code2 className="w-4 h-4" /> Generate Code
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-14rem)] min-h-[600px]">
        <Card className="lg:col-span-2 bg-zinc-900 border-zinc-800 flex flex-col relative overflow-hidden">
          <CardHeader className="border-b border-zinc-800 pb-4 bg-zinc-950/50 z-10">
            <CardTitle className="text-white text-xs flex items-center gap-2">
              <Cloud className="w-4 h-4 text-primary" /> Service Topology
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 relative bg-zinc-950">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              colorMode="dark"
            >
              <Background color="#27272a" gap={20} />
              <Controls />
            </ReactFlow>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 bg-zinc-900 border-zinc-800 flex flex-col">
          <CardHeader className="border-b border-zinc-800 bg-zinc-950/50">
            <CardTitle className="text-white text-sm">Component Details</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-6 space-y-6 overflow-y-auto">
            {selectedNodeData ? (
              <>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    {(() => {
                      const Icon = iconMap[selectedNodeData.type?.toLowerCase()] || iconMap.default;
                      return <Icon className="w-6 h-6" />;
                    })()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedNodeData.label}</h2>
                    <p className="text-xs uppercase text-zinc-500 font-semibold">{selectedNodeData.type}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white mb-2">Description</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{selectedNodeData.description || "No description provided."}</p>
                </div>
                {selectedNodeData.tech && (
                  <div>
                    <h3 className="text-sm font-medium text-white mb-2">Tech Stack</h3>
                    <div className="px-3 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-xs text-primary font-mono inline-block">
                      {selectedNodeData.tech}
                    </div>
                  </div>
                )}
                <Button onClick={() => navigate(`/dashboard/traceability${projectId ? `?projectId=${projectId}` : ''}`)} className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 mt-auto">
                  View Traceability <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            ) : (
              <div className="text-zinc-500 text-center mt-20">Select a node to view its details</div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

// ==========================================
// EXPORTED COMPONENT (WITH PROVIDER)
// ==========================================
export default function Architecture() {
  return (
    <ReactFlowProvider>
      <ArchitectureContent />
    </ReactFlowProvider>
  );
}