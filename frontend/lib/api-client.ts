export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'failed';

export type ConnectionErrorCode =
  | 'CORS_BLOCKED'
  | 'TIMEOUT'
  | 'NOT_FOUND'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'INVALID_URL'
  | 'DATA_ENDPOINT_FAILED';

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
}

/**
 * Clean and strip trailing slashes, /health, /api/v1 from raw input URL.
 */
export function sanitizeBackendUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  // Strip trailing slashes
  url = url.replace(/\/+$/, '');
  // Strip trailing health endpoints
  url = url.replace(/\/health(\/live)?\/?$/i, '');
  // Strip trailing api endpoints
  url = url.replace(/\/api(\/v1)?\/?$/i, '');
  return url.replace(/\/+$/, '');
}

/**
 * Validate URL syntax and enforce HTTPS in production unless localhost.
 */
export function validateBackendUrl(rawUrl: string): { valid: boolean; error?: string; cleanUrl: string } {
  let clean = sanitizeBackendUrl(rawUrl);
  if (!clean) {
    return { valid: false, error: 'Backend URL cannot be empty.', cleanUrl: '' };
  }

  // Prepend https:// if protocol is missing (or http:// if localhost)
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
      error: 'Invalid URL syntax. Please enter a valid URL (e.g. https://your-service.onrender.com)',
      cleanUrl: clean
    };
  }

  const isLocal = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  const isHttps = parsed.protocol === 'https:';

  // In production (or when loaded over https:), require HTTPS unless localhost
  const isBrowserHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const isProduction = process.env.NODE_ENV === 'production';

  if ((isBrowserHttps || isProduction) && !isHttps && !isLocal) {
    return {
      valid: false,
      error: 'In production, a secure HTTPS URL is required (e.g. https://your-service.onrender.com).',
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
 * Get active root backend URL from localStorage or build-time NEXT_PUBLIC_API_URL
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
        // Clear old access token from previous backend instance
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

  // 2. Check build-time environment variable
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
 * Probe GET /health with a 60-second timeout to handle Render cold-starts.
 */
export async function probeBackendHealth(rawUrl?: string, timeoutMs = 60000): Promise<HealthCheckResult> {
  const target = rawUrl ? sanitizeBackendUrl(rawUrl) : getBackendUrl();
  if (!target) {
    return {
      ok: false,
      error: 'Backend API URL is not configured.',
      errorCode: 'INVALID_URL'
    };
  }

  const validation = validateBackendUrl(target);
  if (!validation.valid) {
    return {
      ok: false,
      error: validation.error || 'Invalid URL format.',
      errorCode: 'INVALID_URL'
    };
  }

  const rootUrl = validation.cleanUrl;
  const healthEndpoint = `${rootUrl}/health`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startTime = Date.now();

  try {
    const res = await fetch(healthEndpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timer);
    const latencyMs = Date.now() - startTime;

    if (res.status === 200) {
      const data = await res.json().catch(() => ({}));
      const isHealthy = data && (data.status === 'ok' || data.status === 'healthy' || data.status === 'alive');
      if (isHealthy) {
        return {
          ok: true,
          service: data.service,
          version: data.version,
          database: data.database,
          latencyMs
        };
      }
      return {
        ok: false,
        error: `Backend returned non-healthy status: ${JSON.stringify(data)}`,
        errorCode: 'SERVER_ERROR',
        latencyMs
      };
    }

    if (res.status === 404) {
      return {
        ok: false,
        error: `HTTP 404: /health endpoint was not found at ${rootUrl}. Verify the Render web service root directory and routing.`,
        errorCode: 'NOT_FOUND',
        latencyMs
      };
    }

    if (res.status >= 500) {
      return {
        ok: false,
        error: `Server unavailable (HTTP ${res.status}): Render gateway error or server crash. Check Render deployment logs.`,
        errorCode: 'SERVER_ERROR',
        latencyMs
      };
    }

    return {
      ok: false,
      error: `Server responded with HTTP ${res.status}: ${res.statusText}`,
      errorCode: 'SERVER_ERROR',
      latencyMs
    };
  } catch (err: any) {
    clearTimeout(timer);
    const latencyMs = Date.now() - startTime;

    if (err?.name === 'AbortError') {
      return {
        ok: false,
        error: `Connection timeout: Server did not respond within ${Math.round(timeoutMs / 1000)} seconds. Render free-tier instance may still be waking up.`,
        errorCode: 'TIMEOUT',
        latencyMs
      };
    }

    const msg = String(err?.message || err);
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Load failed')) {
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://k8s-secret-audit.vercel.app';
      return {
        ok: false,
        error: `CORS blocked or Network error: Unable to reach ${rootUrl}. Either the server is offline/waking up, or CORS origin '${currentOrigin}' is not allowed in backend CORS_ORIGINS.`,
        errorCode: 'CORS_BLOCKED',
        latencyMs
      };
    }

    return {
      ok: false,
      error: `Network error: ${msg}`,
      errorCode: 'NETWORK_ERROR',
      latencyMs
    };
  }
}

/**
 * End-to-end verification: Tests /health AND confirms dashboard data retrieval.
 * Live Mode is ONLY declared when both succeed.
 */
export async function testLiveConnection(rawUrl: string, timeoutMs = 60000): Promise<LiveConnectionResult> {
  const healthRes = await probeBackendHealth(rawUrl, timeoutMs);
  if (!healthRes.ok) {
    return {
      success: false,
      health: healthRes,
      error: healthRes.error,
      errorCode: healthRes.errorCode,
      latencyMs: healthRes.latencyMs
    };
  }

  // Health succeeded. Now verify actual dashboard data endpoint
  const targetApi = normalizeApiUrl(rawUrl);
  const dataController = new AbortController();
  const dataTimer = setTimeout(() => dataController.abort(), 30000);

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

    if (dataRes.status === 401 && token) {
      // Stale token, clear it and retry once
      localStorage.removeItem('access_token');
      const retryRes = await fetch(`${targetApi}/dashboard/summary`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (retryRes.ok) {
        const summary = await retryRes.json();
        return { success: true, health: healthRes, summary, latencyMs: healthRes.latencyMs };
      }
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

    return {
      success: false,
      health: healthRes,
      error: `Health check passed, but dashboard data endpoint failed (HTTP ${dataRes.status}). Verify database connectivity on Render.`,
      errorCode: 'DATA_ENDPOINT_FAILED',
      latencyMs: healthRes.latencyMs
    };
  } catch (dataErr: any) {
    clearTimeout(dataTimer);
    return {
      success: false,
      health: healthRes,
      error: `Health check passed, but dashboard data request failed: ${dataErr?.message || 'NetworkError'}.`,
      errorCode: 'DATA_ENDPOINT_FAILED',
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
      'INVALID_URL'
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
  // Set 60-second timeout to handle Render cold-start latency
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
          // Stale or invalid token from prior backend / session
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

  // If response is file download (Blob)
  if (options.headers && (options.headers as Record<string, string>)['Accept'] === 'application/pdf') {
    return (await response.blob()) as unknown as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Health & Connection
  checkHealth: (customBaseUrl?: string, timeoutMs = 60000) => probeBackendHealth(customBaseUrl, timeoutMs),
  testConnection: (customBaseUrl: string, timeoutMs = 60000) => testLiveConnection(customBaseUrl, timeoutMs),
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
