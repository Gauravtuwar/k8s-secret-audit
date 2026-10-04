'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Report, Audit } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { FileText, Download, Plus, FileCode, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [selectedAuditId, setSelectedAuditId] = useState('');
  const [format, setFormat] = useState<'pdf' | 'json'>('pdf');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchData = async () => {
    try {
      const [reportsData, auditsData] = await Promise.all([
        api.listReports(),
        api.listAudits(),
      ]);
      setReports(reportsData);
      setAudits(auditsData);
      if (auditsData.length > 0) setSelectedAuditId(auditsData[0].id);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateReport = async () => {
    if (!selectedAuditId) return;
    setGenerating(true);
    try {
      await api.createReport(selectedAuditId, format);
      await fetchData();
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Reports</h1>
          <p className="text-xs text-muted-foreground">Generate executive PDF reports & JSON export payloads</p>
        </div>
      </div>

      {/* Generator Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" /> Generate New Security Report
          </CardTitle>
          <CardDescription className="text-xs">
            Select an audit execution run to generate an executive compliance report.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5 flex-1 min-w-[240px]">
              <label className="text-xs font-semibold">Select Audit Execution Run</label>
              <select
                value={selectedAuditId}
                onChange={(e) => setSelectedAuditId(e.target.value)}
                className="w-full rounded-md border bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {audits.map((a) => (
                  <option key={a.id} value={a.id}>
                    Audit {a.id.substring(0, 8)}... — Score: {a.security_score}/100 ({formatDate(a.started_at)})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 w-40">
              <label className="text-xs font-semibold">Output Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as 'pdf' | 'json')}
                className="w-full rounded-md border bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="pdf">Executive PDF Report</option>
                <option value="json">Machine JSON Export</option>
              </select>
            </div>

            <Button onClick={handleGenerateReport} disabled={generating || !selectedAuditId} className="gap-2 text-xs">
              <ShieldCheck className="h-4 w-4" />
              {generating ? 'Compiling Report...' : 'Compile Security Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Compiled Report Library ({reports.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Audit ID</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Download</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-semibold text-xs flex items-center gap-2">
                    {r.format === 'pdf' ? (
                      <FileText className="h-4 w-4 text-red-400" />
                    ) : (
                      <FileCode className="h-4 w-4 text-blue-400" />
                    )}
                    {r.report_name}
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.format === 'pdf' ? 'default' : 'secondary'} className="uppercase text-[10px]">
                      {r.format}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.audit_id.substring(0, 8)}...</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDate(r.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <a href={api.getReportDownloadUrl(r.id)} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                        <Download className="h-3 w-3" /> Download
                      </Button>
                    </a>
                  </TableCell>
                </TableRow>
              ))}
              {reports.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                    No reports generated yet. Click &quot;Compile Security Report&quot; above.
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
