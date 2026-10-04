'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@/types';
import { api } from '@/lib/api-client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isDemoMode: boolean;
  setIsDemoMode: (val: boolean) => void;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  register: (email: string, pass: string, name?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function initAuth() {
      const token = localStorage.getItem('access_token');
      const savedDemo = localStorage.getItem('demo_mode');
      if (savedDemo !== null) {
        setIsDemoMode(savedDemo === 'true');
      }

      if (token) {
        try {
          const currentUser = await api.getMe();
          setUser(currentUser);
        } catch (err) {
          console.warn('Invalid token, clearing session', err);
          localStorage.removeItem('access_token');
        }
      } else {
        // Fallback default admin user for zero-friction demo state
        setUser({
          id: 'demo-user-id',
          email: 'secops@enterprise-audit.io',
          full_name: 'Lead Cybersec Engineer',
          is_active: true,
          created_at: new Date().toISOString()
        });
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await api.login({ email, password: pass });
      localStorage.setItem('access_token', res.access_token);
      const currentUser = await api.getMe();
      setUser(currentUser);
      router.push('/dashboard');
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, pass: string, name?: string) => {
    setLoading(true);
    try {
      await api.register({ email, password: pass, full_name: name });
      await login(email, pass);
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
    api.logout().catch(() => {});
    router.push('/login');
  };

  const handleSetDemoMode = (val: boolean) => {
    setIsDemoMode(val);
    localStorage.setItem('demo_mode', String(val));
  };

  return (
    <AuthContext.Provider value={{ user, loading, isDemoMode, setIsDemoMode: handleSetDemoMode, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
