// src/pages/ClickUpCallback.tsx
// Fallback handler — the real OAuth callback now goes through the backend.
// If a user lands here, we just redirect them to the automation page.
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function ClickUpCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // The backend handles the OAuth callback now.
    // If user reaches this page, redirect to automation.
    navigate("/dashboard/automation", { replace: true });
  }, [navigate]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-950 text-white font-satoshi">
      <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
      <h2 className="text-xl font-bold">Redirecting...</h2>
      <p className="text-zinc-500 mt-2">Taking you back to integrations.</p>
    </div>
  );
}
