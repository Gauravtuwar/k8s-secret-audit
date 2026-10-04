'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Audit } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { FileSearch, Play, CheckCircle2, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { AuditProgressModal } from '@/components/audit/audit-progress-modal';

export default function AuditsPage() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [selectedClusterId, setSelectedClusterId] = useState<string>('');

  const fetchAudits = async () => {
    try {
      const data = await api.listAudits();
      setAudits(data);
      if (data.length > 0) setSelectedClusterId(data[0].cluster_id);
    } catch (err) {
      console.error('Failed to list audits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit History</h1>
          <p className="text-xs text-muted-foreground">Historical security audits and automated etcd compliance scans</p>
        </div>
        <Button onClick={() => setAuditModalOpen(true)} className="gap-2 text-xs">
          <Play className="h-3.5 w-3.5" /> Execute New Audit
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Audit Executions ({audits.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Audit ID</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Started At</TableHead>
                <TableHead>Completed At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Security Score</TableHead>
                <TableHead>Audited Secrets</TableHead>
                <TableHead>Findings Breakdown</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audits.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-xs font-semibold">{a.id.substring(0, 8)}...</TableCell>
                  <TableCell>
                    <Badge variant={a.is_demo ? 'warning' : 'default'} className="text-[10px]">
                      {a.is_demo ? 'Demo Mode' : 'Real Cluster'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(a.started_at)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(a.completed_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      {a.status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                      {a.status === 'in_progress' && <Clock className="h-3.5 w-3.5 text-amber-400 animate-spin" />}
                      {a.status === 'failed' && <AlertCircle className="h-3.5 w-3.5 text-red-400" />}
                      <span className="capitalize">{a.status.replace('_', ' ')}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-xs">{a.security_score} / 100</TableCell>
                  <TableCell className="text-xs">{a.total_secrets_audited}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-[11px] font-semibold">
                      <span className="text-red-400">{a.critical_count} C</span> ·
                      <span className="text-orange-400">{a.high_count} H</span> ·
                      <span className="text-amber-400">{a.medium_count} M</span> ·
                      <span className="text-blue-400">{a.low_count} L</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/audits/${a.id}`}>
                      <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1">
                        View Audit <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {audits.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-xs text-muted-foreground">
                    No audits found. Execute a new audit to generate findings.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {auditModalOpen && (
        <AuditProgressModal
          open={auditModalOpen}
          onOpenChange={(op) => {
            setAuditModalOpen(op);
            if (!op) fetchAudits();
          }}
          clusterId={selectedClusterId}
        />
      )}
    </div>
  );
}
