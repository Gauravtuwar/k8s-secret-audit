'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { EncryptionCheck } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Lock, ShieldCheck, AlertCircle, Info, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';

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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">etcd Encryption at Rest Module</h1>
          <p className="text-xs text-muted-foreground">Control-plane EncryptionConfiguration provider ordering & etcd datastore posture</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Active Encryption Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-foreground flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" /> KMS v2 / AES-CBC
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Envelope encryption provider plugin active</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Identity Fallback Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-amber-400 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" /> Identity Provider Warning
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Check provider sequence ordering in config</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Wildcard Target Scope</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" /> *.* Configured
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Core Secret objects covered by rule</p>
          </CardContent>
        </Card>
      </div>

      {/* Encryption Verification Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" /> Verified Control Plane Checks ({checks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {checks.map((c) => (
              <div key={c.id} className="rounded-lg border p-5 bg-card space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">{c.check_name}</span>
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
                      className="text-xs"
                    >
                      {c.status}
                    </Badge>
                  </div>
                  {c.provider_chain && c.provider_chain.length > 0 && (
                    <div className="flex items-center gap-1 font-mono text-xs">
                      <span className="text-muted-foreground">Provider Sequence:</span>
                      <span className="text-primary font-bold">{c.provider_chain.join(' → ')}</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">{c.explanation}</p>

                {c.recommendation && (
                  <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-400">
                    <span className="font-bold block">Remediation Recommendation:</span>
                    {c.recommendation}
                  </div>
                )}
              </div>
            ))}
            {checks.length === 0 && !loading && (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No control plane encryption checks recorded for current audit.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
