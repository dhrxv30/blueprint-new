import DocLayout from "@/components/docs/DocLayout";
import { FileText, Cpu, UserCheck, ShieldOff } from "lucide-react";

export default function FeatureExtraction() {
  return (
    <DocLayout>
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4">
          <FileText className="w-3.5 h-3.5" />
          PRD Analysis
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Feature Extraction</h1>
        <p className="text-xl text-text-secondary leading-relaxed">
          How Blueprint.dev uses AI to distill your prose into technical specifications.
        </p>
      </div>

      <div className="prose prose-invert max-w-none">
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-foreground">The Extraction Pipeline</h2>
          <p className="text-text-secondary mb-6">
            When you upload a document, it undergoes a multi-stage transformation process:
          </p>
          <div className="space-y-6">
            <div className="p-5 bg-overlay border border-border-subtle rounded-2xl relative">
              <div className="absolute -left-3 top-5 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold">1</div>
              <h3 className="font-bold flex items-center gap-2 mb-2 text-foreground">
                <Cpu className="w-4 h-4 text-primary" />
                Semantic Parsing
              </h3>
              <p className="text-sm text-text-muted">The AI reads the document to understand context, intent, and high-level project goals.</p>
            </div>
            <div className="p-5 bg-overlay border border-border-subtle rounded-2xl relative">
              <div className="absolute -left-3 top-5 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold">2</div>
              <h3 className="font-bold flex items-center gap-2 mb-2 text-foreground">
                <UserCheck className="w-4 h-4 text-primary" />
                Actor Identification
              </h3>
              <p className="text-sm text-text-muted">User roles, stakeholders, and external systems are identified to establish boundaries.</p>
            </div>
            <div className="p-5 bg-overlay border border-border-subtle rounded-2xl relative">
              <div className="absolute -left-3 top-5 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold">3</div>
              <h3 className="font-bold flex items-center gap-2 mb-2 text-foreground">
                <ShieldOff className="w-4 h-4 text-primary" />
                Constraint Mapping
              </h3>
              <p className="text-sm text-text-muted">Non-functional requirements like security, performance, and compliance are tagged.</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-foreground">What gets extracted?</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-text-muted text-left">
                <th className="py-3 pr-4">Entity</th>
                <th className="py-3">Description</th>
              </tr>
            </thead>
            <tbody className="text-text-secondary">
              <tr className="border-b border-border-subtle">
                <td className="py-4 pr-4 font-bold text-foreground">Feature</td>
                <td className="py-4">High-level capability (e.g., "User Authentication")</td>
              </tr>
              <tr className="border-b border-border-subtle">
                <td className="py-4 pr-4 font-bold text-foreground">User Story</td>
                <td className="py-4">Specific user action (e.g., "As a user, I want to reset my password")</td>
              </tr>
              <tr className="border-b border-border-subtle">
                <td className="py-4 pr-4 font-bold text-foreground">Technical Task</td>
                <td className="py-4">Engineering unit (e.g., "Setup SMTP provider")</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </DocLayout>
  );
}
