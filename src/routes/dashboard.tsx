import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Search, Sparkles, Check, Loader2, Brain, Network, FileSearch,
  Scale, Gavel, Layers, TrendingUp, Bookmark, Clock, ChevronRight, ArrowUpRight,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

const agentPipeline = [
  { key: "planner", label: "Planner Activated", icon: Layers, detail: "Decomposing query into 4 sub-claims" },
  { key: "memory", label: "Memory Retrieved", icon: Brain, detail: "3 related debates found in graph" },
  { key: "evidence", label: "Evidence Searching", icon: FileSearch, detail: "Scanning 218 sources" },
  { key: "thesis", label: "Thesis Generated", icon: Network, detail: "Strong position drafted" },
  { key: "antithesis", label: "Antithesis Generated", icon: Scale, detail: "Counterarguments compiled" },
  { key: "referee", label: "Referee Evaluating", icon: Gavel, detail: "Weighing argument strength" },
  { key: "synthesis", label: "Synthesis Complete", icon: Sparkles, detail: "Final answer forged" },
];

const recentDebates = [
  { q: "Will AI replace software engineers?", conf: 72, time: "12m" },
  { q: "Is the EU AI Act enforceable extraterritorially?", conf: 64, time: "1h" },
  { q: "Are LLMs reasoning or interpolating?", conf: 51, time: "3h" },
  { q: "Should we adopt SSR for our admin?", conf: 88, time: "1d" },
];

const savedTopics = ["AI Strategy", "Hiring Decisions", "Architecture", "Market Bets"];

const sampleAnalysis = {
  question: "Will AI replace software engineers?",
  analysis:
    "The question conflates two distinct timeframes and two distinct skill clusters. In the short term (2-4 years), AI will replace specific tasks — boilerplate generation, test scaffolding, routine refactors — but not the role itself. In the longer term, the bottleneck shifts from code-writing to specification, system design, and adversarial review of AI output. Engineers who treat AI as a code-completion tool will be displaced; those who become orchestrators of AI agents will compound their leverage.",
  signals: [
    { text: "GitHub Copilot adoption correlates with 55% faster task completion (2024 study, n=2k)", weight: 0.82 },
    { text: "Job postings for ML/AI engineers grew 74% YoY while general SWE roles declined 8%", weight: 0.74 },
    { text: "Stack Overflow developer count down 14%, but median compensation up 9%", weight: 0.61 },
  ],
  counters: [
    { text: "Historical automation predictions (low-code, no-code) over-estimated displacement by 3-5x", weight: 0.7 },
    { text: "LLMs still fail on novel system design at staff+ complexity (HumanEval-X benchmark)", weight: 0.66 },
  ],
  confidence: 72,
  answer:
    "Replacement is the wrong frame. AI will collapse the bottom of the software profession and raise the ceiling for the top. Within 5 years, expect a barbell market: fewer mid-level roles, more senior orchestrators, and a new class of 'AI-native' generalists. Bet on becoming the latter.",
};

function Dashboard() {
  const [stage, setStage] = useState(-1);
  const [showResult, setShowResult] = useState(true);
  const [query, setQuery] = useState("Will AI replace software engineers?");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    setStage(-1);
    setShowResult(false);
    const timers: number[] = [];
    agentPipeline.forEach((_, i) => {
      timers.push(window.setTimeout(() => setStage(i), 400 + i * 700));
    });
    timers.push(window.setTimeout(() => { setShowResult(true); setRunning(false); }, 400 + agentPipeline.length * 700 + 400));
    return () => timers.forEach(clearTimeout);
  }, [running]);

  function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    setRunning(true);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 md:px-6 py-10">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-forge">Workspace</p>
          <h1 className="mt-1 text-3xl md:text-4xl font-display font-semibold text-gradient">
            Forge a new debate
          </h1>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-forge animate-pulse" />
          7 agents online
        </div>
      </div>

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
            disabled={running}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-medium glow-primary disabled:opacity-60"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {running ? "Forging" : "Forge"}
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
              <div className="text-xs font-mono text-muted-foreground">
                {stage === -1 ? "idle" : stage >= agentPipeline.length - 1 ? "complete" : "running"}
              </div>
            </div>
            <div className="space-y-2">
              {agentPipeline.map((a, i) => {
                const status = running ? (stage >= i ? "done" : stage === i - 1 ? "active" : "pending") :
                               stage >= i ? "done" : "pending";
                const active = running && stage === i - 1;
                return (
                  <motion.div
                    key={a.key}
                    initial={false}
                    animate={{ opacity: status === "pending" ? 0.4 : 1 }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-secondary/40"
                  >
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                      status === "done" ? "bg-forge/20 text-forge" :
                      active ? "bg-primary/20 text-primary-foreground" : "bg-muted/40 text-muted-foreground"
                    }`}>
                      {status === "done" ? <Check className="w-3.5 h-3.5" /> :
                       active ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                       <a.icon className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{a.label}</div>
                      <div className="text-xs text-muted-foreground truncate">{a.detail}</div>
                    </div>
                    {status === "done" && <span className="text-[10px] font-mono text-forge">✓</span>}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Output */}
          <AnimatePresence>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-strong border-gradient rounded-2xl p-7"
              >
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-widest text-forge mb-2">Intelligence Report</p>
                    <h2 className="text-2xl font-display font-semibold">{sampleAnalysis.question}</h2>
                  </div>
                  <ConfidenceDial value={sampleAnalysis.confidence} />
                </div>

                <Section title="Analysis">
                  <p className="text-sm leading-relaxed text-foreground/90">{sampleAnalysis.analysis}</p>
                </Section>

                <Section title="Supporting Signals">
                  <div className="space-y-2">
                    {sampleAnalysis.signals.map((s, i) => (
                      <SignalRow key={i} text={s.text} weight={s.weight} color="forge" />
                    ))}
                  </div>
                </Section>

                <Section title="Counterarguments">
                  <div className="space-y-2">
                    {sampleAnalysis.counters.map((s, i) => (
                      <SignalRow key={i} text={s.text} weight={s.weight} color="violet" />
                    ))}
                  </div>
                </Section>

                <Section title="Final Answer">
                  <div className="relative rounded-xl p-5 bg-gradient-to-br from-primary/10 to-forge/10 border border-border/50">
                    <Sparkles className="w-4 h-4 text-forge absolute top-4 right-4" />
                    <p className="text-sm leading-relaxed">{sampleAnalysis.answer}</p>
                  </div>
                </Section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <SidebarCard title="Recent Debates" icon={Clock}>
            <ul className="space-y-2">
              {recentDebates.map((d) => (
                <li key={d.q} className="group flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent/50 cursor-pointer transition">
                  <div className="text-xs font-mono font-semibold w-9 shrink-0 mt-0.5"
                       style={{ color: d.conf > 75 ? "oklch(0.74 0.18 55)" : d.conf > 60 ? "oklch(0.7 0.18 280)" : "oklch(0.65 0.04 270)" }}>
                    {d.conf}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs leading-snug text-foreground/90 line-clamp-2">{d.q}</div>
                    <div className="text-[10px] font-mono text-muted-foreground mt-1">{d.time} ago</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition mt-1" />
                </li>
              ))}
            </ul>
          </SidebarCard>

          <SidebarCard title="Saved Topics" icon={Bookmark}>
            <div className="flex flex-wrap gap-1.5">
              {savedTopics.map((t) => (
                <span key={t} className="text-xs px-2.5 py-1 rounded-md bg-secondary text-foreground/80">{t}</span>
              ))}
            </div>
          </SidebarCard>

          <SidebarCard title="Memory Graph" icon={Network} link>
            <div className="relative h-32 rounded-lg overflow-hidden grid-bg">
              <MiniGraph />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-mono">128 nodes · 412 edges</span>
              <TrendingUp className="w-3.5 h-3.5 text-forge" />
            </div>
          </SidebarCard>
        </aside>
      </div>
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
