import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useEffect, useRef } from "react";
import {
  Search, Sparkles, Check, Loader2, Brain, Network, FileSearch,
  Scale, Gavel, Layers, TrendingUp, Bookmark, Clock, ChevronRight, ArrowUpRight,
  Users, Activity, BarChart3, Building
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const renderStart = useRef(typeof performance !== 'undefined' ? performance.now() : Date.now());
  useEffect(() => {
    const t = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - renderStart.current;
    try { console.log('[Dashboard] mount render time ms:', t); } catch (e) { /* no-op */ }
    return () => { try { console.log('[Dashboard] unmount'); } catch (e) { } };
  }, []);

  const [query, setQuery] = useState("Will AI replace software engineers?");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'workspace' | 'organization'>('workspace');
  
  const { user, token } = useAuth();
  const isBusiness = user?.plan === 'business';

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/truthforge/debate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ question: query }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const data = await response.json();
          if (data.error === 'usage_limit_exceeded') {
            throw new Error(`Usage limit exceeded for ${data.plan} plan. Please upgrade.`);
          }
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      console.log('[Dashboard] Debate result:', data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      console.error('[Dashboard] Error:', msg);
    } finally {
      setIsLoading(false);
    }
  }

  // Build real agent pipeline from execution state
  const pipelineState = useMemo(() => {
    if (!result?.execution_state) {
      return [
        { key: "planner", label: "Planner Activated", icon: Layers, detail: "", status: "pending" },
        { key: "memory", label: "Memory Retrieved", icon: Brain, detail: "", status: "pending" },
        { key: "evidence", label: "Evidence Searching", icon: FileSearch, detail: "", status: "pending" },
        { key: "thesis", label: "Thesis Generated", icon: Network, detail: "", status: "pending" },
        { key: "antithesis", label: "Antithesis Generated", icon: Scale, detail: "", status: "pending" },
        { key: "referee", label: "Referee Evaluating", icon: Gavel, detail: "", status: "pending" },
        { key: "synthesis", label: "Synthesis Complete", icon: Sparkles, detail: "", status: "pending" },
      ];
    }

    const exec = result.execution_state;
    return [
      {
        key: "planner",
        label: "Planner Activated",
        icon: Layers,
        detail: `Complexity: ${result.complexity}`,
        status: isLoading ? (result ? "done" : "active") : "done",
      },
      {
        key: "memory",
        label: "Memory Retrieved",
        icon: Brain,
        detail: `${exec.memory?.matches_found || 0} related debates found in graph`,
        status: isLoading ? "done" : "done",
      },
      {
        key: "evidence",
        label: "Evidence Searching",
        icon: FileSearch,
        detail: `Scanned ${exec.evidence?.sources_scanned || 0} sources, found ${exec.evidence?.sources_found?.length || 0}`,
        status: isLoading ? "done" : "done",
      },
      {
        key: "thesis",
        label: "Thesis Generated",
        icon: Network,
        detail: `${exec.thesis?.total_claims || 0} supporting claims drafted`,
        status: isLoading ? "done" : "done",
      },
      {
        key: "antithesis",
        label: "Antithesis Generated",
        icon: Scale,
        detail: `${exec.antithesis?.total_counterclaims || 0} counter-claims compiled`,
        status: isLoading ? "done" : "done",
      },
      {
        key: "referee",
        label: "Referee Evaluating",
        icon: Gavel,
        detail: `Logic: ${(exec.referee?.logic_quality_score * 100 || 0).toFixed(0)}%, Evidence: ${(exec.referee?.evidence_strength_score * 100 || 0).toFixed(0)}%`,
        status: isLoading ? "done" : "done",
      },
      {
        key: "synthesis",
        label: "Synthesis Complete",
        icon: Sparkles,
        detail: `Final analysis forged with ${result.confidence || 0}% confidence`,
        status: "done",
      },
    ];
  }, [result, isLoading]);

  return (
    <main className="mx-auto max-w-7xl px-4 md:px-6 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-forge">Workspace</p>
          <h1 className="mt-1 text-3xl md:text-4xl font-display font-semibold text-gradient">
            Forge a new debate
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {isBusiness && (
            <div className="flex bg-secondary/50 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('workspace')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${activeTab === 'workspace' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
              >
                Personal
              </button>
              <button
                onClick={() => setActiveTab('organization')}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition ${activeTab === 'organization' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
              >
                <Building className="w-4 h-4" /> Organization
              </button>
            </div>
          )}
          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <span className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-primary animate-pulse' : 'bg-forge animate-pulse'}`} />
            {isLoading ? 'debating...' : '7 agents online'}
          </div>
        </div>
      </div>

      {activeTab === 'organization' && isBusiness ? (
        <BusinessDashboard />
      ) : (
        <>
          {/* Search */}
          <form onSubmit={handleAsk} className="relative glass-strong border-gradient rounded-2xl p-1.5">
        <div className="flex items-center gap-3 px-4 py-2">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a difficult question..."
            className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground py-2"
          />
           <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-medium glow-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isLoading ? 'Forging...' : 'Forge'}
          </button>
        </div>
      </form>

      {/* Suggested */}
      <div className="mt-3 flex flex-wrap gap-2">
        {["Is open-source AI safe?", "Should we hire a CTO or fractional?", "Will rates stay above 4% in 2026?"].map((s) => (
          <button key={s} onClick={() => setQuery(s)} className="text-xs glass px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground transition">
            {s}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main column */}
        <div className="space-y-6">
          {/* Pipeline */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-display font-semibold">Agent Activity</div>
              <div className="text-xs font-mono text-muted-foreground">idle</div>
            </div>
            <div className="space-y-2">
              {pipelineState.map((a) => {
                const active = a.status === "active";
                return (
                  <motion.div
                    key={a.key}
                    initial={false}
                    animate={{ opacity: a.status === "pending" ? 0.55 : 1 }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-secondary/40"
                  >
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                      a.status === "done" ? "bg-forge/20 text-forge" :
                      active ? "bg-primary/20 text-primary-foreground" : "bg-muted/40 text-muted-foreground"
                    }`}>
                      {a.status === "done" ? <Check className="w-3.5 h-3.5" /> :
                        active ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                        <a.icon className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{a.label}</div>
                      <div className="text-xs text-muted-foreground truncate">{a.detail}</div>
                    </div>
                    {a.status === "done" && <span className="text-[10px] font-mono text-forge">✓</span>}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Output */}
          <AnimatePresence>
            {(result || error) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-strong border-gradient rounded-2xl p-7"
              >
                {error ? (
                  <div className="text-red-400 text-sm">Error: {error}</div>
                ) : result ? (
                  <>
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div>
                        <p className="text-xs font-mono uppercase tracking-widest text-forge mb-2">Intelligence Report</p>
                        <h2 className="text-2xl font-display font-semibold">{result.question}</h2>
                      </div>
                      <ConfidenceDial value={result.confidence || 75} />
                    </div>

                    <Section title="Analysis">
                      <p className="text-sm leading-relaxed text-foreground/90">{result.analysis}</p>
                    </Section>

                    <Section title="Supporting Signals">
                      <div className="space-y-2">
                        {(result.supporting_signals || []).map((signal: any, i: number) => {
                          const weight = typeof signal === 'object' ? signal.weight : 0.75;
                          const text = typeof signal === 'object' ? signal.text : signal;
                          return <SignalRow key={i} text={text} weight={weight} color="forge" />;
                        })}
                      </div>
                    </Section>

                    <Section title="Counterarguments">
                      <div className="space-y-2">
                        {(result.counterarguments || []).map((counter: any, i: number) => {
                          const weight = typeof counter === 'object' ? counter.weight : 0.65;
                          const text = typeof counter === 'object' ? counter.text : counter;
                          return <SignalRow key={i} text={text} weight={weight} color="violet" />;
                        })}
                      </div>
                    </Section>

                    <Section title="Final Answer">
                      <div className="relative rounded-xl p-5 bg-gradient-to-br from-primary/10 to-forge/10 border border-border/50">
                        <Sparkles className="w-4 h-4 text-forge absolute top-4 right-4" />
                        <p className="text-sm leading-relaxed">{result.final_answer}</p>
                      </div>
                    </Section>
                  </>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          {/* Current Debate Stats - Real data from last result */}
          {result && (
            <SidebarCard title="Current Analysis" icon={TrendingUp}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Complexity</span>
                  <span className="text-xs font-mono capitalize font-semibold text-forge">{result.complexity || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Confidence</span>
                  <span className="text-xs font-mono font-semibold text-forge">{result.confidence || 0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Sources</span>
                  <span className="text-xs font-mono font-semibold">{result.execution_state?.evidence?.sources_found?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Logic Quality</span>
                  <span className="text-xs font-mono font-semibold">{(result.execution_state?.referee?.logic_quality_score * 100 || 0).toFixed(0)}%</span>
                </div>
              </div>
            </SidebarCard>
          )}

          <SidebarCard title="Memory Graph" icon={Network} link>
            <div className="relative h-32 rounded-lg overflow-hidden grid-bg">
              <MiniGraph />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-mono">
                {result?.execution_state?.memory?.matches_found || 0} related debates
              </span>
              <TrendingUp className="w-3.5 h-3.5 text-forge" />
            </div>
          </SidebarCard>
        </aside>
      </div>
      </>
      )}
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 last:mb-0">
      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">{title}</div>
      {children}
    </div>
  );
}

function SignalRow({ text, weight, color }: { text: string; weight: number; color: "forge" | "violet" }) {
  const bar = color === "forge" ? "bg-gradient-forge" : "bg-gradient-primary";
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40">
      <div className="flex-1 text-sm text-foreground/90">{text}</div>
      <div className="w-16 shrink-0 mt-1.5">
        <div className="h-1 rounded-full bg-muted overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${weight * 100}%` }} transition={{ duration: 1 }} className={`h-full ${bar}`} />
        </div>
        <div className="text-[10px] font-mono text-right mt-1 text-muted-foreground">{(weight * 100).toFixed(0)}%</div>
      </div>
    </div>
  );
}

function ConfidenceDial({ value }: { value: number }) {
  const r = 28; const c = 2 * Math.PI * r;
  return (
    <div className="relative w-20 h-20 shrink-0">
      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
        <circle cx="40" cy="40" r={r} stroke="oklch(0.25 0.03 270)" strokeWidth="6" fill="none" />
        <motion.circle
          cx="40" cy="40" r={r} stroke="url(#dialGrad)" strokeWidth="6" fill="none" strokeLinecap="round"
          initial={{ strokeDasharray: c, strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * value) / 100 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="dialGrad">
            <stop offset="0%" stopColor="oklch(0.7 0.2 240)" />
            <stop offset="100%" stopColor="oklch(0.74 0.18 55)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-display font-semibold">{value}</span>
        <span className="text-[9px] font-mono text-muted-foreground">CONF</span>
      </div>
    </div>
  );
}

function SidebarCard({ title, icon: Icon, link, children }: { title: string; icon: any; link?: boolean; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-forge" />
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{title}</span>
        </div>
        {link && <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />}
      </div>
      {children}
    </div>
  );
}

function MiniGraph() {
  const nodes = [
    { x: 20, y: 50 }, { x: 50, y: 30 }, { x: 80, y: 50 },
    { x: 35, y: 75 }, { x: 65, y: 75 }, { x: 50, y: 55 },
  ];
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {nodes.map((n, i) =>
        nodes.slice(i + 1).map((m, j) => (
          <line key={`${i}-${j}`} x1={n.x} y1={n.y} x2={m.x} y2={m.y} stroke="oklch(0.65 0.22 280 / 0.3)" strokeWidth="0.4" />
        ))
      )}
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r="2.4" fill={i === 5 ? "oklch(0.74 0.18 55)" : "oklch(0.7 0.2 240)"} />
      ))}
    </svg>
  );
}

function BusinessDashboard() {
  const chartData = [
    { name: 'Mon', queries: 400, agents: 2400 },
    { name: 'Tue', queries: 300, agents: 1398 },
    { name: 'Wed', queries: 200, agents: 9800 },
    { name: 'Thu', queries: 278, agents: 3908 },
    { name: 'Fri', queries: 189, agents: 4800 },
    { name: 'Sat', queries: 239, agents: 3800 },
    { name: 'Sun', queries: 349, agents: 4300 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-4">
        {[
          { label: "Total Debates", value: "2,491", inc: "+12%", icon: Scale },
          { label: "Active Team Members", value: "8/10", inc: "+1", icon: Users },
          { label: "Memory Nodes Forged", value: "14.2k", inc: "+8%", icon: Brain },
          { label: "Avg Synthesis Time", value: "12.4s", inc: "-1.2s", icon: Clock },
        ].map((stat, i) => (
          <div key={i} className="glass rounded-2xl p-5">
            <div className="flex justify-between items-start mb-2">
              <stat.icon className="w-5 h-5 text-forge" />
              <span className="text-xs font-mono text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">{stat.inc}</span>
            </div>
            <div className="text-3xl font-display font-semibold mt-4">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6 h-[340px] flex flex-col">
            <h3 className="text-sm font-display font-semibold mb-4">Organization Usage Analytics</h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                  <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.2)' }} />
                  <Line type="monotone" dataKey="queries" stroke="oklch(0.7 0.2 240)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="agents" stroke="oklch(0.74 0.18 55)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="text-sm font-display font-semibold mb-4">Shared Team Debates</h3>
            <div className="space-y-3">
              {[
                { q: "Is our Q4 marketing strategy viable?", user: "Sarah Jenkins", time: "10m ago" },
                { q: "Should we migrate to AWS or GCP?", user: "David Chen", time: "2h ago" },
                { q: "Evaluate acquisition of startup X", user: "Marcus West", time: "1d ago" },
              ].map((d, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold">{d.user[0]}</div>
                    <div>
                      <div className="text-sm font-medium">{d.q}</div>
                      <div className="text-xs text-muted-foreground">Forged by {d.user}</div>
                    </div>
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">{d.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <SidebarCard title="Org Memory Graph" icon={Network} link>
            <div className="relative h-40 rounded-lg overflow-hidden grid-bg">
              <MiniGraph />
            </div>
            <div className="mt-4 text-xs text-muted-foreground text-center">
              Your team's federated reasoning graph contains over 14,000 synthesized nodes.
            </div>
            <button className="mt-4 w-full py-2 bg-secondary rounded-lg text-sm font-medium hover:bg-secondary/80 transition">
              Explore Graph
            </button>
          </SidebarCard>

          <SidebarCard title="Team Activity" icon={Activity}>
            <div className="space-y-4 mt-2">
              {[
                "Sarah added a new claim to Q4 debate",
                "David connected memory node #422",
                "Marcus upgraded organization to Enterprise",
                "Maya exported strategy report"
              ].map((act, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-forge mt-1.5 shrink-0" />
                  <div className="text-sm text-foreground/80">{act}</div>
                </div>
              ))}
            </div>
          </SidebarCard>
        </aside>
      </div>
    </div>
  );
}
