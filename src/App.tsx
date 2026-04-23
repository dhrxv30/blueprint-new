// src/App.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Pages
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Demo from "./pages/Demo.tsx";
import Auth from "./pages/Auth.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import PRDUpload from "./pages/PRDUpload.tsx";
import Processing from "./pages/Processing.tsx";
import Analysis from "./pages/Analysis.tsx";
import Overview from "./pages/Overview.tsx";
import Architecture from "./pages/Architecture.tsx";
import Tasks from "./pages/Tasks.tsx";
import Sprints from "./pages/Sprints.tsx";
import CodeGenerator from "./pages/CodeGenerator.tsx";
import Testing from "./pages/Testing.tsx";
import Chat from "./pages/Chat.tsx";
import Automation from "./pages/Automation.tsx";
import ClickUpCallback from "./pages/ClickUpCallback.tsx";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import Traceability from "./pages/Traceability.tsx";
import Documentation from "./pages/Documentation.tsx";
import Pricing from "./pages/Pricing.tsx";
import Settings from "./pages/Settings.tsx";
import HelpSupport from "./pages/HelpSupport.tsx";

// Documentation Pages
import QuickStart from "./pages/docs/QuickStart.tsx";
import CoreConcepts from "./pages/docs/CoreConcepts.tsx";
import UploadingPRDs from "./pages/docs/UploadingPRDs.tsx";
import FeatureExtraction from "./pages/docs/FeatureExtraction.tsx";
import ArchitectureGraphs from "./pages/docs/ArchitectureGraphs.tsx";
import TraceabilityMatrix from "./pages/docs/TraceabilityMatrix.tsx";

import ScrollToTop from "@/components/utils/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <ErrorBoundary>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/clickup/callback" element={<ClickUpCallback />} />
            <Route path="/docs" element={<Documentation />} />
            <Route path="/pricing" element={<Pricing />} />
            
            {/* Documentation Expansion Routes */}
            <Route path="/docs/getting-started/quick-start" element={<QuickStart />} />
            <Route path="/docs/getting-started/core-concepts" element={<CoreConcepts />} />
            
            <Route path="/docs/prd-analysis/uploading" element={<UploadingPRDs />} />
            <Route path="/docs/prd-analysis/extraction" element={<FeatureExtraction />} />
            
            <Route path="/docs/architecture/graphs" element={<ArchitectureGraphs />} />
            <Route path="/docs/architecture/traceability" element={<TraceabilityMatrix />} />
            
            {/* Dashboard Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/overview" element={<Overview />} />
            <Route path="/dashboard/upload" element={<PRDUpload />} />
            <Route path="/dashboard/processing" element={<Processing />} />
            <Route path="/dashboard/analysis" element={<Analysis />} />
            <Route path="/dashboard/architecture" element={<Architecture />} />
            <Route path="/dashboard/tasks" element={<Tasks />} />
            <Route path="/dashboard/sprints" element={<Sprints />} />
            <Route path="/dashboard/code" element={<CodeGenerator />} />
            <Route path="/dashboard/testing" element={<Testing />} />
            <Route path="/dashboard/chat" element={<Chat />} />
            <Route path="/dashboard/automation" element={<Automation />} />
            <Route path="/dashboard/traceability" element={<Traceability />} />
            <Route path="/dashboard/settings" element={<Settings />} />
            <Route path="/dashboard/help" element={<HelpSupport />} />
            
            {/* Catch-all 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;