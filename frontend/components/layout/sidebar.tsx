'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldAlert,
  LayoutDashboard,
  Server,
  FileSearch,
  AlertTriangle,
  Key,
  Lock,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, badge: null },
  { name: 'Clusters', href: '/clusters', icon: Server, badge: 'Live' },
  { name: 'Audits', href: '/audits', icon: FileSearch, badge: null },
  { name: 'Findings', href: '/findings', icon: AlertTriangle, badge: 'SOC' },
  { name: 'Secrets Inventory', href: '/secrets', icon: Key, badge: 'Safe' },
  { name: 'Encryption at Rest', href: '/encryption', icon: Lock, badge: 'etcd' },
  { name: 'Reports', href: '/reports', icon: FileText, badge: 'PDF' },
  { name: 'Settings', href: '/settings', icon: Settings, badge: null },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-zinc-800/80 bg-black/90 text-slate-100 backdrop-blur-xl transition-all duration-300 z-30',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-7 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 text-slate-300 shadow-md hover:border-cyan-500 hover:text-cyan-400 transition-colors"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-zinc-800/80 px-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 glow-cyan">
          <ShieldAlert className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
              K8s SecAudit <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400/80">
              Cloud SOC Sentinel
            </span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all duration-200',
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-bold'
                  : 'text-slate-400 hover:bg-zinc-900/80 hover:text-slate-200 hover:border-zinc-800 border border-transparent'
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon
                className={cn(
                  'h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110',
                  isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-400'
                )}
              />
              {!collapsed && <span className="flex-1 truncate">{item.name}</span>}

              {!collapsed && item.badge && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide',
                    isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-zinc-800 text-slate-400'
                  )}
                >
                  {item.badge}
                </span>
              )}

              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Live SOC Status Card */}
      {!collapsed && (
        <div className="mx-3 my-2 rounded-lg border border-zinc-800/80 bg-zinc-950/80 p-3 text-[11px] backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Activity className="h-3.5 w-3.5 animate-pulse" /> Sentinel Mode
            </span>
            <span className="text-[10px] text-slate-500">v1.2.0</span>
          </div>
          <p className="text-[10px] text-slate-400">Continuous etcd encryption & RBAC monitoring active.</p>
        </div>
      )}

      {/* Footer Profile & Sign Out */}
      <div className="border-t border-zinc-800/80 p-3">
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-lg p-2 hover:bg-zinc-900/80 transition-colors border border-transparent hover:border-zinc-800"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 font-black text-xs border border-cyan-500/30">
            {user?.full_name ? user.full_name.charAt(0) : 'S'}
          </div>
          {!collapsed && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="truncate text-xs font-bold text-white">{user?.full_name || 'SecOps Lead'}</span>
              <span className="truncate text-[10px] text-slate-400">{user?.email || 'admin@cybersec.audit'}</span>
            </div>
          )}
        </Link>
        <button
          onClick={logout}
          className={cn(
            'mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-800 py-1.5 text-xs font-semibold text-slate-400 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-colors',
            collapsed && 'px-0'
          )}
          title="Sign Out"
        >
          <LogOut className="h-3.5 w-3.5" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
