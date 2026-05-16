import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight, Play, Brain, Network, ShieldCheck, Sparkles, Scale, History,
  Compass, Quote, Check, Plus, Minus,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: Landing,
});

const agents = [
  { name: "Planner", angle: 0, color: "from-blue-400 to-indigo-500" },
  { name: "Memory", angle: 60, color: "from-indigo-400 to-violet-500" },
  { name: "Thesis", angle: 120, color: "from-violet-400 to-fuchsia-500" },
  { name: "Antithesis", angle: 180, color: "from-fuchsia-400 to-pink-500" },
  { name: "Evidence", angle: 240, color: "from-cyan-400 to-blue-500" },
  { name: "Referee", angle: 300, color: "from-orange-400 to-amber-500" },
];

function HeroOrbit() {
  return (
    <div className="relative mx-auto mt-16 h-[460px] w-full max-w-2xl">
      <div className="absolute inset-0 grid-bg" />
      {/* orbit rings */}
      {[140, 200, 260].map((r) => (
        <div
          key={r}
          className="absolute left-1/2 top-1/2 rounded-full border border-border/50"
          style={{ width: r * 2, height: r * 2, transform: "translate(-50%, -50%)" }}
        />
      ))}
      {/* center core */}
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
      >
        <div className="relative w-24 h-24 rounded-2xl bg-gradient-forge flex items-center justify-center glow-forge">
          <div className="absolute inset-0 rounded-2xl bg-gradient-forge blur-xl opacity-50" />
          <Sparkles className="w-9 h-9 text-forge-foreground relative" strokeWidth={2.2} />
        </div>
        <div className="mt-3 text-center text-xs font-mono text-muted-foreground">SYNTHESIS</div>
      </motion.div>

      {/* SVG lines */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 460">
        {agents.map((a, i) => {
          const rad = (a.angle * Math.PI) / 180;
          const x = 300 + Math.cos(rad) * 200;
          const y = 230 + Math.sin(rad) * 160;
          return (
            <motion.line
              key={i}
              x1={300} y1={230} x2={x} y2={y}
              stroke="url(#beam)"
              strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0.2, 0.8, 0.2] }}
              transition={{ duration: 3, delay: i * 0.3, repeat: Infinity }}
            />
          );
        })}
        <defs>
          <linearGradient id="beam" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.7 0.2 240)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="oklch(0.62 0.24 295)" stopOpacity="0.3" />
          </linearGradient>
        </defs>
      </svg>

      {/* agent nodes */}
      {agents.map((a, i) => {
        const rad = (a.angle * Math.PI) / 180;
        const x = 50 + Math.cos(rad) * 33.5;
        const y = 50 + Math.sin(rad) * 33.5;
        return (
          <motion.div
            key={a.name}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.1, type: "spring" }}
            className="absolute"
            style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
          >
            <div className="relative group">
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${a.color} blur-md opacity-50`} />
              <div className="relative glass-strong w-16 h-16 rounded-xl flex items-center justify-center pulse-glow">
                <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${a.color}`} />
              </div>
              <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                {a.name}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`mx-auto max-w-7xl px-6 py-24 ${className}`}>{children}</section>;
}

const features = [
  { icon: Network, title: "Multi-Agent Debate", desc: "Thesis and Antithesis agents argue both sides before a Referee weighs in." },
  { icon: Brain, title: "Memory Graph", desc: "Every conclusion is persisted as a navigable node in your reasoning graph." },
  { icon: ShieldCheck, title: "Evidence-Based", desc: "Claims are validated against real sources, not the model's gut feeling." },
  { icon: Compass, title: "Autonomous Planning", desc: "The Planner agent decomposes complex questions into testable sub-claims." },
  { icon: Scale, title: "Devil's Advocate", desc: "Force adversarial review of any conclusion to surface hidden weaknesses." },
  { icon: History, title: "Historical Reasoning", desc: "Replay past debates and watch how confidence evolved over time." },
];

const steps = [
  { label: "User Question", desc: "You ask. Anything hard." },
  { label: "Planner", desc: "Decomposes the problem." },
  { label: "Debate Agents", desc: "Thesis vs Antithesis." },
  { label: "Evidence", desc: "Sources retrieved & ranked." },
  { label: "Referee", desc: "Arguments scored." },
  { label: "Synthesis", desc: "One stronger answer." },
];

const testimonials = [
  { quote: "Finally an AI that disagrees with me when I'm wrong. The Devil's Advocate alone has saved us from two bad bets.", name: "Maya Chen", role: "Partner, Helix Capital" },
  { quote: "TruthForge replaced our three-hour strategy debates. Same quality, ten minutes.", name: "Daniel Park", role: "VP Strategy, Northwind" },
  { quote: "It's the first model output I trust enough to ship without re-reading.", name: "Imani Okafor", role: "Principal Researcher, Atlas Labs" },
];

const plans = [
  { name: "Free", price: "$0", desc: "Basic reasoning for curious minds.", features: ["50 debates / month", "3 agents per debate", "7-day memory", "Public graph"], cta: "Get started" },
  { name: "Pro", price: "$29", desc: "Advanced agent orchestration.", features: ["Unlimited debates", "All 7 agents", "Persistent memory graph", "Devil's Advocate mode", "Export to PDF"], cta: "Start Pro", featured: true },
  { name: "Teams", price: "$89", desc: "Shared memory across your team.", features: ["Everything in Pro", "Shared workspaces", "Memory federation", "SSO & audit log", "Priority compute"], cta: "Contact sales" },
];

const faqs = [
  { q: "What makes TruthForge different from ChatGPT?", a: "Single LLMs are trained to be helpful, which means agreeable. TruthForge runs an adversarial pipeline — your answer survived a structured debate, not a sympathetic one." },
  { q: "Which models power the agents?", a: "We orchestrate frontier models (GPT, Claude, Gemini) and route each agent to the model best suited for its role. You never pick the model — the Planner does." },
  { q: "Is my data used for training?", a: "No. Your debates, memory graph, and uploaded evidence are private by default and never leave your workspace." },
  { q: "Can I see why the system reached a conclusion?", a: "Every synthesis is backed by the full debate transcript, evidence trail, and a confidence score with the Referee's reasoning." },
];

function Landing() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <main className="relative">
      {/* HERO */}
      <Section className="!pt-16 !pb-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 glass rounded-full px-3.5 py-1.5 text-xs font-mono"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-forge animate-pulse" />
          <span className="text-muted-foreground">Autonomous reasoning engine</span>
          <span className="text-forge">v2.4</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-6 text-5xl md:text-7xl font-semibold tracking-tighter"
        >
          <span className="text-gradient">Challenge Ideas.</span>
          <br />
          <span className="text-gradient-forge">Forge Truth.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.7 }}
          className="mt-6 mx-auto max-w-2xl text-lg text-muted-foreground"
        >
          Autonomous agents debate, validate, remember, and synthesize stronger answers.
          AI systems optimize for agreement. TruthForge optimizes for challenged truth.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <Link to="/dashboard" className="group inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-medium glow-primary hover:scale-[1.02] transition">
            Try TruthForge <ArrowRight className="w-4 h-4 transition group-hover:translate-x-0.5" />
          </Link>
          <button className="inline-flex items-center gap-2 px-5 py-3 rounded-xl glass-strong hover:bg-accent transition font-medium">
            <Play className="w-4 h-4 text-forge" /> Watch Demo
          </button>
        </motion.div>

        <HeroOrbit />
      </Section>

      {/* HOW IT WORKS */}
      <Section>
        <div className="text-center mb-14">
          <p className="text-xs font-mono uppercase tracking-widest text-forge">The Pipeline</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-semibold text-gradient">How Truth Gets Forged</h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Six specialized agents move your question through a deliberate, auditable pipeline.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="relative glass rounded-xl p-5"
            >
              <div className="font-mono text-xs text-forge mb-2">0{i + 1}</div>
              <div className="font-display font-semibold text-base">{s.label}</div>
              <div className="text-xs text-muted-foreground mt-1.5">{s.desc}</div>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                  <ArrowRight className="w-4 h-4 text-muted-foreground/40" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </Section>

      {/* FEATURES */}
      <Section>
        <div className="text-center mb-14">
          <p className="text-xs font-mono uppercase tracking-widest text-forge">Capabilities</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-semibold text-gradient">Built for Hard Questions</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group relative glass rounded-2xl p-6 hover:bg-card/60 transition"
            >
              <div className="inline-flex w-11 h-11 rounded-xl bg-gradient-primary items-center justify-center glow-primary mb-4">
                <f.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* TESTIMONIALS */}
      <Section>
        <div className="text-center mb-14">
          <p className="text-xs font-mono uppercase tracking-widest text-forge">Operators trust it</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-semibold text-gradient">When the answer matters</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-7"
            >
              <Quote className="w-6 h-6 text-forge mb-4" />
              <p className="text-sm leading-relaxed text-foreground/90">"{t.quote}"</p>
              <div className="mt-5 pt-5 border-t border-border/60">
                <div className="font-medium text-sm">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* PRICING */}
      <Section>
        <div className="text-center mb-14">
          <p className="text-xs font-mono uppercase tracking-widest text-forge">Pricing</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-semibold text-gradient">Forge at your scale</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3 max-w-5xl mx-auto">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl p-7 ${p.featured ? "glass-strong border-gradient glow-primary" : "glass"}`}
            >
              {p.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-forge text-forge-foreground text-[10px] font-mono uppercase tracking-wider">
                  Most popular
                </div>
              )}
              <div className="font-display font-semibold text-lg">{p.name}</div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-display font-semibold">{p.price}</span>
                <span className="text-muted-foreground text-sm">/mo</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{p.desc}</p>
              <ul className="mt-6 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-forge mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/pricing"
                className={`mt-7 w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-medium text-sm transition ${
                  p.featured
                    ? "bg-gradient-primary text-primary-foreground hover:opacity-90"
                    : "glass-strong hover:bg-accent"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section>
        <div className="text-center mb-14">
          <p className="text-xs font-mono uppercase tracking-widest text-forge">FAQ</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-semibold text-gradient">Honest answers</h2>
        </div>
        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="glass rounded-xl overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <span className="font-medium">{f.q}</span>
                {open === i ? <Minus className="w-4 h-4 text-forge" /> : <Plus className="w-4 h-4 text-muted-foreground" />}
              </button>
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="px-5 pb-5 text-sm text-muted-foreground"
                >
                  {f.a}
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section className="!pb-32">
        <div className="relative glass-strong rounded-3xl p-12 md:p-16 text-center overflow-hidden">
          <div className="absolute inset-0 grid-bg opacity-50" />
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-forge rounded-full blur-3xl opacity-20" />
          <div className="relative">
            <h2 className="text-4xl md:text-5xl font-display font-semibold text-gradient">
              Stop accepting easy answers.
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Join the operators, founders, and researchers using TruthForge to interrogate their hardest decisions.
            </p>
            <Link to="/dashboard" className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-medium glow-primary hover:scale-[1.02] transition">
              Launch Workspace <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </Section>
    </main>
  );
}
