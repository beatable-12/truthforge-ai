import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';

export const Route = createFileRoute('/login')({
  component: Login,
});

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(!text ? 'Server connection failed. Is the API running?' : 'Received invalid response from server.');
      }

      if (!res.ok) throw new Error(data?.error || 'Login failed');
      
      login(data.token, data.user);
      router.navigate({ to: '/dashboard' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-forge blur-[120px] opacity-20 rounded-full" />
      
      <div className="max-w-md w-full space-y-8 relative glass-strong p-8 rounded-2xl border-gradient">
        <div>
          <div className="mx-auto w-12 h-12 bg-gradient-forge rounded-xl flex items-center justify-center glow-forge mb-6">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-center text-3xl font-display font-semibold text-gradient">
            Welcome back
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Sign in to continue to your workspace
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3 text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-forge/50 transition"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-foreground">Password</label>
                <Link to="/forgot-password" className="text-xs text-forge hover:opacity-80 transition">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-forge/50 transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-gradient-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in'}
            {!isSubmitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">Don't have an account? </span>
          <Link to="/signup" className="text-forge font-medium hover:opacity-80 transition">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
