'use client';

import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Finding } from '@/types';
import { getSeverityBadgeColor, getStatusBadgeColor, formatDate } from '@/lib/utils';
import { AlertTriangle, ExternalLink, ShieldCheck, Check, Clock } from 'lucide-react';
import { api } from '@/lib/api-client';

interface FindingDetailsModalProps {
  finding: Finding | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdated?: () => void;
}

export function FindingDetailsModal({ finding, open, onOpenChange, onStatusUpdated }: FindingDetailsModalProps) {
  const [updating, setUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>(finding?.status || 'Open');

  if (!finding) return null;

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      await api.updateFindingStatus(finding.id, newStatus);
      setCurrentStatus(newStatus);
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      console.error('Failed to update finding status:', err);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="space-y-6 text-foreground max-h-[80vh] overflow-y-auto pr-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                {finding.rule_id}
              </span>
              <Badge className={getSeverityBadgeColor(finding.severity)}>{finding.severity}</Badge>
              <Badge className={getStatusBadgeColor(currentStatus)}>{currentStatus}</Badge>
            </div>
            <h2 className="text-lg font-bold">{finding.title}</h2>
            <p className="text-xs text-muted-foreground">Category: {finding.category} · Namespace: {finding.namespace}</p>
          </div>
        </div>

        {/* Description & Why it Matters */}
        <div className="space-y-3">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</h4>
            <p className="mt-1 text-xs leading-relaxed text-foreground">{finding.description}</p>
          </div>

          {finding.rationale && (
            <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-400">
              <span className="font-bold block mb-0.5">Why It Matters (Rationale):</span>
              {finding.rationale}
            </div>
          )}
        </div>

        {/* Affected Resource & Evidence */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-md border p-3 bg-background/50">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Affected Resource</span>
            <div className="mt-1 font-mono text-xs font-semibold">
              {finding.resource_type} / <span className="text-primary">{finding.resource_name}</span>
            </div>
            <span className="text-[10px] text-muted-foreground block mt-1">Namespace: {finding.namespace}</span>
          </div>

          <div className="rounded-md border p-3 bg-background/50">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Detection & Audit ID</span>
            <div className="mt-1 text-xs">
              First Detected: {formatDate(finding.first_detected)}
            </div>
            <span className="text-[10px] text-muted-foreground block mt-1 font-mono">Audit: {finding.audit_id}</span>
          </div>
        </div>

        {/* Technical Evidence */}
        {finding.evidence && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Empirical Evidence</h4>
            <pre className="rounded-md border bg-slate-950 p-3 text-[11px] font-mono text-slate-200 overflow-x-auto">
              {JSON.stringify(finding.evidence, null, 2)}
            </pre>
          </div>
        )}

        {/* Recommendation & Remediation */}
        <div className="space-y-3">
          <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Recommendation</h4>
            <p className="mt-1 text-xs text-foreground">{finding.recommendation}</p>
          </div>

          {finding.remediation && (
            <div className="rounded-md border bg-card p-3">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Remediation Action Plan</h4>
              <p className="mt-1 text-xs font-mono bg-background p-2 rounded border text-foreground">{finding.remediation}</p>
            </div>
          )}
        </div>

        {/* References */}
        {finding.references && finding.references.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Official Documentation & References</h4>
            <div className="space-y-1">
              {finding.references.map((ref, i) => (
                <a
                  key={i}
                  href={ref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {ref}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Status Action Buttons */}
        <div className="border-t pt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">Change Status:</span>
            {['Open', 'Acknowledged', 'Resolved', 'False Positive'].map((st) => (
              <Button
                key={st}
                variant={currentStatus === st ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                disabled={updating}
                onClick={() => handleStatusChange(st)}
              >
                {st}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
