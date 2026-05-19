import { createFileRoute, useRouter } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Check, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
});

const plans = [
  {
    name: "Free",
    price: { m: 0, y: 0 },
    desc: "Basic reasoning for curious minds.",
    features: ["50 debates / month", "3 agents per debate", "7-day memory retention", "Public debate graph", "Community support"],
    cta: "Start free",
  },
  {
    name: "Pro",
    price: { m: 29, y: 24 },
    desc: "Advanced agent orchestration.",
    features: ["Unlimited debates", "All 7 agents", "Persistent memory graph", "Devil's Advocate mode", "Evidence uploads (PDF/URL)", "Export to PDF & Markdown", "Priority compute"],
    cta: "Start Pro",
    featured: true,
  },
  {
    name: "Teams",
    price: { m: 89, y: 74 },
    desc: "Shared memory across your team.",
    features: ["Everything in Pro", "Up to 10 seats", "Shared workspaces", "Federated memory graph", "SSO & SCIM", "Audit log & compliance", "Dedicated success manager"],
    cta: "Contact sales",
  },
];

const compare = [
  { feature: "Debates per month", free: "50", pro: "Unlimited", teams: "Unlimited" },
  { feature: "Active agents", free: "3", pro: "7", teams: "7" },
  { feature: "Memory retention", free: "7 days", pro: "Forever", teams: "Forever" },
  { feature: "Devil's Advocate", free: "—", pro: "✓", teams: "✓" },
  { feature: "Evidence uploads", free: "—", pro: "✓", teams: "✓" },
  { feature: "Shared workspace", free: "—", pro: "—", teams: "✓" },
  { feature: "SSO & audit", free: "—", pro: "—", teams: "✓" },
];

function PricingPage() {
  const [yearly, setYearly] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const { user, updateUser, token } = useAuth();
  const router = useRouter();

  const handleUpgrade = async (planName: string) => {
    if (!user) {
      router.navigate({ to: '/login', search: { redirect: '/pricing' } });
      return;
    }

    const planId = planName.toLowerCase();
    if (user.plan === planId) return;

    setUpgrading(planId);
    try {
      const res = await fetch('/api/auth/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan: planId })
      });
      const data = await res.json();
      if (res.ok) {
        updateUser({ plan: planId as any });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 md:px-6 py-16">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-xs font-mono uppercase tracking-widest text-forge">Pricing</p>
        <h1 className="mt-3 text-4xl md:text-6xl font-display font-semibold text-gradient">
          Forge at your scale.
        </h1>
        <p className="mt-5 text-muted-foreground">
          Start free. Upgrade when one good answer pays for the year.
        </p>

        <div className="mt-8 inline-flex items-center gap-1 glass rounded-full p-1">
          {[
            { l: "Monthly", v: false },
            { l: "Yearly", v: true, badge: "−17%" },
          ].map((opt) => (
            <button
              key={opt.l}
              onClick={() => setYearly(opt.v)}
              className={`relative px-4 py-1.5 text-sm rounded-full transition ${
                yearly === opt.v ? "bg-gradient-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {opt.l}
              {opt.badge && <span className="ml-1.5 text-[10px] font-mono text-forge">{opt.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="grid gap-5 md:grid-cols-3 max-w-6xl mx-auto mt-14">
        {plans.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`relative rounded-2xl p-7 flex flex-col ${
              p.featured ? "glass-strong border-gradient glow-primary" : "glass"
            }`}
          >
            {p.featured && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-forge text-forge-foreground text-[10px] font-mono uppercase tracking-wider">
                Most popular
              </div>
            )}
            <div className="font-display font-semibold text-lg">{p.name}</div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-5xl font-display font-semibold">${yearly ? p.price.y : p.price.m}</span>
              <span className="text-muted-foreground text-sm">/mo</span>
            </div>
            {yearly && p.price.m > 0 && (
              <div className="text-xs font-mono text-muted-foreground mt-1">billed ${p.price.y * 12}/year</div>
            )}
            <p className="text-sm text-muted-foreground mt-3">{p.desc}</p>

            <ul className="mt-6 space-y-2.5 flex-1">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-forge mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleUpgrade(p.name)}
              disabled={upgrading === p.name.toLowerCase() || user?.plan === p.name.toLowerCase()}
              className={`mt-7 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition ${
                p.featured
                  ? "bg-gradient-primary text-primary-foreground hover:opacity-90"
                  : "glass-strong hover:bg-accent"
              } disabled:opacity-50`}
            >
              {upgrading === p.name.toLowerCase() ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : user?.plan === p.name.toLowerCase() ? (
                <>Current Plan</>
              ) : (
                <>
                  {p.featured && <Sparkles className="w-3.5 h-3.5" />}
                  {p.cta}
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Compare table */}
      <div className="mt-20 max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-display font-semibold text-gradient">Compare plans</h2>
        </div>
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="text-left p-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">Feature</th>
                <th className="p-4 font-display font-semibold">Free</th>
                <th className="p-4 font-display font-semibold text-forge">Pro</th>
                <th className="p-4 font-display font-semibold">Teams</th>
              </tr>
            </thead>
            <tbody>
              {compare.map((row) => (
                <tr key={row.feature} className="border-b border-border/40 last:border-0">
                  <td className="p-4 text-foreground/80">{row.feature}</td>
                  <td className="p-4 text-center text-muted-foreground">{row.free}</td>
                  <td className="p-4 text-center">{row.pro}</td>
                  <td className="p-4 text-center text-muted-foreground">{row.teams}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enterprise */}
      <div className="mt-16 max-w-4xl mx-auto glass-strong rounded-2xl p-8 md:p-10 flex flex-wrap items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-display font-semibold">Enterprise & custom deployments</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            Self-hosted forging, custom agents, private model routing, and dedicated infra. Built for regulated industries.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass-strong hover:bg-accent text-sm font-medium">
          Talk to founders <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </main>
  );
}
