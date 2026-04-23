// src/pages/NotFound.tsx
import { useLocation, Link } from "react-router-dom"; // <-- ADDED Link IMPORT
import { useEffect } from "react";
import { Button } from "@/components/ui/button"; // <-- ADDED Button IMPORT
import { Layout } from "lucide-react"; // <-- ADDED Icon

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 font-satoshi">
      <div className="text-center flex flex-col items-center max-w-md px-6">
        
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
          <svg width="32" height="32" viewBox="0 0 28 28" fill="none" className="text-primary">
            <rect x="2" y="2" width="10" height="10" rx="2" fill="currentColor" opacity="0.9" />
            <rect x="16" y="2" width="10" height="10" rx="2" fill="currentColor" opacity="0.5" />
            <rect x="2" y="16" width="10" height="10" rx="2" fill="currentColor" opacity="0.5" />
            <rect x="16" y="16" width="10" height="10" rx="2" fill="currentColor" opacity="0.3" />
          </svg>
        </div>
        
        <h1 className="mb-2 text-5xl font-bold text-white tracking-tight">404</h1>
        <p className="mb-8 text-lg text-zinc-400">
          The architecture blueprint you are looking for doesn't exist or has been moved.
        </p>
        
        {/* FIXED: Using React Router Link instead of <a> tag to prevent full page reload */}
        <Link to="/">
          <Button className="bg-primary hover:brightness-110 text-white font-semibold h-11 px-8 rounded-lg glow-orange">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;