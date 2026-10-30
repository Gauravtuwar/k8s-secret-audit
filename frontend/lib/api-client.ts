export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'failed';

export type ConnectionErrorCode =
  | 'MISSING_URL'
  | 'INVALID_FORMAT'
  | 'CORS_BLOCKED'
  | 'TIMEOUT'
  | 'NOT_FOUND'
  | 'SERVER_ERROR'
  | 'DATA_ENDPOINT_FAILED'
  | 'NETWORK_ERROR'
  | 'DISCONNECTED';

export interface HealthCheckResult {
  ok: boolean;
  service?: string;
  version?: string;
  database?: {
    connected: boolean;
    status: string;
    message?: string;
  };
  error?: string;
  errorCode?: ConnectionErrorCode;
  latencyMs?: number;
}

export interface LiveConnectionResult {
  success: boolean;
  health?: HealthCheckResult;
  summary?: any;
  error?: string;
  errorCode?: ConnectionErrorCode;
  latencyMs?: number;
  unauthenticated?: boolean;
}

export interface UrlValidationResult {
  valid: boolean;
  errorCode?: ConnectionErrorCode;
  error?: string;
  cleanUrl: string;
}

/**
 * Clean and strip whitespace, trailing slashes, /health, /api/v1 from raw input URL.
 */
export function sanitizeBackendUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  // Strip trailing slashes
  url = url.replace(/\/+$/, '');
  // Strip trailing health endpoints
  url = url.replace(/\/(health|api\/health|api\/v1\/health)(\/live)?\/?$/i, '');
  // Strip trailing api endpoints
  url = url.replace(/\/api(\/v1)?\/?$/i, '');
  return url.replace(/\/+$/, '');
}

/**
 * Validate URL syntax, auto-prepend https:// (or http:// for localhost),
 * and enforce HTTPS in production unless localhost.
 */
export function validateBackendUrl(rawUrl: string): UrlValidationResult {
  if (!rawUrl || !rawUrl.trim()) {
    return {
      valid: false,
      errorCode: 'MISSING_URL',
      error: 'No backend API URL configured. Enter your Render service URL below or configure NEXT_PUBLIC_API_URL in Vercel.',
      cleanUrl: ''
    };
  }

  let clean = sanitizeBackendUrl(rawUrl);
  if (!clean) {
    return {
      valid: false,
      errorCode: 'MISSING_URL',
      error: 'No backend API URL configured. Enter your Render service URL below or configure NEXT_PUBLIC_API_URL in Vercel.',
      cleanUrl: ''
    };
  }

  // Prepend https:// if protocol is missing (or http:// if localhost / 127.0.0.1)
  if (!/^https?:\/\//i.test(clean)) {
    if (clean.startsWith('localhost') || clean.startsWith('127.0.0.1')) {
      clean = `http://${clean}`;
    } else {
      clean = `https://${clean}`;
    }
  }

  let parsed: URL;
  try {
    parsed = new URL(clean);
  } catch {
    return {
      valid: false,
      errorCode: 'INVALID_FORMAT',
      error: 'Invalid URL syntax. Please enter a valid URL (e.g. https://your-service.onrender.com)',
      cleanUrl: clean
    };
  }

  // Only allow http: and https: protocols
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      valid: false,
      errorCode: 'INVALID_FORMAT',
      error: 'Unsupported protocol. Only http:// and https:// URLs are supported.',
      cleanUrl: clean
    };
  }

  const isLocal = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';

  // Remote domain must have at least one dot (e.g. my-app.onrender.com)
  if (!isLocal && !parsed.hostname.includes('.')) {
    return {
      valid: false,
      errorCode: 'INVALID_FORMAT',
      error: 'Invalid domain name. Please enter a valid host (e.g. your-service.onrender.com).',
      cleanUrl: clean
    };
  }

  // In production (or when loaded over https:), require HTTPS unless localhost
  const isBrowserHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const isProduction = process.env.NODE_ENV === 'production';

  if ((isBrowserHttps || isProduction) && !isLocal && parsed.protocol !== 'https:') {
    return {
      valid: false,
      errorCode: 'INVALID_FORMAT',
      error: 'Insecure URL: Remote connections from HTTPS require HTTPS (e.g. https://your-service.onrender.com).',
      cleanUrl: clean
    };
  }

  return { valid: true, cleanUrl: parsed.origin };
}

/**
 * Returns API v1 endpoint (e.g. https://service.onrender.com/api/v1)
 */
export function normalizeApiUrl(rawUrl: string): string {
  const { valid, cleanUrl } = validateBackendUrl(rawUrl);
  if (!valid || !cleanUrl) return '';
  return `${cleanUrl}/api/v1`;
}

/**
 * Get active root backend URL from localStorage (override) or build-time NEXT_PUBLIC_API_URL (default).
 * Note: process.env.NEXT_PUBLIC_API_URL is accessed literally so Next.js static inlining works reliably.
 */
export function getBackendUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('sentinel_backend_url');
    if (custom && custom.trim()) {
      return sanitizeBackendUrl(custom);
    }
  }
  const envUrl = process.env.NEXT_PUBLIC_API_URL || '';
  return sanitizeBackendUrl(envUrl);
}

/**
 * Save validated working backend URL to localStorage
 */
export function setBackendUrl(url: string): void {
  if (typeof window !== 'undefined') {
    if (!url || !url.trim()) {
      localStorage.removeItem('sentinel_backend_url');
    } else {
      const { valid, cleanUrl } = validateBackendUrl(url);
      const toSave = valid ? cleanUrl : sanitizeBackendUrl(url);
      const prev = localStorage.getItem('sentinel_backend_url');
      if (prev !== toSave) {
        // Clear stale token from previous backend instance
        localStorage.removeItem('access_token');
      }
      localStorage.setItem('sentinel_backend_url', toSave);
    }
  }
}

/**
 * Resolve full API base URL (including /api/v1)
 */
export function getApiBaseUrl(): string {
  // 1. Check runtime override stored in browser localStorage
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('sentinel_backend_url');
    if (customUrl && customUrl.trim()) {
      const normalized = normalizeApiUrl(customUrl);
      if (normalized) return normalized;
    }
  }

  // 2. Check build-time environment variable (literal dot-notation for Next.js build-time inlining)
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim()) {
    const normalized = normalizeApiUrl(envUrl);
    if (normalized) return normalized;
  }

  // 3. In browser on localhost or 127.0.0.1, fallback to local FastAPI server
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8000/api/v1';
    }
    // Remote domain (e.g. Vercel) without configured backend URL
    return '';
  }

  // Server-side default
  return process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8000/api/v1';
}

export function isBackendConfigured(): boolean {
  return Boolean(getApiBaseUrl());
}

export class ApiError extends Error {
  status: number;
  data: any;
  errorCode?: ConnectionErrorCode;

  constructor(message: string, status: number, data?: any, errorCode?: ConnectionErrorCode) {
    super(message);
    this.status = status;
    this.data = data;
    this.errorCode = errorCode;
  }
}

/**
 * Helper to execute a single health fetch probe against /health (and fallback /api/health).
 */
async function fetchHealthProbe(
  rootUrl: string,
  timeoutMs: number
): Promise<{ status?: number; data?: any; error?: any; latencyMs: number }> {
  const startTime = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let res = await fetch(`${rootUrl}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });

    // If /health returns 404, fallback to /api/health or /api/v1/health
    if (res.status === 404) {
      try {
        const fallbackRes = await fetch(`${rootUrl}/api/health`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal
        });
        if (fallbackRes.status === 200) {
          res = fallbackRes;
        }
      } catch {
        // keep original 404
      }
    }

    clearTimeout(timer);
    const latencyMs = Date.now() - startTime;
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data, latencyMs };
  } catch (err: any) {
    clearTimeout(timer);
    const latencyMs = Date.now() - startTime;
    return { error: err, latencyMs };
  }
}

/**
 * Probe GET /health with an initial 10s timeout, followed by a cold-start retry loop
 * up to 60s for waking up sleeping Render free-tier web services.
 */
export async function probeBackendHealth(
  rawUrl?: string,
  onProgress?: (message: string) => void,
  maxTimeoutMs = 60000
): Promise<HealthCheckResult> {
  const target = rawUrl !== undefined ? rawUrl.trim() : getBackendUrl();
  if (!target) {
    return {
      ok: false,
      error: 'No backend API URL configured. Enter your Render service URL below or configure NEXT_PUBLIC_API_URL in Vercel.',
      errorCode: 'MISSING_URL'
    };
  }

  const validation = validateBackendUrl(target);
  if (!validation.valid) {
    return {
      ok: false,
      error: validation.error || 'Invalid URL format.',
      errorCode: validation.errorCode || 'INVALID_FORMAT'
    };
  }

  const rootUrl = validation.cleanUrl;
  const startTime = Date.now();

  onProgress?.('Pinging backend health endpoint (10s initial probe)...');

  // 1. Initial health check with 10s timeout
  const initialProbe = await fetchHealthProbe(rootUrl, 10000);

  if (initialProbe.status === 200) {
    const data = initialProbe.data || {};
    const isHealthy = data.status === 'ok' || data.status === 'healthy' || data.status === 'alive' || Boolean(data.database);
    if (isHealthy) {
      return {
        ok: true,
        service: data.service,
        version: data.version,
        database: data.database,
        latencyMs: initialProbe.latencyMs
      };
    }
    return {
      ok: false,
      error: `Backend returned unexpected status payload: ${JSON.stringify(data)}`,
      errorCode: 'SERVER_ERROR',
      latencyMs: initialProbe.latencyMs
    };
  }

  // If initial probe returned 404 on health endpoints, fail immediately without waiting 60s
  if (initialProbe.status === 404) {
    return {
      ok: false,
      error: `HTTP 404: /health endpoint was not found at ${rootUrl}. Verify the Render service root directory and API routing.`,
      errorCode: 'NOT_FOUND',
      latencyMs: initialProbe.latencyMs
    };
  }

  // 2. Cold-start retry loop (Render free-tier instances take 30-55s to spin up from sleep)
  let lastStatus = initialProbe.status;
  let lastError = initialProbe.error;
  let attempt = 1;

  while (Date.now() - startTime < maxTimeoutMs) {
    attempt++;
    const elapsedSec = Math.round((Date.now() - startTime) / 1000);
    const remainingSec = Math.max(1, Math.round((maxTimeoutMs - (Date.now() - startTime)) / 1000));

    onProgress?.(`Waking up server, may take up to 60 seconds... (${elapsedSec}s elapsed)`);

    // Wait 2.5 seconds between polling attempts
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const remainingMs = maxTimeoutMs - (Date.now() - startTime);
    if (remainingMs <= 1000) break;

    const probeTimeout = Math.min(remainingMs, 8000);
    const probe = await fetchHealthProbe(rootUrl, probeTimeout);

    if (probe.status === 200) {
      const data = probe.data || {};
      const isHealthy = data.status === 'ok' || data.status === 'healthy' || data.status === 'alive' || Boolean(data.database);
      if (isHealthy) {
        return {
          ok: true,
          service: data.service,
          version: data.version,
          database: data.database,
          latencyMs: probe.latencyMs
        };
      }
    }

    if (probe.status === 404) {
      return {
        ok: false,
        error: `HTTP 404: /health endpoint was not found at ${rootUrl}.`,
        errorCode: 'NOT_FOUND',
        latencyMs: probe.latencyMs
      };
    }

    lastStatus = probe.status;
    lastError = probe.error;
  }

  const totalLatency = Date.now() - startTime;

  // 3. Classify failure after 60s cold-start attempt
  if (lastStatus && lastStatus >= 500) {
    return {
      ok: false,
      error: `Server error (HTTP ${lastStatus}): Render backend failed to start or crashed. Check Render deployment logs.`,
      errorCode: 'SERVER_ERROR',
      latencyMs: totalLatency
    };
  }

  if (lastError?.name === 'AbortError') {
    return {
      ok: false,
      error: `Connection timeout: Backend did not respond within 60 seconds. The Render free-tier instance may still be booting or suspended. Please retry in a moment.`,
      errorCode: 'TIMEOUT',
      latencyMs: totalLatency
    };
  }

  const msg = String(lastError?.message || lastError || '');
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://k8s-secret-audit.vercel.app';

  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Load failed')) {
    return {
      ok: false,
      error: `CORS blocked or Network error: Unable to reach ${rootUrl}. Either the Render service is offline/waking up, or origin '${currentOrigin}' is not permitted in backend CORS_ORIGINS.`,
      errorCode: 'CORS_BLOCKED',
      latencyMs: totalLatency
    };
  }

  return {
    ok: false,
    error: `Backend unreachable (${msg || 'Request timed out after 60s'}). Check Render deployment status.`,
    errorCode: 'TIMEOUT',
    latencyMs: totalLatency
  };
}

/**
 * End-to-end live connection verification:
 * 1. Checks GET /health (with 10s initial probe and 60s cold-start retry loop).
 * 2. If healthy, tests /dashboard/summary data endpoint.
 * 3. Declares Live Mode if backend is healthy (even if unauthenticated on dashboard summary).
 */
export async function testLiveConnection(
  rawUrl: string,
  onProgress?: (message: string) => void,
  maxTimeoutMs = 60000
): Promise<LiveConnectionResult> {
  const healthRes = await probeBackendHealth(rawUrl, onProgress, maxTimeoutMs);
  if (!healthRes.ok) {
    return {
      success: false,
      health: healthRes,
      error: healthRes.error,
      errorCode: healthRes.errorCode,
      latencyMs: healthRes.latencyMs
    };
  }

  // Health probe succeeded. Backend is live!
  const targetApi = normalizeApiUrl(rawUrl);
  const dataController = new AbortController();
  const dataTimer = setTimeout(() => dataController.abort(), 15000);

  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const dataRes = await fetch(`${targetApi}/dashboard/summary`, {
      method: 'GET',
      headers,
      signal: dataController.signal
    });

    clearTimeout(dataTimer);

    if (dataRes.status === 401) {
      // User is not authenticated yet. The backend IS reachable and live!
      return {
        success: true,
        health: healthRes,
        unauthenticated: true,
        latencyMs: healthRes.latencyMs
      };
    }

    if (dataRes.ok) {
      const summary = await dataRes.json();
      return {
        success: true,
        health: healthRes,
        summary,
        latencyMs: healthRes.latencyMs
      };
    }

    if (dataRes.status >= 500) {
      return {
        success: false,
        health: healthRes,
        error: `Health check passed, but database query failed on Render (HTTP ${dataRes.status}). Verify Supabase connection string.`,
        errorCode: 'DATA_ENDPOINT_FAILED',
        latencyMs: healthRes.latencyMs
      };
    }

    return {
      success: true,
      health: healthRes,
      latencyMs: healthRes.latencyMs
    };
  } catch {
    clearTimeout(dataTimer);
    // Even if dashboard summary timed out, the backend health check passed
    return {
      success: true,
      health: healthRes,
      latencyMs: healthRes.latencyMs
    };
  }
}

/**
 * Central API request handler with 60-second timeout, auth header injection,
 * and comprehensive error classification.
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new ApiError(
      'Render Backend API URL is not configured. Please set NEXT_PUBLIC_API_URL in Vercel or enter your Render backend URL.',
      0,
      { code: 'BACKEND_NOT_CONFIGURED' },
      'MISSING_URL'
    );
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  let response: Response;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    response = await fetch(`${baseUrl}${cleanEndpoint}`, {
      ...options,
      signal: options.signal || controller.signal,
      headers,
    });
  } catch (netErr: any) {
    if (netErr?.name === 'AbortError') {
      throw new ApiError(
        'Backend connection timed out after 60s. The Render service may still be waking up. Please retry in a moment.',
        408,
        undefined,
        'TIMEOUT'
      );
    }
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://k8s-secret-audit.vercel.app';
    throw new ApiError(
      `CORS blocked or Network error: Unable to reach backend at ${baseUrl}. Verify Render deployment status and ensure CORS origin '${currentOrigin}' is permitted.`,
      0,
      { originalError: netErr?.message },
      'CORS_BLOCKED'
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = { detail: response.statusText || `HTTP ${response.status} Error` };
    }

    const detailMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail || errorData);

    switch (response.status) {
      case 401:
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
        }
        throw new ApiError(detailMsg || 'Unauthorized: Invalid or expired token.', 401, errorData);
      case 403:
        throw new ApiError(detailMsg || 'Forbidden: Access denied to this resource.', 403, errorData);
      case 404:
        throw new ApiError(detailMsg || 'Resource not found on backend.', 404, errorData, 'NOT_FOUND');
      case 422:
        throw new ApiError(detailMsg || 'Validation Error: Check input format.', 422, errorData);
      case 500:
      case 502:
      case 503:
      case 504:
        throw new ApiError(
          detailMsg || `Backend service error (HTTP ${response.status}). Check Render logs.`,
          response.status,
          errorData,
          'SERVER_ERROR'
        );
      default:
        throw new ApiError(detailMsg || `API request failed (HTTP ${response.status})`, response.status, errorData);
    }
  }

  if (options.headers && (options.headers as Record<string, string>)['Accept'] === 'application/pdf') {
    return (await response.blob()) as unknown as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Health & Connection
  checkHealth: (customBaseUrl?: string, onProgress?: (msg: string) => void, timeoutMs = 60000) =>
    probeBackendHealth(customBaseUrl, onProgress, timeoutMs),
  testConnection: (customBaseUrl: string, onProgress?: (msg: string) => void, timeoutMs = 60000) =>
    testLiveConnection(customBaseUrl, onProgress, timeoutMs),
  checkLiveness: async (customBaseUrl?: string) => {
    const target = customBaseUrl ? sanitizeBackendUrl(customBaseUrl) : getBackendUrl();
    if (!target) throw new ApiError('No backend URL provided.', 0);
    const res = await fetch(`${target}/health/live`);
    if (!res.ok) throw new ApiError(`Liveness probe returned HTTP ${res.status}`, res.status);
    return res.json();
  },

  // Auth
  register: (data: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<any>('/auth/me'),
  logout: () => request<any>('/auth/logout', { method: 'POST' }),

  // Clusters
  listClusters: () => request<any[]>('/clusters'),
  getCluster: (id: string) => request<any>(`/clusters/${id}`),
  connectCluster: (data: any) => request<any>('/clusters', { method: 'POST', body: JSON.stringify(data) }),
  testCluster: (id: string) => request<any>(`/clusters/${id}/test`, { method: 'POST' }),
  deleteCluster: (id: string) => request<any>(`/clusters/${id}`, { method: 'DELETE' }),

  // Audits
  createAudit: (cluster_id: string) => request<any>('/audits', { method: 'POST', body: JSON.stringify({ cluster_id }) }),
  listAudits: (cluster_id?: string) => request<any[]>(`/audits${cluster_id ? `?cluster_id=${cluster_id}` : ''}`),
  getAudit: (id: string) => request<any>(`/audits/${id}`),
  getAuditFindings: (id: string) => request<any[]>(`/audits/${id}/findings`),

  // Findings
  listFindings: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<any[]>(`/findings${query ? `?${query}` : ''}`);
  },
  updateFindingStatus: (id: string, status: string) =>
    request<any>(`/findings/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Secrets Inventory
  listSecrets: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<any[]>(`/secrets${query ? `?${query}` : ''}`);
  },

  // Encryption Checks
  listEncryptionChecks: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<any[]>(`/encryption${query ? `?${query}` : ''}`);
  },

  // Reports
  createReport: (audit_id: string, format: string = 'pdf') =>
    request<any>('/reports', { method: 'POST', body: JSON.stringify({ audit_id, format }) }),
  listReports: () => request<any[]>('/reports'),
  getReportDownloadUrl: (id: string) => `${getApiBaseUrl()}/reports/${id}/download`,

  // Dashboard
  getDashboardSummary: () => request<any>('/dashboard/summary'),
};
