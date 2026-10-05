'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ShieldAlert, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
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
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">Password Recovery</h1>
            <p className="text-xs text-slate-400 mt-1">Reset your security analyst dashboard access</p>
          </div>
        </div>

        <Card className="glass-panel border-cyan-900/40 shadow-2xl">
          <CardHeader className="pb-3 border-b border-cyan-900/20">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-cyan-400 font-mono">
              Reset Password
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Enter your email address to receive recovery instructions
            </CardDescription>
          </CardHeader>

          {submitted ? (
            <CardContent className="pt-4 space-y-4">
              <div className="rounded-lg bg-emerald-950/60 p-4 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-3 font-mono">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                <div>
                  <span className="font-bold block text-sm text-emerald-400">Recovery Link Dispatched</span>
                  If an account exists for <b className="text-white">{email}</b>, password reset instructions have been sent.
                </div>
              </div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 font-mono">Registered Email Address</label>
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
              </CardContent>

              <CardFooter className="flex flex-col gap-3 pt-2">
                <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs shadow-lg shadow-cyan-950/60">
                  Send Recovery Link
                </Button>
              </CardFooter>
            </form>
          )}

          <CardFooter className="pt-0 border-t border-cyan-900/20 mt-2">
            <Link href="/login" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 font-mono pt-3 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
