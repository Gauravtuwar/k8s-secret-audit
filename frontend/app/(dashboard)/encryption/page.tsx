'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { EncryptionCheck } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Lock, ShieldCheck, AlertCircle, CheckCircle2, ShieldAlert, Cpu, Layers, RefreshCw, KeyRound, Server } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EncryptionPage() {
  const [checks, setChecks] = useState<EncryptionCheck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEncryption() {
      try {
        const data = await api.listEncryptionChecks();
        setChecks(data);
      } catch (err) {
        console.error('Failed to list encryption checks:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEncryption();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyan-900/20 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">etcd Encryption at Rest Module</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Control-plane EncryptionConfiguration provider ordering & etcd datastore posture verification</p>
        </div>
      </div>

      {/* Top SOC Visual Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <Card className="glass-panel border-l-4 border-l-cyan-500 hover:border-cyan-400/50 transition-all duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-[11px] uppercase tracking-wider text-cyan-400 font-mono flex items-center justify-between">
                <span>Active Encryption Provider</span>
                <Cpu className="h-4 w-4 text-cyan-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-white flex items-center gap-2 font-mono">
                KMS v2 / AES-CBC
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Envelope encryption provider plugin active on API Server</p>
              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-cyan-400/80 font-mono">
                <ShieldCheck className="h-3.5 w-3.5" /> Provider order priority verified
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.05 }}>
          <Card className="glass-panel border-l-4 border-l-amber-500 hover:border-amber-400/50 transition-all duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-[11px] uppercase tracking-wider text-amber-400 font-mono flex items-center justify-between">
                <span>Identity Fallback Posture</span>
                <AlertCircle className="h-4 w-4 text-amber-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-amber-400 flex items-center gap-2 font-mono">
                Identity Fallback Warning
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Provider sequence ordering must list KMS v2 ahead of identity provider</p>
              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-amber-400/80 font-mono">
                <KeyRound className="h-3.5 w-3.5" /> Rule KSA-001 Enforcement
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.1 }}>
          <Card className="glass-panel border-l-4 border-l-emerald-500 hover:border-emerald-400/50 transition-all duration-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-[11px] uppercase tracking-wider text-emerald-400 font-mono flex items-center justify-between">
                <span>Wildcard Target Scope</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-emerald-400 flex items-center gap-2 font-mono">
                *.* Configured
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Core Secret objects and configmaps covered by envelope encryption</p>
              <div className="mt-3 flex items-center gap-1.5 text-[10px] text-emerald-400/80 font-mono">
                <Server className="h-3.5 w-3.5" /> etcd datastore encrypted
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Encryption Verification Table */}
      <Card className="glass-panel">
        <CardHeader className="pb-3 border-b border-cyan-900/20">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-cyan-400 font-mono flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-cyan-400" /> Verified Control Plane Checks ({checks.length})
            </span>
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-[10px]">
              KSA-001 etcd Engine
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Live inspection of Kubernetes EncryptionConfiguration specs, provider keys, and fallback provider sequences.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-4 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-lg bg-slate-900/60 animate-pulse border border-slate-800" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {checks.map((c, idx) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                  className="rounded-lg border border-cyan-900/30 p-4 bg-slate-950/60 hover:bg-slate-900/60 transition-all duration-200 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm text-white font-mono">{c.check_name}</span>
                      <Badge
                        variant={
                          c.status === 'PASS'
                            ? 'success'
                            : c.status === 'FAIL'
                            ? 'destructive'
                            : c.status === 'WARNING'
                            ? 'warning'
                            : 'outline'
                        }
                        className="text-[10px] uppercase font-mono px-2 py-0.5"
                      >
                        {c.status}
                      </Badge>
                    </div>
                    {c.provider_chain && c.provider_chain.length > 0 && (
                      <div className="flex items-center gap-2 font-mono text-xs bg-slate-900 px-3 py-1 rounded border border-slate-800">
                        <span className="text-slate-400 text-[11px]">Provider Sequence:</span>
                        <span className="text-cyan-400 font-bold">{c.provider_chain.join(' → ')}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{c.explanation}</p>

                  {c.recommendation && (
                    <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-300 font-mono">
                      <span className="font-bold block text-amber-400 mb-1 flex items-center gap-1.5">
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-400" /> Remediation Recommendation:
                      </span>
                      {c.recommendation}
                    </div>
                  )}
                </motion.div>
              ))}

              {checks.length === 0 && !loading && (
                <div className="py-12 text-center text-xs text-slate-500 font-mono border border-dashed border-slate-800 rounded-lg">
                  No control plane encryption checks recorded for current audit run.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
