'use client';

import React from 'react';
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
  User,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clusters', href: '/clusters', icon: Server },
  { name: 'Audits', href: '/audits', icon: FileSearch },
  { name: 'Findings', href: '/findings', icon: AlertTriangle },
  { name: 'Secrets Inventory', href: '/secrets', icon: Key },
  { name: 'Encryption at Rest', href: '/encryption', icon: Lock },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isDemoMode } = useAuth();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card text-card-foreground">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-foreground">K8s Secret Audit</span>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Enterprise SOC</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-primary/10 text-primary border-l-2 border-primary font-semibold'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <item.icon className={cn('h-4 w-4', isActive ? 'text-primary' : 'text-muted-foreground')} />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer Profile */}
      <div className="border-t p-3">
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-md p-2 hover:bg-accent transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-semibold text-xs">
            {user?.full_name ? user.full_name.charAt(0) : 'A'}
          </div>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-xs font-semibold text-foreground">{user?.full_name || 'SecOps Admin'}</span>
            <span className="truncate text-[10px] text-muted-foreground">{user?.email || 'admin@cybersec.audit'}</span>
          </div>
        </Link>
        <button
          onClick={logout}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border py-1.5 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
