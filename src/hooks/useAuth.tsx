import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from '@tanstack/react-router';

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  plan: 'free' | 'pro' | 'business';
  debate_count: number;
  saved_memories: number;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('truthforge_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        } else {
          setToken(null);
          localStorage.removeItem('truthforge_token');
        }
      })
      .catch(() => {
        setToken(null);
        localStorage.removeItem('truthforge_token');
      })
      .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('truthforge_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(console.error);
    }
    localStorage.removeItem('truthforge_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updatedUser } : null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
