'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Report, Audit } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { FileText, Download, Plus, FileCode, CheckCircle2, ShieldCheck, RefreshCw, FileSpreadsheet, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/toast';

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [selectedAuditId, setSelectedAuditId] = useState('');
  const [format, setFormat] = useState<'pdf' | 'json'>('pdf');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { showToast } = useToast();

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
      const newReport = await api.createReport(selectedAuditId, format);
      await fetchData();
      showToast(
        'Security Report Compiled',
        `Successfully generated executive ${format.toUpperCase()} report for audit execution run.`,
        'success'
      );
    } catch (err: any) {
      console.error('Failed to generate report:', err);
      showToast('Compilation Failed', err.message || 'Unable to compile security report.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyan-900/20 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <h1 className="text-2xl font-bold tracking-tight text-white font-mono">Audit Reports</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Generate executive PDF compliance reports & machine-readable JSON data exports</p>
        </div>
      </div>

      {/* Generator Card */}
      <Card className="glass-panel border-cyan-500/20">
        <CardHeader className="pb-3 border-b border-cyan-900/20">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-2">
            <Plus className="h-4 w-4 text-cyan-400" /> Generate New Security Compliance Report
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Select an audit execution run to generate an executive compliance report with redacted secret metadata.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5 flex-1 min-w-[260px]">
              <label className="text-xs font-semibold text-slate-300 font-mono">Select Audit Execution Run</label>
              <select
                value={selectedAuditId}
                onChange={(e) => setSelectedAuditId(e.target.value)}
                className="w-full rounded-md border border-cyan-900/40 bg-slate-950 p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
              >
                {audits.map((a) => (
                  <option key={a.id} value={a.id} className="bg-slate-900 text-slate-200">
                    Audit Run {a.id.substring(0, 8)}... — Score: {a.security_score}/100 ({formatDate(a.started_at)})
                  </option>
                ))}
                {audits.length === 0 && <option value="">No completed audits available</option>}
              </select>
            </div>

            <div className="space-y-1.5 w-44">
              <label className="text-xs font-semibold text-slate-300 font-mono">Output Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as 'pdf' | 'json')}
                className="w-full rounded-md border border-cyan-900/40 bg-slate-950 p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
              >
                <option value="pdf" className="bg-slate-900">Executive PDF Report</option>
                <option value="json" className="bg-slate-900">Machine JSON Export</option>
              </select>
            </div>

            <Button
              onClick={handleGenerateReport}
              disabled={generating || !selectedAuditId}
              className="gap-2 text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-mono shadow-lg shadow-cyan-950/50"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Compiling Report...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" /> Compile Security Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card className="glass-panel">
        <CardHeader className="pb-3 border-b border-cyan-900/20">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-cyan-400 font-mono flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-cyan-400" /> Compiled Report Library ({reports.length})
            </span>
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-[10px] font-mono">
              Ready for Download
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-cyan-900/20 hover:bg-transparent">
                <TableHead className="text-slate-400 text-xs font-mono">Report Name</TableHead>
                <TableHead className="text-slate-400 text-xs font-mono">Format</TableHead>
                <TableHead className="text-slate-400 text-xs font-mono">Audit ID</TableHead>
                <TableHead className="text-slate-400 text-xs font-mono">Created At</TableHead>
                <TableHead className="text-right text-slate-400 text-xs font-mono">Download</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((r, idx) => (
                <TableRow key={r.id} className="border-cyan-900/20 hover:bg-slate-900/40">
                  <TableCell className="font-semibold text-xs text-white font-mono">
                    <div className="flex items-center gap-2">
                      {r.format === 'pdf' ? (
                        <FileText className="h-4 w-4 text-red-400" />
                      ) : (
                        <FileCode className="h-4 w-4 text-cyan-400" />
                      )}
                      <span>{r.report_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={r.format === 'pdf' ? 'default' : 'secondary'}
                      className="uppercase text-[10px] font-mono"
                    >
                      {r.format}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-400">{r.audit_id.substring(0, 8)}...</TableCell>
                  <TableCell className="text-xs text-slate-400 font-mono">{formatDate(r.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <a href={api.getReportDownloadUrl(r.id)} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-cyan-800/40 text-cyan-300 hover:bg-cyan-950/60 font-mono">
                        <Download className="h-3 w-3" /> Download
                      </Button>
                    </a>
                  </TableCell>
                </TableRow>
              ))}
              {reports.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-xs text-slate-500 font-mono">
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
