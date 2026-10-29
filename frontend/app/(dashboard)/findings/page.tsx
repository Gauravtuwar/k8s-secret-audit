'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Finding } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { getSeverityBadgeColor, getStatusBadgeColor, formatDate } from '@/lib/utils';
import { Search, Filter, AlertTriangle } from 'lucide-react';
import { FindingDetailsModal } from '@/components/audit/finding-details-modal';

const DEMO_FINDINGS: Finding[] = [
  {
    id: 'finding-001',
    audit_id: 'demo-audit-001',
    cluster_id: 'demo-cluster-prod',
    rule_id: 'KSA-001',
    title: 'Plaintext Secret Injected in Pod Environment Variable',
    description: 'Workload "payment-processor" mounts database credentials directly via envFrom rather than a safe file volume.',
    severity: 'Critical',
    category: 'Workload Configuration',
    namespace: 'production',
    resource_type: 'Pod',
    resource_name: 'payment-processor-79fb488f5c-8z2d1',
    status: 'Open',
    recommendation: 'Mount Secret keys as volume projections with read-only file mode 0400 instead of environment variables.',
    first_detected: new Date().toISOString(),
    last_detected: new Date().toISOString()
  },
  {
    id: 'finding-002',
    audit_id: 'demo-audit-001',
    cluster_id: 'demo-cluster-prod',
    rule_id: 'KSA-002',
    title: 'Wildcard Secret RBAC Access (*.*)',
    description: 'ClusterRole "ci-cd-deployer" has wildcard verb access ["*"] on resources ["secrets"].',
    severity: 'Critical',
    category: 'RBAC Authorization',
    namespace: 'kube-system',
    resource_type: 'ClusterRole',
    resource_name: 'ci-cd-deployer',
    status: 'Open',
    recommendation: 'Scope RBAC permissions strictly to specific verbs and use namespace-isolated RoleBindings.',
    first_detected: new Date().toISOString(),
    last_detected: new Date().toISOString()
  },
  {
    id: 'finding-003',
    audit_id: 'demo-audit-001',
    cluster_id: 'demo-cluster-prod',
    rule_id: 'KSA-003',
    title: 'etcd Unencrypted Storage - Identity Fallback',
    description: 'Control plane EncryptionConfiguration specifies "identity" provider ahead of AES-CBC/KMS.',
    severity: 'High',
    category: 'Encryption at Rest',
    namespace: 'kube-system',
    resource_type: 'EncryptionConfiguration',
    resource_name: 'apiserver-encryption-config',
    status: 'Open',
    recommendation: 'Order KMS or aescbc providers first in the provider sequence and re-encrypt all secret keys.',
    first_detected: new Date().toISOString(),
    last_detected: new Date().toISOString()
  },
  {
    id: 'finding-004',
    audit_id: 'demo-audit-001',
    cluster_id: 'demo-cluster-prod',
    rule_id: 'KSA-004',
    title: 'Unrotated High-Age Secret Key (> 180 Days)',
    description: 'Secret "legacy-stripe-signing-secret" has not been rotated in 214 days.',
    severity: 'Medium',
    category: 'Secret Lifecycle',
    namespace: 'production',
    resource_type: 'Secret',
    resource_name: 'legacy-stripe-signing-secret',
    status: 'Acknowledged',
    recommendation: 'Implement automated secret rotation through HashiCorp Vault or AWS Secrets Manager CSI driver.',
    first_detected: new Date().toISOString(),
    last_detected: new Date().toISOString()
  }
];

export default function FindingsPage() {
  const [findings, setFindings] = useState<Finding[]>(DEMO_FINDINGS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchFindings = async () => {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (severityFilter) params.severity = severityFilter;
      if (statusFilter) params.status = statusFilter;

      const data = await api.listFindings(params);
      if (data && data.length > 0) {
        setFindings(data);
      }
    } catch (err) {
      console.warn('Backend unavailable, using demo findings:', err);
      // Filter demo findings locally if search/filter applied
      let filtered = [...DEMO_FINDINGS];
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(f => f.title.toLowerCase().includes(s) || f.rule_id.toLowerCase().includes(s) || f.resource_name.toLowerCase().includes(s));
      }
      if (severityFilter) {
        filtered = filtered.filter(f => f.severity === severityFilter);
      }
      if (statusFilter) {
        filtered = filtered.filter(f => f.status === statusFilter);
      }
      setFindings(filtered);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFindings();
  }, [search, severityFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Security Rule Violation Registry</h1>
          <p className="text-xs text-slate-400">KSA-001 through KSA-010 rule findings & threat management</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-950/80 p-4 text-slate-100 glass-panel">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-cyan-400" />
          <Input
            type="search"
            placeholder="Filter by rule ID, title, or resource name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs bg-slate-900/80 border-slate-800 text-white placeholder:text-slate-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <Filter className="h-3.5 w-3.5 text-cyan-400" />
            <span>Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Acknowledged">Acknowledged</option>
              <option value="Resolved">Resolved</option>
              <option value="False Positive">False Positive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Findings Table */}
      <Card className="glass-panel">
        <CardHeader className="pb-3 border-b border-slate-800/80">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" /> Finding Records ({findings.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800/80 hover:bg-transparent">
                <TableHead className="text-slate-400 font-bold text-xs uppercase">Rule ID</TableHead>
                <TableHead className="text-slate-400 font-bold text-xs uppercase">Severity</TableHead>
                <TableHead className="text-slate-400 font-bold text-xs uppercase">Title</TableHead>
                <TableHead className="text-slate-400 font-bold text-xs uppercase">Namespace</TableHead>
                <TableHead className="text-slate-400 font-bold text-xs uppercase">Resource</TableHead>
                <TableHead className="text-slate-400 font-bold text-xs uppercase">Status</TableHead>
                <TableHead className="text-slate-400 font-bold text-xs uppercase">First Detected</TableHead>
                <TableHead className="text-slate-400 font-bold text-xs uppercase">Last Detected</TableHead>
                <TableHead className="text-right text-slate-400 font-bold text-xs uppercase">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {findings.map((f) => (
                <TableRow key={f.id} className="border-slate-800/60 hover:bg-slate-900/50 transition-colors">
                  <TableCell className="font-mono text-xs font-bold text-cyan-400">{f.rule_id}</TableCell>
                  <TableCell>
                    <Badge className={getSeverityBadgeColor(f.severity)}>{f.severity}</Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-xs text-white max-w-[220px] truncate">{f.title}</TableCell>
                  <TableCell className="text-xs font-mono text-slate-400">{f.namespace}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-400">{f.resource_name}</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(f.status)}>{f.status}</Badge>
                  </TableCell>
                  <TableCell className="text-[11px] text-slate-400">{formatDate(f.first_detected)}</TableCell>
                  <TableCell className="text-[11px] text-slate-400">{formatDate(f.last_detected)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-slate-700 hover:border-cyan-500/40 text-slate-200"
                      onClick={() => {
                        setSelectedFinding(f);
                        setModalOpen(true);
                      }}
                    >
                      Inspect
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {findings.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-xs text-slate-500 font-medium">
                    No matching security findings discovered.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Modal */}
      {selectedFinding && (
        <FindingDetailsModal
          finding={selectedFinding}
          open={modalOpen}
          onOpenChange={setModalOpen}
          onStatusUpdated={fetchFindings}
        />
      )}
    </div>
  );
}
