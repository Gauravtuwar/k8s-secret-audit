'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Cluster } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { Server, Plus, Play, RefreshCw, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { AuditProgressModal } from '@/components/audit/audit-progress-modal';
import { useToast } from '@/components/ui/toast';

export default function ClustersPage() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [activeClusterId, setActiveClusterId] = useState<string>('');
  const { toast } = useToast();

  const fetchClusters = async () => {
    try {
      const data = await api.listClusters();
      setClusters(data);
    } catch (err) {
      console.error('Failed to list clusters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, []);

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    try {
      const res = await api.testCluster(id);
      toast('Connectivity Test Completed', res.message, res.success ? 'success' : 'error');
      await fetchClusters();
    } catch (err: any) {
      toast('Connectivity Test Failed', err.message || 'API connection failed', 'error');
    } finally {
      setTestingId(null);
    }
  };

  const handleDeleteCluster = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect and delete this cluster connection?')) return;
    try {
      await api.deleteCluster(id);
      toast('Cluster Connection Removed', 'Disconnected successfully', 'info');
      await fetchClusters();
    } catch (err: any) {
      toast('Failed to Remove Cluster', err.message, 'error');
    }
  };

  const handleTriggerAudit = (clusterId: string) => {
    setActiveClusterId(clusterId);
    setAuditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Kubernetes Clusters</h1>
          <p className="text-xs text-slate-400">Manage connected cluster environments and metadata audit connections</p>
        </div>
        <Link href="/clusters/connect">
          <Button className="gap-2 text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold glow-cyan">
            <Plus className="h-4 w-4" /> Connect New Cluster
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs font-semibold text-slate-400">Loading cluster connections...</div>
      ) : (
        <Card className="glass-panel">
          <CardHeader className="pb-3 border-b border-slate-800/80">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Registered Kubernetes Clusters ({clusters.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800/80 hover:bg-transparent">
                  <TableHead className="text-slate-400 font-bold text-xs uppercase">Cluster Name</TableHead>
                  <TableHead className="text-slate-400 font-bold text-xs uppercase">Mode</TableHead>
                  <TableHead className="text-slate-400 font-bold text-xs uppercase">API Server</TableHead>
                  <TableHead className="text-slate-400 font-bold text-xs uppercase">K8s Version</TableHead>
                  <TableHead className="text-slate-400 font-bold text-xs uppercase">Nodes</TableHead>
                  <TableHead className="text-slate-400 font-bold text-xs uppercase">Namespaces</TableHead>
                  <TableHead className="text-slate-400 font-bold text-xs uppercase">Status</TableHead>
                  <TableHead className="text-slate-400 font-bold text-xs uppercase">Last Audit</TableHead>
                  <TableHead className="text-right text-slate-400 font-bold text-xs uppercase">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clusters.map((c) => (
                  <TableRow key={c.id} className="border-slate-800/60 hover:bg-slate-900/50 transition-colors">
                    <TableCell className="font-bold text-xs text-white flex items-center gap-2">
                      <Server className="h-4 w-4 text-cyan-400" />
                      {c.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.is_demo ? 'warning' : 'default'} className="text-[10px] font-bold uppercase">
                        {c.is_demo ? 'Demo Mode' : 'Real Cluster'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-400 truncate max-w-[180px]">
                      {c.api_server || 'Kubeconfig'}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-200">{c.kubernetes_version}</TableCell>
                    <TableCell className="text-xs font-semibold text-slate-200">{c.node_count}</TableCell>
                    <TableCell className="text-xs font-semibold text-slate-200">{c.namespace_count}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        {c.connection_status === 'Connected' ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                        )}
                        <span className={c.connection_status === 'Connected' ? 'text-emerald-400' : 'text-red-400'}>
                          {c.connection_status}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">{formatDate(c.last_audit_at)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 px-2.5 text-xs gap-1 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 font-bold border border-cyan-500/30"
                        onClick={() => handleTriggerAudit(c.id)}
                      >
                        <Play className="h-3 w-3 fill-current" /> Audit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2.5 text-xs gap-1 border-slate-700 hover:border-cyan-500/40 text-slate-200"
                        disabled={testingId === c.id}
                        onClick={() => handleTestConnection(c.id)}
                      >
                        <RefreshCw className={`h-3 w-3 ${testingId === c.id ? 'animate-spin' : ''}`} /> Test
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => handleDeleteCluster(c.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {clusters.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-xs text-slate-500">
                      No Kubernetes clusters connected yet. Click &quot;Connect New Cluster&quot; to begin.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {auditModalOpen && (
        <AuditProgressModal
          open={auditModalOpen}
          onOpenChange={(op) => {
            setAuditModalOpen(op);
            if (!op) fetchClusters();
          }}
          clusterId={activeClusterId}
        />
      )}
    </div>
  );
}
