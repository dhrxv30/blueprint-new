import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, MessageCircle, Mail, ExternalLink, Zap, FileText, Code2, TestTube, Search, LifeBuoy, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";


const faqs = [
  {
    question: "How do I upload a PRD document?",
    answer: "Navigate to the PRD Analysis section from the sidebar, click 'Upload PRD', and drag & drop your document (PDF, DOCX, or Markdown). Our AI will parse and extract requirements automatically within seconds.",
  },
  {
    question: "What formats does the code generator support?",
    answer: "The code generator supports TypeScript, JavaScript, Python, and Go. It produces clean, production-ready code with proper error handling, types, and documentation based on your task specifications.",
  },
  {
    question: "How does sprint planning work?",
    answer: "Once tasks are generated from your PRD analysis, navigate to Sprint Planner. Tasks are automatically estimated and can be dragged into sprint cycles. The AI suggests optimal sprint compositions based on dependencies and team velocity.",
  },
  {
    question: "Can I integrate with existing project management tools?",
    answer: "Yes! Blueprint.dev supports integrations with GitHub, Jira, Linear, and Slack. Go to Settings → Integrations to connect your tools. We sync tasks, sprints, and code changes bidirectionally.",
  },
  {
    question: "How does the traceability matrix work?",
    answer: "The traceability matrix maps every requirement from your PRD to its corresponding tasks, architecture components, code modules, and test cases. This ensures complete coverage and helps identify gaps in implementation.",
  },
  {
    question: "What AI models power the analysis?",
    answer: "Blueprint.dev uses a combination of fine-tuned LLMs for PRD parsing, requirement extraction, and code generation. The models are optimized for software engineering workflows and continuously improved based on user feedback.",
  },
];

const supportChannels = [
  {
    title: "Community Discord",
    description: "Join 2,000+ developers building with Blueprint.dev",
    icon: MessageCircle,
    action: "Join Discord",
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
  },
  {
    title: "Email Support",
    description: "Get help from our engineering team within 24 hours",
    icon: Mail,
    action: "Send Email",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Documentation",
    description: "Comprehensive guides, API references, and tutorials",
    icon: BookOpen,
    action: "Browse Docs",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
];

export default function HelpSupport() {
  const { toast } = useToast();

  const handleAction = (channel: string) => {
    toast({ title: channel, description: `Opening ${channel.toLowerCase()}...` });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 pt-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
            <LifeBuoy className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold font-satoshi text-foreground">Help & Support</h1>
          <p className="text-text-secondary max-w-lg mx-auto">
            Find answers, browse documentation, or reach out to our team.
          </p>
        </div>


        {/* FAQ */}
        <Card className="bg-surface border-border-subtle shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-foreground font-satoshi">Frequently Asked Questions</CardTitle>
            <CardDescription className="text-text-muted">
              Common questions about Blueprint.dev features and workflows.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-border-subtle">
                  <AccordionTrigger className="text-sm font-medium text-foreground hover:text-primary hover:no-underline py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-text-secondary leading-relaxed pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Support Channels */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 font-satoshi">Contact Support</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {supportChannels.map((channel) => (
              <Card
                key={channel.title}
                className="bg-surface border-border-subtle hover:border-primary/30 transition-colors"
              >
                <CardContent className="p-5 text-center space-y-3">
                  <div className={`w-10 h-10 rounded-xl ${channel.bgColor} flex items-center justify-center mx-auto`}>
                    <channel.icon className={`w-5 h-5 ${channel.color}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{channel.title}</h3>
                    <p className="text-xs text-text-muted mt-1">{channel.description}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border-emphasis text-foreground hover:bg-overlay w-full"
                    onClick={() => handleAction(channel.title)}
                  >
                    {channel.action}
                    <ExternalLink className="w-3 h-3 ml-1.5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Status */}
        <Card className="bg-surface border-border-subtle">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
              <div>
                <p className="text-sm font-medium text-foreground">All Systems Operational</p>
                <p className="text-xs text-text-muted">Last checked 2 minutes ago</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-text-secondary hover:text-foreground"
              onClick={() => toast({ title: "Status Page", description: "Opening system status page..." })}
            >
              View Status Page
              <ExternalLink className="w-3 h-3 ml-1.5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
