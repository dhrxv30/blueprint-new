// src/pages/Overview.tsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { calculateCompleteness, calculateComplexity, calculateTimelineWeeks, normalizeHealthScore } from "@/lib/projectMetrics";
import { CircularProgress } from "@/components/ui/circular-progress";
import { ArrowRight, Zap, Target, BarChart3, ListChecks, Clock, Activity, ShieldCheck } from "lucide-react";
import { BACKEND_BASE } from "@/lib/config";

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100 }
  }
};

function NumberCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;

    let totalDuration = 1000;
    let increment = end / (totalDuration / 16);
    
    let timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{displayValue}{suffix}</span>;
}

export default function Overview() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const [data, setData] = useState<OverviewData>(fallbackData);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        let parsed: any = null;

        if (projectId) {
          const response = await fetch(`${BACKEND_BASE}/api/projects/${projectId}/analysis`);
          if (response.ok) {
            parsed = await response.json();
          }
        }

        if (!projectId && !parsed) {
          const rawData = localStorage.getItem("blueprint_project_data");
          if (rawData) {
            parsed = JSON.parse(rawData);
          }
        }

        if (parsed) {
          const aiFeatures = Array.isArray(parsed.features) ? parsed.features : [];
          const aiTasks    = Array.isArray(parsed.tasks)    ? parsed.tasks    : [];
          const aiStories  = Array.isArray(parsed.stories)  ? parsed.stories  : [];
          const aiSprints  = Array.isArray(parsed.sprints)  ? parsed.sprints  : [];
          const aiAmbiguities = Array.isArray(parsed.ambiguities) ? parsed.ambiguities : [];

          const hs = parsed.healthScore ?? {};
          const aiComplexity   = typeof hs === 'object' ? (hs.complexity   ?? null) : null;
          const aiCompleteness = typeof hs === 'object' ? (hs.completeness ?? null) : null;
          const aiTimeline     = typeof hs === 'object' ? (hs.timeline     ?? null) : null;

          const completeness = (typeof aiCompleteness === 'number' && aiCompleteness > 0)
            ? Math.round(aiCompleteness)
            : calculateCompleteness(parsed);

          let complexityLabel: string;
          if (typeof aiComplexity === 'number' && aiComplexity > 0) {
            complexityLabel = aiComplexity <= 3 ? 'Low' : aiComplexity <= 6 ? 'Medium' : 'High';
          } else {
            complexityLabel = calculateComplexity(aiTasks, aiAmbiguities);
          }

          const timelineWeeks = (typeof aiTimeline === 'number' && aiTimeline > 0)
            ? Math.round(aiTimeline)
            : calculateTimelineWeeks(aiTasks, { ambiguities: aiAmbiguities, plannedSprints: aiSprints.length });

          const finalHealthScore = normalizeHealthScore(parsed.healthScore, aiAmbiguities, completeness);

          const formattedFeatures = aiFeatures.map((f: any, i: number) => {
            const featName = typeof f === 'string' ? f : (f.title || f.name || "Untitled Feature");
            return {
              id: f.id || `feat-${i}`,
              name: featName,
              stories: f.stories?.length || f.storyCount || Math.max(1, Math.floor(aiStories.length / Math.max(aiFeatures.length, 1))),
              tasks: f.tasks?.length || f.taskCount || Math.max(1, Math.floor(aiTasks.length / Math.max(aiFeatures.length, 1))),
              complexity: f.complexity || "Medium"
            };
          });

          setData({
            name: parsed.projectName || "Untitled Project",
            description: "Strategic engineering blueprint synthesized from your product requirements. Our engine has architected a high-fidelity roadmap across features, user stories, and technical execution tasks.",
            healthScore: finalHealthScore,
            completeness,
            complexity: complexityLabel,
            timeline: `${timelineWeeks} Weeks`,
            features: formattedFeatures,
            stats: {
              features: aiFeatures.length,
              tasks: aiTasks.length,
              sprints: aiSprints.length,
              ambiguities: aiAmbiguities.length
            }
          });
          setIsLoaded(true);
        }
      } catch (error) {
        console.error("Error parsing overview data", error);
      }
    };

    fetchOverview();
  }, [projectId]);

  return (
    <DashboardLayout>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8 max-w-6xl mx-auto pb-12"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1 text-xs font-black uppercase tracking-[0.2em]">
                System Architecture
              </Badge>
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold bg-emerald-500/5 px-2 py-1 rounded-full border border-emerald-500/10">
                <Activity className="w-3 h-3 animate-pulse" />
                Live Analysis
              </div>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter leading-none mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-zinc-500">
              {data.name}
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-3xl font-medium">
              {data.description}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => navigate(projectId ? `/dashboard/analysis?projectId=${projectId}` : "/dashboard/analysis")} 
              className="group bg-primary hover:bg-primary/90 text-white gap-2 shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] transition-all duration-300 h-12 px-8 rounded-xl font-bold"
            >
              Explore Deep Analysis <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              label: 'PRD Health', 
              value: data.healthScore, 
              suffix: '/100',
              color: 'text-primary', 
              icon: BarChart3, 
              desc: 'Requirement quality score',
              isCompleteness: false
            },
            { 
              label: 'Completeness', 
              value: data.completeness, 
              suffix: '%',
              color: 'text-blue-400', 
              icon: Target, 
              desc: 'Roadmap coverage depth',
              isCompleteness: true
            },
            { 
              label: 'Complexity', 
              value: data.complexity, 
              color: 'text-amber-400', 
              icon: Zap, 
              desc: 'Implementation difficulty',
              isCompleteness: false
            },
            { 
              label: 'Timeline', 
              value: data.timeline, 
              color: 'text-purple-400', 
              icon: Clock, 
              desc: 'Projected dev duration',
              isCompleteness: false
            },
          ].map((m, idx) => (
            <motion.div key={m.label} variants={itemVariants}>
              <Card className="relative overflow-hidden bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl group hover:border-zinc-600 transition-all duration-500 hover:translate-y-[-4px] shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-zinc-700 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-black">{m.label}</p>
                    <div className={cn('p-2 rounded-lg bg-zinc-950/50 border border-zinc-800/50 group-hover:border-zinc-700 transition-colors', m.color)}>
                      <m.icon className="w-4 h-4" />
                    </div>
                  </div>
                  
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className={cn('text-4xl font-black tracking-tighter mb-1', m.color)}>
                        {typeof m.value === 'number' ? (
                          <NumberCounter value={m.value} suffix={m.suffix} />
                        ) : m.value}
                      </p>
                      <p className="text-xs text-zinc-500 font-medium">{m.desc}</p>
                    </div>
                    {m.isCompleteness && isLoaded && (
                      <CircularProgress value={data.completeness} size={50} color="text-blue-400" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Breakdown Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Core Features', value: data.stats.features, icon: ShieldCheck },
            { label: 'Total Tasks', value: data.stats.tasks, icon: ListChecks },
            { label: 'Planned Sprints', value: data.stats.sprints, icon: Clock },
            { label: 'Ambiguities', value: data.stats.ambiguities, icon: Zap },
          ].map(s => (
            <div key={s.label} className="group relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/20 p-5 flex flex-col items-center justify-center text-center hover:bg-zinc-900/40 transition-all duration-300">
              <p className="text-[10px] text-zinc-500 font-black mb-1 uppercase tracking-widest">{s.label}</p>
              <p className="text-4xl text-white font-black tracking-tighter group-hover:scale-110 transition-transform duration-300">{s.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Core Features Extracted Section */}
        <motion.div variants={itemVariants} className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-zinc-800/50 pb-4">
            <h3 className="text-2xl font-black text-white flex items-center gap-3 tracking-tight">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ListChecks className="w-6 h-6 text-primary" />
              </div>
              Core Architecture Components
            </h3>
            <Button 
              variant="ghost" 
              onClick={() => navigate(projectId ? `/dashboard/analysis?projectId=${projectId}` : "/dashboard/analysis")} 
              className="text-zinc-500 hover:text-white hover:bg-zinc-800/50 group"
            >
              View Full Blueprint <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.features.length > 0 ? (
              data.features.map((feature, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ x: 4, backgroundColor: "rgba(24, 24, 27, 0.6)" }}
                  className="flex items-center justify-between p-5 bg-zinc-900/30 border border-zinc-800/50 rounded-xl group transition-all"
                >
                  <div className="flex flex-col">
                    <span className="text-base font-bold text-white group-hover:text-primary transition-colors">{feature.name}</span>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{feature.stories} stories</span>
                      <div className="w-1 h-1 rounded-full bg-zinc-700" />
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{feature.tasks} tasks</span>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn(
                    'rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] border-zinc-800 group-hover:border-zinc-600 transition-colors',
                    feature.complexity === 'Critical' ? 'text-red-400 bg-red-500/5' : 
                    feature.complexity === 'High' ? 'text-orange-400 bg-orange-500/5' : 
                    'text-amber-400 bg-amber-500/5'
                  )}>
                    {feature.complexity}
                  </Badge>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full p-12 text-center border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/10">
                <p className="text-zinc-500 font-medium">No architectural components synthesized yet.</p>
                <p className="text-zinc-600 text-sm mt-1">Check your PRD analysis to trigger generation.</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}

