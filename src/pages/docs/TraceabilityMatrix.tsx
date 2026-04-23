import DocLayout from "@/components/docs/DocLayout";
import { GitBranch, Link2, Search, Table as TableIcon } from "lucide-react";

export default function TraceabilityMatrix() {
  return (
    <DocLayout>
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4">
          <GitBranch className="w-3.5 h-3.5" />
          Architecture & Traceability
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Traceability Matrix</h1>
        <p className="text-xl text-text-secondary leading-relaxed">
          The immutable link between business requirements and technical implementation.
        </p>
      </div>

      <div className="prose prose-invert max-w-none">
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Why Traceability?</h2>
          <p className="text-text-secondary mb-4">
            In complex systems, it's easy to lose track of <span className="text-foreground italic">why</span> a specific piece of code exists. The Traceability Matrix ensures that every line of generated code can be traced back to its origin in the PRD.
          </p>
          <div className="flex bg-overlay rounded-2xl border border-border-subtle overflow-hidden">
            <div className="flex-1 p-4 border-r border-border-subtle text-center">
              <p className="text-[10px] text-text-muted uppercase font-bold mb-1">Requirement</p>
              <p className="text-xs text-primary font-medium">"Pay with Stripe"</p>
            </div>
            <div className="p-4 flex items-center">
              <Link2 className="w-4 h-4 text-text-muted" />
            </div>
            <div className="flex-1 p-4 border-r border-border-subtle text-center">
              <p className="text-[10px] text-text-muted uppercase font-bold mb-1">Feature</p>
              <p className="text-xs text-foreground font-medium">Checkout API</p>
            </div>
            <div className="p-4 flex items-center">
              <Link2 className="w-4 h-4 text-text-muted" />
            </div>
            <div className="flex-1 p-4 text-center">
              <p className="text-[10px] text-text-muted uppercase font-bold mb-1">Code</p>
              <p className="text-[10px] font-mono text-accent-green">stripe.controller.ts</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-2">
            <TableIcon className="w-5 h-5 text-primary" />
            The Matrix View
          </h2>
          <p className="text-text-secondary mb-4">
            The Matrix is a tabular view where rows are requirements and columns are system components. A checkmark indicates that a component helps fulfill a specific requirement.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-text-secondary">
            <li><span className="text-foreground font-bold">Audit Trails:</span> Essential for regulated industries (Fintech, Medtech).</li>
            <li><span className="text-foreground font-bold">Impact Analysis:</span> See exactly which code needs to change when a PRD requirement is modified.</li>
            <li><span className="text-foreground font-bold">Coverage Mapping:</span> Identify "ghost" requirements that have no implementation yet.</li>
          </ul>
        </section>
      </div>
    </DocLayout>
  );
}
