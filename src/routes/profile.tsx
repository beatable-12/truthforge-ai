import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';
import { User, Settings, Shield, Bell } from 'lucide-react';

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) return null; // AuthWrapper will redirect

  return (
    <main className="mx-auto max-w-4xl px-4 md:px-6 py-10">
      <div className="mb-8">
        <p className="text-xs font-mono uppercase tracking-widest text-forge">Account</p>
        <h1 className="mt-1 text-3xl font-display font-semibold text-gradient">Profile Settings</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-[250px_1fr]">
        <aside className="space-y-1">
          {[
            { label: 'General', icon: User, active: true },
            { label: 'Security', icon: Shield, active: false },
            { label: 'Notifications', icon: Bell, active: false },
            { label: 'Preferences', icon: Settings, active: false },
          ].map((item) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                item.active ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </aside>

        <div className="space-y-6">
          <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-display font-semibold mb-4">Profile Information</h3>
            <div className="space-y-4 max-w-sm">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Name</label>
                <input
                  type="text"
                  disabled
                  value={user.name}
                  className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full bg-background/50 border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Current Plan</label>
                <div className="flex items-center gap-2">
                  <div className="capitalize px-2.5 py-1 rounded-md bg-secondary text-sm font-medium text-forge border border-forge/20">
                    {user.plan}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass border-destructive/20 rounded-2xl p-6">
            <h3 className="text-lg font-display font-semibold text-destructive mb-2">Danger Zone</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button className="px-4 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm font-medium hover:bg-destructive hover:text-destructive-foreground transition">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
