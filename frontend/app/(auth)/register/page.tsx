'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ShieldAlert, Lock, Mail, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, fullName);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 overflow-hidden">
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
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">Create Security Account</h1>
            <p className="text-xs text-slate-400 mt-1">Register as a security engineer to begin auditing K8s clusters</p>
          </div>
        </div>

        <Card className="glass-panel border-cyan-900/40 shadow-2xl">
          <CardHeader className="pb-3 border-b border-cyan-900/20">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-cyan-400 font-mono flex items-center justify-between">
              <span>Analyst Registration</span>
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Fill in your details to create a new security auditor account
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
                <label className="text-xs font-semibold text-slate-300 font-mono">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Mercer"
                    className="pl-9 bg-slate-950 border-cyan-900/40 text-xs font-mono text-white focus:ring-cyan-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 font-mono">Work Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@secops.io"
                    className="pl-9 bg-slate-950 border-cyan-900/40 text-xs font-mono text-white focus:ring-cyan-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 font-mono">Password (6+ chars)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="pl-9 bg-slate-950 border-cyan-900/40 text-xs font-mono text-white focus:ring-cyan-500"
                    minLength={6}
                    required
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                className="w-full gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs shadow-lg shadow-cyan-950/60"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Register Account'}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-center text-xs text-slate-400 font-mono">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-cyan-400 hover:text-cyan-300 hover:underline">
                  Sign in instead
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
