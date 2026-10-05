'use client';

import React from 'react';
import { Sparkles, Server, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';

export function DemoBanner() {
  const { isDemoMode, setIsDemoMode } = useAuth();
  const { toast } = useToast();

  const handleToggle = () => {
    const nextVal = !isDemoMode;
    setIsDemoMode(nextVal);
    toast(
      nextVal ? 'Demo Mode Activated' : 'Real Cluster Mode Activated',
      nextVal ? 'Displaying synthetic cluster simulation & findings.' : 'Connected to live Kubernetes cluster API.',
      nextVal ? 'info' : 'success'
    );
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/30 bg-amber-950/40 px-6 py-2.5 text-xs font-semibold text-amber-300 backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
        </div>
        <span className="font-extrabold uppercase tracking-wider text-amber-400">Demo Environment Active</span>
        <span className="hidden md:inline text-slate-300 text-[11px] font-normal">
          — Displaying synthetic Kubernetes cluster metadata & security rule simulations. No live cluster modified.
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant={isDemoMode ? 'warning' : 'outline'} className="text-[10px] uppercase font-bold tracking-wider">
          {isDemoMode ? 'Synthetic Data Mode' : 'Real Cluster Mode'}
        </Badge>

        <button
          onClick={handleToggle}
          className="rounded-lg border border-amber-500/40 bg-amber-500/20 px-3 py-1 text-[11px] font-bold text-amber-300 hover:bg-amber-500/30 hover:border-amber-400 transition-all shadow-[0_0_10px_rgba(245,158,11,0.15)]"
        >
          {isDemoMode ? 'Switch to Real Audit Mode' : 'Enable Demo Mode'}
        </button>
      </div>
    </div>
  );
}
