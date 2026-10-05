'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ShieldCheck, Server, Key, Sparkles, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';

export default function ConnectClusterPage() {
  const router = useRouter();
  const { toast } = useToast();
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
        const res = {
          success: true,
          message: 'Demo Environment synthetic cluster connection test successful.'
        };
        setTestResult(res);
        toast('Connection Test Successful', res.message, 'success');
      } else {
        const created = await api.connectCluster({
          name: name || 'Test-Connection-Temp',
          auth_type: authType,
          kubeconfig,
          api_server: apiServer,
          token
        });
        const testRes = await api.testCluster(created.id);
        setTestResult(testRes);
        toast(
          testRes.success ? 'Connectivity Verified' : 'Connection Failed',
          testRes.message,
          testRes.success ? 'success' : 'error'
        );
      }
    } catch (err: any) {
      const msg = err.message || 'Connection test failed. Check API server URL and credentials.';
      setError(msg);
      toast('Connection Test Failed', msg, 'error');
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
      toast('Cluster Connected', 'Kubernetes cluster environment registered successfully.', 'success');
      router.push('/clusters');
    } catch (err: any) {
      setError(err.message || 'Failed to connect cluster.');
      toast('Connection Failed', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/clusters">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Connect Kubernetes Cluster</h1>
          <p className="text-xs text-slate-400">Establish safe metadata connection for Secret & etcd Encryption auditing</p>
        </div>
      </div>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Authentication Method</CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Select credential type. Credentials are used strictly for metadata inspection. Secret payload values are NEVER retrieved.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Auth Type Switcher */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setAuthType('kubeconfig')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-xs font-bold gap-2 transition-all ${
                  authType === 'kubeconfig'
                    ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300 glow-cyan'
                    : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:bg-slate-900'
                }`}
              >
                <Server className="h-5 w-5" />
                A. Local Kubeconfig
              </button>

              <button
                type="button"
                onClick={() => setAuthType('token')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-xs font-bold gap-2 transition-all ${
                  authType === 'token'
                    ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300 glow-cyan'
                    : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:bg-slate-900'
                }`}
              >
                <Key className="h-5 w-5" />
                B. API Server & Token
              </button>

              <button
                type="button"
                onClick={() => setAuthType('demo')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-xs font-bold gap-2 transition-all ${
                  authType === 'demo'
                    ? 'border-amber-500 bg-amber-500/15 text-amber-300 glow-amber'
                    : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:bg-slate-900'
                }`}
              >
                <Sparkles className="h-5 w-5 text-amber-400" />
                C. Demo Mode
              </button>
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {testResult && (
              <div
                className={`rounded-lg p-3 text-xs border flex items-center gap-2 ${
                  testResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/20 text-red-300'
                }`}
              >
                {testResult.success ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                <span>{testResult.message}</span>
              </div>
            )}

            {/* Common Cluster Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Cluster Identifier Name</label>
              <Input
                type="text"
                placeholder="e.g. prod-us-east-eks"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={authType !== 'demo'}
                className="bg-slate-900/80 border-slate-800 text-xs text-white"
              />
            </div>

            {/* Method A: Kubeconfig */}
            {authType === 'kubeconfig' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Kubeconfig YAML Content</label>
                <textarea
                  rows={7}
                  value={kubeconfig}
                  onChange={(e) => setKubeconfig(e.target.value)}
                  placeholder={`apiVersion: v1\nclusters:\n- cluster:\n    server: https://10.0.0.1:6443...`}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  required
                />
              </div>
            )}

            {/* Method B: API Server & Token */}
            {authType === 'token' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Kubernetes API Server Endpoint URL</label>
                  <Input
                    type="url"
                    placeholder="https://kubernetes.example.com:6443"
                    value={apiServer}
                    onChange={(e) => setApiServer(e.target.value)}
                    required
                    className="bg-slate-900/80 border-slate-800 text-xs text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">ServiceAccount Bearer Token</label>
                  <textarea
                    rows={4}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="eyJhbGciOiJSUzI1NiIsImtpZCI6..."
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    required
                  />
                </div>
              </div>
            )}

            {/* Method C: Demo Mode */}
            {authType === 'demo' && (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-300 space-y-1">
                <span className="font-bold block text-amber-400">Synthetic Demo Cluster Selected</span>
                <p>Loads a pre-configured Kubernetes 1.29 cluster simulation with 12 nodes, 8 namespaces, and synthetic security rule findings.</p>
              </div>
            )}

            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-[11px] text-slate-400">
              <b className="text-slate-300">Zero-Trust Notice:</b> Raw credentials are never stored unencrypted in plain database text or exposed in frontend code. Secret data values are strictly redacted.
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t border-slate-800/80 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing || (authType !== 'demo' && !name)}
              className="text-xs border-slate-700 hover:border-cyan-500/40 text-slate-200"
            >
              {testing ? 'Testing Connectivity...' : 'Test Connection'}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="text-xs gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold glow-cyan"
            >
              <ShieldCheck className="h-4 w-4" />
              {loading ? 'Connecting...' : 'Save & Connect Cluster'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
