'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Settings, Shield, Lock, CheckCircle2, Sliders, Database, EyeOff, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/toast';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const { showToast } = useToast();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    showToast('Preferences Saved', 'Global security audit preferences updated successfully.', 'success');
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-900/20 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">System Settings</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Configure global security audit policies & zero-trust inspection parameters</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-md bg-emerald-500/10 p-3 text-xs text-emerald-400 border border-emerald-500/30 flex items-center gap-2 font-mono"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Audit system preferences updated successfully.</span>
          </motion.div>
        )}

        {/* Rule Thresholds */}
        <Card className="glass-panel border-cyan-900/30">
          <CardHeader className="pb-3 border-b border-cyan-900/20">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-2">
              <Sliders className="h-4 w-4 text-cyan-400" /> Rule Engine Detection Thresholds
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Customize parameters used by rules KSA-001 through KSA-010 during scan execution.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 font-mono">Stale Secret Threshold (Days)</label>
                <Input type="number" defaultValue={90} min={30} max={365} className="bg-slate-950 border-cyan-900/40 text-xs font-mono text-white" />
                <span className="text-[10px] text-slate-500 font-mono block">Flags secrets unchanged beyond this age (Rule KSA-005)</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 font-mono">Multi-Workload Reference Limit</label>
                <Input type="number" defaultValue={3} min={2} max={10} className="bg-slate-950 border-cyan-900/40 text-xs font-mono text-white" />
                <span className="text-[10px] text-slate-500 font-mono block">Triggers shared secret warning (Rule KSA-004)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* etcd & Redaction Policy */}
        <Card className="glass-panel border-cyan-900/30">
          <CardHeader className="pb-3 border-b border-cyan-900/20">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-400" /> etcd Verification & Zero-Trust Safeguards
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Mandatory platform security restrictions enforced at API level.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-cyan-900/30 p-3 bg-slate-950/60">
              <div className="flex items-center gap-3">
                <EyeOff className="h-5 w-5 text-cyan-400" />
                <div>
                  <span className="text-xs font-semibold text-white block font-mono">Strict Secret Value Masking</span>
                  <span className="text-[11px] text-slate-400">Never fetch or render plaintext secret bytes in UI or API responses</span>
                </div>
              </div>
              <Badge variant="success" className="text-[10px] font-mono">ENFORCED (ALWAYS ON)</Badge>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-cyan-900/30 p-3 bg-slate-950/60">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-amber-400" />
                <div>
                  <span className="text-xs font-semibold text-white block font-mono">KMS Provider Priority Enforcement</span>
                  <span className="text-[11px] text-slate-400">Flag identity fallback provider listed prior to KMS v2 in EncryptionConfiguration</span>
                </div>
              </div>
              <Badge variant="success" className="text-[10px] font-mono">ENABLED</Badge>
            </div>
          </CardContent>
          <CardFooter className="border-t border-cyan-900/20 pt-4 flex justify-end">
            <Button type="submit" className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-mono gap-2">
              <Save className="h-3.5 w-3.5" /> Save Security Preferences
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
