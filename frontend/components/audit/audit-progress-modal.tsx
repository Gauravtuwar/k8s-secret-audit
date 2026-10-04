'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';

interface AuditProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clusterId: string;
}

const STEPS = [
  'Connecting',
  'Collecting namespaces',
  'Analyzing Secrets',
  'Analyzing RBAC',
  'Checking encryption',
  'Running security rules',
  'Generating findings',
  'Completed'
];

export function AuditProgressModal({ open, onOpenChange, clusterId }: AuditProgressModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [auditId, setAuditId] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open || !clusterId) return;

    let isMounted = true;
    setError(null);
    setIsDone(false);
    setCurrentStepIndex(0);

    async function startAudit() {
      try {
        const audit = await api.createAudit(clusterId);
        if (!isMounted) return;
        setAuditId(audit.id);

        // Simulate real step updates for progress visualization
        for (let i = 0; i < STEPS.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 350));
          if (!isMounted) return;
          setCurrentStepIndex(i);
        }

        setIsDone(true);
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Audit execution failed');
        }
      }
    }

    startAudit();

    return () => {
      isMounted = false;
    };
  }, [open, clusterId]);

  const progressPercent = Math.round(((currentStepIndex + 1) / STEPS.length) * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="space-y-6 text-foreground">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Kubernetes Secret Audit Engine</h3>
            <p className="text-xs text-muted-foreground">Executing multi-layer security checks & RBAC metadata scan</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span>{STEPS[currentStepIndex]}...</span>
            <span>{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2.5" />
        </div>

        {/* Step list */}
        <div className="space-y-2 rounded-md border bg-background/50 p-4">
          {STEPS.map((step, idx) => {
            const isFinished = idx < currentStepIndex || isDone;
            const isCurrent = idx === currentStepIndex && !isDone;

            return (
              <div key={step} className="flex items-center justify-between text-xs">
                <span className={isFinished ? 'text-foreground font-medium' : (isCurrent ? 'text-primary font-bold' : 'text-muted-foreground')}>
                  {step}
                </span>
                {isFinished ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          {isDone ? (
            <Button
              onClick={() => {
                onOpenChange(false);
                if (auditId) router.push(`/audits/${auditId}`);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              View Audit Findings
            </Button>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={currentStepIndex === 0}>
              Run in Background
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
