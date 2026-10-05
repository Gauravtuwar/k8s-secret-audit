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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Audit History Timeline</h1>
          <p className="text-xs text-slate-400">Historical security audits and automated etcd compliance scans</p>
        </div>
        <Button
          onClick={() => setAuditModalOpen(true)}
          className="gap-2 text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold glow-cyan"
        >
          <Play className="h-3.5 w-3.5 fill-current" /> Execute New Audit
        </Button>
      </div>

      <Card className="glass-panel">
        <CardHeader className="pb-3 border-b border-slate-800/80">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <FileSearch className="h-4 w-4 text-cyan-400" /> Audit Executions ({audits.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800/80 hover:bg-transparent">
                <TableHead className="text-slate-400 font-bold text-xs uppercase">Audit ID</TableHead>
                <TableHead className="text-slate-400 font-bold text-xs uppercase">Environment</TableHead>
                <TableHead className="text-slate-400 font-bold text-xs uppercase">Started At</TableHead>
                <TableHead className="text-slate-400 font-bold text-xs uppercase">Completed At</TableHead>
                <TableHead className="text-slate-400 font-bold text-xs uppercase">Status</TableHead>
                <TableHead className="text-slate-400 font-bold text-xs uppercase">Security Score</TableHead>
                <TableHead className="text-slate-400 font-bold text-xs uppercase">Audited Secrets</TableHead>
                <TableHead className="text-slate-400 font-bold text-xs uppercase">Findings</TableHead>
                <TableHead className="text-right text-slate-400 font-bold text-xs uppercase">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audits.map((a) => (
                <TableRow key={a.id} className="border-slate-800/60 hover:bg-slate-900/50 transition-colors">
                  <TableCell className="font-mono text-xs font-bold text-cyan-400">{a.id.substring(0, 8)}...</TableCell>
                  <TableCell>
                    <Badge variant={a.is_demo ? 'warning' : 'default'} className="text-[10px] font-bold uppercase">
                      {a.is_demo ? 'Demo Mode' : 'Real Cluster'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-400">{formatDate(a.started_at)}</TableCell>
                  <TableCell className="text-xs text-slate-400">{formatDate(a.completed_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      {a.status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                      {a.status === 'in_progress' && <Clock className="h-3.5 w-3.5 text-amber-400 animate-spin" />}
                      {a.status === 'failed' && <AlertCircle className="h-3.5 w-3.5 text-red-400" />}
                      <span className="capitalize text-slate-200">{a.status.replace('_', ' ')}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-black text-xs text-white">{a.security_score} / 100</TableCell>
                  <TableCell className="text-xs font-semibold text-slate-200">{a.total_secrets_audited}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-[11px] font-bold">
                      <span className="text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">{a.critical_count} C</span>
                      <span className="text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">{a.high_count} H</span>
                      <span className="text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">{a.medium_count} M</span>
                      <span className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">{a.low_count} L</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/audits/${a.id}`}>
                      <Button variant="outline" size="sm" className="h-7 px-3 text-xs border-slate-700 hover:border-cyan-500/40 text-slate-200 gap-1">
                        View Audit <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {audits.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-xs text-slate-500">
                    No audit records found. Execute a new audit to generate findings.
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
