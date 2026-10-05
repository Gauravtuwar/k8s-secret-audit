'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { User, ShieldCheck, Mail, Calendar, Key, Shield, Terminal, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-900/20 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">User Profile & Credentials</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Security analyst identity, RBAC entitlements & active session token</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <Card className="glass-panel border-cyan-900/30">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-bold text-2xl font-mono shadow-lg shadow-cyan-950/50">
                {user?.full_name ? user.full_name.charAt(0) : 'S'}
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold text-white font-mono">{user?.full_name || 'SecOps Administrator'}</CardTitle>
                <CardDescription className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-cyan-400" /> {user?.email || 'admin@cybersec.audit'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 border-t border-cyan-900/20 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-cyan-900/30 p-3 bg-slate-950/60 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block font-mono">Security Role</span>
                  <span className="text-xs font-bold text-white font-mono">Lead Cybersec Auditor</span>
                </div>
              </div>

              <div className="rounded-lg border border-cyan-900/30 p-3 bg-slate-950/60 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block font-mono">Account Created</span>
                  <span className="text-xs font-semibold text-white font-mono">{formatDate(user?.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Token Viewer */}
            <div className="rounded-lg border border-cyan-900/40 p-4 bg-slate-950 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-cyan-400 font-mono">
                  <Key className="h-4 w-4" /> Active Session Token (Bearer JWT)
                </span>
                <Badge variant="success" className="text-[10px] font-mono">
                  JWT Authenticated
                </Badge>
              </div>
              <p className="text-[11px] font-mono text-slate-400 truncate bg-slate-900 p-2 rounded border border-slate-800">
                Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NzA5ODEwMDAsInN1YiI6ImFkbWluQGN5YmVyc2Vj...
              </p>
              <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500 font-mono">
                <span>Encryption: HS256 Signed</span>
                <span>Storage: Secure Session Context</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
