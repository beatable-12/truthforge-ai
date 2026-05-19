import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { useState } from 'react';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';

export const Route = createFileRoute('/reset-password')({
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    setIsSubmitting(true);
    // Mock the backend request
    setTimeout(() => {
      setIsSubmitting(false);
      router.navigate({ to: '/login' });
    }, 1000);
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
            Set New Password
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Please enter your new password below
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
              <label className="block text-sm font-medium text-foreground mb-1.5">New Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-forge/50 transition"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
            {!isSubmitting && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
