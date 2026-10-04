'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Finding } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { getSeverityBadgeColor, getStatusBadgeColor, formatDate } from '@/lib/utils';
import { Search, Filter, AlertTriangle, ArrowUpDown } from 'lucide-react';
import { FindingDetailsModal } from '@/components/audit/finding-details-modal';

export default function FindingsPage() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchFindings = async () => {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (severityFilter) params.severity = severityFilter;
      if (statusFilter) params.status = statusFilter;

      const data = await api.listFindings(params);
      setFindings(data);
    } catch (err) {
      console.error('Failed to list findings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFindings();
  }, [search, severityFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Security Findings</h1>
          <p className="text-xs text-muted-foreground">KSA-001 through KSA-010 security rule violation registry</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card p-4 text-card-foreground">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Filter by rule ID, title, or resource name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="rounded-md border bg-background px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border bg-background px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Acknowledged">Acknowledged</option>
              <option value="Resolved">Resolved</option>
              <option value="False Positive">False Positive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Findings Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Finding Records ({findings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Finding ID</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Namespace</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>First Detected</TableHead>
                <TableHead>Last Detected</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {findings.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-mono text-xs font-bold text-primary">{f.rule_id}</TableCell>
                  <TableCell>
                    <Badge className={getSeverityBadgeColor(f.severity)}>{f.severity}</Badge>
                  </TableCell>
                  <TableCell className="font-medium text-xs text-foreground max-w-[220px] truncate">{f.title}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{f.namespace}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{f.resource_name}</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(f.status)}>{f.status}</Badge>
                  </TableCell>
                  <TableCell className="text-[11px] text-muted-foreground">{formatDate(f.first_detected)}</TableCell>
                  <TableCell className="text-[11px] text-muted-foreground">{formatDate(f.last_detected)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setSelectedFinding(f);
                        setModalOpen(true);
                      }}
                    >
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {findings.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-xs text-muted-foreground">
                    No matching security findings discovered.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Modal */}
      {selectedFinding && (
        <FindingDetailsModal
          finding={selectedFinding}
          open={modalOpen}
          onOpenChange={setModalOpen}
          onStatusUpdated={fetchFindings}
        />
      )}
    </div>
  );
}
