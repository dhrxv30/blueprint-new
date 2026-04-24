// src/pages/JobProcessing.tsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  FileSearch, 
  Network, 
  ListTodo, 
  Code2, 
  CheckCircle2, 
  Loader2, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  TestTube2 
} from "lucide-react";
import { BACKEND_BASE } from "@/lib/config";

const stepsConfig = [
  { name: "Ingest & Normalize", icon: FileSearch, stage: "Ingest & Normalize" },
  { name: "Feature Extraction", icon: ShieldCheck, stage: "Feature Extraction" },
  { name: "User Story Generation", icon: FileSearch, stage: "User Story Generation" },
  { name: "Task Planning", icon: ListTodo, stage: "Task Planning" },
  { name: "Architecture Synthesis", icon: Network, stage: "Architecture Synthesis" },
  { name: "Implementation Details", icon: Code2, stage: "Implementation Details" },
  { name: "Test Planning", icon: TestTube2, stage: "Test Planning" },
];

interface Stage {
  stageName: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
  error?: string;
}

export default function JobProcessing() {
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("jobId");
  const projectId = searchParams.get("projectId");
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const [stages, setStages] = useState<Stage[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`${BACKEND_BASE}/api/prd/jobs/${jobId}/status`);
        if (!response.ok) throw new Error("Failed to fetch job status");
        
        const data = await response.json();
        setStages(data.stages || []);

        if (data.status === "COMPLETED") {
          setIsComplete(true);
          toast({ title: "Analysis Complete", description: "Your project is ready!" });
        } else if (data.status === "FAILED") {
          setError(data.error || "Generation failed. Please try again.");
        }
      } catch (err: any) {
        console.error("Polling error:", err);
      }
    };

    const interval = setInterval(pollStatus, 3000);
    pollStatus(); // Initial call
    return () => clearInterval(interval);
  }, [jobId, toast]);

  const calculateProgress = () => {
    if (isComplete) return 100;
    const completedStages = stages.filter(s => s.status === "COMPLETED").length;
    return Math.round((completedStages / stepsConfig.length) * 100);
  };

  const handleFinish = () => {
    navigate(`/dashboard/analysis?projectId=${projectId}`);
  };

  if (!jobId) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold">Invalid Job Session</h2>
          <p className="text-zinc-400 mt-2">Please upload your PRD again to start the analysis.</p>
          <Button className="mt-6" onClick={() => navigate("/dashboard/upload")}>Go to Upload</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto mt-8 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="text-center mb-12 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold text-white tracking-tight mb-4">
              {isComplete ? "Architecture Generated" : error ? "Generation Failed" : "Processing PRD..."}
            </h1>
            <div className="max-w-md mx-auto mb-8">
              <div className="flex justify-between text-sm text-zinc-400 mb-2">
                <span>Overall Progress</span>
                <span>{calculateProgress()}%</span>
              </div>
              <Progress value={calculateProgress()} className="h-2 bg-zinc-800" />
            </div>
            <p className="text-zinc-400 max-w-lg mx-auto text-lg">
              {isComplete 
                ? "Your blueprint is ready. Review the analysis, architecture, and generated tasks."
                : error 
                ? "There was an issue generating your blueprint. See the error details below."
                : "Our AI is analyzing your document across multiple stages to build a resilient technical foundation."}
            </p>
          </motion.div>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {stepsConfig.map((step, index) => {
            const stageData = stages.find(s => s.stageName === step.stage);
            const isActive = stageData?.status === "IN_PROGRESS";
            const isDone = stageData?.status === "COMPLETED";
            const isFailed = stageData?.status === "FAILED";
            const Icon = step.icon;

            return (
              <motion.div
                key={step.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className={`
                  p-6 border-2 transition-all duration-500 flex items-start gap-4
                  ${isActive ? "bg-zinc-900 border-primary-500/50 shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]" : 
                    isDone ? "bg-zinc-900 border-green-500/20" : 
                    isFailed ? "bg-zinc-900 border-red-500/40" :
                    "bg-zinc-950 border-zinc-800 opacity-50"}
                `}>
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0
                    ${isActive ? "bg-primary-500/20 text-primary-400" : 
                      isDone ? "bg-green-500/20 text-green-400" : 
                      isFailed ? "bg-red-500/20 text-red-400" :
                      "bg-zinc-800 text-zinc-500"}
                  `}>
                    {isDone ? <CheckCircle2 className="w-6 h-6" /> : 
                     isFailed ? <AlertCircle className="w-6 h-6" /> :
                     isActive ? <Loader2 className="w-6 h-6 animate-spin" /> : 
                     <Icon className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold mb-1 ${isActive || isDone ? "text-white" : isFailed ? "text-red-400" : "text-zinc-500"}`}>
                      {step.name}
                    </h3>
                    <p className="text-sm text-zinc-400">
                        {isFailed ? "Error in this stage." : "Status: " + (stageData?.status || "Pending")}
                    </p>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {error && (
          <div className="mb-12 p-6 bg-red-500/10 border border-red-500/40 rounded-xl max-w-2xl w-full">
            <div className="flex gap-4">
              <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
              <div>
                <h4 className="text-red-400 font-bold mb-1">Fatal Pipeline Error</h4>
                <p className="text-red-300/80 text-sm">{error}</p>
                <Button className="mt-4 bg-red-500 hover:bg-red-600 text-white" onClick={() => navigate("/dashboard/upload")}>
                  Retry Upload
                </Button>
              </div>
            </div>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: isComplete ? 1 : 0, scale: isComplete ? 1 : 0.9 }}
          transition={{ duration: 0.4 }}
          className="h-16"
        >
          {isComplete && (
            <Button 
              size="lg" 
              onClick={handleFinish}
              className="bg-primary hover:brightness-110 text-white text-lg px-8 gap-2 glow-primary"
            >
              View Analysis & Architecture <ArrowRight className="w-5 h-5" />
            </Button>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
