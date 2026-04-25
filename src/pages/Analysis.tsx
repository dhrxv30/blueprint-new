// src/pages/Analysis.tsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { FileText, ListTodo, Zap, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { calculateCompleteness, calculateComplexity, calculateTimelineWeeks, normalizeHealthScore } from "@/lib/projectMetrics";
import { BACKEND_BASE } from "@/lib/config";

interface ParsedData {
  projectName: string;
  features: any[];
  stories: any[];
  tasks: any[];
  healthScore: { score: number; issues: string[]; complexity?: number; completeness?: number; timeline?: number };
  ambiguities?: any[];
  clarifications?: any[];
  architecture?: any;
  sprints?: any[];
}

export default function Analysis() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ParsedData | null>(null);

  useEffect(() => {
    if (!projectId) {
        // Fallback to localStorage for demo/old data
        const rawData = localStorage.getItem("blueprint_project_data");
        if (rawData) {
            try {
              const parsed = JSON.parse(rawData);
              const extractedAmbigs = Array.isArray(parsed.ambiguities) ? parsed.ambiguities : [];
              const completeness = calculateCompleteness(parsed);
              const finalHs = normalizeHealthScore(parsed.healthScore, extractedAmbigs, completeness);

              setData({ ...parsed, healthScore: { score: finalHs, issues: parsed.healthScore?.issues || extractedAmbigs } });
            } catch (e) {
              console.error("Invalid localStorage data", e);
            }
            setLoading(false);
        } else {
            setLoading(false);
        }
        return;
    }

    const fetchAnalysis = async () => {
      try {
        const response = await fetch(`${BACKEND_BASE}/api/projects/${projectId}/analysis`);
        if (!response.ok) throw new Error("Failed to fetch analysis");
        const analysis = await response.json();
        
        const extractedAmbiguities = Array.isArray(analysis.ambiguities) ? analysis.ambiguities : [];
        const extractedSprints = Array.isArray(analysis.sprints) ? analysis.sprints : [];
        const completeness = calculateCompleteness(analysis);

        const finalHealthScore = normalizeHealthScore(analysis.healthScore, extractedAmbiguities, completeness);

        setData({
          projectName: analysis.projectName || "Architecture Analysis",
          features: Array.isArray(analysis.features) ? analysis.features : [],
          stories: Array.isArray(analysis.stories) ? analysis.stories : [],
          tasks: Array.isArray(analysis.tasks) ? analysis.tasks : [],
          // Spread the FULL healthScore so complexity/timeline/completeness are preserved
          healthScore: {
            ...(typeof analysis.healthScore === 'object' ? analysis.healthScore : {}),
            score: finalHealthScore,
            issues: analysis.healthScore?.issues || extractedAmbiguities,
          },
          ambiguities: extractedAmbiguities,
          clarifications: Array.isArray(analysis.clarifications) ? analysis.clarifications : [],
          architecture: typeof analysis.architecture === 'string' ? JSON.parse(analysis.architecture) : (analysis.architecture || { nodes: [], edges: [] }),
          sprints: extractedSprints
        });
      } catch (err: any) {
        console.error(err);
        toast({ variant: "destructive", title: "Error", description: "Could not load project analysis." });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [projectId, toast]);

  if (loading) {
      return (
          <DashboardLayout>
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
                  <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                  <p>Loading project blueprint...</p>
              </div>
          </DashboardLayout>
      );
  }

  if (!data) {
      return (
          <DashboardLayout>
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
                  <AlertCircle className="w-12 h-12 text-zinc-500 mb-4" />
                  <h2 className="text-xl font-bold">No Analysis Found</h2>
                  <p className="text-zinc-400 mt-2">Try uploading a PRD to generate a blueprint.</p>
                  <Button className="mt-6" onClick={() => navigate("/dashboard/upload")}>Go to Upload</Button>
              </div>
          </DashboardLayout>
      );
  }

  const totalTasks = data.tasks?.length || 0;

  // Read AI-generated values from healthScore JSON first (same source as Overview page)
  const hs = data.healthScore as any;
  const aiComplexity   = typeof hs?.complexity === 'number' && hs.complexity > 0 ? hs.complexity : null;
  const aiTimeline     = typeof hs?.timeline   === 'number' && hs.timeline   > 0 ? hs.timeline   : null;

  // Complexity: map AI 1-10 → label, or fall back to local calculation
  const overallComplexity = aiComplexity !== null
    ? (aiComplexity <= 3 ? 'Low' : aiComplexity <= 6 ? 'Medium' : 'High')
    : calculateComplexity(data.tasks || [], data.ambiguities || []);

  // Timeline: use AI weeks directly, or fall back to local point-velocity estimate
  const estimatedWeeks = aiTimeline !== null
    ? aiTimeline
    : calculateTimelineWeeks(data.tasks || [], {
        ambiguities: data.ambiguities || [],
        plannedSprints: data.sprints?.length || 0
      });

  const complexitySource = aiComplexity !== null ? 'AI evaluated' : `derived from ${totalTasks} tasks`;
  const handleExportReport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      projectId,
      summary: {
        projectName: data.projectName,
        healthScore: data.healthScore?.score || 0,
        complexity: overallComplexity,
        estimatedWeeks
      },
      analysis: data
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(data.projectName || "analysis").replace(/\s+/g, "-").toLowerCase()}-report.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Report Exported", description: "Downloaded analysis report as JSON." });
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 font-satoshi">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{data.projectName}</h1>
          <p className="text-zinc-400 mt-1">Technical Roadmap & Analysis</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="bg-orange-600 border-orange-700 text-white hover:bg-orange-700"
            onClick={handleExportReport}
          >
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-12rem)] min-h-[600px] font-satoshi">
        <div className="lg:col-span-9 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
          
          <Card className="bg-zinc-900 border-zinc-800 flex flex-col overflow-hidden">
            <CardHeader className="border-b border-zinc-800 pb-4 bg-zinc-950/50">
              <CardTitle className="text-white text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-primary" />
                  Extracted Features
                </div>
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium">
                  {data.features?.length || 0} Found
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {data.features?.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {data.features.map((feature, idx) => (
                    <AccordionItem key={idx} value={`feat-${idx}`} className="border-zinc-800">
                      <AccordionTrigger className="text-white hover:text-primary hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                          <span>{feature.name || feature.title || "Unnamed Feature"}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-zinc-400">
                        <p className="mb-4 leading-relaxed">{feature.description || "No description available."}</p>
                        <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                          Priority: {feature.priority || "Medium"}
                        </Badge>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-zinc-500 text-center py-8">No features identified yet.</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800 flex flex-col overflow-hidden">
            <CardHeader className="border-b border-zinc-800 pb-4 bg-zinc-950/50">
              <CardTitle className="text-white text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  Ambiguities & Clarifications
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {data.healthScore?.issues?.length > 0 ? (
                <ul className="space-y-3">
                  {data.healthScore.issues.map((issue, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-zinc-400 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                      {issue}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-500 text-sm text-center py-4">No critical ambiguities detected.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6 flex flex-col">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                PRD Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-white mb-1">
                {data.healthScore?.score || 0}<span className="text-xl text-zinc-500 font-bold">/100</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Project Complexity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">{overallComplexity}</div>
              <p className="text-xs text-zinc-500">{complexitySource}.</p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                Estimated Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white mb-1">~{estimatedWeeks} Weeks</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
