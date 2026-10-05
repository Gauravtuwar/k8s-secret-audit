'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { DashboardSummary } from '@/types';
import { StatCard } from '@/components/dashboard/stat-card';
import { AuditCharts } from '@/components/dashboard/audit-charts';
import { RecentAuditsTable } from '@/components/dashboard/recent-audits-table';
import { AuditProgressModal } from '@/components/audit/audit-progress-modal';
import { Security3DNodeCanvas } from '@/components/ui/security-3d-node-canvas';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatDate, getSeverityBadgeColor } from '@/lib/utils';
import {
  ShieldAlert,
  Server,
  Key,
  AlertOctagon,
  AlertTriangle,
  Lock,
  Play,
  PlusCircle,
  FileText,
  TrendingUp,
  TrendingDown,
  Cpu,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  Activity
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
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent glow-cyan" />
        <span className="text-xs font-bold text-slate-300">Loading Sentinel Security Dashboard...</span>
      </div>
    );
  }

  const scoreRating = summary?.security_score && summary.security_score >= 90 ? 'Excellent' :
    summary?.security_score && summary.security_score >= 75 ? 'Good' :
    summary?.security_score && summary.security_score >= 50 ? 'Needs Improvement' : 'Critical Risk';

  return (
    <div className="space-y-8">
      {/* 1. Security Overview Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">SOC Security Overview</h1>
            <Badge variant="outline" className="border-cyan-500/40 text-cyan-300 text-[10px] uppercase font-bold">
              Continuous Sentinel
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">Real-time Kubernetes Secret Posture & etcd Encryption Compliance Engine</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => setRunAuditModalOpen(true)}
            className="gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs glow-cyan transition-all"
          >
            <Play className="h-3.5 w-3.5 fill-current" /> Run New Audit
          </Button>

          <Link href="/clusters/connect">
            <Button variant="outline" className="gap-2 text-xs border-slate-700 hover:border-cyan-500/40 text-slate-200">
              <PlusCircle className="h-3.5 w-3.5 text-cyan-400" /> Connect Cluster
            </Button>
          </Link>

          <Link href="/reports">
            <Button variant="secondary" className="gap-2 text-xs bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200">
              <FileText className="h-3.5 w-3.5 text-cyan-400" /> Generate Report
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Cluster Security Score & 3D Interactive Topology Mesh */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Security Score Hero Card */}
        <div className="lg:col-span-1 glass-panel relative overflow-hidden rounded-xl p-6 border-cyan-500/30 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4" /> 2. Cluster Security Score
              </span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {scoreRating}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tight text-white">
                <AnimatedCounter value={summary?.security_score || 0} decimals={1} />
              </span>
              <span className="text-sm font-semibold text-slate-400">/ 100</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Calculated based on active KSA rule violations, RBAC verb exposure, and etcd EncryptionConfiguration status.
            </p>
          </div>

          <div className="mt-6 border-t border-slate-800/80 pt-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold">
              {(summary?.score_change || 0) >= 0 ? (
                <span className="flex items-center gap-1 text-emerald-400">
                  <TrendingUp className="h-4 w-4" /> +{summary?.score_change}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-400">
                  <TrendingDown className="h-4 w-4" /> {summary?.score_change}
                </span>
              )}
              <span className="text-slate-500 text-[10px]">vs last audit</span>
            </div>

            <span className="text-[11px] text-slate-400 font-mono">
              Last Scan: {formatDate(summary?.last_audit_at)}
            </span>
          </div>
        </div>

        {/* 3D Security Canvas Visualizer */}
        <div className="lg:col-span-2">
          <Security3DNodeCanvas score={summary?.security_score || 85} />
        </div>
      </div>

      {/* 3. Key Metric Cards with Animated Counters & Trend Badges */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Clusters"
          value={summary?.total_clusters || 0}
          description="Monitored K8s environments"
          icon={Server}
          iconColor="text-blue-400"
          glowColor="blue"
        />
        <StatCard
          title="Secrets Audited"
          value={summary?.total_secrets_audited || 0}
          description="Metadata inspected (Redacted)"
          icon={Key}
          iconColor="text-amber-400"
          glowColor="amber"
        />
        <StatCard
          title="Critical Findings"
          value={summary?.critical_findings || 0}
          description="Require immediate remediation"
          icon={AlertOctagon}
          iconColor="text-red-500"
          glowColor="red"
        />
        <StatCard
          title="High Findings"
          value={summary?.high_findings || 0}
          description="Broad RBAC & etcd risk"
          icon={AlertTriangle}
          iconColor="text-orange-400"
          glowColor="amber"
        />
      </div>

      {/* 4. Critical/High/Medium/Low Findings & 10. Security Trends */}
      <AuditCharts summaryData={summary} />

      {/* 5. Encryption-at-Rest & 6. RBAC Risk Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 5. Encryption-at-Rest Status */}
        <Card className="glass-panel p-6">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Lock className="h-4 w-4 text-cyan-400" /> 5. Encryption-at-Rest Control Plane
            </CardTitle>
            <Link href="/encryption" className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1">
              Full Module <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0 space-y-3">
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-200">Active Provider Sequence</span>
                <Badge variant="warning" className="text-[10px]">identity $\rightarrow$ aescbc</Badge>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Control plane EncryptionConfiguration specifies identity (unencrypted) before cipher providers. etcd writes new secrets in plaintext.
              </p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800/80 bg-slate-900/40 text-xs">
              <span className="font-semibold text-slate-300">Wildcard Resource Encryption Scope (*.*)</span>
              <Badge variant="success" className="text-[10px]">CONFIGURED</Badge>
            </div>
          </CardContent>
        </Card>

        {/* 6. RBAC Risk Overview */}
        <Card className="glass-panel p-6">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-400" /> 6. RBAC Secret Permission Exposure
            </CardTitle>
            <Link href="/findings?severity=High" className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1">
              RBAC Findings <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0 space-y-3 text-xs">
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 flex items-center justify-between text-red-300 font-semibold">
              <div className="flex items-center gap-2">
                <AlertOctagon className="h-4 w-4 shrink-0 text-red-400" />
                <span>ServiceAccount: ci-cd-deployer</span>
              </div>
              <Badge variant="destructive" className="text-[10px]">Verbs: *</Badge>
            </div>

            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex items-center justify-between text-amber-300 font-semibold">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                <span>ClusterRoleBinding: monitoring-prom-sa</span>
              </div>
              <Badge variant="warning" className="text-[10px]">get, list, watch</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 7. Secrets Inventory Exposure & 8. Security Rules Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7. Secrets Inventory Quick Overview */}
        <Card className="glass-panel p-6">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Key className="h-4 w-4 text-cyan-400" /> 7. Secrets Inventory Exposure Summary
            </CardTitle>
            <Link href="/secrets" className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1">
              Inventory <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0 space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-900/50">
              <span className="font-mono text-cyan-300 font-bold">db-postgres-credentials</span>
              <span className="text-[11px] text-slate-400 font-mono">Mounted in 5 workloads</span>
              <span className="font-bold text-red-400">[REDACTED]</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-900/50">
              <span className="font-mono text-cyan-300 font-bold">payment-stripe-token</span>
              <span className="text-[11px] text-slate-400 font-mono">Injected via envFrom</span>
              <span className="font-bold text-red-400">[REDACTED]</span>
            </div>
          </CardContent>
        </Card>

        {/* 8. Security Rules Catalog Matrix (KSA-001 - KSA-010) */}
        <Card className="glass-panel p-6">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-purple-400" /> 8. Security Rules Enforcement (KSA-001 - KSA-010)
            </CardTitle>
            <Link href="/findings" className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1">
              Rules Registry <ChevronRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-5 gap-2 text-center text-xs font-bold">
              {['KSA-001', 'KSA-002', 'KSA-003', 'KSA-004', 'KSA-005', 'KSA-006', 'KSA-007', 'KSA-008', 'KSA-009', 'KSA-010'].map((rule) => (
                <div key={rule} className="p-2 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-cyan-500/40 text-cyan-300 font-mono text-[11px] transition-all">
                  {rule}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 9. Recent Audit History Table */}
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
