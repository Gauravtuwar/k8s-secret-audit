'use client';

import React from 'react';
import Link from 'next/link';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Audit } from '@/types';
import { ArrowRight, CheckCircle2, AlertCircle, Clock, ShieldCheck } from 'lucide-react';

interface RecentAuditsTableProps {
  audits: Audit[];
}

export function RecentAuditsTable({ audits }: RecentAuditsTableProps) {
  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-800/80 p-5">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">5. Audit History Timeline</h3>
          <p className="text-xs text-slate-400 mt-0.5">Automated Kubernetes Secret & etcd Encryption assessment runs</p>
        </div>
        <Link href="/audits">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-cyan-400 hover:text-cyan-300">
            View All Audits <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-slate-800/80 hover:bg-transparent">
            <TableHead className="text-slate-400 font-bold text-xs uppercase">Audit ID</TableHead>
            <TableHead className="text-slate-400 font-bold text-xs uppercase">Environment</TableHead>
            <TableHead className="text-slate-400 font-bold text-xs uppercase">Started At</TableHead>
            <TableHead className="text-slate-400 font-bold text-xs uppercase">Status</TableHead>
            <TableHead className="text-slate-400 font-bold text-xs uppercase">Score</TableHead>
            <TableHead className="text-slate-400 font-bold text-xs uppercase">Severity Findings</TableHead>
            <TableHead className="text-right text-slate-400 font-bold text-xs uppercase">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {audits.map((audit) => (
            <TableRow key={audit.id} className="border-slate-800/60 hover:bg-slate-900/50 transition-colors">
              <TableCell className="font-mono text-xs font-bold text-cyan-400">{audit.id.substring(0, 8)}...</TableCell>
              <TableCell>
                <Badge variant={audit.is_demo ? 'warning' : 'default'} className="text-[10px] font-bold uppercase">
                  {audit.is_demo ? 'Demo Mode' : 'Real Cluster'}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-slate-400">{formatDate(audit.started_at)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  {audit.status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                  {audit.status === 'in_progress' && <Clock className="h-3.5 w-3.5 text-amber-400 animate-spin" />}
                  {audit.status === 'failed' && <AlertCircle className="h-3.5 w-3.5 text-red-400" />}
                  <span className="capitalize">{audit.status.replace('_', ' ')}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-black text-xs text-slate-100">{audit.security_score} / 100</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-[11px] font-bold">
                  <span className="text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">{audit.critical_count} C</span>
                  <span className="text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">{audit.high_count} H</span>
                  <span className="text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">{audit.medium_count} M</span>
                  <span className="text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">{audit.low_count} L</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Link href={`/audits/${audit.id}`}>
                  <Button variant="outline" size="sm" className="h-7 px-3 text-xs border-slate-700 hover:border-cyan-500/40 text-slate-200">
                    Inspect
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
          {audits.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-slate-500 text-xs font-medium">
                No audit execution records found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
