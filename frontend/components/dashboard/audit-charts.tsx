'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface AuditChartsProps {
  summaryData: any;
}

const SEVERITY_COLORS: Record<string, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#f59e0b',
  Low: '#3b82f6',
};

const ENCRYPTION_COLORS: Record<string, string> = {
  PASS: '#10b981',
  FAIL: '#ef4444',
  WARNING: '#f59e0b',
  UNKNOWN: '#64748b',
};

export function AuditCharts({ summaryData }: AuditChartsProps) {
  const severityData = Object.entries(summaryData?.severity_breakdown || {}).map(([key, val]) => ({
    name: key,
    count: val,
    fill: SEVERITY_COLORS[key] || '#94a3b8'
  }));

  const scoreHistoryData = summaryData?.score_history || [
    { date: 'Run 1', score: 65 },
    { date: 'Run 2', score: 72 },
    { date: 'Run 3', score: 84 },
    { date: 'Run 4', score: 91 }
  ];

  const encryptionData = Object.entries(summaryData?.encryption_status_summary || {}).map(([key, val]) => ({
    name: key,
    value: val,
    fill: ENCRYPTION_COLORS[key] || '#94a3b8'
  }));

  const namespaceData = summaryData?.namespace_breakdown || [
    { namespace: 'production', findings_count: 5 },
    { namespace: 'kube-system', findings_count: 3 },
    { namespace: 'staging', findings_count: 2 },
    { namespace: 'default', findings_count: 1 }
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* 1. Findings by Severity */}
      <Card className="glass-panel p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
            1. Rule Violation Severity Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} fontWeight={600} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 2. Security Score Over Time */}
      <Card className="glass-panel p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
            2. Application Security Score Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={scoreHistoryData}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} fontWeight={600} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                />
                <Area type="monotone" dataKey="score" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#scoreGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 3. Encryption Status */}
      <Card className="glass-panel p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
            3. Control Plane etcd Encryption Posture
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={encryptionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={6}
                  dataKey="value"
                >
                  {encryptionData.map((entry, index) => (
                    <Cell key={`cell-enc-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 4. Findings by Namespace */}
      <Card className="glass-panel p-6">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
            4. Namespace Vulnerability Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={namespaceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <YAxis dataKey="namespace" type="category" stroke="#94a3b8" fontSize={11} width={90} fontWeight={600} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                />
                <Bar dataKey="findings_count" fill="#3b82f6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
