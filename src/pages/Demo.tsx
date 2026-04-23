// src/pages/Demo.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, FileSearch, MessageSquare, MessageSquareMore, ListChecks, Calendar,
  Network, GitBranch, Code2, FlaskConical, TestTube, Zap,
  ArrowRight, CheckCircle2, CircleDashed, Clock, Folder, FileCode2, FileJson,
  GitMerge, FileText, Server, Database, Globe, BookOpen,
  Lock, CreditCard, Github, Trello, Slack, AlertCircle, Layout, Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { demoProject, demoAnalysis, demoChatMessages } from '@/data/demo/project';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import Testing from '@/pages/Testing';
import { ReactFlow, Background, Controls, Handle, Position, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

type DemoPage = 'overview' | 'analysis' | 'chat' | 'tasks' | 'sprints' | 'architecture' | 'traceability' | 'code' | 'tests' | 'automation';

const navItems: { key: DemoPage; label: string; icon: React.ElementType }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'analysis', label: 'PRD Analysis', icon: FileText },
  { key: 'chat', label: 'Chat & Clarify', icon: MessageSquareMore },
  { key: 'tasks', label: 'Tasks', icon: ListChecks },
  { key: 'sprints', label: 'Sprints', icon: Calendar },
  { key: 'architecture', label: 'Architecture', icon: Network },
  { key: 'traceability', label: 'Traceability', icon: GitMerge },
  { key: 'code', label: 'Code Generator', icon: Code2 },
  { key: 'tests', label: 'Testing', icon: TestTube },
  { key: 'automation', label: 'Automation', icon: Zap },
];

function DemoBanner() {
  return (
    <div className="flex items-center justify-between px-6 py-2.5 bg-primary/10 border-b border-primary/20 text-primary">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        <p className="text-sm font-medium">
          You are viewing a read-only Demo of the <strong>Food Delivery Platform</strong> project.
        </p>
      </div>
    </div>
  );
}

// --- OVERVIEW, ANALYSIS, CHAT PANELS ---
function OverviewPanel() {
  const p = demoProject;
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">{p.name}</h2>
        <p className="text-zinc-400 mt-1 max-w-2xl">{p.description}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'PRD Health', value: `${p.healthScore} / 100`, color: 'text-primary' },
          { label: 'Completeness', value: `${p.completeness}%`, color: 'text-blue-400' },
          { label: 'Complexity', value: p.complexity, color: 'text-amber-400' },
          { label: 'Estimate Timeline', value: '4-6 Weeks', color: 'text-purple-400' },
        ].map(m => (
          <div key={m.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-1">{m.label}</p>
            <p className={cn('text-3xl font-bold', m.color)}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Features', value: p.features.length },
          { label: 'Tasks Generated', value: p.taskCount },
          { label: 'Sprints Planned', value: p.sprintCount },
          { label: 'Ambiguities Found', value: demoAnalysis.ambiguities.length },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs text-zinc-500 font-medium mb-1">{s.label}</p>
            <p className="text-2xl text-white font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Strategic Initiatives */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-primary" />
          Strategic Initiatives
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {p.features.map(f => (
            <div key={f.id} className="group flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-primary/50 transition-all cursor-pointer">
              <div>
                <span className="text-base font-bold text-white group-hover:text-primary transition-colors block mb-1">{f.name}</span>
                <div className="flex items-center gap-3 text-xs text-zinc-500 font-medium">
                  <span>{f.storyCount} Stories</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-700" />
                  <span>{f.taskCount} Tasks</span>
                </div>
              </div>
              <Badge variant="outline" className={cn(
                'rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-tighter',
                f.complexity === 'Critical' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 
                f.complexity === 'High' ? 'text-primary bg-primary/10 border-primary/20' : 
                'text-zinc-400 bg-zinc-800 border-zinc-700'
              )}>
                {f.complexity}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Core Features Extracted Section (NEW) */}
      <div className="space-y-4 py-4">
        <h3 className="text-xl font-bold text-white">Core Features Extracted</h3>
        <div className="space-y-2">
          {[
            { name: "Order Tracking", stories: 4, tasks: 12, complexity: "High" },
            { name: "Kitchen Display System", stories: 5, tasks: 18, complexity: "High" },
            { name: "POS Integration", stories: 4, tasks: 16, complexity: "Critical" },
            { name: "Rider Management", stories: 3, tasks: 14, complexity: "High" },
            { name: "Menu CMS", stories: 4, tasks: 15, complexity: "High" },
            { name: "Analytics Dashboard", stories: 4, tasks: 14, complexity: "Medium" }
          ].map((feature, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-zinc-900/30 border border-zinc-800 hover:bg-zinc-900/50 transition-colors rounded-lg">
              <span className="text-sm font-semibold text-white">{feature.name}</span>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium">
                  <span>{feature.stories} stories</span>
                  <span>{feature.tasks} tasks</span>
                </div>
                <Badge variant="outline" className={cn(
                  'rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-tight w-16 text-center justify-center',
                  feature.complexity === 'Critical' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 
                  feature.complexity === 'High' ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' : 
                  'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
                )}>
                  {feature.complexity}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnalysisPanel() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Ambiguities Detected</h2>
        <p className="text-sm text-zinc-400 mb-4">Issues that need clarification before development</p>
        <div className="space-y-3">
          {demoAnalysis.ambiguities.map(a => (
            <div key={a.id} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={cn('px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider', a.severity === 'high' ? 'text-red-400 bg-red-500/10' : a.severity === 'medium' ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-400 bg-zinc-800')}>
                  {a.severity}
                </span>
                <span className="text-sm font-medium text-primary">{a.feature}</span>
              </div>
              <p className="text-sm text-zinc-300">{a.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Missing Requirements</h2>
        <p className="text-sm text-zinc-400 mb-4">Requirements that should be specified but are absent</p>
        <div className="space-y-3">
          {demoAnalysis.missingRequirements.map(m => (
            <div key={m.id} className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
              <span className="text-sm font-medium text-primary mb-1 block">{m.feature}</span>
              <p className="text-sm text-zinc-300">{m.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatPanel() {
  return (
    <div className="flex flex-col h-[600px] bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
      <div className="p-4 border-b border-zinc-800 bg-zinc-950/50">
        <h3 className="text-sm font-semibold text-white">Blueprint AI Architect</h3>
      </div>
      <div className="flex-1 overflow-auto space-y-4 p-6">
        {demoChatMessages.map(msg => (
          <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn('max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed', msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-zinc-800 text-zinc-200 rounded-tl-none border border-zinc-700')}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.options && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {msg.options.map(opt => (
                    <span key={opt} className="px-3 py-1.5 rounded-full border border-zinc-700 bg-zinc-950 text-xs text-zinc-300 cursor-default">
                      {opt}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 bg-zinc-950 border-t border-zinc-800">
        <div className="flex gap-2">
          <input type="text" placeholder="Demo mode — messages are read-only" disabled className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-800 bg-zinc-900 text-sm text-zinc-500 cursor-not-allowed" />
          <button disabled className="px-4 py-2.5 rounded-lg bg-primary/50 text-white text-sm font-medium cursor-not-allowed">Send</button>
        </div>
      </div>
    </div>
  );
}

// --- TASKS & SPRINTS PANELS ---
function TasksDemoPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Tasks</h2>
        <p className="text-zinc-400 mt-1">Review AI-generated User Stories and effort estimations.</p>
      </div>
      <div className="space-y-4">
        {[
          { id: "STORY-1", title: "User Authentication & Security", points: 8, tasks: [{ id: "AUTH-101", title: "Implement JWT Middleware", type: "Security", pts: 3 }, { id: "AUTH-102", title: "User Registration Endpoint", type: "Feature", pts: 5 }] },
          { id: "STORY-2", title: "Core Infrastructure Setup", points: 15, tasks: [{ id: "SYS-001", title: "Setup API Gateway Routing", type: "Infrastructure", pts: 5 }, { id: "DB-042", title: "Provision PostgreSQL RDS", type: "Infrastructure", pts: 8 }] }
        ].map(story => (
          <Card key={story.id} className="bg-zinc-900 border-zinc-800 overflow-hidden">
            <CardHeader className="border-b border-zinc-800 bg-zinc-950/80 py-4 flex flex-row items-start justify-between">
              <div className="flex gap-3 items-start">
                <div className="mt-1 bg-blue-500/10 p-1.5 rounded-md border border-blue-500/20 text-blue-400"><BookOpen className="w-4 h-4" /></div>
                <div>
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-white text-base">{story.title}</CardTitle>
                    <span className="text-xs font-mono text-zinc-500">{story.id}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
                <span className="text-xs text-zinc-400 font-medium">Story Points:</span>
                <span className="text-sm font-bold text-primary">{story.points}</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-zinc-800/50">
                {story.tasks.map(t => (
                  <div key={t.id} className="p-4 flex items-center justify-between pl-12 bg-zinc-900">
                    <div className="flex items-center gap-3">
                      <CircleDashed className="w-4 h-4 text-zinc-600" />
                      <div>
                        <h4 className="text-sm font-medium text-zinc-200">{t.title}</h4>
                        <p className="text-xs text-zinc-500 mt-0.5 font-mono">{t.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="text-[10px] uppercase bg-zinc-950 border-zinc-700 text-zinc-400">{t.type}</Badge>
                      <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">{t.pts}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SprintsDemoPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Sprint Board</h2>
        <p className="text-zinc-400 mt-1">Preview of the AI-generated execution plan.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col bg-zinc-950/50 rounded-xl border border-zinc-800/50 p-4">
          <div className="flex items-center gap-2 mb-4">
            <CircleDashed className="w-4 h-4 text-zinc-500" />
            <h3 className="font-semibold text-white">To Do</h3>
          </div>
          <div className="space-y-3">
            <Card className="bg-zinc-900 border-zinc-800 p-4 border-l-4 border-l-blue-500 relative overflow-hidden">
              <span className="text-[10px] font-mono text-zinc-500">AUTH-102</span>
              <h4 className="text-sm font-medium text-white mt-1">User Registration Endpoint</h4>
              <div className="flex justify-between items-center mt-3">
                <Badge variant="outline" className="text-red-400 bg-red-500/10 border-red-500/20 border">High</Badge>
                <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-[10px] font-bold text-primary">5</div>
              </div>
            </Card>
          </div>
        </div>
        <div className="flex flex-col bg-zinc-950/50 rounded-xl border border-zinc-800/50 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold text-white">In Progress</h3>
          </div>
          <div className="space-y-3">
            <Card className="bg-zinc-900 border-zinc-800 p-4 border-l-4 border-l-purple-500 relative overflow-hidden">
              <span className="text-[10px] font-mono text-zinc-500">DB-042</span>
              <h4 className="text-sm font-medium text-white mt-1">Provision PostgreSQL RDS</h4>
              <div className="flex justify-between items-center mt-3">
                <Badge variant="outline" className="text-amber-400 bg-amber-500/10 border-amber-500/20 border">Med</Badge>
                <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-[10px] font-bold text-primary">8</div>
              </div>
            </Card>
          </div>
        </div>
        <div className="flex flex-col bg-zinc-950/50 rounded-xl border border-zinc-800/50 p-4">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <h3 className="font-semibold text-white">Done</h3>
          </div>
          <div className="space-y-3">
            <Card className="bg-zinc-900 border-zinc-800 p-4 border-l-4 border-l-purple-500 relative overflow-hidden opacity-70">
              <span className="text-[10px] font-mono text-zinc-500">SYS-001</span>
              <h4 className="text-sm font-medium text-white mt-1">Setup API Gateway Routing</h4>
              <div className="flex justify-between items-center mt-3">
                <Badge variant="outline" className="text-green-400 bg-green-500/10 border-green-500/20 border">Done</Badge>
                <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-[10px] font-bold text-primary">5</div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- ARCHITECTURE & TRACEABILITY PANELS ---
const BlueprintNode = ({ data }: any) => {
  const Icon = data.icon;
  return (
    <div className="flex flex-col items-center gap-2 group transition-all w-32">
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-primary border-none" />
      <div className="w-16 h-16 rounded-xl border-2 border-zinc-700 bg-zinc-950 text-zinc-400 flex items-center justify-center">
        <Icon className="w-8 h-8" />
      </div>
      <span className="text-xs font-medium px-2 py-1 rounded-md text-center bg-zinc-900 text-zinc-400">{data.label}</span>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-primary border-none" />
    </div>
  );
};
const archNodes = [
  { id: "g", type: "blueprint", position: { x: 250, y: 0 }, data: { label: "API Gateway", icon: Globe } },
  { id: "a", type: "blueprint", position: { x: 100, y: 150 }, data: { label: "Auth Service", icon: Lock } },
  { id: "p", type: "blueprint", position: { x: 400, y: 150 }, data: { label: "Payments", icon: CreditCard } },
  { id: "d", type: "blueprint", position: { x: 100, y: 300 }, data: { label: "Users DB", icon: Database } },
];
const archEdges = [
  { id: 'e1', source: 'g', target: 'a', animated: true, style: { stroke: '#52525b', strokeWidth: 2 } },
  { id: 'e2', source: 'g', target: 'p', animated: true, style: { stroke: '#52525b', strokeWidth: 2 } },
  { id: 'e3', source: 'a', target: 'd', animated: true, style: { stroke: '#52525b', strokeWidth: 2 } },
];

function ArchitectureDemoPanel() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">System Architecture</h2>
        <p className="text-zinc-400 mt-1">Sign in to click nodes and view specific endpoints & logic.</p>
      </div>
      <div className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden relative min-h-[400px]">
        <ReactFlow nodes={archNodes} edges={archEdges} nodeTypes={{ blueprint: BlueprintNode }} fitView nodesDraggable={false} panOnDrag={false} zoomOnScroll={false} colorMode="dark">
          <Background color="#3f3f46" gap={24} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}

const TraceNode = ({ data }: any) => {
  const Icon = data.icon;
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-zinc-800 bg-zinc-950 w-56">
      {data.type !== 'req' && <Handle type="target" position={Position.Left} className="w-2 h-2 bg-zinc-500 border-none" />}
      <div className={cn("p-2 rounded-md", data.type === 'req' ? "text-blue-400 bg-blue-500/10" : data.type === 'srv' ? "text-primary bg-primary/10" : "text-green-400 bg-green-500/10")}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{data.badge}</span>
        <span className="text-sm font-medium text-white leading-tight mt-0.5">{data.label}</span>
      </div>
      {data.type !== 'tsk' && <Handle type="source" position={Position.Right} className="w-2 h-2 bg-zinc-500 border-none" />}
    </div>
  );
};
const traceNodes = [
  { id: "r1", type: "trace", position: { x: 50, y: 100 }, data: { label: "User Auth", badge: "PRD-01", type: "req", icon: FileText } },
  { id: "s1", type: "trace", position: { x: 350, y: 100 }, data: { label: "Auth Service", badge: "Microservice", type: "srv", icon: Server } },
  { id: "t1", type: "trace", position: { x: 650, y: 50 }, data: { label: "Setup JWT", badge: "TASK-101", type: "tsk", icon: ListChecks } },
  { id: "t2", type: "trace", position: { x: 650, y: 150 }, data: { label: "OAuth config", badge: "TASK-102", type: "tsk", icon: ListChecks } },
];
const traceEdges = [
  { id: 'tr1', source: 'r1', target: 's1', animated: true, style: { stroke: '#52525b', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#52525b' } },
  { id: 'tr2', source: 's1', target: 't1', style: { stroke: '#52525b', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#52525b' } },
  { id: 'tr3', source: 's1', target: 't2', style: { stroke: '#52525b', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#52525b' } },
];

function TraceabilityDemoPanel() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Traceability Matrix</h2>
        <p className="text-zinc-400 mt-1">Shows how PRD requirements map to generated services and tickets.</p>
      </div>
      <div className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden relative min-h-[400px]">
        <ReactFlow nodes={traceNodes} edges={traceEdges} nodeTypes={{ trace: TraceNode }} fitView nodesDraggable={false} panOnDrag={false} zoomOnScroll={false} colorMode="dark">
          <Background color="#3f3f46" gap={24} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}

// --- CODE & AUTOMATION PANELS ---
function CodeDemoPanel() {
  const [activeFile, setActiveFile] = useState('index.ts');

  const files: Record<string, JSX.Element> = {
    'index.ts': (
      <>
        <span className="text-pink-400">import</span> express <span className="text-pink-400">from</span> <span className="text-green-400">'express'</span>;<br />
        <span className="text-pink-400">import</span> authRoutes <span className="text-pink-400">from</span> <span className="text-green-400">'./routes/auth.routes'</span>;<br /><br />
        <span className="text-blue-400">const</span> app = express();<br />
        <span className="text-blue-400">const</span> PORT = process.env.PORT || <span className="text-orange-400">3000</span>;<br /><br />
        app.use(express.json());<br />
        app.use(<span className="text-green-400">'/api/v1/auth'</span>, authRoutes);<br /><br />
        app.listen(PORT, () ={'>'} {'{\n'}
        {'  '}console.log(<span className="text-green-400">{"`Server running on port ${PORT}`"}</span>);{'\n}'});
      </>
    ),
    'auth.routes.ts': (
      <>
        <span className="text-pink-400">import</span> {'{'} Router {'}'} <span className="text-pink-400">from</span> <span className="text-green-400">'express'</span>;<br />
        <span className="text-pink-400">import</span> {'{'} login, register {'}'} <span className="text-pink-400">from</span> <span className="text-green-400">'../controllers/auth.controller'</span>;<br /><br />
        <span className="text-blue-400">const</span> router = Router();<br /><br />
        <span className="text-zinc-500">// Maps to Requirements in PRD-01</span><br />
        router.post(<span className="text-green-400">'/login'</span>, login);<br />
        router.post(<span className="text-green-400">'/register'</span>, register);<br /><br />
        <span className="text-pink-400">export default</span> router;
      </>
    ),
    'package.json': (
      <>
        {'{'}<br />
        {'  '}<span className="text-blue-400">"name"</span>: <span className="text-green-400">"auth-service"</span>,<br />
        {'  '}<span className="text-blue-400">"version"</span>: <span className="text-green-400">"1.0.0"</span>,<br />
        {'  '}<span className="text-blue-400">"dependencies"</span>: {'{\n'}
        {'    '}<span className="text-blue-400">"express"</span>: <span className="text-green-400">"^4.18.2"</span>,<br />
        {'    '}<span className="text-blue-400">"jsonwebtoken"</span>: <span className="text-green-400">"^9.0.0"</span><br />
        {'  }'}<br />
        {'}'}
      </>
    )
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Code Scaffolding</h2>
        <p className="text-zinc-400 mt-1">Sign in to download the full .ZIP or push directly to GitHub.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[400px]">
        <Card className="col-span-1 bg-zinc-900 border-zinc-800 flex flex-col">
          <CardHeader className="p-4 border-b border-zinc-800"><CardTitle className="text-sm text-white">Explorer</CardTitle></CardHeader>
          <CardContent className="p-2 space-y-1 flex-1">
            <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-zinc-300"><Folder className="w-4 h-4 text-primary/70" /> src</div>
            <div onClick={() => setActiveFile('index.ts')} className={cn("flex items-center gap-2 px-2 py-1.5 text-sm pl-6 cursor-pointer rounded-md transition-colors", activeFile === 'index.ts' ? "bg-primary/10 text-primary" : "text-zinc-400 hover:bg-zinc-800")}>
              <FileCode2 className="w-4 h-4" /> index.ts
            </div>
            <div onClick={() => setActiveFile('auth.routes.ts')} className={cn("flex items-center gap-2 px-2 py-1.5 text-sm pl-6 cursor-pointer rounded-md transition-colors", activeFile === 'auth.routes.ts' ? "bg-primary/10 text-primary" : "text-zinc-400 hover:bg-zinc-800")}>
              <FileCode2 className="w-4 h-4" /> auth.routes.ts
            </div>
            <div onClick={() => setActiveFile('package.json')} className={cn("flex items-center gap-2 px-2 py-1.5 text-sm pl-2 cursor-pointer rounded-md transition-colors", activeFile === 'package.json' ? "bg-primary/10 text-primary" : "text-zinc-400 hover:bg-zinc-800")}>
              <FileJson className="w-4 h-4 text-yellow-400" /> package.json
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3 bg-[#121212] border-zinc-800 flex flex-col relative overflow-hidden">
          <div className="border-b border-zinc-800 bg-zinc-900/50 px-4 py-2 flex items-center gap-2">
            {activeFile.endsWith('.json') ? <FileJson className="w-4 h-4 text-yellow-400" /> : <FileCode2 className="w-4 h-4 text-primary" />}
            <span className="text-sm font-mono text-zinc-300">{activeFile}</span>
          </div>
          <div className="flex-1 p-6 overflow-auto">
            <pre className="text-sm font-mono text-zinc-300 leading-relaxed">
              {files[activeFile]}
            </pre>
          </div>
        </Card>
      </div>
    </div>
  );
}

function AutomationDemoPanel() {
  const integrations = [
    { id: "github", name: "GitHub", desc: "Push scaffolded code.", icon: Github, connected: true },
    { id: "jira", name: "Jira Software", desc: "Sync architecture tasks.", icon: Trello, connected: false },
    { id: "slack", name: "Slack", desc: "Receive notifications.", icon: Slack, connected: false }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Automations</h2>
        <p className="text-zinc-400 mt-1">Connect your workspace to your favorite tools.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {integrations.map((int) => (
          <Card key={int.id} className={cn("bg-zinc-900 border", int.connected ? "border-primary/30" : "border-zinc-800")}>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-2", int.connected ? "bg-primary/10 text-primary" : "bg-zinc-950 text-zinc-400")}>
                  <int.icon className="w-6 h-6" />
                </div>
                <Switch checked={int.connected} disabled />
              </div>
              <CardTitle className="text-white text-xl">{int.name}</CardTitle>
              <CardDescription className="text-zinc-400 mt-2 h-6">{int.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                {int.connected ? (
                  <div className="flex items-center gap-2 text-sm text-green-400"><CheckCircle2 className="w-4 h-4" /> Connected</div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-zinc-500"><AlertCircle className="w-4 h-4" /> Not connected</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function Demo() {
  const [active, setActive] = useState<DemoPage>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const renderPage = () => {
    switch (active) {
      case 'overview': return <OverviewPanel />;
      case 'analysis': return <AnalysisPanel />;
      case 'chat': return <ChatPanel />;
      case 'tests': return <Testing isDemo={true} />;
      case 'tasks': return <TasksDemoPanel />;
      case 'sprints': return <SprintsDemoPanel />;
      case 'architecture': return <ArchitectureDemoPanel />;
      case 'traceability': return <TraceabilityDemoPanel />;
      case 'code': return <CodeDemoPanel />;
      case 'automation': return <AutomationDemoPanel />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950 text-white">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none" className="text-primary">
            <rect x="2" y="2" width="10" height="10" rx="2" fill="currentColor" opacity="0.9" />
            <rect x="16" y="2" width="10" height="10" rx="2" fill="currentColor" opacity="0.5" />
            <rect x="2" y="16" width="10" height="10" rx="2" fill="currentColor" opacity="0.5" />
            <rect x="16" y="16" width="10" height="10" rx="2" fill="currentColor" opacity="0.3" />
          </svg>
          <span className="font-bold">Blueprint.dev</span>
        </Link>
        <button className="p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* MATCHES DashboardLayout.tsx SIDEBAR EXACTLY */}
      <aside className={`
        ${isMobileMenuOpen ? "block" : "hidden"} 
        md:block w-full md:w-64 bg-zinc-900 border-r border-zinc-800 flex-shrink-0 transition-all duration-300 z-20
      `}>
        <div className="h-full flex flex-col">
          <Link to="/" className="hidden md:flex items-center gap-2 p-6 border-b border-zinc-800 text-white hover:bg-zinc-800/50 transition-colors">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-primary">
              <rect x="2" y="2" width="10" height="10" rx="2" fill="currentColor" opacity="0.9" />
              <rect x="16" y="2" width="10" height="10" rx="2" fill="currentColor" opacity="0.5" />
              <rect x="2" y="16" width="10" height="10" rx="2" fill="currentColor" opacity="0.5" />
              <rect x="16" y="16" width="10" height="10" rx="2" fill="currentColor" opacity="0.3" />
            </svg>
            <span className="text-xl font-bold tracking-tight">Blueprint.dev</span>
          </Link>

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
            {navItems.map((item) => {
              const isActive = active === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => { setActive(item.key); setIsMobileMenuOpen(false); }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium
                    ${isActive
                      ? "bg-primary/10 text-primary"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-white"}
                  `}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-zinc-500"}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-zinc-800">
            <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-md bg-zinc-950 border border-zinc-800">
              <div className="flex flex-col text-left">
                <span className="text-sm font-medium text-white leading-none">Guest Mode</span>
                <span className="text-[10px] text-zinc-500 mt-1">Read-only Demo</span>
              </div>
              <Link to="/auth" className="text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 font-medium transition-colors">Sign Up</Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        <DemoBanner />

        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-4 text-zinc-400 text-sm">
            <span>Demo Workspace</span>
            <span>/</span>
            <span className="text-white font-medium">{navItems.find(i => i.key === active)?.label}</span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button className="bg-primary hover:brightness-110 text-white gap-2 h-9 text-sm glow-orange">
                Create Account <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-zinc-950 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}