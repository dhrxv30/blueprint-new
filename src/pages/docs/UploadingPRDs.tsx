import DocLayout from "@/components/docs/DocLayout";
import { FileText, Upload, AlertCircle, CheckCircle2 } from "lucide-react";

export default function UploadingPRDs() {
  return (
    <DocLayout>
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4">
          <FileText className="w-3.5 h-3.5" />
          PRD Analysis
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Uploading PRDs</h1>
        <p className="text-xl text-text-secondary leading-relaxed">
          Best practices for feeding the Blueprint.dev engine with your requirements.
        </p>
      </div>

      <div className="prose prose-invert max-w-none">
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Supported Formats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-overlay border border-border-subtle rounded-xl text-center">
              <span className="text-lg font-bold text-primary">.pdf</span>
              <p className="text-[10px] text-text-muted mt-1 uppercase">Portable Doc</p>
            </div>
            <div className="p-4 bg-overlay border border-border-subtle rounded-xl text-center">
              <span className="text-lg font-bold text-primary">.docx</span>
              <p className="text-[10px] text-text-muted mt-1 uppercase">MS Word</p>
            </div>
            <div className="p-4 bg-overlay border border-border-subtle rounded-xl text-center">
              <span className="text-lg font-bold text-primary">.md</span>
              <p className="text-[10px] text-text-muted mt-1 uppercase">Markdown</p>
            </div>
            <div className="p-4 bg-overlay border border-border-subtle rounded-xl text-center">
              <span className="text-lg font-bold text-primary">.txt</span>
              <p className="text-[10px] text-text-muted mt-1 uppercase">Plain Text</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-foreground">File Limits</h2>
          <div className="flex items-center gap-3 p-4 bg-overlay border border-border-subtle rounded-xl">
            <AlertCircle className="w-5 h-5 text-accent-orange" />
            <p className="text-sm text-text-secondary">Maximum file size is <span className="text-foreground font-bold">20MB</span>. For larger documents, we recommend splitting them by domain or module.</p>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-foreground">Optimizing Content for AI</h2>
          <p className="text-text-secondary mb-4">
            To get the most accurate feature extraction, follow these structural tips:
          </p>
          <div className="space-y-4">
            <div className="flex gap-4">
              <CheckCircle2 className="w-5 h-5 text-accent-green shrink-0 mt-1" />
              <div>
                <p className="text-foreground font-medium">Use Clear Headings</p>
                <p className="text-sm text-text-muted">Headings help the parser identify major modules and sections.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle2 className="w-5 h-5 text-accent-green shrink-0 mt-1" />
              <div>
                <p className="text-foreground font-medium">Bullet Points for Reqs</p>
                <p className="text-sm text-text-muted">Specific requirements are best listed as distinct bullet points or numbered lists.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle2 className="w-5 h-5 text-accent-green shrink-0 mt-1" />
              <div>
                <p className="text-foreground font-medium">Define Terminology</p>
                <p className="text-sm text-text-muted">A short glossary of domain-specific terms can significantly reduce ambiguity.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DocLayout>
  );
}
