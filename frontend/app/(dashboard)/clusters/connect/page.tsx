'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ShieldCheck, Server, Key, Sparkles, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ConnectClusterPage() {
  const router = useRouter();
  const [authType, setAuthType] = useState<'kubeconfig' | 'token' | 'demo'>('kubeconfig');
  const [name, setName] = useState('');
  const [kubeconfig, setKubeconfig] = useState('');
  const [apiServer, setApiServer] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [error, setError] = useState('');

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setError('');

    try {
      if (authType === 'demo') {
        setTestResult({
          success: true,
          message: 'Demo Environment synthetic cluster connection successful.'
        });
      } else {
        // Submit temporary connection payload for verification
        const created = await api.connectCluster({
          name: name || 'Test-Connection-Temp',
          auth_type: authType,
          kubeconfig,
          api_server: apiServer,
          token
        });
        const testRes = await api.testCluster(created.id);
        setTestResult(testRes);
      }
    } catch (err: any) {
      setError(err.message || 'Connection test failed. Check API server URL and credentials.');
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.connectCluster({
        name: name || (authType === 'demo' ? 'prod-us-east-k8s-demo' : 'prod-k8s-cluster'),
        auth_type: authType,
        kubeconfig,
        api_server: apiServer,
        token
      });
      router.push('/clusters');
    } catch (err: any) {
      setError(err.message || 'Failed to connect cluster.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/clusters">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Connect Kubernetes Cluster</h1>
          <p className="text-xs text-muted-foreground">Establish safe metadata connection for Secret & etcd Encryption auditing</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Authentication Method</CardTitle>
          <CardDescription className="text-xs">
            Select credential type. Credentials are used strictly for metadata inspection. Secret values are NEVER retrieved.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Auth Type Switcher */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setAuthType('kubeconfig')}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border text-xs font-semibold gap-2 transition-all ${
                  authType === 'kubeconfig' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'
                }`}
              >
                <Server className="h-5 w-5" />
                A. Local Kubeconfig
              </button>

              <button
                type="button"
                onClick={() => setAuthType('token')}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border text-xs font-semibold gap-2 transition-all ${
                  authType === 'token' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'
                }`}
              >
                <Key className="h-5 w-5" />
                B. API Server & Token
              </button>

              <button
                type="button"
                onClick={() => setAuthType('demo')}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border text-xs font-semibold gap-2 transition-all ${
                  authType === 'demo' ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-border hover:bg-accent'
                }`}
              >
                <Sparkles className="h-5 w-5 text-amber-400" />
                C. Demo Mode
              </button>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {testResult && (
              <div className={`rounded-md p-3 text-xs border flex items-center gap-2 ${
                testResult.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                {testResult.success ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Common Cluster Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Cluster Name</label>
              <Input
                type="text"
                placeholder="e.g. prod-us-east-eks"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={authType !== 'demo'}
              />
            </div>

            {/* Method A: Kubeconfig */}
            {authType === 'kubeconfig' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Kubeconfig YAML Text</label>
                <textarea
                  rows={8}
                  value={kubeconfig}
                  onChange={(e) => setKubeconfig(e.target.value)}
                  placeholder={`apiVersion: v1\nclusters:\n- cluster:\n    server: https://10.0.0.1:6443...`}
                  className="w-full rounded-md border border-input bg-background/50 p-3 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  required
                />
              </div>
            )}

            {/* Method B: API Server & Token */}
            {authType === 'token' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">Kubernetes API Server URL</label>
                  <Input
                    type="url"
                    placeholder="https://kubernetes.example.com:6443"
                    value={apiServer}
                    onChange={(e) => setApiServer(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">ServiceAccount Bearer Token</label>
                  <textarea
                    rows={4}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="eyJhbGciOiJSUzI1NiIsImtpZCI6..."
                    className="w-full rounded-md border border-input bg-background/50 p-3 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    required
                  />
                </div>
              </div>
            )}

            {/* Method C: Demo Mode */}
            {authType === 'demo' && (
              <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-400 space-y-1">
                <span className="font-bold block">Synthetic Demo Cluster Selected</span>
                <p>Loads a pre-configured Kubernetes 1.29 cluster simulation with 12 nodes, 8 namespaces, and synthetic security rule findings.</p>
              </div>
            )}

            <div className="rounded-md bg-muted/40 p-3 text-[11px] text-muted-foreground">
              <b>Security Protection Notice:</b> Raw kubeconfigs and API tokens are never exposed in frontend code or stored in plaintext. Secret data/stringData payload values are strictly redacted.
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing || (authType !== 'demo' && !name)}
              className="text-xs"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </Button>
            <Button type="submit" disabled={loading} className="text-xs gap-2">
              <ShieldCheck className="h-4 w-4" />
              {loading ? 'Connecting...' : 'Save & Connect Cluster'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
