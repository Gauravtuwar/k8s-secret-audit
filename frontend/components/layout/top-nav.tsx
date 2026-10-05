'use client';

import React, { useState } from 'react';
import { Search, Bell, Shield, User, X, CheckCircle2, AlertOctagon, Terminal, ShieldAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/lib/auth-context';
import { Dialog } from '@/components/ui/dialog';

export function TopNav() {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-zinc-800/80 bg-white/90 dark:bg-black/90 px-6 backdrop-blur-xl z-20 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Search Input Trigger */}
      <div className="flex w-96 items-center gap-2">
        <button
          onClick={() => setSearchModalOpen(true)}
          className="flex w-full items-center gap-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-100/80 dark:bg-zinc-950/80 px-3 py-1.5 text-xs text-slate-500 dark:text-slate-400 hover:border-cyan-500/40 hover:text-slate-800 dark:hover:text-slate-200 transition-all shadow-inner"
        >
          <Search className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          <span className="flex-1 text-left">Quick Search rules (KSA-001), secrets, RBAC...</span>
          <kbd className="rounded border border-slate-300 dark:border-zinc-700 bg-slate-200 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Real-Time SOC Sentinel Badge */}
        <div className="hidden md:flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-700 dark:text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]">
          <span className="h-2 w-2 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-ping" />
          SOC Engine Active
        </div>

        {/* Notifications Button & Drawer */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:border-cyan-500/40 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-all text-slate-700 dark:text-slate-300"
          >
            <Bell className="h-4 w-4 text-slate-700 dark:text-slate-300" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-black/95 p-4 shadow-2xl backdrop-blur-xl z-50 text-xs text-slate-900 dark:text-slate-100">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-2.5 font-bold text-slate-900 dark:text-slate-100">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-cyan-600 dark:text-cyan-400" /> Sentinel Notifications
                </span>
                <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[10px] text-cyan-700 dark:text-cyan-300">3 Alerts</span>
              </div>
              <div className="mt-3 space-y-2.5">
                <div className="rounded-lg p-2.5 bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20">
                  <span className="font-bold block text-xs">KSA-001 Critical Alert</span>
                  Identity fallback enabled in etcd EncryptionConfiguration.
                </div>
                <div className="rounded-lg p-2.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  <span className="font-bold block text-xs">KSA-002 RBAC Warning</span>
                  Wildcard secret verbs assigned to ServiceAccount ci-cd-deployer.
                </div>
                <div className="rounded-lg p-2.5 bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                  <span className="font-bold block text-xs">Audit Executed</span>
                  Automated scan finished for prod-us-east-k8s-demo.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Identity Avatar */}
        <div className="flex items-center gap-3 border-l border-slate-200 dark:border-zinc-800 pl-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 font-black text-xs shadow-[0_0_10px_rgba(6,182,212,0.1)]">
            {user?.full_name ? user.full_name.charAt(0) : 'S'}
          </div>
          <div className="hidden sm:flex flex-col text-xs">
            <span className="font-bold text-slate-900 dark:text-slate-100">{user?.full_name || 'SecOps Lead'}</span>
            <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono">Senior Security Engineer</span>
          </div>
        </div>
      </div>

      {/* Quick Search Modal */}
      <Dialog open={searchModalOpen} onOpenChange={setSearchModalOpen}>
        <div className="space-y-4 text-slate-900 dark:text-slate-100">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-zinc-800 pb-3">
            <Search className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            <Input
              type="text"
              placeholder="Type rule code (e.g. KSA-001, KSA-009), namespace, or secret..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 bg-transparent text-sm focus-visible:ring-0 text-slate-900 dark:text-slate-100"
              autoFocus
            />
          </div>

          <div className="space-y-2 text-xs">
            <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Quick Shortcuts</span>
            <div className="grid grid-cols-2 gap-2">
              <a
                href="/findings?search=KSA-001"
                onClick={() => setSearchModalOpen(false)}
                className="p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 hover:border-cyan-500/40 hover:bg-slate-100 dark:hover:bg-black transition-all flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400 block">KSA-001</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Encryption at Rest</span>
                </div>
                <span className="text-[10px] text-red-600 dark:text-red-400 font-bold">Critical</span>
              </a>

              <a
                href="/findings?search=KSA-002"
                onClick={() => setSearchModalOpen(false)}
                className="p-2.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 hover:border-cyan-500/40 hover:bg-slate-100 dark:hover:bg-black transition-all flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400 block">KSA-002</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Broad RBAC Verbs</span>
                </div>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">High</span>
              </a>
            </div>
          </div>
        </div>
      </Dialog>
    </header>
  );
}
