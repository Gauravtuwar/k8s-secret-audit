'use client';

import React from 'react';
import Link from 'next/link';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { Audit } from '@/types';
import { ArrowRight, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface RecentAuditsTableProps {
  audits: Audit[];
}

export function RecentAuditsTable({ audits }: RecentAuditsTableProps) {
  return (
    <div className="rounded-md border bg-card text-card-foreground">
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">5. Audit History</h3>
          <p className="text-xs text-muted-foreground">Recent automated Kubernetes Secret audit executions</p>
        </div>
        <Link href="/audits">
          <Button variant="ghost" size="sm" className="gap-1 text-xs">
            View All Audits <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Audit ID</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead>Started At</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Findings</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {audits.map((audit) => (
            <TableRow key={audit.id}>
              <TableCell className="font-mono text-xs font-semibold">{audit.id.substring(0, 8)}...</TableCell>
              <TableCell>
                <Badge variant={audit.is_demo ? 'warning' : 'default'} className="text-[10px]">
                  {audit.is_demo ? 'Demo Mode' : 'Real Cluster'}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{formatDate(audit.started_at)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  {audit.status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                  {audit.status === 'in_progress' && <Clock className="h-3.5 w-3.5 text-amber-400 animate-spin" />}
                  {audit.status === 'failed' && <AlertCircle className="h-3.5 w-3.5 text-red-400" />}
                  <span className="capitalize">{audit.status.replace('_', ' ')}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-bold text-xs">{audit.security_score} / 100</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-[11px] font-semibold">
                  <span className="text-red-400">{audit.critical_count} C</span> ·
                  <span className="text-orange-400">{audit.high_count} H</span> ·
                  <span className="text-amber-400">{audit.medium_count} M</span> ·
                  <span className="text-blue-400">{audit.low_count} L</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Link href={`/audits/${audit.id}`}>
                  <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs">
                    View Details
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
          {audits.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-6 text-muted-foreground text-xs">
                No recent audit runs found. Click &quot;Run New Audit&quot; to initialize.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
