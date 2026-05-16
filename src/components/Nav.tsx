import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { LogoMark } from "./LogoMark";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/dashboard", label: "Workspace" },
  { to: "/graph", label: "Debate Graph" },
  { to: "/history", label: "History" },
  { to: "/pricing", label: "Pricing" },
];

export function Nav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 w-full"
    >
      <div className="mx-auto mt-3 max-w-7xl px-4">
        <div className="glass-strong flex items-center justify-between rounded-2xl px-4 py-2.5">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-primary rounded-lg blur-md opacity-40 group-hover:opacity-70 transition" />
              <LogoMark className="relative w-9 h-9" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display font-semibold text-sm tracking-tight">TruthForge</span>
              <span className="text-[10px] text-muted-foreground font-mono">AI</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative px-3.5 py-1.5 text-sm rounded-lg transition-colors ${
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-lg bg-accent/60"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="hidden sm:inline-flex relative items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium bg-gradient-primary text-primary-foreground hover:opacity-90 transition glow-primary"
            >
              Launch
            </Link>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
