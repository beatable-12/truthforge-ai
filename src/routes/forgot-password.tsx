import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Mock the backend request
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
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
            Reset Password
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Enter your email to receive a reset link
          </p>
        </div>
        
        {!submitted ? (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-gradient-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        ) : (
          <div className="mt-8 text-center space-y-4">
            <div className="p-4 bg-primary/10 text-primary rounded-lg text-sm border border-primary/20">
              If an account exists for {email}, a reset link has been sent.
            </div>
            <Link to="/login" className="text-sm text-forge hover:opacity-80 transition inline-block">
              Return to login
            </Link>
          </div>
        )}
        
        {!submitted && (
          <div className="mt-6 text-center text-sm">
            <Link to="/login" className="text-muted-foreground hover:text-foreground transition">
              Back to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
