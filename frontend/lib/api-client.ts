export function normalizeApiUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim().replace(/\/+$/, '');
  if (!url.endsWith('/api/v1')) {
    url = `${url}/api/v1`;
  }
  return url;
}

export function getBackendUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('sentinel_backend_url');
    if (custom) return custom;
  }
  return process.env.NEXT_PUBLIC_API_URL || '';
}

export function setBackendUrl(url: string): void {
  if (typeof window !== 'undefined') {
    if (!url || !url.trim()) {
      localStorage.removeItem('sentinel_backend_url');
    } else {
      localStorage.setItem('sentinel_backend_url', url.trim());
    }
  }
}

export function getApiBaseUrl(): string {
  // 1. Check runtime override stored in browser localStorage
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('sentinel_backend_url');
    if (customUrl && customUrl.trim()) {
      return normalizeApiUrl(customUrl);
    }
  }

  // 2. Check build-time environment variable
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim()) {
    return normalizeApiUrl(envUrl);
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

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new ApiError(
      'Render Backend API URL is not configured. Please set NEXT_PUBLIC_API_URL in Vercel or enter your Render backend URL below.',
      0,
      { code: 'BACKEND_NOT_CONFIGURED' }
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
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    response = await fetch(`${baseUrl}${cleanEndpoint}`, {
      ...options,
      signal: options.signal || controller.signal,
      headers,
    });
  } catch (netErr: any) {
    if (netErr?.name === 'AbortError') {
      throw new ApiError(
        'Backend connection timed out after 15s. The Render service may be waking up from sleep. Please wait a moment and click Retry.',
        408
      );
    }
    throw new ApiError(
      `Unable to reach backend API at ${baseUrl}. Verify Render deployment status and CORS configuration. (${netErr?.message || 'NetworkError'})`,
      0,
      { originalError: netErr?.message }
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { detail: response.statusText || `HTTP ${response.status} Error` };
    }

    const detailMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail || errorData);

    switch (response.status) {
      case 401:
        throw new ApiError(detailMsg || 'Unauthorized: Invalid or expired token.', 401, errorData);
      case 403:
        throw new ApiError(detailMsg || 'Forbidden: Access denied to this resource.', 403, errorData);
      case 404:
        throw new ApiError(detailMsg || 'Resource not found on backend.', 404, errorData);
      case 422:
        throw new ApiError(detailMsg || 'Validation Error: Check input format.', 422, errorData);
      case 500:
      case 502:
      case 503:
      case 504:
        throw new ApiError(detailMsg || `Backend service error (HTTP ${response.status}). Check Render logs.`, response.status, errorData);
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
  // Health
  checkHealth: async (customBaseUrl?: string) => {
    let base = customBaseUrl ? normalizeApiUrl(customBaseUrl) : getApiBaseUrl();
    if (!base) {
      throw new ApiError('No backend URL provided for health check.', 0);
    }
    const rootBase = base.replace(/\/api\/v1\/?$/, '');
    const res = await fetch(`${rootBase}/health`);
    if (!res.ok) {
      throw new ApiError(`Health check returned HTTP ${res.status}`, res.status);
    }
    return res.json();
  },
  checkLiveness: async (customBaseUrl?: string) => {
    let base = customBaseUrl ? normalizeApiUrl(customBaseUrl) : getApiBaseUrl();
    if (!base) {
      throw new ApiError('No backend URL provided for liveness check.', 0);
    }
    const rootBase = base.replace(/\/api\/v1\/?$/, '');
    const res = await fetch(`${rootBase}/health/live`);
    if (!res.ok) {
      throw new ApiError(`Liveness check returned HTTP ${res.status}`, res.status);
    }
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
