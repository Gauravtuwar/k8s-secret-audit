'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Settings, Shield, Lock, Bell, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
          <p className="text-xs text-muted-foreground">Configure global security audit policies & zero-trust inspection parameters</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {saved && (
          <div className="rounded-md bg-emerald-500/10 p-3 text-xs text-emerald-400 border border-emerald-500/20 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Audit system preferences updated successfully.</span>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Rule Engine Thresholds
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Stale Secret Threshold (Days)</label>
                <Input type="number" defaultValue={90} min={30} max={365} />
                <span className="text-[10px] text-muted-foreground">Flags secrets unchanged beyond this age (KSA-005)</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Multi-Workload Reference Limit</label>
                <Input type="number" defaultValue={3} min={2} max={10} />
                <span className="text-[10px] text-muted-foreground font-medium">Triggers KSA-004 when shared across workloads</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-500" /> etcd Verification & Zero-Trust Policies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-md border p-3 bg-background/50">
              <div>
                <span className="text-xs font-semibold block">Strict Secret Value Masking</span>
                <span className="text-[11px] text-muted-foreground">Never allow fetching or rendering secret data bytes</span>
              </div>
              <Badge variant="success" className="text-[10px]">ENFORCED (ALWAYS ON)</Badge>
            </div>

            <div className="flex items-center justify-between rounded-md border p-3 bg-background/50">
              <div>
                <span className="text-xs font-semibold block">KMS Provider Priority Enforcement</span>
                <span className="text-[11px] text-muted-foreground">Flag identity fallback listed prior to KMS v2</span>
              </div>
              <Badge variant="success" className="text-[10px]">ENABLED</Badge>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-end">
            <Button type="submit" className="text-xs">
              Save Security Preferences
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
