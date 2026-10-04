'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Cluster } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { Server, Plus, Play, RefreshCw, Trash2, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import { AuditProgressModal } from '@/components/audit/audit-progress-modal';

export default function ClustersPage() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [activeClusterId, setActiveClusterId] = useState<string>('');

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
      await api.testCluster(id);
      await fetchClusters();
    } catch (err) {
      console.error('Test failed:', err);
    } finally {
      setTestingId(null);
    }
  };

  const handleDeleteCluster = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect and delete this cluster connection?')) return;
    try {
      await api.deleteCluster(id);
      await fetchClusters();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleTriggerAudit = (clusterId: string) => {
    setActiveClusterId(clusterId);
    setAuditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kubernetes Clusters</h1>
          <p className="text-xs text-muted-foreground">Manage connected Kubernetes environments and audit connections</p>
        </div>
        <Link href="/clusters/connect">
          <Button className="gap-2 text-xs">
            <Plus className="h-4 w-4" /> Connect New Cluster
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-muted-foreground">Loading clusters...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Connected Kubernetes Clusters ({clusters.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cluster Name</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>API Server</TableHead>
                    <TableHead>K8s Version</TableHead>
                    <TableHead>Nodes</TableHead>
                    <TableHead>Namespaces</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Audit</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clusters.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-semibold text-xs flex items-center gap-2">
                        <Server className="h-4 w-4 text-primary" />
                        {c.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.is_demo ? 'warning' : 'default'} className="text-[10px]">
                          {c.is_demo ? 'Demo Mode' : 'Real Cluster'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[180px]">
                        {c.api_server || 'Kubeconfig'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{c.kubernetes_version}</TableCell>
                      <TableCell className="text-xs">{c.node_count}</TableCell>
                      <TableCell className="text-xs">{c.namespace_count}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                          {c.connection_status === 'Connected' ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                          )}
                          <span>{c.connection_status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(c.last_audit_at)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 px-2.5 text-xs gap-1"
                          onClick={() => handleTriggerAudit(c.id)}
                        >
                          <Play className="h-3 w-3" /> Audit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2.5 text-xs gap-1"
                          disabled={testingId === c.id}
                          onClick={() => handleTestConnection(c.id)}
                        >
                          <RefreshCw className={`h-3 w-3 ${testingId === c.id ? 'animate-spin' : ''}`} /> Test
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteCluster(c.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {clusters.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-xs text-muted-foreground">
                        No Kubernetes clusters connected yet. Click &quot;Connect New Cluster&quot; to begin.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
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
