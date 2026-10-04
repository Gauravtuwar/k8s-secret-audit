'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { DashboardSummary } from '@/types';
import { StatCard } from '@/components/dashboard/stat-card';
import { AuditCharts } from '@/components/dashboard/audit-charts';
import { RecentAuditsTable } from '@/components/dashboard/recent-audits-table';
import { AuditProgressModal } from '@/components/audit/audit-progress-modal';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import {
  ShieldAlert,
  Server,
  Key,
  AlertOctagon,
  AlertTriangle,
  AlertCircle,
  Info,
  Lock,
  Play,
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [runAuditModalOpen, setRunAuditModalOpen] = useState(false);
  const [selectedClusterId, setSelectedClusterId] = useState<string>('');

  const fetchSummary = async () => {
    try {
      const data = await api.getDashboardSummary();
      setSummary(data);
      if (data.recent_audits && data.recent_audits.length > 0) {
        setSelectedClusterId(data.recent_audits[0].cluster_id);
      }
    } catch (err) {
      console.error('Failed to load dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="text-xs text-muted-foreground font-medium">Loading Security Dashboard...</span>
        </div>
      </div>
    );
  }

  const scoreRating = summary?.security_score && summary.security_score >= 90 ? 'Excellent' :
    summary?.security_score && summary.security_score >= 75 ? 'Good' :
    summary?.security_score && summary.security_score >= 50 ? 'Needs Improvement' : 'Critical Risk';

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Security Audit Dashboard</h1>
          <p className="text-xs text-muted-foreground">Real-time Kubernetes Secret Management & etcd Encryption at Rest Posture</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => setRunAuditModalOpen(true)}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
          >
            <Play className="h-3.5 w-3.5" /> Run New Audit
          </Button>

          <Link href="/clusters/connect">
            <Button variant="outline" className="gap-2 text-xs">
              <PlusCircle className="h-3.5 w-3.5" /> Connect Cluster
            </Button>
          </Link>

          <Link href="/reports">
            <Button variant="secondary" className="gap-2 text-xs">
              <FileText className="h-3.5 w-3.5" /> Generate Report
            </Button>
          </Link>
        </div>
      </div>

      {/* Security Score Highlight Banner */}
      <div className="rounded-xl border bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 shadow-xl text-white">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Application Security Score</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              {summary?.security_score || 0} <span className="text-lg font-medium text-slate-400">/ 100</span>
            </h2>
            <p className="text-xs text-slate-300">
              Rating: <span className="font-bold text-amber-400">{scoreRating}</span> · Overall security rating computed based on active KSA rule violations & encryption posture.
            </p>
          </div>

          <div className="flex items-center gap-6 border-l border-slate-800 pl-6">
            <div className="flex flex-col text-center">
              <span className="text-xs text-slate-400 font-medium">Score Change</span>
              <div className="flex items-center justify-center gap-1 font-bold text-sm mt-1">
                {(summary?.score_change || 0) >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                )}
                <span>{(summary?.score_change || 0) > 0 ? `+${summary?.score_change}` : summary?.score_change}</span>
              </div>
            </div>

            <div className="flex flex-col text-center">
              <span className="text-xs text-slate-400 font-medium">Last Audit</span>
              <span className="text-xs font-semibold mt-1 text-slate-200">
                {formatDate(summary?.last_audit_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Clusters"
          value={summary?.total_clusters || 0}
          description="Active Kubernetes clusters"
          icon={Server}
          iconColor="text-blue-400"
        />
        <StatCard
          title="Secrets Audited"
          value={summary?.total_secrets_audited || 0}
          description="Metadata inspected (Redacted)"
          icon={Key}
          iconColor="text-amber-400"
        />
        <StatCard
          title="Critical Findings"
          value={summary?.critical_findings || 0}
          description="Require immediate remediation"
          icon={AlertOctagon}
          iconColor="text-red-500"
        />
        <StatCard
          title="High Findings"
          value={summary?.high_findings || 0}
          description="Broad RBAC & key risk"
          icon={AlertTriangle}
          iconColor="text-orange-400"
        />
      </div>

      {/* Recharts Dashboard Charts */}
      <AuditCharts summaryData={summary} />

      {/* Audit History Table */}
      <RecentAuditsTable audits={summary?.recent_audits || []} />

      {/* Audit Progress Modal */}
      {runAuditModalOpen && (
        <AuditProgressModal
          open={runAuditModalOpen}
          onOpenChange={(op) => {
            setRunAuditModalOpen(op);
            if (!op) fetchSummary();
          }}
          clusterId={selectedClusterId}
        />
      )}
    </div>
  );
}
