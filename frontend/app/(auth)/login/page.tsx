'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ShieldAlert, Lock, Mail, ArrowRight, Sparkles, Cpu, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@cybersec.audit');
  const [password, setPassword] = useState('AdminSecret123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 overflow-hidden">
      {/* Background Cyber Glow & Grid Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/40 via-slate-950 to-slate-950 -z-10" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#082f4915_1px,transparent_1px),linear-gradient(to_bottom,#082f4915_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] -z-10" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md space-y-6"
      >
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 shadow-lg shadow-cyan-950/80">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">K8s Secret Audit Platform</h1>
            <p className="text-xs text-slate-400 mt-1">Sign in to access your Kubernetes Secret Security Dashboard</p>
          </div>
        </div>

        <Card className="glass-panel border-cyan-900/40 shadow-2xl">
          <CardHeader className="pb-3 border-b border-cyan-900/20">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-cyan-400 font-mono flex items-center justify-between">
              <span>Account Authentication</span>
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Enter your security analyst credentials below to initialize session
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="pt-4 space-y-4">
              {error && (
                <div className="rounded-md bg-red-950/80 p-3 text-xs text-red-300 border border-red-500/40 font-mono">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 font-mono">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="analyst@secops.io"
                    className="pl-9 bg-slate-950 border-cyan-900/40 text-xs font-mono text-white focus:ring-cyan-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 font-mono">Password</label>
                  <Link href="/forgot-password" className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline font-mono">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="pl-9 bg-slate-950 border-cyan-900/40 text-xs font-mono text-white focus:ring-cyan-500"
                    required
                  />
                </div>
              </div>

              {/* Demo auto-fill button */}
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@cybersec.audit');
                  setPassword('AdminSecret123!');
                }}
                className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-mono font-semibold pt-1 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" /> Auto-fill Demo Credentials
              </button>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                className="w-full gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs shadow-lg shadow-cyan-950/60"
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-center text-xs text-slate-400 font-mono">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="font-semibold text-cyan-400 hover:text-cyan-300 hover:underline">
                  Register new account
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
