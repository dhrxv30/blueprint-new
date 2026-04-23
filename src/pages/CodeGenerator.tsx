// src/pages/CodeGenerator.tsx
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Folder, 
  FolderOpen, 
  FileCode2, 
  FileJson, 
  FileText,
  Copy,
  Check,
  Download,
  Terminal,
  Code2
} from "lucide-react";
import { codeToHtml } from "shiki";
import JSZip from "jszip";

// ======================================
// CUSTOM ICONS & TYPES
// ======================================
const VSCodeIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className} 
    fill="currentColor" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-5.58-4.312a1.495 1.495 0 0 0-1.819.021L.348 5.629a1.494 1.494 0 0 0-.14 2.112l4.636 5.25L.208 18.24a1.494 1.494 0 0 0 .14 2.112l.618.503a1.495 1.495 0 0 0 1.819.021l5.58-4.312 9.46 8.63a1.494 1.494 0 0 0 1.705.29l4.94-2.377A1.5 1.5 0 0 0 24 21.785V5.214a1.5 1.5 0 0 0-.85-1.352zM18 18.962l-4.59-4.183L18 12V18.962zM4.215 15.895l-2.057-2.33 2.057-2.33 1.151 1.151-1.151 1.151z" />
  </svg>
);

interface CodeFile {
  path: string;
  name: string;
  type: "file" | "folder";
  language?: string;
  content?: string;
  children?: CodeFile[];
}

export default function CodeGenerator() {
  const { toast } = useToast();

  const [fileTree, setFileTree] = useState<CodeFile[]>([]);
  const [activeFile, setActiveFile] = useState<CodeFile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [highlightedHtml, setHighlightedHtml] = useState("");
  const [isHighlighting, setIsHighlighting] = useState(false);

  /*
  ======================================
  LOAD PIPELINE CODE STRUCTURE
  ======================================
  */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("blueprint_project_data");
      if (!raw) {
        setIsLoading(false);
        return;
      }

      const data = JSON.parse(raw);
      const codeStructure = data.codeStructure || [];

      setFileTree(codeStructure);

      const findFirstFile = (nodes: CodeFile[]): CodeFile | null => {
        for (const n of nodes) {
          if (n.type === "file") return n;
          if (n.children) {
            const f = findFirstFile(n.children);
            if (f) return f;
          }
        }
        return null;
      };

      const firstFile = findFirstFile(codeStructure);
      if (firstFile) setActiveFile(firstFile);

      setIsLoading(false);
    } catch (err) {
      console.error("Failed to load code structure:", err);
      setIsLoading(false);
    }
  }, []);

  /*
  ======================================
  SHIKI HIGHLIGHTING
  ======================================
  */
  useEffect(() => {
    if (!activeFile?.content) {
      setHighlightedHtml("");
      return;
    }

    let mounted = true;

    const highlight = async () => {
      setIsHighlighting(true);
      try {
        const html = await codeToHtml(activeFile.content || "", {
          lang: activeFile.language || "typescript",
          theme: "vitesse-dark"
        });

        if (mounted) {
          setHighlightedHtml(html);
          setIsHighlighting(false);
        }
      } catch {
        if (mounted) {
          setHighlightedHtml(`<pre class="p-4 text-zinc-300 font-mono text-sm">${activeFile.content}</pre>`);
          setIsHighlighting(false);
        }
      }
    };

    highlight();

    return () => {
      mounted = false;
    };
  }, [activeFile]);

  /*
  ======================================
  HELPERS & ACTIONS
  ======================================
  */
  const toggleFolder = (path: string) => {
    const next = new Set(expandedFolders);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    setExpandedFolders(next);
  };

  const copyToClipboard = () => {
    if (!activeFile?.content) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getFileIcon = (name: string) => {
    if (name.endsWith(".ts") || name.endsWith(".js") || name.endsWith(".tsx") || name.endsWith(".jsx"))
      return <FileCode2 className="w-4 h-4 text-primary" />;
    if (name.endsWith(".json"))
      return <FileJson className="w-4 h-4 text-yellow-400" />;
    return <FileText className="w-4 h-4 text-zinc-400" />;
  };

  // ZIP Generation Logic
  const downloadZip = async () => {
    if (fileTree.length === 0) {
      toast({ title: "Error", description: "No code to download.", variant: "destructive" });
      return;
    }

    toast({ title: "Preparing ZIP", description: "Zipping your codebase..." });
    
    const zip = new JSZip();

    // Recursive function to add folders and files to JSZip
    const addFilesToZip = (nodes: CodeFile[], currentFolder: JSZip) => {
      nodes.forEach(node => {
        if (node.type === 'folder' && node.children) {
          const newFolder = currentFolder.folder(node.name);
          if (newFolder) addFilesToZip(node.children, newFolder);
        } else if (node.type === 'file' && node.content) {
          currentFolder.file(node.name, node.content);
        }
      });
    };

    addFilesToZip(fileTree, zip);

    try {
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "blueprint-generated-code.zip";
      a.click();
      URL.revokeObjectURL(url);
      
      toast({ title: "Success", description: "Code downloaded successfully!" });
    } catch (err) {
      console.error(err);
      toast({ title: "Export Failed", description: "Failed to generate ZIP file.", variant: "destructive" });
    }
  };

  /*
  ======================================
  FILE TREE NODE COMPONENT
  ======================================
  */
  const FileTreeNode = ({ node, depth = 0 }: { node: CodeFile; depth?: number; }) => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = activeFile?.path === node.path;

    if (node.type === "folder") {
      return (
        <div>
          <div
            className="flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-800 rounded-md cursor-pointer text-sm text-zinc-300"
            style={{ paddingLeft: depth * 12 + 8 }}
            onClick={() => toggleFolder(node.path)}
          >
            {isExpanded ? <FolderOpen className="w-4 h-4 text-primary" /> : <Folder className="w-4 h-4 text-primary/70" />}
            {node.name}
          </div>
          {isExpanded && node.children && (
            <div>
              {node.children.map(child => (
                <FileTreeNode key={child.path} node={child} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer text-sm rounded-md transition-colors
        ${isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-zinc-800 text-zinc-400"}`}
        style={{ paddingLeft: depth * 12 + 8 }}
        onClick={() => setActiveFile(node)}
      >
        {getFileIcon(node.name)}
        {node.name}
      </div>
    );
  };

  /*
  ======================================
  UI
  ======================================
  */
  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Code2 className="w-8 h-8 text-primary" />
            Code Scaffolding
          </h1>
          <p className="text-zinc-400 mt-1">Review the AI-generated backend structure and code stubs.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="bg-zinc-950 border-zinc-700 text-white hover:bg-zinc-800 gap-2" onClick={() => toast({ title: "Opening StackBlitz", description: "Launching cloud dev environment..." })}>
            <Terminal className="w-4 h-4" /> StackBlitz
          </Button>

          <Button variant="outline" className="bg-zinc-950 border-zinc-700 text-white hover:bg-zinc-800 gap-2" onClick={() => toast({ title: "VS Code", description: "Exporting to local workspace..." })}>
            <VSCodeIcon className="w-4 h-4" /> VS Code
          </Button>

          <Button onClick={downloadZip} className="bg-primary hover:brightness-110 text-white gap-2">
            <Download className="w-4 h-4" /> Download ZIP
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-14rem)] min-h-[600px]">
        
        {/* Explorer */}
        <Card className="lg:col-span-1 bg-zinc-900 border-zinc-800 flex flex-col overflow-hidden">
          <CardHeader className="border-b border-zinc-800 pb-3 bg-zinc-950/50">
            <CardTitle className="text-sm flex items-center gap-2 text-zinc-300 uppercase tracking-wider font-bold">
              <Code2 className="w-4 h-4 text-primary" />
              Explorer
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            {isLoading ? (
              <div className="space-y-2 p-2">
                <Skeleton className="h-5 w-full bg-zinc-800" />
                <Skeleton className="h-5 w-5/6 bg-zinc-800" />
                <Skeleton className="h-5 w-4/6 bg-zinc-800" />
              </div>
            ) : fileTree.length > 0 ? (
              fileTree.map(n => <FileTreeNode key={n.path} node={n} />)
            ) : (
              <div className="p-4 text-center text-sm text-zinc-500">
                No code structure generated yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Code Viewer */}
        <Card className="lg:col-span-3 bg-[#121212] border-zinc-800 flex flex-col overflow-hidden">
          <CardHeader className="flex flex-row justify-between items-center border-b border-zinc-800 pb-3 bg-zinc-950/80">
            <div className="flex gap-2 items-center">
              {activeFile && getFileIcon(activeFile.name)}
              <span className="font-mono text-sm text-zinc-300">
                {activeFile?.path || "No file selected"}
              </span>
            </div>
            {activeFile?.content && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" onClick={copyToClipboard}>
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            )}
          </CardHeader>

          <CardContent className="flex-1 p-0 overflow-auto custom-scrollbar bg-[#121212]">
            {isHighlighting ? (
              <div className="flex items-center justify-center h-full text-zinc-500 gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Highlighting code...
              </div>
            ) : activeFile?.content ? (
              <div
                className="text-sm font-mono p-4 [&>pre]:!bg-transparent"
                dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
                Select a file to view its contents
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}