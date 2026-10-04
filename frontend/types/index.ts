export interface User {
  id: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  created_at: string;
}

export interface Cluster {
  id: string;
  name: string;
  is_demo: boolean;
  api_server?: string;
  kubernetes_version: string;
  node_count: number;
  namespace_count: number;
  connection_status: string;
  last_audit_at?: string;
  created_at: string;
}

export interface Finding {
  id: string;
  audit_id: string;
  cluster_id: string;
  rule_id: string;
  title: string;
  description: string;
  rationale?: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
  category: string;
  namespace: string;
  resource_type: string;
  resource_name: string;
  status: 'Open' | 'Acknowledged' | 'Resolved' | 'False Positive';
  evidence?: any;
  impact?: string;
  recommendation: string;
  remediation?: string;
  references?: string[];
  first_detected: string;
  last_detected: string;
}

export interface SecretsInventory {
  id: string;
  audit_id: string;
  cluster_id: string;
  name: string;
  namespace: string;
  type: string;
  created_at_k8s?: string;
  age_days: number;
  used_by?: { kind: string; name: string; via: string }[];
  rbac_exposure: string;
  encryption_status: string;
  risk_level: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  value_display: string;
}

export interface RbacPermission {
  id: string;
  audit_id: string;
  cluster_id: string;
  subject_kind: string;
  subject_name: string;
  subject_namespace?: string;
  role_kind: string;
  role_name: string;
  verbs: string[];
  namespace: string;
  risk_level: string;
}

export interface EncryptionCheck {
  id: string;
  audit_id: string;
  cluster_id: string;
  check_name: string;
  status: 'PASS' | 'FAIL' | 'WARNING' | 'UNKNOWN';
  provider_chain?: string[];
  wildcard_configured: boolean;
  identity_fallback_detected: boolean;
  explanation: string;
  recommendation?: string;
}

export interface Audit {
  id: string;
  user_id: string;
  cluster_id: string;
  started_at: string;
  completed_at?: string;
  status: string;
  current_step: string;
  security_score: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  informational_count: number;
  total_secrets_audited: number;
  is_demo: boolean;
  summary_json?: Record<string, any>;
}

export interface DashboardSummary {
  total_clusters: number;
  total_secrets_audited: number;
  critical_findings: number;
  high_findings: number;
  medium_findings: number;
  low_findings: number;
  encryption_status_summary: Record<string, number>;
  last_audit_at?: string;
  security_score: number;
  previous_score: number;
  score_change: number;
  severity_breakdown: Record<string, number>;
  score_history: { date: string; score: number }[];
  namespace_breakdown: { namespace: string; findings_count: number }[];
  recent_audits: Audit[];
}

export interface Report {
  id: string;
  audit_id: string;
  cluster_id: string;
  report_name: string;
  format: string;
  created_at: string;
}
