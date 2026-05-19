import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';
import { Search, Brain, Clock, ChevronRight } from 'lucide-react';

export const Route = createFileRoute('/memory')({
  component: MemoryPage,
});

function MemoryPage() {
  const { user } = useAuth();

  if (!user) return null; // AuthWrapper redirects

  return (
    <main className="mx-auto max-w-7xl px-4 md:px-6 py-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-forge">Memory Graph</p>
          <h1 className="mt-1 text-3xl md:text-4xl font-display font-semibold text-gradient">
            Historical Reasoning
          </h1>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search memory..."
            className="w-full bg-secondary/50 border border-border/50 rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-forge/50 transition"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {[
            { q: "Is open-source AI fundamentally safer than closed-source models?", conf: 82, date: "2 days ago" },
            { q: "Will the current trajectory of LLM scaling hit a wall before AGI?", conf: 68, date: "5 days ago" },
            { q: "Should we prioritize RAG or fine-tuning for internal knowledge?", conf: 91, date: "1 week ago" },
            { q: "Does remote work permanently decrease enterprise productivity?", conf: 55, date: "2 weeks ago" },
          ].map((item, i) => (
            <div key={i} className="glass rounded-xl p-5 group cursor-pointer hover:bg-secondary/40 transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-forge/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Brain className="w-4 h-4 text-forge" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground/90 group-hover:text-forge transition">{item.q}</h3>
                    <div className="flex items-center gap-3 mt-2 text-xs font-mono text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {item.date}
                      </span>
                      <span>Confidence: {item.conf}%</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-foreground transition mt-1" />
              </div>
            </div>
          ))}
        </div>

        <aside className="space-y-6">
          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-display font-semibold mb-4">Graph Statistics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Nodes</span>
                <span className="font-mono text-sm font-semibold text-forge">142</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Connections</span>
                <span className="font-mono text-sm font-semibold text-forge">318</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg Confidence</span>
                <span className="font-mono text-sm font-semibold text-forge">76%</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
