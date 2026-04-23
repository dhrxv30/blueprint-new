import { useState } from "react";
import { Link } from "react-router-dom";
import { Book, Code2, FileText, Zap, Terminal, GitBranch, ArrowRight, Search, ExternalLink, ChevronRight } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const categories = [
  {
    title: "Getting Started",
    icon: Zap,
    description: "Set up your first project in under 5 minutes.",
    articles: [
      { title: "Quick Start Guide", description: "Create your first Blueprint.dev project and upload a PRD.", badge: "Popular", href: "/docs/getting-started/quick-start" },
      { title: "Core Concepts", description: "Understand PRDs, architecture graphs, task decomposition, and sprint planning.", href: "/docs/getting-started/core-concepts" },
    ],
  },
  {
    title: "PRD Analysis",
    icon: FileText,
    description: "How Blueprint.dev parses and structures your requirements.",
    articles: [
      { title: "Uploading PRDs", description: "Supported formats, file size limits, and best practices for PRD structure.", href: "/docs/prd-analysis/uploading" },
      { title: "Feature Extraction", description: "How AI identifies features, user stories, and acceptance criteria.", href: "/docs/prd-analysis/extraction" },
    ],
  },
  {
    title: "Architecture & Traceability",
    icon: GitBranch,
    description: "System design graphs, dependency mapping, and traceability matrices.",
    articles: [
      { title: "Architecture Graphs", description: "Interactive node-based system design with service dependencies.", href: "/docs/architecture/graphs" },
      { title: "Traceability Matrix", description: "Link requirements → features → tasks → code for full audit trails.", href: "/docs/architecture/traceability" },
    ],
  },
];

export default function Documentation() {
  return (
    <div className="min-h-screen bg-canvas text-foreground font-satoshi">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-[1280px] mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Everything you need to <span className="text-primary">build faster</span>
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto mb-8">
            Comprehensive guides, API references, and tutorials to help you get the most out of Blueprint.dev.
          </p>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="pb-24 px-6">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.title}
              className="bg-surface border border-border-subtle rounded-2xl p-6 hover:border-primary/30 transition-all group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <cat.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{cat.title}</h2>
                </div>
              </div>
              <p className="text-text-secondary text-sm mb-5">{cat.description}</p>

              <div className="space-y-3">
                {cat.articles.map((article) => (
                  <Link
                    key={article.title}
                    to={article.href}
                    className="w-full text-left flex items-start gap-3 p-3 rounded-lg hover:bg-overlay transition-colors group/item"
                  >
                    <ChevronRight className="w-4 h-4 text-text-muted mt-0.5 group-hover/item:text-primary transition-colors" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground group-hover/item:text-primary transition-colors">
                          {article.title}
                        </span>
                        {article.badge && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold uppercase tracking-wider">
                            {article.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{article.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24 px-6">
        <div className="max-w-[1280px] mx-auto">
          <div className="bg-surface border border-border-subtle rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Can't find what you're looking for?</h2>
            <p className="text-text-secondary mb-6 max-w-lg mx-auto">
              Join our community or reach out to the team directly. We're here to help.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth">
                <button className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:brightness-110 transition-all flex items-center gap-2 glow-orange">
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <button className="px-6 py-3 bg-overlay border border-border-subtle text-foreground rounded-lg font-medium hover:bg-elevated transition-all flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Join Discord
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
