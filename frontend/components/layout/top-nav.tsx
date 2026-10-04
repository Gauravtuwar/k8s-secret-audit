'use client';

import React, { useState } from 'react';
import { Search, Bell, Shield, User, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/lib/auth-context';

export function TopNav() {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="flex h-16 w-full items-center justify-between border-b bg-card px-6 text-card-foreground">
      {/* Search Input */}
      <div className="flex w-96 items-center gap-2">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search rules (KSA-001), secrets, RBAC perms, or namespaces..."
            className="pl-9 bg-background/50 border-input text-xs"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Security Status Indicator */}
        <div className="hidden md:flex items-center gap-2 rounded-full border bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border-emerald-500/20">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          SOC Engine Active
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-9 w-9 items-center justify-center rounded-md border bg-background hover:bg-accent transition-colors"
          >
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-md border bg-card p-4 shadow-xl z-50 text-xs">
              <div className="flex items-center justify-between border-b pb-2 font-semibold">
                <span>Audit Notifications</span>
                <span className="text-[10px] text-muted-foreground">3 New</span>
              </div>
              <div className="mt-2 space-y-2">
                <div className="rounded p-2 bg-destructive/10 text-destructive border border-destructive/20">
                  <span className="font-semibold block">KSA-001 Triggered</span>
                  Unverified Encryption at rest detected in production.
                </div>
                <div className="rounded p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <span className="font-semibold block">KSA-002 Alert</span>
                  Wildcard RBAC secret permissions found for ci-cd-deployer.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Info */}
        <div className="flex items-center gap-2 border-l pl-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs">
            {user?.full_name ? user.full_name.charAt(0) : 'S'}
          </div>
          <div className="hidden sm:flex flex-col text-xs">
            <span className="font-semibold">{user?.full_name || 'Security Lead'}</span>
            <span className="text-[10px] text-muted-foreground">SOC Administrator</span>
          </div>
        </div>
      </div>
    </header>
  );
}
