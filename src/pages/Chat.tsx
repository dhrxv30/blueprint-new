// src/pages/Chat.tsx
import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, AlertCircle, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BACKEND_BASE } from "@/lib/config";

type Message = {
  id: string;
  role: "ai" | "user";
  content: string;
  timestamp: string;
  ambiguityId?: string;
};

type AmbiguityStatus = {
  total: number;
  resolved: number;
  pending: number;
  allResolved: boolean;
};

export default function Chat() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentAmbiguityId, setCurrentAmbiguityId] = useState<string | null>(null);
  const [status, setStatus] = useState<AmbiguityStatus | null>(null);
  const [allDone, setAllDone] = useState(false);
  const [contextInput, setContextInput] = useState("");
  const [isFinalizing, setIsFinalizing] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const now = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // ============================
  // Load first ambiguity on mount
  // ============================
  useEffect(() => {
    if (!projectId) return;
    fetchNextAmbiguity();
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // ============================
  // Auto scroll
  // ============================
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, allDone]);

  // ============================
  // Fetch next pending ambiguity
  // ============================
  const fetchNextAmbiguity = async () => {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/ambiguities/next?projectId=${projectId}`);
      const data = await res.json();

      if (data.done || !data.ambiguity) {
        // Double check status before declaring victory
        const statusRes = await fetch(`${BACKEND_BASE}/api/ambiguities/status?projectId=${projectId}`);
        const statusData = await statusRes.json();
        setStatus(statusData);
        
        if (statusData.pending === 0 || statusData.allResolved) {
          setAllDone(true);
          setCurrentAmbiguityId(null);
          // Add a system message
          setMessages((prev) => [
            ...prev,
            {
              id: "done-" + Date.now(),
              role: "ai",
              content: "All ambiguities have been resolved! You can add any additional context below, then click Finalize PRD to re-evaluate.",
              timestamp: now()
            }
          ]);
        } else {
          // If there are still pending, retry fetch once
          console.warn("Mismatched state: done reported but pending exists. Retrying...");
          setTimeout(fetchNextAmbiguity, 1000);
        }
        return;
      }

      setCurrentAmbiguityId(data.ambiguity.id);
      setMessages((prev) => [
        ...prev,
        {
          id: data.ambiguity.id,
          role: "ai",
          content: data.ambiguity.question,
          timestamp: now(),
          ambiguityId: data.ambiguity.id
        }
      ]);
    } catch (err) {
      console.error("Failed to fetch next ambiguity:", err);
    }
  };

  // ============================
  // Fetch ambiguity status
  // ============================
  const fetchStatus = async () => {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/ambiguities/status?projectId=${projectId}`);
      const data = await res.json();
      setStatus(data);
      setAllDone(data.allResolved);
    } catch (err) {
      console.error("Failed to fetch status:", err);
    }
  };

  // ============================
  // Handle answer submission
  // ============================
  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || !currentAmbiguityId) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: now()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    try {
      const res = await fetch(`${BACKEND_BASE}/api/ambiguities/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ambiguityId: currentAmbiguityId,
          answer: userMsg.content
        })
      });

      const data = await res.json();

      if (data.done) {
        setAllDone(true);
        setCurrentAmbiguityId(null);
        setMessages((prev) => [
          ...prev,
          {
            id: "done-" + Date.now(),
            role: "ai",
            content: "All ambiguities have been resolved! You can add any additional context below, then click Finalize PRD to re-evaluate.",
            timestamp: now()
          }
        ]);
      } else if (data.next) {
        setCurrentAmbiguityId(data.next.id);
        setMessages((prev) => [
          ...prev,
          {
            id: data.next.id,
            role: "ai",
            content: data.next.question,
            timestamp: now(),
            ambiguityId: data.next.id
          }
        ]);
      }

      fetchStatus();
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "ai",
          content: "⚠️ Failed to submit answer. Please try again.",
          timestamp: now()
        }
      ]);
    }

    setIsTyping(false);
  };

  // ============================
  // Save context and finalize
  // ============================
  const handleFinalize = async () => {
    if (!projectId) return;
    setIsFinalizing(true);

    try {
      // Save context if provided
      if (contextInput.trim()) {
        await fetch(`${BACKEND_BASE}/api/context/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, content: contextInput.trim() })
        });
      }

      // Trigger PRD finalization
      const res = await fetch(`${BACKEND_BASE}/api/prd/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId })
      });

      const data = await res.json();

      if (data.success && data.jobId) {
        toast({
          title: "Re-evaluating PRD...",
          description: "Redirecting to the pipeline processing page."
        });
        navigate(`/dashboard/processing?jobId=${data.jobId}&projectId=${projectId}&autoRedirect=true`);
      } else {
        throw new Error(data.error || "Finalization failed");
      }
    } catch (err: any) {
      toast({
        title: "Finalization Failed",
        description: err.message || "Something went wrong",
        variant: "destructive"
      });
      setIsFinalizing(false);
    }
  };

  // ============================
  // No projectId guard
  // ============================
  if (!projectId) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold">No Project Selected</h2>
          <p className="text-zinc-400 mt-2">Please select a project from the dashboard.</p>
          <Button className="mt-6" onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto gap-4">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              PRD Clarification
            </h1>
            <p className="text-zinc-400 mt-1 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Resolve ambiguities detected in the PRD
            </p>
          </div>
          {status && status.total > 0 && (
            <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2">
              <span className="text-xs text-zinc-500 uppercase font-bold">Progress</span>
              <span className="text-white font-bold text-lg">
                {status.resolved}/{status.total}
              </span>
              {status.allResolved && <CheckCircle2 className="w-4 h-4 text-green-400" />}
            </div>
          )}
        </div>

        {/* CHAT CARD */}
        <Card className="flex-1 flex flex-col bg-zinc-900 border-zinc-800 overflow-hidden">
          <CardHeader className="border-b border-zinc-800 bg-zinc-950/50">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-black text-white">
                B
              </div>
              Blueprint.dev
            </CardTitle>
          </CardHeader>

          {/* MESSAGES */}
          <CardContent
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6"
          >
            {messages.length === 0 && !allDone && (
              <div className="flex items-center justify-center h-full text-zinc-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading ambiguities...
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-4 max-w-[85%] ${
                  msg.role === "user"
                    ? "ml-auto flex-row-reverse"
                    : ""
                }`}
              >
                <Avatar className="w-8 h-8 border border-zinc-700 flex-shrink-0">
                  <AvatarImage src={msg.role === "ai" ? "/bot-avatar.png" : undefined} />
                  <AvatarFallback className={msg.role === "ai" ? "bg-primary text-white font-black text-xs" : "bg-zinc-700 text-white font-bold text-xs"}>
                    {msg.role === "ai" ? "B" : "U"}
                  </AvatarFallback>
                </Avatar>

                <div
                  className={`flex flex-col ${
                    msg.role === "user"
                      ? "items-end"
                      : "items-start"
                  }`}
                >
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed
                    ${
                      msg.role === "user"
                        ? "bg-primary text-white"
                        : "bg-zinc-800 text-zinc-200 border border-zinc-700"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-4">
                <Avatar className="w-8 h-8 border border-zinc-700">
                  <AvatarImage src="/bot-avatar.png" />
                  <AvatarFallback className="bg-primary text-white font-black text-xs">B</AvatarFallback>
                </Avatar>
                <div className="bg-zinc-800 border border-zinc-700 px-4 py-3 rounded-xl text-zinc-400 text-sm">
                  Blueprint is thinking...
                </div>
              </div>
            )}
          </CardContent>

          {/* CONTEXT + FINALIZE (shown when all resolved) */}
          {allDone && (
            <div className="px-6 py-4 bg-zinc-950/80 border-t border-zinc-800 space-y-4">
              <div>
                <label className="text-xs text-zinc-500 uppercase font-bold mb-2 block">
                  Additional Context (optional)
                </label>
                <Textarea
                  value={contextInput}
                  onChange={(e) => setContextInput(e.target.value)}
                  placeholder="Add any extra context, constraints, or preferences..."
                  className="bg-zinc-900 border-zinc-700 text-white min-h-[80px] resize-none"
                />
              </div>
              <Button
                onClick={handleFinalize}
                disabled={isFinalizing}
                className="w-full bg-primary hover:brightness-110 text-white gap-2 h-12 text-base font-bold"
              >
                {isFinalizing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Re-evaluating PRD...
                  </>
                ) : (
                  <>
                    Finalize PRD
                  </>
                )}
              </Button>
            </div>
          )}

          {/* INPUT (only shown when there are pending ambiguities) */}
          {!allDone && (
            <div className="p-4 bg-zinc-950 border-t border-zinc-800">
              <form
                onSubmit={handleSendMessage}
                className="relative flex items-center"
              >
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your clarification..."
                  className="pr-12 bg-zinc-900 border-zinc-700 text-white"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="absolute right-1.5 h-9 w-9"
                  disabled={!inputValue.trim() || isTyping || !currentAmbiguityId}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}