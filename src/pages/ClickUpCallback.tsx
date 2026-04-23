// src/pages/ClickUpCallback.tsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function ClickUpCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState("Connecting to ClickUp...");

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      
      if (!code) {
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: "No authorization code received from ClickUp."
        });
        return navigate("/dashboard/automation");
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          throw new Error("You must be logged in to connect ClickUp.");
        }

        setStatus("Securing connection...");

        const response = await fetch("http://localhost:5000/api/clickup/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            code,
            profileId: user.id
          })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to finalize ClickUp connection.");
        }

        toast({
          title: "ClickUp Connected!",
          description: "Your workspace is now synced.",
        });

      } catch (error: any) {
        console.error("ClickUp OAuth Error:", error);
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: error.message
        });
      } finally {
        navigate("/dashboard/automation");
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-950 text-white font-satoshi">
      <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
      <h2 className="text-xl font-bold">{status}</h2>
      <p className="text-zinc-500 mt-2">Please wait while we finalize your integration.</p>
    </div>
  );
}
