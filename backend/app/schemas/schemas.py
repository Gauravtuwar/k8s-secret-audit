from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# Auth Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool
    created_at: datetime

# Cluster Schemas
class ClusterConnectRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    auth_type: str = Field(..., pattern="^(kubeconfig|token|demo)$")
    kubeconfig: Optional[str] = None
    api_server: Optional[str] = None
    token: Optional[str] = None

class ClusterOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    is_demo: bool
    api_server: Optional[str] = None
    kubernetes_version: str
    node_count: int
    namespace_count: int
    connection_status: str
    last_audit_at: Optional[datetime] = None
    created_at: datetime

class ClusterTestResponse(BaseModel):
    success: bool
    message: str
    kubernetes_version: Optional[str] = None
    node_count: Optional[int] = None
    namespace_count: Optional[int] = None

# Finding Schemas
class FindingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    audit_id: str
    cluster_id: str
    rule_id: str
    title: str
    description: str
    rationale: Optional[str] = None
    severity: str
    category: str
    namespace: str
    resource_type: str
    resource_name: str
    status: str
    evidence: Optional[Any] = None
    impact: Optional[str] = None
    recommendation: str
    remediation: Optional[str] = None
    references: Optional[List[str]] = None
    first_detected: datetime
    last_detected: datetime

class FindingStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(Open|Acknowledged|Resolved|False Positive)$")

# Secrets Inventory Schemas
class SecretsInventoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    audit_id: str
    cluster_id: str
    name: str
    namespace: str
    type: str
    created_at_k8s: Optional[datetime] = None
    age_days: int
    used_by: Optional[List[Dict[str, Any]]] = None
    rbac_exposure: str
    encryption_status: str
    risk_level: str
    labels: Optional[Dict[str, str]] = None
    annotations: Optional[Dict[str, str]] = None
    value_display: str = "[REDACTED]"

# Rbac Permission Schemas
class RbacPermissionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    audit_id: str
    cluster_id: str
    subject_kind: str
    subject_name: str
    subject_namespace: Optional[str] = None
    role_kind: str
    role_name: str
    verbs: List[str]
    namespace: str
    risk_level: str

# Encryption Check Schemas
class EncryptionCheckOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    audit_id: str
    cluster_id: str
    check_name: str
    status: str
    provider_chain: Optional[List[str]] = None
    wildcard_configured: bool
    identity_fallback_detected: bool
    explanation: str
    recommendation: Optional[str] = None

# Audit Schemas
class AuditCreateRequest(BaseModel):
    cluster_id: str

class AuditOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    cluster_id: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    status: str
    current_step: str
    security_score: float
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    informational_count: int
    total_secrets_audited: int
    is_demo: bool
    summary_json: Optional[Dict[str, Any]] = None

# Dashboard Summary Schema
class DashboardSummaryOut(BaseModel):
    total_clusters: int
    total_secrets_audited: int
    critical_findings: int
    high_findings: int
    medium_findings: int
    low_findings: int
    encryption_status_summary: Dict[str, int]
    last_audit_at: Optional[datetime]
    security_score: float
    previous_score: float
    score_change: float
    severity_breakdown: Dict[str, int]
    score_history: List[Dict[str, Any]]
    namespace_breakdown: List[Dict[str, Any]]
    recent_audits: List[AuditOut]

# Report Schemas
class ReportCreateRequest(BaseModel):
    audit_id: str
    format: str = "pdf" # pdf or json

class ReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    audit_id: str
    cluster_id: str
    report_name: str
    format: str
    created_at: datetime
