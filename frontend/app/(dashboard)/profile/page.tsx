'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { User, ShieldCheck, Mail, Calendar, Key } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Profile & Credentials</h1>
          <p className="text-xs text-muted-foreground">Security analyst identity and active session permissions</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xl">
              {user?.full_name ? user.full_name.charAt(0) : 'S'}
            </div>
            <div>
              <CardTitle className="text-lg">{user?.full_name || 'SecOps Administrator'}</CardTitle>
              <CardDescription className="text-xs">{user?.email || 'admin@cybersec.audit'}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-md border p-3 bg-background/50 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <div>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Security Role</span>
                <span className="text-xs font-bold text-foreground">Lead Cybersec Auditor</span>
              </div>
            </div>

            <div className="rounded-md border p-3 bg-background/50 flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Account Created</span>
                <span className="text-xs font-medium text-foreground">{formatDate(user?.created_at)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-md border p-4 bg-slate-900 text-white space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" /> Active Session Token
              </span>
              <Badge variant="success" className="text-[10px]">JWT Valid</Badge>
            </div>
            <p className="text-[11px] font-mono text-slate-400 truncate">
              Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NzA...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
