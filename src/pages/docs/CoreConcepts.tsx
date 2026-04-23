import DocLayout from "@/components/docs/DocLayout";
import { Zap, Brain, Layers, GitMerge } from "lucide-react";

export default function CoreConcepts() {
  return (
    <DocLayout>
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4">
          <Zap className="w-3.5 h-3.5" />
          Getting Started
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Core Concepts</h1>
        <p className="text-xl text-text-secondary leading-relaxed">
          Understand the foundational pillars of the Blueprint.dev architectural engine.
        </p>
      </div>

      <div className="prose prose-invert max-w-none">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="p-6 bg-surface border border-border-subtle rounded-2xl">
            <Brain className="w-10 h-10 text-primary mb-4" />
            <h2 className="text-xl font-bold mb-2 text-foreground">The PRD Parser</h2>
            <p className="text-sm text-text-muted">
              Our advanced LLM-powered engine that transforms unstructured text into structured technical requirements.
            </p>
          </div>
          <div className="p-6 bg-surface border border-border-subtle rounded-2xl">
            <Layers className="w-10 h-10 text-primary mb-4" />
            <h2 className="text-xl font-bold mb-2 text-foreground">Architecture Graphs</h2>
            <p className="text-sm text-text-muted">
              Dynamic, interactive visualizations of your system components, services, and their data flows.
            </p>
          </div>
          <div className="p-6 bg-surface border border-border-subtle rounded-2xl">
            <GitMerge className="w-10 h-10 text-primary mb-4" />
            <h2 className="text-xl font-bold mb-2 text-foreground">Traceability Matrix</h2>
            <p className="text-sm text-text-muted">
              The glue that connects high-level business goals to specific lines of code via features and tasks.
            </p>
          </div>
          <div className="p-6 bg-surface border border-border-subtle rounded-2xl">
            <Zap className="w-10 h-10 text-primary mb-4" />
            <h2 className="text-xl font-bold mb-2 text-foreground">Code Synthesis</h2>
            <p className="text-sm text-text-muted">
              Automated scaffolding that creates production-ready boilerplate based on your specific system design.
            </p>
          </div>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Workflow Lifecycle</h2>
          <p className="text-text-secondary mb-6">
            A typical project in Blueprint.dev follows this logical progression:
          </p>
          <ol className="space-y-4 list-decimal pl-6 text-text-secondary">
            <li className="font-medium text-foreground">
              Requirement Ingestion <span className="block font-normal text-text-muted mt-1 text-sm">Upload your document and let the AI analyze the scope.</span>
            </li>
            <li className="font-medium text-foreground">
              Architecture Modeling <span className="block font-normal text-text-muted mt-1 text-sm">Refine the generated system design and service boundaries.</span>
            </li>
            <li className="font-medium text-foreground">
              Task Decomposition <span className="block font-normal text-text-muted mt-1 text-sm">Break down features into actionable engineering tasks.</span>
            </li>
            <li className="font-medium text-foreground">
              Implementation <span className="block font-normal text-text-muted mt-1 text-sm">Generate codebases and synchronize with your repository.</span>
            </li>
          </ol>
        </section>
      </div>
    </DocLayout>
  );
}
