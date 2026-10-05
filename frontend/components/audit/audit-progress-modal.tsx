'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, ShieldCheck, AlertCircle, Cpu, Radio } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface AuditProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clusterId: string;
}

const STEPS = [
  'Connecting to Kubernetes API',
  'Collecting namespace metadata',
  'Analyzing Secret specs & types',
  'Evaluating RBAC Roles & Bindings',
  'Checking etcd EncryptionConfiguration',
  'Running KSA-001–KSA-010 security rules',
  'Synthesizing risk severity findings',
  'Audit Execution Completed'
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

        for (let i = 0; i < STEPS.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 320));
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
      <div className="space-y-6 text-slate-100 p-1">
        <div className="flex items-center gap-3 border-b border-cyan-900/30 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 shadow-lg shadow-cyan-950/60">
            <Radio className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-mono text-white flex items-center gap-2">
              Kubernetes Secret Audit Engine
            </h3>
            <p className="text-xs text-slate-400">Executing multi-layer security checks, etcd encryption check & RBAC metadata scan</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold font-mono">
            <span className="text-cyan-400 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              {STEPS[currentStepIndex]}...
            </span>
            <span className="text-slate-300">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2 bg-slate-900 border border-cyan-900/40" />
        </div>

        {/* Step list */}
        <div className="space-y-2 rounded-lg border border-cyan-900/30 bg-slate-950/80 p-4 max-h-56 overflow-y-auto">
          {STEPS.map((step, idx) => {
            const isFinished = idx < currentStepIndex || isDone;
            const isCurrent = idx === currentStepIndex && !isDone;

            return (
              <div key={step} className="flex items-center justify-between text-xs font-mono py-1">
                <span className={isFinished ? 'text-slate-300 font-medium' : (isCurrent ? 'text-cyan-400 font-bold' : 'text-slate-600')}>
                  {step}
                </span>
                {isFinished ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-400 shrink-0" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-800 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="rounded-md bg-red-950/80 border border-red-500/40 p-3 text-xs text-red-300 font-mono flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-cyan-900/20">
          {isDone ? (
            <Button
              onClick={() => {
                onOpenChange(false);
                if (auditId) router.push(`/audits/${auditId}`);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs shadow-lg shadow-emerald-950/50"
            >
              View Complete Audit Findings
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={currentStepIndex === 0}
              className="border-cyan-900/40 text-slate-400 hover:bg-slate-900 text-xs font-mono"
            >
              Run in Background
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
