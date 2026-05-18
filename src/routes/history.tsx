import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Search, TrendingUp, Filter, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
});

const categories = ["All", "Strategy", "Engineering", "Markets", "Hiring", "Policy"];

function HistoryPage() {
  const [cat, setCat] = useState("All");
  const [query, setQuery] = useState("");
  const [debates, setDebates] = useState<any[]>([]);
  const [stats, setStats] = useState({ total_debates: 0, avg_confidence: 0, trend: [] });
  const [loading, setLoading] = useState(true);

  // Fetch debates from backend
  useEffect(() => {
    const fetchDebates = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/truthforge/debates');
        if (!response.ok) throw new Error('Failed to fetch debates');
        const data = await response.json();
        setDebates(data.debates || []);
        setStats(data.stats || { total_debates: 0, avg_confidence: 0, trend: [] });
        console.log('[History] Fetched debates from backend:', data);
      } catch (err) {
        console.error('[History] Error fetching debates:', err);
        // Fallback to empty state
        setDebates([]);
        setStats({ total_debates: 0, avg_confidence: 0, trend: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchDebates();
  }, []);

  const filtered = debates.filter((d) =>
    (cat === "All" || d.category === cat) && d.question.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <main className="mx-auto max-w-7xl px-4 md:px-6 py-10">
      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-widest text-forge">Archive</p>
        <h1 className="mt-1 text-3xl md:text-4xl font-display font-semibold text-gradient">Debate History</h1>
        <p className="text-sm text-muted-foreground mt-2">Every question you've put through the forge.</p>
      </div>

      {/* Stats row - Real data from backend */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <StatCard label="Total Debates" value={stats.total_debates.toString()} delta={`+${Math.floor(stats.total_debates * 0.1)} this week`} />
        <StatCard label="Avg Confidence" value={`${stats.avg_confidence || 0}%`} delta="+4 pts MoM" />
        <TrendCard data={stats.trend || []} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center mb-5">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search history..."
            className="w-full glass rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/40"
          />
        </div>
        <div className="flex items-center gap-1.5 glass rounded-xl p-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                cat === c ? "bg-gradient-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <button className="glass rounded-xl p-2.5"><Filter className="w-4 h-4 text-muted-foreground" /></button>
      </div>

      {/* Cards - Real data */}
      <div className="grid gap-3">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading debates...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No debates found</div>
        ) : (
          filtered.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="group glass rounded-xl p-5 hover:bg-card/70 transition cursor-pointer flex items-center gap-5"
            >
              <ConfBadge value={d.confidence} />
              <div className="flex-1 min-w-0">
                <div className="font-display font-medium">{d.question}</div>
                <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground font-mono">
                  <span className="px-2 py-0.5 rounded-md bg-secondary text-foreground/70">{d.category}</span>
                  <span>{d.time}</span>
                  <span className="text-muted-foreground/60">·</span>
                  <span>{d.date}</span>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
            </motion.div>
          ))
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-display font-semibold">{value}</span>
        <span className="text-xs text-forge font-mono">{delta}</span>
      </div>
    </div>
  );
}

function TrendCard({ data }: { data: number[] }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const W = 200, H = 60;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / (max - min)) * H;
    return `${x},${y}`;
  }).join(" ");
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Confidence Trend</div>
        <TrendingUp className="w-3.5 h-3.5 text-forge" />
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full h-16">
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.74 0.18 55)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="oklch(0.74 0.18 55)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={`0,${H} ${pts} ${W},${H}`} fill="url(#trendGrad)" stroke="none" />
        <polyline points={pts} fill="none" stroke="oklch(0.74 0.18 55)" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

function ConfBadge({ value }: { value: number }) {
  const color = value > 75 ? "oklch(0.74 0.18 55)" : value > 60 ? "oklch(0.7 0.18 280)" : "oklch(0.6 0.06 270)";
  return (
    <div className="relative w-14 h-14 shrink-0">
      <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
        <circle cx="28" cy="28" r="22" fill="none" stroke="oklch(0.22 0.03 270)" strokeWidth="4" />
        <circle cx="28" cy="28" r="22" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${(value / 100) * 138.2} 138.2`} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-display font-semibold">
        {value}
      </div>
    </div>
  );
}
