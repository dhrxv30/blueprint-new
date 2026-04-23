import DocLayout from "@/components/docs/DocLayout";
import { GitBranch, Share2, Maximize2, MousePointer2 } from "lucide-react";

export default function ArchitectureGraphs() {
  return (
    <DocLayout>
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4">
          <GitBranch className="w-3.5 h-3.5" />
          Architecture & Traceability
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Architecture Graphs</h1>
        <p className="text-xl text-text-secondary leading-relaxed">
          Interactive node-based system design generated automatically from your requirements.
        </p>
      </div>

      <div className="prose prose-invert max-w-none">
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Navigating the Graph</h2>
          <p className="text-text-secondary mb-6">
            The Architecture Graph uses standard node-link visualization. Each node represents a system component (Service, Database, External API, etc.).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-overlay border border-border-subtle rounded-xl flex flex-col items-center text-center">
              <MousePointer2 className="w-6 h-6 text-primary mb-2" />
              <p className="text-xs font-bold mb-1">Select Nodes</p>
              <p className="text-[10px] text-text-muted">Click a node to highlight its dependencies and view details.</p>
            </div>
            <div className="p-4 bg-overlay border border-border-subtle rounded-xl flex flex-col items-center text-center">
              <Maximize2 className="w-6 h-6 text-primary mb-2" />
              <p className="text-xs font-bold mb-1">Pan & Zoom</p>
              <p className="text-[10px] text-text-muted">Use your mouse wheel to zoom; drag the canvas to pan.</p>
            </div>
            <div className="p-4 bg-overlay border border-border-subtle rounded-xl flex flex-col items-center text-center">
              <Share2 className="w-6 h-6 text-primary mb-2" />
              <p className="text-xs font-bold mb-1">Layout Toggle</p>
              <p className="text-[10px] text-text-muted">Switch between hierarchical, organic, or cluster layouts.</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Service Dependencies</h2>
          <p className="text-text-secondary mb-4">
            Arrows between nodes indicate data flow or dependency direction.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-text-secondary">
            <li><span className="text-foreground font-bold italic">Solid Line:</span> Synchronous request (e.g., REST, GraphQL).</li>
            <li><span className="text-foreground font-bold italic">Dashed Line:</span> Asynchronous communication (e.g., Message Queue, Pub/Sub).</li>
            <li><span className="text-foreground font-bold italic">Colored Border:</span> Service health or complexity status.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-foreground text-orange-400">Collaborative Editing</h2>
          <p className="text-text-secondary italic bg-orange-400/5 border border-orange-400/20 p-4 rounded-xl">
            "Coming Soon: Real-time multi developer editing for architecture graphs. Currently, graphs are auto-generated based on the PRD analysis and can be manually adjusted via the task view."
          </p>
        </section>
      </div>
    </DocLayout>
  );
}
