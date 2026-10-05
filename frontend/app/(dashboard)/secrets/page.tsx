'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { SecretsInventory } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Key, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { getSeverityBadgeColor } from '@/lib/utils';

export default function SecretsInventoryPage() {
  const [secrets, setSecrets] = useState<SecretsInventory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSecrets() {
      try {
        const data = await api.listSecrets();
        setSecrets(data);
      } catch (err) {
        console.error('Failed to list secrets:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSecrets();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Secrets Inventory</h1>
          <p className="text-xs text-slate-400">Cluster Secret metadata registry & workload usage exposure tracking</p>
        </div>
      </div>

      {/* Zero-Trust Redaction Banner */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 text-xs text-amber-300 flex items-center gap-3.5 backdrop-blur-md glow-amber">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
          <EyeOff className="h-5 w-5" />
        </div>
        <div>
          <span className="font-bold text-sm text-amber-400 block">Zero-Trust Metadata Redaction Guarantee</span>
          <span className="font-semibold text-amber-200">
            Secret values are intentionally never displayed or stored by this application.
          </span>{' '}
          This inventory displays strictly safe metadata (name, namespace, age, workload mounts, and RBAC exposure) to enforce cybersecurity compliance.
        </div>
      </div>

      <Card className="glass-panel">
        <CardHeader className="pb-3 border-b border-slate-800/80">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Key className="h-4 w-4 text-cyan-400" /> Registered Kubernetes Secret Objects ({secrets.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800/80 hover:bg-transparent">
                <TableHead className="text-slate-400 font-bold text-xs uppercase">Secret Name</TableHead>
                <TableHead className="text-slate-400 font-bold text-xs uppercase">Namespace</TableHead>
                <TableHead className="text-slate-400 font-bold text-xs uppercase">Type</TableHead>
                <TableHead className="text-slate-400 font-bold text-xs uppercase">Age</TableHead>
                <TableHead className="text-slate-400 font-bold text-xs uppercase">Used By Workloads</TableHead>
                <TableHead className="text-slate-400 font-bold text-xs uppercase">RBAC Exposure</TableHead>
                <TableHead className="text-slate-400 font-bold text-xs uppercase">Encryption</TableHead>
                <TableHead className="text-slate-400 font-bold text-xs uppercase">Risk Level</TableHead>
                <TableHead className="text-slate-400 font-bold text-xs uppercase">Payload Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {secrets.map((s) => (
                <TableRow key={s.id} className="border-slate-800/60 hover:bg-slate-900/50 transition-colors">
                  <TableCell className="font-mono text-xs font-bold text-white">{s.name}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-400">{s.namespace}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-400">{s.type}</TableCell>
                  <TableCell className="text-xs font-semibold text-slate-200">{s.age_days} days</TableCell>
                  <TableCell>
                    {s.used_by && s.used_by.length > 0 ? (
                      <div className="space-y-1">
                        {s.used_by.map((w, idx) => (
                          <span key={idx} className="block text-[11px] font-mono text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {w.kind}/{w.name} ({w.via})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">Unmounted</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.rbac_exposure === 'High' ? 'destructive' : 'outline'} className="text-[10px] font-bold uppercase">
                      {s.rbac_exposure}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.encryption_status === 'PASS' ? 'success' : 'destructive'} className="text-[10px] font-bold uppercase">
                      {s.encryption_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getSeverityBadgeColor(s.risk_level)}>{s.risk_level}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-[11px] font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                      [REDACTED]
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {secrets.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-xs text-slate-500 font-medium">
                    No secret metadata recorded for current audit.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
