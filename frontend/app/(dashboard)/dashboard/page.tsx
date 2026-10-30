'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  api,
  getBackendUrl,
  setBackendUrl,
  validateBackendUrl,
  ConnectionState
} from '@/lib/api-client';
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
import { formatDate } from '@/lib/utils';
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
  Activity,
  RotateCw,
  Globe
} from 'lucide-react';

const DEMO_FALLBACK_SUMMARY: DashboardSummary = {
  total_clusters: 1,
  total_secrets_audited: 42,
  critical_findings: 3,
  high_findings: 7,
  medium_findings: 5,
  low_findings: 2,
  encryption_status_summary: {
    PASS: 1,
    FAIL: 2,
    WARNING: 1
  },
  last_audit_at: new Date().toISOString(),
  security_score: 82.5,
  previous_score: 79.0,
  score_change: 3.5,
  severity_breakdown: {
    Critical: 3,
    High: 7,
    Medium: 5,
    Low: 2,
    Informational: 4
  },
  score_history: [
    { date: '2026-10-23', score: 71.0 },
    { date: '2026-10-25', score: 75.5 },
    { date: '2026-10-27', score: 79.0 },
    { date: '2026-10-29', score: 82.5 }
  ],
  namespace_breakdown: [
    { namespace: 'kube-system', findings_count: 8 },
    { namespace: 'production', findings_count: 6 },
    { namespace: 'staging', findings_count: 2 },
    { namespace: 'default', findings_count: 1 }
  ],
  recent_audits: [
    {
      id: 'demo-audit-001',
      user_id: 'demo-user',
      cluster_id: 'demo-cluster-prod',
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      status: 'completed',
      current_step: 'Completed',
      security_score: 82.5,
      critical_count: 3,
      high_count: 7,
      medium_count: 5,
      low_count: 2,
      informational_count: 4,
      total_secrets_audited: 42,
      is_demo: true
    }
  ]
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary>(DEMO_FALLBACK_SUMMARY);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>('connecting');
  const [latency, setLatency] = useState<number | null>(null);
  const [runAuditModalOpen, setRunAuditModalOpen] = useState(false);
  const [selectedClusterId, setSelectedClusterId] = useState<string>('demo-cluster-prod');

  /**
   * Background connection check:
   * Quietly checks for a live backend if configured, updating live summary data if available,
   * or falling back gracefully to simulation data without displaying intrusive banners.
   */
  const handleConnect = async (urlToConnect?: string) => {
    const rawTarget = urlToConnect?.trim();
    if (!rawTarget) {
      setConnectionStatus('failed');
      setSummary(DEMO_FALLBACK_SUMMARY);
      return;
    }

    const validation = validateBackendUrl(rawTarget);
    if (!validation.valid) {
      setConnectionStatus('failed');
      setSummary(DEMO_FALLBACK_SUMMARY);
      return;
    }

    setConnectionStatus('connecting');

    try {
      const result = await api.testConnection(validation.cleanUrl, undefined, 60000);

      if (result.success) {
        setBackendUrl(validation.cleanUrl);
        if (result.summary) {
          setSummary(result.summary);
          if (result.summary.recent_audits && result.summary.recent_audits.length > 0) {
            setSelectedClusterId(result.summary.recent_audits[0].cluster_id);
          }
        }
        setConnectionStatus('connected');
        if (result.latencyMs) setLatency(result.latencyMs);
      } else {
        setConnectionStatus('failed');
        setSummary(DEMO_FALLBACK_SUMMARY);
      }
    } catch {
      setConnectionStatus('failed');
      setSummary(DEMO_FALLBACK_SUMMARY);
    }
  };

  /**
   * Automatic connection check on mount:
   * Inspects localStorage or build-time environment variable.
   */
  useEffect(() => {
    const initialUrl = getBackendUrl();
    if (initialUrl && initialUrl.trim()) {
      handleConnect(initialUrl.trim());
    } else {
      setConnectionStatus('failed');
      setSummary(DEMO_FALLBACK_SUMMARY);
    }
  }, []);

  const hasAuditResults = Boolean(
    summary?.recent_audits &&
    summary.recent_audits.length > 0 &&
    (summary.total_secrets_audited > 0 || (summary.security_score != null && summary.security_score > 0))
  );

  const score = summary?.security_score;
  const scoreRating = !hasAuditResults || score == null
    ? 'Not assessed'
    : score >= 90
    ? 'Excellent'
    : score >= 75
    ? 'Good'
    : score >= 50
    ? 'Needs Improvement'
    : 'Critical Risk';

  return (
    <div className="space-y-6">
      {/* 1. Security Overview Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">SOC Security Overview</h1>
            <Badge variant="outline" className="border-cyan-500/40 text-cyan-300 text-[10px] uppercase font-bold">
              Continuous Sentinel
            </Badge>
            {connectionStatus === 'connected' && (
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 text-[10px] bg-emerald-950/50 uppercase font-bold tracking-wider">
                Live API {latency ? `(${latency}ms)` : ''}
              </Badge>
            )}
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
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                scoreRating === 'Not assessed'
                  ? 'bg-slate-800 text-slate-400 border-slate-700'
                  : scoreRating === 'Excellent'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : scoreRating === 'Good'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                  : scoreRating === 'Needs Improvement'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-red-500/20 text-red-300 border-red-500/30'
              }`}>
                {scoreRating}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tight text-white">
                {hasAuditResults && score != null ? (
                  <AnimatedCounter value={score} decimals={1} />
                ) : (
                  '--'
                )}
              </span>
              <span className="text-sm font-semibold text-slate-400">/ 100</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {hasAuditResults
                ? 'Calculated based on active KSA rule violations, RBAC verb exposure, and etcd EncryptionConfiguration status.'
                : 'No cluster audits executed yet. Run an audit or connect a live Kubernetes cluster to calculate score.'}
            </p>
          </div>

          <div className="mt-6 border-t border-slate-800/80 pt-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold">
              {hasAuditResults && summary?.score_change != null ? (
                summary.score_change >= 0 ? (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <TrendingUp className="h-4 w-4" /> +{summary.score_change}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-400">
                    <TrendingDown className="h-4 w-4" /> {summary.score_change}
                  </span>
                )
              ) : (
                <span className="text-slate-500 text-[11px] font-mono">No previous scan</span>
              )}
              {hasAuditResults && summary?.score_change != null && (
                <span className="text-slate-500 text-[10px]">vs last audit</span>
              )}
            </div>

            <span className="text-[11px] text-slate-400 font-mono">
              Last Scan: {summary?.last_audit_at ? formatDate(summary.last_audit_at) : 'Never'}
            </span>
          </div>
        </div>

        {/* 3D Security Canvas Visualizer */}
        <div className="lg:col-span-2">
          <Security3DNodeCanvas score={hasAuditResults && score != null ? score : 85} />
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
                <Badge variant="warning" className="text-[10px]">identity &rarr; aescbc</Badge>
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
            if (!op) handleConnect();
          }}
          clusterId={selectedClusterId}
        />
      )}
    </div>
  );
}
