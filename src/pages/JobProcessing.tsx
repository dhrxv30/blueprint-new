import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Stage {
  id: string;
  stageName: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  error?: string;
}

interface JobStatus {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  stages: Stage[];
}

export default function JobProcessing() {
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("jobId");
  const projectId = searchParams.get("projectId");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [job, setJob] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/prd/jobs/${jobId}/status`);
        if (!response.ok) throw new Error("Failed to fetch job status");
        
        const data = await response.json();
        setJob(data);

        if (data.status === "COMPLETED") {
          toast({ title: "Analysis Complete", description: "Your project is ready!" });
          // In a real app, we'd fetch all data here, but for now we'll just go to dashboard
          // The dashboard pages (Analysis, Architecture, etc.) will fetch their own data by projectId
          navigate(`/dashboard/analysis?projectId=${projectId}`);
        } else if (data.status === "FAILED") {
          setError(data.error || "Job failed during processing");
        }
      } catch (err: any) {
        console.error("Polling error:", err);
      }
    };

    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, [jobId, projectId, navigate, toast]);

  if (!jobId) return <div>Invalid Job ID</div>;

  const completedStages = job?.stages.filter(s => s.status === "COMPLETED").length || 0;
  const totalStages = 7; // We defined 7 stages in orchestrator
  const progress = (completedStages / totalStages) * 100;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto mt-12 font-satoshi">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Architecting Your Project</h1>
          <p className="text-zinc-400">Gemini is analyzing your PRD and generating technical blueprints...</p>
        </div>

        <Card className="bg-zinc-900 border-zinc-800 p-8">
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-zinc-400 text-sm">Overall Progress</span>
              <span className="text-primary font-bold">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="space-y-4">
            {job?.stages.map((stage) => (
              <div key={stage.id} className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                <div className="flex items-center gap-4">
                  {stage.status === "COMPLETED" ? (
                    <CheckCircle2 className="text-green-500 w-5 h-5" />
                  ) : stage.status === "FAILED" ? (
                    <AlertCircle className="text-red-500 w-5 h-5" />
                  ) : stage.status === "IN_PROGRESS" ? (
                    <Loader2 className="text-primary w-5 h-5 animate-spin" />
                  ) : (
                    <Circle className="text-zinc-700 w-5 h-5" />
                  )}
                  <span className={`font-medium ${stage.status === "PENDING" ? "text-zinc-500" : "text-white"}`}>
                    {stage.stageName}
                  </span>
                </div>
                <div className="text-xs uppercase tracking-widest font-bold">
                  {stage.status === "IN_PROGRESS" && <span className="text-primary animate-pulse">Running</span>}
                  {stage.status === "COMPLETED" && <span className="text-green-500">Done</span>}
                  {stage.status === "FAILED" && <span className="text-red-500">Error</span>}
                  {stage.status === "PENDING" && <span className="text-zinc-600">Waiting</span>}
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-8 p-4 bg-red-500/10 border border-red-500/40 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div className="text-red-400 text-sm">
                <p className="font-bold">Generation Error</p>
                <p>{error}</p>
                <p className="mt-2 text-xs opacity-70">The model might be overloaded. Please try again later.</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
