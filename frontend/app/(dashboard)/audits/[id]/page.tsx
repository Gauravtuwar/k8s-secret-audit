'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Audit, Finding, SecretsInventory, EncryptionCheck } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatDate, getSeverityBadgeColor, getStatusBadgeColor } from '@/lib/utils';
import { ArrowLeft, FileText, CheckCircle2, AlertOctagon, Key, Lock, ShieldCheck } from 'lucide-react';
import { FindingDetailsModal } from '@/components/audit/finding-details-modal';

export default function AuditDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const auditId = resolvedParams.id;

  const [audit, setAudit] = useState<Audit | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [secrets, setSecrets] = useState<SecretsInventory[]>([]);
  const [encChecks, setEncChecks] = useState<EncryptionCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const fetchAuditData = async () => {
    try {
      const [auditData, findingsData, secretsData, encData] = await Promise.all([
        api.getAudit(auditId),
        api.getAuditFindings(auditId),
        api.listSecrets({ audit_id: auditId }),
        api.listEncryptionChecks({ audit_id: auditId }),
      ]);
      setAudit(auditData);
      setFindings(findingsData);
      setSecrets(secretsData);
      setEncChecks(encData);
    } catch (err) {
      console.error('Failed to load audit details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, [auditId]);

  if (loading) {
    return <div className="py-12 text-center text-xs text-muted-foreground">Loading audit run details...</div>;
  }

  if (!audit) {
    return <div className="py-12 text-center text-xs text-muted-foreground">Audit not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Link href="/audits">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">Audit Run {audit.id.substring(0, 8)}...</h1>
              <Badge variant={audit.is_demo ? 'warning' : 'default'} className="text-[10px]">
                {audit.is_demo ? 'Demo Mode' : 'Real Cluster'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Executed on {formatDate(audit.started_at)}</p>
          </div>
        </div>

        <Link href="/reports">
          <Button variant="outline" className="gap-2 text-xs">
            <FileText className="h-3.5 w-3.5" /> Export PDF / JSON Report
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-slate-900 text-white">
          <CardContent className="p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Security Score</span>
            <div className="text-2xl font-black mt-1">{audit.security_score} / 100</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Findings</span>
            <div className="text-2xl font-black mt-1 text-foreground">{findings.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Audited Secrets</span>
            <div className="text-2xl font-black mt-1 text-primary">{audit.total_secrets_audited}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Execution Status</span>
            <div className="text-sm font-bold mt-2 capitalize flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> {audit.status.replace('_', ' ')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Encryption at Rest Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" /> Encryption at Rest Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {encChecks.map((ec, idx) => (
              <div key={idx} className="rounded-md border p-4 bg-background/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-foreground">{ec.check_name}</span>
                    <Badge variant={ec.status === 'PASS' ? 'success' : ec.status === 'FAIL' ? 'destructive' : 'warning'} className="text-[10px]">
                      {ec.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{ec.explanation}</p>
                </div>
                {ec.recommendation && (
                  <div className="text-xs text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/20 max-w-md">
                    <b>Recommendation:</b> {ec.recommendation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Findings Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <AlertOctagon className="h-4 w-4 text-destructive" /> Discovered Findings ({findings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {findings.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-mono text-xs font-bold text-primary">{f.rule_id}</TableCell>
                  <TableCell className="font-medium text-xs text-foreground">{f.title}</TableCell>
                  <TableCell>
                    <Badge className={getSeverityBadgeColor(f.severity)}>{f.severity}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{f.category}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{f.resource_name}</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(f.status)}>{f.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setSelectedFinding(f);
                        setDetailsModalOpen(true);
                      }}
                    >
                      Inspect
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Finding Details Modal */}
      {selectedFinding && (
        <FindingDetailsModal
          finding={selectedFinding}
          open={detailsModalOpen}
          onOpenChange={setDetailsModalOpen}
          onStatusUpdated={fetchAuditData}
        />
      )}
    </div>
  );
}
