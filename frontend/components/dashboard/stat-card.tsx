import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  description?: string;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  iconColor?: string;
  glowColor?: 'cyan' | 'blue' | 'red' | 'amber' | 'emerald';
}

export function StatCard({
  title,
  value,
  description,
  change,
  isPositive,
  icon: Icon,
  iconColor = 'text-cyan-400',
  glowColor = 'cyan'
}: StatCardProps) {
  const glowClasses = {
    cyan: 'hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]',
    blue: 'hover:border-blue-500/40 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]',
    red: 'hover:border-red-500/40 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]',
    amber: 'hover:border-amber-500/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]',
    emerald: 'hover:border-emerald-500/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]',
  };

  return (
    <Card className={cn('glass-panel-interactive relative overflow-hidden p-6', glowClasses[glowColor])}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</span>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/80 border border-slate-800 shadow-inner">
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-3xl font-black tracking-tight text-white">
          <AnimatedCounter value={value} duration={1200} />
        </span>
        {change && (
          <span
            className={cn(
              'text-[11px] font-extrabold px-2 py-0.5 rounded-full border',
              isPositive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-red-500/10 text-red-400 border-red-500/30'
            )}
          >
            {change}
          </span>
        )}
      </div>

      {description && <p className="mt-1 text-[11px] text-slate-400 font-medium">{description}</p>}
    </Card>
  );
}
