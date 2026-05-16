import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Maximize2, ZoomIn, ZoomOut, Layers3 } from "lucide-react";

export const Route = createFileRoute("/graph")({
  component: GraphPage,
});

type NodeType = "topic" | "question" | "claim" | "counter" | "evidence" | "verdict";

interface GNode {
  id: string;
  label: string;
  type: NodeType;
  x: number; // 0-100
  y: number; // 0-100
  detail?: string;
}

const nodes: GNode[] = [
  { id: "t1", label: "AI & Software", type: "topic", x: 50, y: 12 },
  { id: "q1", label: "Will AI replace SWEs?", type: "question", x: 50, y: 30, detail: "Original debate question" },
  { id: "c1", label: "Yes, by 2030", type: "claim", x: 22, y: 50, detail: "Thesis position" },
  { id: "c2", label: "Augments, not replaces", type: "counter", x: 78, y: 50, detail: "Antithesis position" },
  { id: "e1", label: "Copilot +55% speed", type: "evidence", x: 10, y: 72 },
  { id: "e2", label: "Job postings -8% YoY", type: "evidence", x: 30, y: 78 },
  { id: "e3", label: "Low-code prior failed", type: "evidence", x: 70, y: 78 },
  { id: "e4", label: "HumanEval-X plateau", type: "evidence", x: 90, y: 72 },
  { id: "v1", label: "Barbell market emerges", type: "verdict", x: 50, y: 92, detail: "Synthesis verdict · 72% confidence" },
];

const edges: [string, string][] = [
  ["t1", "q1"],
  ["q1", "c1"], ["q1", "c2"],
  ["c1", "e1"], ["c1", "e2"],
  ["c2", "e3"], ["c2", "e4"],
  ["c1", "v1"], ["c2", "v1"],
];

const typeStyles: Record<NodeType, { color: string; ring: string; label: string }> = {
  topic:    { color: "bg-gradient-forge text-forge-foreground", ring: "ring-forge/40", label: "TOPIC" },
  question: { color: "bg-gradient-primary text-primary-foreground", ring: "ring-primary/40", label: "QUESTION" },
  claim:    { color: "bg-blue-500/20 text-blue-200 border border-blue-400/30", ring: "ring-blue-400/30", label: "CLAIM" },
  counter:  { color: "bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-400/30", ring: "ring-fuchsia-400/30", label: "COUNTERCLAIM" },
  evidence: { color: "bg-cyan-500/15 text-cyan-200 border border-cyan-400/25", ring: "ring-cyan-400/25", label: "EVIDENCE" },
  verdict:  { color: "bg-gradient-forge text-forge-foreground", ring: "ring-forge/50", label: "VERDICT" },
};

function GraphPage() {
  const [selected, setSelected] = useState<GNode | null>(nodes[1]);

  return (
    <main className="mx-auto max-w-7xl px-4 md:px-6 py-10">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-forge">Memory Graph</p>
          <h1 className="mt-1 text-3xl md:text-4xl font-display font-semibold text-gradient">Debate Topology</h1>
          <p className="text-sm text-muted-foreground mt-2">Every claim, counter, and verdict — one navigable graph.</p>
        </div>
        <div className="hidden md:flex items-center gap-1 glass rounded-xl p-1">
          <button className="p-2 hover:bg-accent rounded-lg"><ZoomIn className="w-4 h-4" /></button>
          <button className="p-2 hover:bg-accent rounded-lg"><ZoomOut className="w-4 h-4" /></button>
          <button className="p-2 hover:bg-accent rounded-lg"><Maximize2 className="w-4 h-4" /></button>
          <button className="p-2 hover:bg-accent rounded-lg"><Layers3 className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        {/* Graph canvas */}
        <div className="relative glass-strong rounded-2xl overflow-hidden h-[640px]">
          <div className="absolute inset-0 grid-bg" />
          <div className="absolute top-0 left-0 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-forge/20 rounded-full blur-3xl" />

          {/* SVG edges */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="oklch(0.7 0.2 240)" stopOpacity="0.6" />
                <stop offset="100%" stopColor="oklch(0.74 0.18 55)" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            {edges.map(([a, b], i) => {
              const A = nodes.find((n) => n.id === a)!;
              const B = nodes.find((n) => n.id === b)!;
              return (
                <motion.line
                  key={i}
                  x1={A.x} y1={A.y} x2={B.x} y2={B.y}
                  stroke="url(#edgeGrad)"
                  strokeWidth="0.18"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
            {/* Pulses along edges */}
            {edges.slice(0, 5).map(([a, b], i) => {
              const A = nodes.find((n) => n.id === a)!;
              const B = nodes.find((n) => n.id === b)!;
              return (
                <motion.circle
                  key={`p-${i}`}
                  r="0.5"
                  fill="oklch(0.74 0.18 55)"
                  initial={{ cx: A.x, cy: A.y, opacity: 0 }}
                  animate={{ cx: [A.x, B.x], cy: [A.y, B.y], opacity: [0, 1, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {nodes.map((n, i) => {
            const t = typeStyles[n.type];
            const isSel = selected?.id === n.id;
            return (
              <motion.button
                key={n.id}
                onClick={() => setSelected(n)}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.06, type: "spring" }}
                whileHover={{ scale: 1.08 }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group"
                style={{ left: `${n.x}%`, top: `${n.y}%` }}
              >
                <div className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap ${t.color} ${isSel ? `ring-2 ${t.ring}` : ""} shadow-lg transition`}>
                  {n.label}
                </div>
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition">
                  {t.label}
                </div>
              </motion.button>
            );
          })}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 glass rounded-xl px-3 py-2 flex gap-3 text-[10px] font-mono">
            <LegendDot color="bg-gradient-forge" label="Topic / Verdict" />
            <LegendDot color="bg-gradient-primary" label="Question" />
            <LegendDot color="bg-blue-400" label="Claim" />
            <LegendDot color="bg-fuchsia-400" label="Counter" />
            <LegendDot color="bg-cyan-400" label="Evidence" />
          </div>
        </div>

        {/* Detail panel */}
        <aside className="glass rounded-2xl p-5 h-fit sticky top-24">
          {selected ? (
            <>
              <div className="text-xs font-mono uppercase tracking-widest text-forge">
                {typeStyles[selected.type].label}
              </div>
              <h3 className="mt-2 text-lg font-display font-semibold">{selected.label}</h3>
              {selected.detail && <p className="mt-2 text-sm text-muted-foreground">{selected.detail}</p>}

              <div className="mt-5 pt-5 border-t border-border/60">
                <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Connections</div>
                <ul className="space-y-1.5">
                  {edges
                    .filter(([a, b]) => a === selected.id || b === selected.id)
                    .map(([a, b], i) => {
                      const other = a === selected.id ? b : a;
                      const node = nodes.find((n) => n.id === other)!;
                      return (
                        <li key={i}>
                          <button onClick={() => setSelected(node)} className="w-full text-left text-xs flex items-center gap-2 p-2 rounded-md hover:bg-accent transition">
                            <span className="w-1.5 h-1.5 rounded-full bg-forge" />
                            <span className="flex-1">{node.label}</span>
                            <span className="font-mono text-muted-foreground text-[10px]">{typeStyles[node.type].label}</span>
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Select a node to inspect.</p>
          )}
        </aside>
      </div>
    </main>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
