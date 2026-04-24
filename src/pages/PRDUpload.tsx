import { useState, useCallback, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  UploadCloud,
  FileType2,
  X,
  ArrowRight,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { BACKEND_BASE } from "@/lib/config";

export default function PRDUpload() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectId = searchParams.get("projectId");

  const projectName = location.state?.projectName || "Untitled Project";

  /*
  ==========================
  AUTH CHECK
  ==========================
  */

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        navigate("/auth");
      }
    };

    checkUser();
  }, [navigate]);

  /*
  ==========================
  FILE VALIDATION
  ==========================
  */

  const validateFile = (uploadedFile: File) => {

    if (uploadedFile.type !== "application/pdf") {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Only PDF files are supported"
      });
      return false;
    }

    if (uploadedFile.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Maximum size is 10MB"
      });
      return false;
    }

    return true;
  };

  /*
  ==========================
  DRAG HANDLERS
  ==========================
  */

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {

    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];

    if (!droppedFile) return;

    if (!validateFile(droppedFile)) return;

    setFile(droppedFile);
    setError(null);

  }, []);

  /*
  ==========================
  FILE SELECT
  ==========================
  */

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {

    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    if (!validateFile(selectedFile)) return;

    setFile(selectedFile);
    setError(null);
  };

  /*
  ==========================
  PROCESS PRD
  ==========================
  */
  const handleProcess = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    localStorage.removeItem("blueprint_project_data");

    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        throw new Error("Authentication session expired");
      }

      const formData = new FormData();

      formData.append("prd", file);
      formData.append("profileId", user.id);
      formData.append("projectName", projectName);
      if (projectId) formData.append("projectId", projectId);
      formData.append("email", user.email || "");

      const response = await fetch(
        `${BACKEND_BASE}/api/prd/upload`,
        {
          method: "POST",
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error("Server error: " + response.status);
      }

      const result = await response.json();

      if (result.success && result.jobId) {
        toast({
          title: "Upload Successful",
          description: "Analysis started in background."
        });

        navigate(`/dashboard/processing?jobId=${result.jobId}&projectId=${result.projectId}`);
      } else {
        throw new Error(result.error || "Failed to start analysis job");
      }

    } catch (err: any) {
      console.error("Upload error:", err);
      const message = err?.message || "Upload failed";

      // Trigger Requestly SessionBook export to capture the network trace and video for debugging
      // @ts-ignore
      if (typeof window !== 'undefined' && window.RequestlySessionBook) {
        // @ts-ignore
        window.RequestlySessionBook.save();
        toast({
          title: "Session Recorded for Debugging",
          description: "A Requestly SessionBook debug report is being generated to help diagnose this pipeline failure.",
        });
      }

      setError(message);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: message
      });
    } finally {
      setIsUploading(false);
    }
  };

  /*
  ==========================
  UI
  ==========================
  */

  return (

    <DashboardLayout>

      <div className="max-w-3xl mx-auto mt-8 font-satoshi">

        <div className="mb-8 text-center md:text-left">

          <h1 className="text-3xl font-bold text-white">

            {projectName === "Untitled Project"
              ? "Upload PRD"
              : `PRD for: ${projectName}`}

          </h1>

          <p className="text-zinc-400 mt-2">
            Submit your product specifications. Our synthesis engine will architect a high-fidelity backlog, technical blueprint, and comprehensive test suite-accelerating your path from requirement to code.
          </p>

        </div>

        {error && (

          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/40 rounded-lg flex gap-3">

            <AlertCircle className="w-5 h-5 text-red-400" />

            <p className="text-red-400 text-sm">{error}</p>

          </div>

        )}

        {!file ? (

          <Card
            className={`bg-zinc-900 border-2 border-dashed p-16 text-center
            ${isDragging
                ? "border-primary bg-primary/10"
                : "border-zinc-700"
              }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >

            <UploadCloud className="w-12 h-12 mx-auto mb-4 text-zinc-400" />

            <h3 className="text-lg font-semibold text-white mb-2">
              Drag & drop your PRD
            </h3>

            <p className="text-zinc-400 text-sm mb-6">
              Upload a PDF (max 10MB)
            </p>

            <div className="relative inline-block">

              <input
                type="file"
                accept=".pdf"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileSelect}
              />

              <Button variant="outline">
                Browse Files
              </Button>

            </div>

          </Card>

        ) : (

          <Card className="bg-zinc-900 border-zinc-800 p-6">

            <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-lg">

              <div className="flex items-center gap-4">

                <FileType2 className="text-primary w-6 h-6" />

                <div>

                  <p className="text-white font-semibold">
                    {file.name}
                  </p>

                  <p className="text-sm text-zinc-400">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>

                </div>

              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFile(null)}
              >
                <X />
              </Button>

            </div>

            <div className="mt-6 flex justify-end gap-4">

              <Button
                variant="ghost"
                onClick={() => setFile(null)}
              >
                Cancel
              </Button>

              <Button
                onClick={handleProcess}
                disabled={isUploading}
                className="gap-2"
              >

                {isUploading ? (

                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>

                ) : (

                  <>
                    Begin Analysis
                    <ArrowRight className="w-4 h-4" />
                  </>

                )}

              </Button>

            </div>

          </Card>

        )}

      </div>

    </DashboardLayout>
  );
}