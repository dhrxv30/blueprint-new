// src/pages/Overview.tsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { calculateCompleteness, calculateComplexity, calculateTimelineWeeks, normalizeHealthScore } from "@/lib/projectMetrics";
import { ArrowRight, Zap, Target, BarChart3, ListChecks, Clock } from "lucide-react";

interface OverviewData {
  name: string;
  description: string;
  healthScore: number;
  completeness: number;
  complexity: string;
  timeline: string;
  features: any[];
  stats: {
    features: number;
    tasks: number;
    sprints: number;
    ambiguities: number;
  };
}

const fallbackData: OverviewData = {
  name: "Loading Project...",
  description: "Analyzing your PRD to generate a comprehensive architecture roadmap.",
  healthScore: 0,
  completeness: 0,
  complexity: "Calculating",
  timeline: "...",
  features: [],
  stats: { features: 0, tasks: 0, sprints: 0, ambiguities: 0 }
};

export default function Overview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const [data, setData] = useState<OverviewData>(fallbackData);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        let parsed: any = null;

        if (projectId) {
          const response = await fetch(`http://localhost:5000/api/projects/${projectId}/analysis`);
          if (response.ok) {
            parsed = await response.json();
          }
        }

        if (!parsed) {
          const rawData = localStorage.getItem("blueprint_project_data");
          if (rawData) {
            parsed = JSON.parse(rawData);
          }
        }

        if (parsed) {
          // Safely extract arrays
          const aiFeatures = Array.isArray(parsed.features) ? parsed.features : [];
          const aiTasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
          const aiStories = Array.isArray(parsed.stories) ? parsed.stories : [];
          const aiSprints = Array.isArray(parsed.sprints) ? parsed.sprints : [];
          const aiAmbiguities = Array.isArray(parsed.ambiguities) ? parsed.ambiguities : [];

          const calculatedComplexity = calculateComplexity(aiTasks);
          const estimatedWeeks = calculateTimelineWeeks(aiTasks);
          const finalHealthScore = normalizeHealthScore(parsed.healthScore, aiAmbiguities);
          const completeness = calculateCompleteness(parsed);

          // Safely format features (handling both string and object responses from Gemini)
          const formattedFeatures = aiFeatures.map((f: any, i: number) => {
            if (typeof f === 'string') {
              return {
                id: `feat-${i}`,
                name: f,
                stories: Math.max(1, Math.floor(aiStories.length / Math.max(aiFeatures.length, 1))), // Estimate distribution
                tasks: Math.max(1, Math.floor(aiTasks.length / Math.max(aiFeatures.length, 1))),
                complexity: "Medium"
              };
            }
            return {
              id: f.id || `feat-${i}`,
              name: f.title || f.name || "Untitled Feature",
              stories: f.stories?.length || f.storyCount || Math.max(1, Math.floor(aiStories.length / Math.max(aiFeatures.length, 1))),
              tasks: f.tasks?.length || f.taskCount || Math.max(1, Math.floor(aiTasks.length / Math.max(aiFeatures.length, 1))),
              complexity: f.complexity || "Medium"
            };
          });

          setData({
            name: parsed.projectName || "Untitled Project",
            description: "AI-generated architecture roadmap based on your uploaded PRD requirements. The pipeline has successfully extracted features, stories, and engineering tasks.",
            healthScore: finalHealthScore,
            completeness,
            complexity: calculatedComplexity,
            timeline: `${estimatedWeeks} Weeks`,
            features: formattedFeatures,
            stats: {
              features: aiFeatures.length,
              tasks: aiTasks.length,
              sprints: aiSprints.length,
              ambiguities: aiAmbiguities.length
            }
          });
        }
      } catch (error) {
        console.error("Error parsing overview data", error);
      }
    };

    fetchOverview();
  }, [projectId]);

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                Active Project
              </Badge>
              <span className="text-zinc-500 text-sm font-medium">Pipeline Complete</span>
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight leading-tight">{data.name}</h1>
            <p className="text-zinc-400 mt-3 text-lg leading-relaxed max-w-3xl">{data.description}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => navigate("/dashboard/analysis")} className="bg-primary hover:brightness-110 text-white gap-2 shadow-lg glow-orange h-11 px-6">
              View Analysis <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'PRD Health', value: `${data.healthScore}/100`, color: 'text-primary', icon: BarChart3, desc: 'Overall requirement quality' },
            { label: 'Completeness', value: `${data.completeness}%`, color: 'text-blue-400', icon: Target, desc: 'Architecture mapping progress' },
            { label: 'Complexity', value: data.complexity, color: 'text-amber-400', icon: Zap, desc: 'Technical implementation difficulty' },
            { label: 'Estimate Timeline', value: data.timeline, color: 'text-purple-400', icon: Clock, desc: 'Projected delivery duration' },
          ].map(m => (
            <Card key={m.label} className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm group hover:border-zinc-700 transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">{m.label}</p>
                  <m.icon className={cn('w-4 h-4', m.color)} />
                </div>
                <p className={cn('text-3xl font-black tracking-tight mb-1', m.color)}>{m.value}</p>
                <p className="text-sm text-zinc-500">{m.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Breakdown Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Core Features', value: data.stats.features },
            { label: 'Total Tasks', value: data.stats.tasks },
            { label: 'Planned Sprints', value: data.stats.sprints },
            { label: 'Ambiguities Found', value: data.stats.ambiguities },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-5 flex flex-col items-center justify-center text-center">
              <p className="text-xs text-zinc-500 font-bold mb-1 uppercase tracking-wider">{s.label}</p>
              <p className="text-3xl text-white font-black">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Core Features Extracted Section */}
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-primary" />
              Core Features Extracted
            </h3>
            <Button variant="link" onClick={() => navigate("/dashboard/analysis")} className="text-zinc-500 hover:text-white p-0 h-auto">
              View Feature Details
            </Button>
          </div>
          
          <div className="space-y-2">
            {data.features.length > 0 ? (
              data.features.map((feature, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-900/30 border border-zinc-800 hover:bg-zinc-900/50 transition-colors rounded-lg gap-4">
                  <span className="text-sm font-semibold text-white">{feature.name}</span>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium">
                      <span>{feature.stories} stories</span>
                      <span>{feature.tasks} tasks</span>
                    </div>
                    <Badge variant="outline" className={cn(
                      'rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-tight w-16 text-center justify-center',
                      feature.complexity === 'Critical' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 
                      feature.complexity === 'High' ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' : 
                      'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
                    )}>
                      {feature.complexity}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center border border-dashed border-zinc-800 rounded-lg text-zinc-500">
                No features found. Check your PRD analysis.
              </div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}