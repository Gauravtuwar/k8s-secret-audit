import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  iconColor?: string;
}

export function StatCard({ title, value, description, change, isPositive, icon: Icon, iconColor = 'text-primary' }: StatCardProps) {
  return (
    <Card className="hover:border-primary/40 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</span>
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg bg-secondary', iconColor)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-2xl font-bold tracking-tight text-foreground">{value}</span>
          {change && (
            <span
              className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded',
                isPositive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              )}
            >
              {change}
            </span>
          )}
        </div>
        {description && <p className="mt-1 text-[11px] text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}
