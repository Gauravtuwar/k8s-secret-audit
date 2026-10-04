'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { SecretsInventory } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ShieldAlert, Key, Lock, AlertTriangle, Info, EyeOff } from 'lucide-react';
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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Secrets Inventory</h1>
          <p className="text-xs text-muted-foreground">Cluster Secret metadata registry & workload usage exposure tracking</p>
        </div>
      </div>

      {/* Prominent Redaction Security Warning */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-400 flex items-center gap-3">
        <EyeOff className="h-6 w-6 text-amber-500 shrink-0" />
        <div>
          <span className="font-bold text-sm block">Zero-Trust Metadata Inspection</span>
          <span className="font-medium text-amber-300">
            Secret values are intentionally never displayed or stored by this application.
          </span>{' '}
          This inventory displays strictly safe metadata (name, namespace, age, workload mounts, and RBAC exposure) to enforce cybersecurity compliance.
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" /> Registered Kubernetes Secrets ({secrets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Secret Name</TableHead>
                <TableHead>Namespace</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Used By Workloads</TableHead>
                <TableHead>RBAC Exposure</TableHead>
                <TableHead>Encryption</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Payload Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {secrets.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs font-bold text-foreground">{s.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{s.namespace}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{s.type}</TableCell>
                  <TableCell className="text-xs font-medium">{s.age_days} days</TableCell>
                  <TableCell>
                    {s.used_by && s.used_by.length > 0 ? (
                      <div className="space-y-1">
                        {s.used_by.map((w, idx) => (
                          <span key={idx} className="block text-[11px] font-mono text-slate-300 bg-secondary px-2 py-0.5 rounded">
                            {w.kind}/{w.name} ({w.via})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground italic">Unmounted</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.rbac_exposure === 'High' ? 'destructive' : 'outline'} className="text-[10px]">
                      {s.rbac_exposure}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.encryption_status === 'PASS' ? 'success' : 'destructive'} className="text-[10px]">
                      {s.encryption_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getSeverityBadgeColor(s.risk_level)}>{s.risk_level}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-[11px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded">
                      [REDACTED]
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {secrets.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-xs text-muted-foreground">
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
