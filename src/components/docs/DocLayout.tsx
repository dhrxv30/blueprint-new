import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  BarChart3, 
  Book, 
  ChevronRight, 
  Code2, 
  FileText, 
  GitBranch, 
  Layout, 
  Search, 
  Terminal, 
  Zap,
  ArrowLeft
} from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { cn } from "@/lib/utils";

const docNavigation = [
  {
    title: "Getting Started",
    icon: Zap,
    items: [
      { title: "Quick Start Guide", href: "/docs/getting-started/quick-start" },
      { title: "Core Concepts", href: "/docs/getting-started/core-concepts" },
    ],
  },
  {
    title: "PRD Analysis",
    icon: FileText,
    items: [
      { title: "Uploading PRDs", href: "/docs/prd-analysis/uploading" },
      { title: "Feature Extraction", href: "/docs/prd-analysis/extraction" },
    ],
  },
  {
    title: "Architecture & Traceability",
    icon: GitBranch,
    items: [
      { title: "Architecture Graphs", href: "/docs/architecture/graphs" },
      { title: "Traceability Matrix", href: "/docs/architecture/traceability" },
    ],
  },
];

interface DocLayoutProps {
  children: ReactNode;
}

export default function DocLayout({ children }: DocLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-canvas text-foreground font-satoshi">
      <Navbar />
      
      <div className="max-w-[1400px] mx-auto flex pt-24 min-h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <aside className="w-64 hidden lg:block shrink-0 border-r border-border-subtle p-6 overflow-y-auto max-h-[calc(100vh-96px)] sticky top-24">
          <Link to="/docs" className="flex items-center gap-2 text-primary font-medium mb-8 hover:brightness-110">
            <ArrowLeft className="w-4 h-4" />
            Back to Docs
          </Link>

          <div className="space-y-8">
            {docNavigation.map((section) => (
              <div key={section.title}>
                <div className="flex items-center gap-2 text-text-muted text-xs font-bold uppercase tracking-wider mb-4">
                  <section.icon className="w-3.5 h-3.5 text-primary" />
                  {section.title}
                </div>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "block px-3 py-2 rounded-lg text-sm transition-all",
                        location.pathname === item.href
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-text-secondary hover:text-foreground hover:bg-overlay"
                      )}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-12 lg:p-16 max-w-4xl min-w-0">
          <div className="animate-fade-up">
            {children}
          </div>
          
          <div className="mt-24 pt-12 border-t border-border-subtle flex justify-between items-center text-sm text-text-muted">
            <p>© 2026 Blueprint.dev - Premium System Architecture</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-primary transition-colors">Edit this page</a>
              <a href="#" className="hover:text-primary transition-colors">Contact Support</a>
            </div>
          </div>
        </main>

      </div>

      <Footer />
    </div>
  );
}
