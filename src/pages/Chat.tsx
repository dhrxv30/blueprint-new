// src/pages/Chat.tsx
import { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Bot, AlertCircle } from "lucide-react";

type Message = {
  id: string;
  role: "ai" | "user";
  content: string;
  timestamp: string;
};

export default function Chat() {

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  /*
  ===============================
  Load clarifications from pipeline
  ===============================
  */

  useEffect(() => {

    const raw = localStorage.getItem("blueprint_project_data");

    if (!raw) return;

    const data = JSON.parse(raw);

    const clarifications = data.clarifications || [];

    const aiMessages: Message[] = clarifications.map((q: any, i: number) => ({
      id: "ai-" + i,
      role: "ai",
      content: q.question || q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }));

    setMessages(aiMessages);

  }, []);

  /*
  ===============================
  Auto scroll
  ===============================
  */

  useEffect(() => {

    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }

  }, [messages, isTyping]);

  /*
  ===============================
  Send message
  ===============================
  */

  const handleSendMessage = async (e?: React.FormEvent) => {

    e?.preventDefault();

    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    try {

      const raw = localStorage.getItem("blueprint_project_data");

      const context = raw ? JSON.parse(raw) : {};

      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userMsg.content,
          context
        })
      });

      const data = await response.json();

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: data.reply || "AI response unavailable.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        })
      };

      setMessages((prev) => [...prev, aiMsg]);

    } catch (err) {

      const fallbackMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: "⚠️ Backend unavailable or API key exhausted.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        })
      };

      setMessages((prev) => [...prev, fallbackMsg]);

    }

    setIsTyping(false);

  };

  const handleChipClick = (text: string) => {
    setInputValue(text);
  };

  return (

    <DashboardLayout>

      <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto gap-4">

        {/* HEADER */}

        <div>

          <h1 className="text-3xl font-bold text-white tracking-tight">
            PRD Clarification
          </h1>

          <p className="text-zinc-400 mt-1 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Resolve ambiguities detected in the PRD
          </p>

        </div>

        {/* CHAT CARD */}

        <Card className="flex-1 flex flex-col bg-zinc-900 border-zinc-800 overflow-hidden">

          <CardHeader className="border-b border-zinc-800 bg-zinc-950/50">

            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              Blueprint AI Architect
            </CardTitle>

          </CardHeader>

          {/* MESSAGES */}

          <CardContent
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6"
          >

            {messages.map((msg) => (

              <div
                key={msg.id}
                className={`flex gap-4 max-w-[85%] ${
                  msg.role === "user"
                    ? "ml-auto flex-row-reverse"
                    : ""
                }`}
              >

                <Avatar className="w-8 h-8 border border-zinc-700">

                  {msg.role === "ai"
                    ? <Bot className="w-5 h-5 m-auto text-primary" />
                    : <AvatarImage src="https://github.com/shadcn.png" />}

                  <AvatarFallback>
                    {msg.role === "ai" ? "AI" : "U"}
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
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>

                <div className="bg-zinc-800 border border-zinc-700 px-4 py-3 rounded-xl text-zinc-400 text-sm">
                  AI thinking...
                </div>

              </div>

            )}

          </CardContent>

          {/* QUICK SUGGESTIONS */}

          <div className="px-6 pb-2 pt-2 bg-zinc-900 flex flex-wrap gap-2">

            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                handleChipClick("Let's implement a retry queue for webhook failures.")
              }
            >
              Suggest: Add retry queue
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                handleChipClick("Stripe built-in retries are sufficient for MVP.")
              }
            >
              Suggest: Use Stripe retries
            </Button>

          </div>

          {/* INPUT */}

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
                disabled={!inputValue.trim() || isTyping}
              >
                <Send className="w-4 h-4" />
              </Button>

            </form>

          </div>

        </Card>

      </div>

    </DashboardLayout>
  );
}