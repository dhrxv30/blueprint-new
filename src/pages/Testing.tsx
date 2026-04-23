// src/pages/Testing.tsx
import { useState, useEffect } from 'react';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FlaskConical, ShieldAlert, AlertTriangle, Code2, 
  Send, CheckCircle2, XCircle, AlertCircle, Copy, Check, Download 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  functionalTests as demoFunctional,
  edgeCaseTests as demoEdge,
  negativeTests as demoNegative,
  unitStubs as demoUnit,
  postmanCollection as demoPostman,
} from '@/data/demo/tests';

// =====================================
// TYPES
// =====================================
type TestStatus = "pass" | "fail" | "edge";

type TestCase = {
  id: string;
  method: string;
  endpoint: string;
  description: string;
  expected: string;
  status: TestStatus;
  category?: string;
};

type Category = "functional" | "edge" | "negative" | "unit" | "postman";

// =====================================
// HELPER COMPONENTS
// =====================================
const statusConfig: Record<TestStatus, { label: string; icon: React.ElementType; className: string }> = {
  pass: { label: 'PASS', icon: CheckCircle2, className: 'bg-green-500/10 text-green-400 border-green-500/30' },
  fail: { label: 'FAIL', icon: XCircle, className: 'bg-red-500/10 text-red-400 border-red-500/30' },
  edge: { label: 'EDGE', icon: AlertCircle, className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
};

function StatusBadge({ status }: { status: TestStatus }) {
  const config = statusConfig[status] || statusConfig.pass;
  const Icon = config.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border uppercase', config.className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function TestItem({ test, isDemo }: { test: TestCase, isDemo: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-lg border p-4 transition-colors",
        isDemo 
          ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700" 
          : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm text-orange-400 font-medium">{test.method}</span>
            <span className={cn("font-mono text-sm truncate", isDemo ? "text-zinc-300" : "text-zinc-200")}>{test.endpoint}</span>
          </div>
          <p className={cn("text-sm mb-2", isDemo ? "text-zinc-400" : "text-zinc-400")}>{test.description}</p>
          <p className="font-mono text-xs text-zinc-500">
            Expected: <span className={isDemo ? "text-primary/80" : "text-zinc-300"}>{test.expected}</span>
          </p>
        </div>
        <StatusBadge status={test.status} />
      </div>
    </motion.div>
  );
}

function PostmanViewer({ isDemo, postmanData }: { isDemo: boolean, postmanData: any }) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(postmanData, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'blueprint-api-collection.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold font-satoshi text-white">Postman Collection</h3>
          <p className="text-sm mt-1 text-zinc-400">Export and import into Postman or Insomnia</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm transition-colors bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export .json
          </button>
        </div>
      </div>
      <div className="flex-1 rounded-lg border overflow-auto bg-zinc-950 border-zinc-800">
        <pre className="p-4 text-sm font-mono leading-relaxed text-zinc-400">
          <code>{json}</code>
        </pre>
      </div>
    </div>
  );
}

// =====================================
// MAIN COMPONENT
// =====================================
export default function Testing({ isDemo = false }: { isDemo?: boolean }) {
  const [active, setActive] = useState<Category>('functional');

  // State arrays to hold pipeline data dynamically
  const [functionalTests, setFunctionalTests] = useState<TestCase[]>([]);
  const [edgeCaseTests, setEdgeCaseTests] = useState<TestCase[]>([]);
  const [negativeTests, setNegativeTests] = useState<TestCase[]>([]);
  const [unitStubs, setUnitStubs] = useState<TestCase[]>([]);
  const [postmanData, setPostmanData] = useState<any>({});

  useEffect(() => {
    if (isDemo) {
      // Use static demo data for landing page
      setFunctionalTests(demoFunctional as TestCase[]);
      setEdgeCaseTests(demoEdge as TestCase[]);
      setNegativeTests(demoNegative as TestCase[]);
      setUnitStubs(demoUnit as TestCase[]);
      setPostmanData(demoPostman);
    } else {
      // Load real AI generated data for actual Dashboard
      const raw = localStorage.getItem("blueprint_project_data");
      if (raw) {
        try {
          const data = JSON.parse(raw);
          const tests = data.tests || [];
          
          setFunctionalTests(tests.filter((t: any) => t.category === "functional"));
          setEdgeCaseTests(tests.filter((t: any) => t.category === "edge"));
          setNegativeTests(tests.filter((t: any) => t.category === "negative"));
          setUnitStubs(tests.filter((t: any) => t.category === "unit"));
          setPostmanData(data.postmanCollection || {});
        } catch (e) {
          console.error("Error parsing test data", e);
        }
      }
    }
  }, [isDemo]);

  const categories: { key: Category; label: string; icon: React.ElementType; count: number }[] = [
    { key: 'functional', label: 'Functional Tests', icon: FlaskConical, count: functionalTests.length },
    { key: 'edge', label: 'Edge Cases', icon: AlertTriangle, count: edgeCaseTests.length },
    { key: 'negative', label: 'Negative Tests', icon: ShieldAlert, count: negativeTests.length },
    { key: 'unit', label: 'Unit Test Stubs', icon: Code2, count: unitStubs.length },
    { key: 'postman', label: 'Postman Collection', icon: Send, count: 0 }, // Postman isn't counted
  ];

  const categoryData: Record<Exclude<Category, 'postman'>, TestCase[]> = {
    functional: functionalTests,
    edge: edgeCaseTests,
    negative: negativeTests,
    unit: unitStubs,
  };

  const allTests = Object.values(categoryData).flat();
  const passCount = allTests.filter(t => t.status === 'pass').length;
  const failCount = allTests.filter(t => t.status === 'fail').length;
  const totalCount = allTests.length;

  const content = (
    <div className={cn(
      "flex rounded-xl border overflow-hidden", 
      isDemo ? "h-full bg-zinc-950 border-zinc-800" : "h-[calc(100vh-14rem)] bg-zinc-950 border-zinc-800"
    )}>
      {/* Sidebar Categories */}
      <aside className="w-[220px] shrink-0 border-r border-zinc-800 bg-zinc-900/30 p-4 flex flex-col gap-1">
        <h2 className="text-xs uppercase tracking-wider mb-3 px-2 text-zinc-500 font-bold">Test Categories</h2>
        
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = active === cat.key; // Solves the "isActive not found" error!

          return (
            <button
              key={cat.key}
              onClick={() => setActive(cat.key as Category)}
              className={cn(
                'flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm transition-colors text-left',
                isActive
                  ? 'bg-zinc-800 text-primary font-medium'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{cat.label}</span>
              {cat.count > 0 && (
                <span className={cn('text-xs font-mono', isActive ? 'text-primary' : 'text-zinc-600')}>
                  {cat.count}
                </span>
              )}
            </button>
          );
        })}

        {/* Summary Stats */}
        <div className="mt-auto pt-4 border-t border-zinc-800 space-y-2 px-2">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Total</span>
            <span className="font-mono text-zinc-300">{totalCount}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-green-500">Passing</span>
            <span className="text-green-500 font-mono">{passCount}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-red-500">Failing</span>
            <span className="text-red-500 font-mono">{failCount}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Viewer */}
      <main className="flex-1 p-6 overflow-hidden flex flex-col bg-zinc-950">
        <AnimatePresence mode="wait">
          {active === 'postman' ? (
            <motion.div key="postman" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-hidden">
              <PostmanViewer isDemo={isDemo} postmanData={postmanData} />
            </motion.div>
          ) : (
            <motion.div key={active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col overflow-hidden">
              
              <div className="flex items-center justify-between mb-6 shrink-0">
                <div>
                  <h3 className="text-xl font-bold font-satoshi text-white">
                    {categories.find(c => c.key === active)?.label}
                  </h3>
                  <p className="text-sm mt-1 text-zinc-400">
                    {active === 'functional' && 'Core endpoint tests validating expected behavior'}
                    {active === 'edge' && 'Boundary conditions and unusual but valid inputs'}
                    {active === 'negative' && 'Invalid inputs and unauthorized access attempts'}
                    {active === 'unit' && 'Service-level unit test stubs for core logic'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {(['pass', 'fail', 'edge'] as TestStatus[]).map(s => {
                    const testsForActiveCat = categoryData[active] || [];
                    const count = testsForActiveCat.filter(t => t.status === s).length;
                    if (count === 0) return null;
                    return (
                      <div key={s} className="flex items-center gap-1.5 text-xs">
                        <StatusBadge status={s} />
                        <span className="font-mono text-zinc-500">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {(categoryData[active] || []).length > 0 ? (
                  (categoryData[active] || []).map((test, i) => (
                    <TestItem key={test.id || i} test={test} isDemo={isDemo} />
                  ))
                ) : (
                  <div className="text-zinc-500 text-center mt-20 text-sm border border-dashed border-zinc-800 rounded-lg p-10 bg-zinc-900/20">
                    No {active} tests generated by the AI for this project yet.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );

  return isDemo ? content : (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <FlaskConical className="w-8 h-8 text-primary" />
          Testing & Quality Assurance
        </h1>
        <p className="text-zinc-400 mt-1">Generated API tests, unit stubs, and Postman collections based on your PRD.</p>
      </div>
      {content}
    </DashboardLayout>
  );
}