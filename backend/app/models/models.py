import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from app.core.db import Base

def generate_uuid():
    return str(uuid.uuid4())

def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    clusters = relationship("Cluster", back_populates="user", cascade="all, delete-orphan")
    audits = relationship("Audit", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")
    logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")


class Cluster(Base):
    __tablename__ = "clusters"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    is_demo = Column(Boolean, default=False)
    api_server = Column(String(255), nullable=True)
    kubernetes_version = Column(String(64), default="Unknown")
    node_count = Column(Integer, default=0)
    namespace_count = Column(Integer, default=0)
    connection_status = Column(String(64), default="Connected") # Connected, Disconnected, Testing, Error
    last_audit_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="clusters")
    connection = relationship("ClusterConnection", back_populates="cluster", uselist=False, cascade="all, delete-orphan")
    audits = relationship("Audit", back_populates="cluster", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="cluster", cascade="all, delete-orphan")
    secrets = relationship("SecretsInventory", back_populates="cluster", cascade="all, delete-orphan")


class ClusterConnection(Base):
    __tablename__ = "cluster_connections"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    cluster_id = Column(String(36), ForeignKey("clusters.id"), nullable=False, unique=True)
    auth_type = Column(String(32), nullable=False) # kubeconfig, token, demo
    encrypted_credentials = Column(Text, nullable=True) # Safely encrypted or blank for demo
    created_at = Column(DateTime, default=utcnow)

    cluster = relationship("Cluster", back_populates="connection")


class Audit(Base):
    __tablename__ = "audits"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    cluster_id = Column(String(36), ForeignKey("clusters.id"), nullable=False)
    started_at = Column(DateTime, default=utcnow)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String(64), default="in_progress") # in_progress, completed, failed
    current_step = Column(String(128), default="Connecting to cluster")
    security_score = Column(Float, default=100.0)
    critical_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)
    informational_count = Column(Integer, default=0)
    total_secrets_audited = Column(Integer, default=0)
    is_demo = Column(Boolean, default=False)
    summary_json = Column(JSON, nullable=True)

    user = relationship("User", back_populates="audits")
    cluster = relationship("Cluster", back_populates="audits")
    findings = relationship("Finding", back_populates="audit", cascade="all, delete-orphan")
    secrets = relationship("SecretsInventory", back_populates="audit", cascade="all, delete-orphan")
    rbac_permissions = relationship("RbacPermission", back_populates="audit", cascade="all, delete-orphan")
    encryption_checks = relationship("EncryptionCheck", back_populates="audit", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="audit", cascade="all, delete-orphan")


class Finding(Base):
    __tablename__ = "findings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    audit_id = Column(String(36), ForeignKey("audits.id"), nullable=False)
    cluster_id = Column(String(36), ForeignKey("clusters.id"), nullable=False)
    rule_id = Column(String(32), nullable=False) # KSA-001 to KSA-010
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    rationale = Column(Text, nullable=True) # Why it matters
    severity = Column(String(32), nullable=False) # Critical, High, Medium, Low, Informational
    category = Column(String(64), nullable=False) # Encryption, RBAC, Secret Hygiene, Workload Exposure
    namespace = Column(String(128), default="default")
    resource_type = Column(String(128), nullable=False)
    resource_name = Column(String(255), nullable=False)
    status = Column(String(32), default="Open") # Open, Acknowledged, Resolved, False Positive
    evidence = Column(JSON, nullable=True)
    impact = Column(Text, nullable=True)
    recommendation = Column(Text, nullable=False)
    remediation = Column(Text, nullable=True)
    references = Column(JSON, nullable=True)
    first_detected = Column(DateTime, default=utcnow)
    last_detected = Column(DateTime, default=utcnow)

    audit = relationship("Audit", back_populates="findings")
    cluster = relationship("Cluster", back_populates="findings")


class SecretsInventory(Base):
    __tablename__ = "secrets_inventory"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    audit_id = Column(String(36), ForeignKey("audits.id"), nullable=False)
    cluster_id = Column(String(36), ForeignKey("clusters.id"), nullable=False)
    name = Column(String(255), nullable=False)
    namespace = Column(String(128), nullable=False)
    type = Column(String(128), nullable=False) # Opaque, kubernetes.io/service-account-token, etc.
    created_at_k8s = Column(DateTime, nullable=True)
    age_days = Column(Integer, default=0)
    used_by = Column(JSON, nullable=True) # List of deployment/pod names referencing it
    rbac_exposure = Column(String(32), default="Low") # High, Medium, Low
    encryption_status = Column(String(32), default="UNKNOWN") # PASS, FAIL, WARNING, UNKNOWN
    risk_level = Column(String(32), default="Low") # Critical, High, Medium, Low
    labels = Column(JSON, nullable=True)
    annotations = Column(JSON, nullable=True)

    audit = relationship("Audit", back_populates="secrets")
    cluster = relationship("Cluster", back_populates="secrets")


class RbacPermission(Base):
    __tablename__ = "rbac_permissions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    audit_id = Column(String(36), ForeignKey("audits.id"), nullable=False)
    cluster_id = Column(String(36), ForeignKey("clusters.id"), nullable=False)
    subject_kind = Column(String(64), nullable=False) # User, Group, ServiceAccount
    subject_name = Column(String(255), nullable=False)
    subject_namespace = Column(String(128), nullable=True)
    role_kind = Column(String(64), nullable=False) # Role, ClusterRole
    role_name = Column(String(255), nullable=False)
    verbs = Column(JSON, nullable=False) # ["get", "list", "watch", "*"]
    namespace = Column(String(128), default="cluster-wide")
    risk_level = Column(String(32), default="Low") # High, Medium, Low

    audit = relationship("Audit", back_populates="rbac_permissions")


class EncryptionCheck(Base):
    __tablename__ = "encryption_checks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    audit_id = Column(String(36), ForeignKey("audits.id"), nullable=False)
    cluster_id = Column(String(36), ForeignKey("clusters.id"), nullable=False)
    check_name = Column(String(255), nullable=False)
    status = Column(String(32), nullable=False) # PASS, FAIL, WARNING, UNKNOWN / NOT VERIFIABLE
    provider_chain = Column(JSON, nullable=True) # ["kms", "aescbc", "identity"]
    wildcard_configured = Column(Boolean, default=False)
    identity_fallback_detected = Column(Boolean, default=False)
    explanation = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=True)

    audit = relationship("Audit", back_populates="encryption_checks")


class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    audit_id = Column(String(36), ForeignKey("audits.id"), nullable=False)
    cluster_id = Column(String(36), ForeignKey("clusters.id"), nullable=False)
    report_name = Column(String(255), nullable=False)
    format = Column(String(16), default="pdf") # pdf, json
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="reports")
    audit = relationship("Audit", back_populates="reports")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action = Column(String(128), nullable=False) # E.g., USER_LOGIN, AUDIT_STARTED, CLUSTER_CONNECTED
    target_type = Column(String(64), nullable=True)
    target_id = Column(String(128), nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="logs")
