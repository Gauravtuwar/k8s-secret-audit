'use client';

import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Finding } from '@/types';
import { getSeverityBadgeColor, getStatusBadgeColor, formatDate } from '@/lib/utils';
import { AlertTriangle, ExternalLink, ShieldCheck, Check, Clock, ShieldAlert, Cpu, Terminal, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useToast } from '@/components/ui/toast';

interface FindingDetailsModalProps {
  finding: Finding | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdated?: () => void;
}

export function FindingDetailsModal({ finding, open, onOpenChange, onStatusUpdated }: FindingDetailsModalProps) {
  const [updating, setUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>(finding?.status || 'Open');
  const { showToast } = useToast();

  if (!finding) return null;

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      await api.updateFindingStatus(finding.id, newStatus);
      setCurrentStatus(newStatus);
      showToast('Finding Status Updated', `Status changed to ${newStatus}`, 'success');
      if (onStatusUpdated) onStatusUpdated();
    } catch (err: any) {
      console.error('Failed to update finding status:', err);
      showToast('Update Failed', err.message || 'Failed to update finding status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="space-y-6 text-slate-100 max-h-[80vh] overflow-y-auto pr-2 p-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-cyan-900/30 pb-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40">
                {finding.rule_id}
              </span>
              <Badge className={`${getSeverityBadgeColor(finding.severity)} text-[10px] font-mono uppercase px-2 py-0.5`}>
                {finding.severity}
              </Badge>
              <Badge className={`${getStatusBadgeColor(currentStatus)} text-[10px] font-mono uppercase px-2 py-0.5`}>
                {currentStatus}
              </Badge>
            </div>
            <h2 className="text-lg font-bold font-mono text-white">{finding.title}</h2>
            <p className="text-xs text-slate-400 font-mono">
              Category: <span className="text-slate-300">{finding.category}</span> · Namespace: <span className="text-cyan-400">{finding.namespace}</span>
            </p>
          </div>
        </div>

        {/* Description & Why it Matters */}
        <div className="space-y-3">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 font-mono">Description</h4>
            <p className="mt-1 text-xs leading-relaxed text-slate-300 font-sans">{finding.description}</p>
          </div>

          {finding.rationale && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-300 font-mono">
              <span className="font-bold block text-amber-400 mb-1 flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-400" /> Security Impact & Rationale:
              </span>
              {finding.rationale}
            </div>
          )}
        </div>

        {/* Affected Resource & Evidence */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-cyan-900/30 p-3 bg-slate-950/60">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block font-mono">Affected Resource</span>
            <div className="mt-1 font-mono text-xs font-semibold">
              {finding.resource_type} / <span className="text-cyan-400">{finding.resource_name}</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1 font-mono">Namespace: {finding.namespace}</span>
          </div>

          <div className="rounded-lg border border-cyan-900/30 p-3 bg-slate-950/60">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block font-mono">Detection Timestamp</span>
            <div className="mt-1 text-xs font-mono text-slate-300">
              First Detected: {formatDate(finding.first_detected)}
            </div>
            <span className="text-[10px] text-slate-500 block mt-1 font-mono">Audit: {finding.audit_id}</span>
          </div>
        </div>

        {/* Technical Evidence */}
        {finding.evidence && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 font-mono mb-1 flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5" /> Empirical Evidence (Metadata Only)
            </h4>
            <pre className="rounded-lg border border-cyan-900/40 bg-slate-950 p-3 text-[11px] font-mono text-cyan-300 overflow-x-auto">
              {JSON.stringify(finding.evidence, null, 2)}
            </pre>
          </div>
        )}

        {/* Recommendation & Remediation */}
        <div className="space-y-3">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-3">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> Recommendation
            </h4>
            <p className="mt-1 text-xs text-slate-200 font-sans">{finding.recommendation}</p>
          </div>

          {finding.remediation && (
            <div className="rounded-lg border border-cyan-900/30 bg-slate-950/80 p-3">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">Remediation Action Plan</h4>
              <p className="mt-1.5 text-xs font-mono bg-slate-900 p-2.5 rounded border border-slate-800 text-slate-200">{finding.remediation}</p>
            </div>
          )}
        </div>

        {/* References */}
        {finding.references && finding.references.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono mb-1">Official References</h4>
            <div className="space-y-1">
              {finding.references.map((ref, i) => (
                <a
                  key={i}
                  href={ref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-cyan-400 underline underline-offset-2 hover:text-cyan-300 font-mono"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {ref}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Status Action Buttons */}
        <div className="border-t border-cyan-900/30 pt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 font-mono">Change Status:</span>
            {['Open', 'Acknowledged', 'Resolved', 'False Positive'].map((st) => (
              <Button
                key={st}
                variant={currentStatus === st ? 'default' : 'outline'}
                size="sm"
                className={`h-7 text-xs font-mono ${
                  currentStatus === st
                    ? 'bg-cyan-600 text-white'
                    : 'border-cyan-900/40 text-slate-300 hover:bg-slate-900'
                }`}
                disabled={updating}
                onClick={() => handleStatusChange(st)}
              >
                {updating && currentStatus === st ? (
                  <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                ) : null}
                {st}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="border-cyan-900/40 text-slate-300 text-xs font-mono">
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
