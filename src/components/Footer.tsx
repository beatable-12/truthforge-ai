import { Link } from "@tanstack/react-router";
import { Flame, Github, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-32 border-t border-border/60">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="bg-gradient-forge w-8 h-8 rounded-lg flex items-center justify-center">
                <Flame className="w-4 h-4 text-forge-foreground" strokeWidth={2.5} />
              </div>
              <span className="font-display font-semibold">TruthForge AI</span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              AI systems optimize for agreement. TruthForge optimizes for challenged truth.
            </p>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-mono">Product</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link to="/dashboard" className="hover:text-foreground text-muted-foreground">Workspace</Link></li>
              <li><Link to="/graph" className="hover:text-foreground text-muted-foreground">Debate Graph</Link></li>
              <li><Link to="/pricing" className="hover:text-foreground text-muted-foreground">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-mono">Connect</h4>
            <div className="mt-4 flex gap-3">
              <a className="text-muted-foreground hover:text-foreground" href="#"><Twitter className="w-4 h-4" /></a>
              <a className="text-muted-foreground hover:text-foreground" href="#"><Github className="w-4 h-4" /></a>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-border/60 flex flex-wrap justify-between gap-3 text-xs text-muted-foreground font-mono">
          <span>© 2026 TruthForge Labs</span>
          <span>Forging truth, one debate at a time.</span>
        </div>
      </div>
    </footer>
  );
}
