import DocLayout from "@/components/docs/DocLayout";
import { Zap, ArrowRight, Play, Rocket } from "lucide-react";

export default function QuickStart() {
  return (
    <DocLayout>
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4">
          <Zap className="w-3.5 h-3.5" />
          Getting Started
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Quick Start Guide</h1>
        <p className="text-xl text-text-secondary leading-relaxed">
          Launch your first architectural project in under 5 minutes with Blueprint.dev.
        </p>
      </div>

      <div className="prose prose-invert max-w-none">
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground">
            <span className="w-8 h-8 rounded-full bg-overlay border border-border-subtle flex items-center justify-center text-sm">1</span>
            Create Your Account
          </h2>
          <p className="text-text-secondary mb-4">
            Sign up for a free account at <a href="/auth" className="text-primary hover:underline">Blueprint.dev/auth</a>. You can use your GitHub or Google account for a seamless onboarding experience.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground">
            <span className="w-8 h-8 rounded-full bg-overlay border border-border-subtle flex items-center justify-center text-sm">2</span>
            Create a New Project
          </h2>
          <p className="text-text-secondary mb-4">
            Once logged in, click the <span className="text-foreground font-semibold">"New Project"</span> button on your dashboard. Give your project a name and an optional description.
          </p>
          <div className="bg-surface border border-border-subtle rounded-xl p-6 mb-4">
            <p className="text-sm italic text-text-muted">
              "My first project: E-commerce Backend Architecture"
            </p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-foreground">
            <span className="w-8 h-8 rounded-full bg-overlay border border-border-subtle flex items-center justify-center text-sm">3</span>
            Upload your PRD
          </h2>
          <p className="text-text-secondary mb-4">
            Upload your Product Requirement Document (PDF, DOCX, or Markdown). Our AI-powered parser will analyze the content and extract key features, user stories, and architectural requirements.
          </p>
          <div className="flex items-center gap-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <Rocket className="w-5 h-5 text-primary" />
            <p className="text-sm text-primary-foreground/80 font-medium">
              Pro tip: Ensure your PRD has clear headings for better extraction accuracy.
            </p>
          </div>
        </section>

      </div>
    </DocLayout>
  );
}
