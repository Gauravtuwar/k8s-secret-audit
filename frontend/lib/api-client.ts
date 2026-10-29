export function getApiBaseUrl(): string {
  let url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return '/api/v1';
    }
    return 'http://localhost:8000/api/v1';
  }

  // Strip trailing slashes
  url = url.replace(/\/+$/, '');

  // Normalize /api/v1 suffix
  if (!url.endsWith('/api/v1')) {
    url = `${url}/api/v1`;
  }

  return url;
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
  try {
    response = await fetch(`${baseUrl}${cleanEndpoint}`, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    throw new ApiError(
      'Unable to connect to the Security Audit API. Verify backend service status and CORS configuration.',
      0,
      { originalError: netErr?.message }
    );
  }

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { detail: response.statusText || 'API request failed' };
    }
    throw new ApiError(errorData.detail || 'API request failed', response.status, errorData);
  }

  // If response is file download (Blob)
  if (options.headers && (options.headers as Record<string, string>)['Accept'] === 'application/pdf') {
    return (await response.blob()) as unknown as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  // Health
  checkHealth: () => {
    const base = getApiBaseUrl().replace(/\/api\/v1$/, '');
    return fetch(`${base}/health`).then((res) => res.json());
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
