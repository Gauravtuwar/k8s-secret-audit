'use client';

import React from 'react';
import { Info, Sparkles, Server } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Badge } from '@/components/ui/badge';

export function DemoBanner() {
  const { isDemoMode, setIsDemoMode } = useAuth();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-amber-500/10 px-6 py-2.5 text-xs font-medium text-amber-500 dark:bg-amber-950/40 dark:text-amber-400">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
        <span className="font-semibold uppercase tracking-wider">Demo Environment</span>
        <span className="hidden sm:inline text-amber-600 dark:text-amber-300">
          — Displaying synthetic Kubernetes cluster metadata & security rule simulations. No real secrets modified.
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={isDemoMode ? 'warning' : 'outline'} className="text-[10px] uppercase">
          {isDemoMode ? 'Synthetic Data Mode' : 'Real Cluster Mode'}
        </Badge>
        <button
          onClick={() => setIsDemoMode(!isDemoMode)}
          className="rounded border border-amber-500/30 bg-amber-500/20 px-2.5 py-1 text-[11px] font-semibold text-amber-400 hover:bg-amber-500/30 transition-colors"
        >
          {isDemoMode ? 'Switch to Real Audit Mode' : 'Enable Demo Mode'}
        </button>
      </div>
    </div>
  );
}
