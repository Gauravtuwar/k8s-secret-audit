from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List

def get_demo_cluster_data() -> Dict[str, Any]:
    return {
        "name": "prod-us-east-k8s-demo",
        "api_server": "https://api.prod-demo.k8s.internal:6443",
        "kubernetes_version": "v1.29.3-eks",
        "node_count": 12,
        "namespace_count": 8,
        "connection_status": "Connected",
        "is_demo": True
    }

def get_demo_secrets_inventory() -> List[Dict[str, Any]]:
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    return [
        {
            "name": "db-postgres-credentials",
            "namespace": "production",
            "type": "Opaque",
            "created_at_k8s": now - timedelta(days=210),
            "age_days": 210,
            "used_by": [{"kind": "Deployment", "name": "api-gateway", "via": "envFrom"}, {"kind": "Deployment", "name": "user-service", "via": "env"}],
            "rbac_exposure": "High",
            "encryption_status": "FAIL",
            "risk_level": "Critical",
            "labels": {"app": "postgres", "tier": "database"},
            "annotations": {"audit.k8s.io/managed": "true"}
        },
        {
            "name": "payment-gateway-stripe-token",
            "namespace": "production",
            "type": "Opaque",
            "created_at_k8s": now - timedelta(days=195),
            "age_days": 195,
            "used_by": [{"kind": "Deployment", "name": "billing-worker", "via": "env"}],
            "rbac_exposure": "High",
            "encryption_status": "FAIL",
            "risk_level": "Critical",
            "labels": {"sec.level": "restricted"},
            "annotations": {}
        },
        {
            "name": "default-token-sa942",
            "namespace": "kube-system",
            "type": "kubernetes.io/service-account-token",
            "created_at_k8s": now - timedelta(days=400),
            "age_days": 400,
            "used_by": [],
            "rbac_exposure": "Medium",
            "encryption_status": "PASS",
            "risk_level": "Medium",
            "labels": {},
            "annotations": {"kubernetes.io/service-account.name": "default"}
        },
        {
            "name": "redis-cluster-auth",
            "namespace": "staging",
            "type": "Opaque",
            "created_at_k8s": now - timedelta(days=45),
            "age_days": 45,
            "used_by": [{"kind": "Deployment", "name": "cache-node", "via": "volume"}],
            "rbac_exposure": "Low",
            "encryption_status": "PASS",
            "risk_level": "Low",
            "labels": {"env": "staging"},
            "annotations": {}
        },
        {
            "name": "tls-ingress-wildcard-cert",
            "namespace": "ingress-nginx",
            "type": "kubernetes.io/tls",
            "created_at_k8s": now - timedelta(days=30),
            "age_days": 30,
            "used_by": [{"kind": "DaemonSet", "name": "nginx-ingress-controller", "via": "volume"}],
            "rbac_exposure": "Low",
            "encryption_status": "PASS",
            "risk_level": "Low",
            "labels": {"managed-by": "cert-manager"},
            "annotations": {}
        }
    ]

def get_demo_rbac_permissions() -> List[Dict[str, Any]]:
    return [
        {
            "subject_kind": "ServiceAccount",
            "subject_name": "ci-cd-deployer",
            "subject_namespace": "production",
            "role_kind": "ClusterRole",
            "role_name": "cluster-admin",
            "verbs": ["*"],
            "namespace": "cluster-wide",
            "risk_level": "Critical"
        },
        {
            "subject_kind": "ServiceAccount",
            "subject_name": "monitoring-prom-sa",
            "subject_namespace": "monitoring",
            "role_kind": "ClusterRole",
            "role_name": "secret-reader-global",
            "verbs": ["get", "list", "watch"],
            "namespace": "cluster-wide",
            "risk_level": "High"
        },
        {
            "subject_kind": "Group",
            "subject_name": "developers-read-only",
            "subject_namespace": None,
            "role_kind": "Role",
            "role_name": "view-secrets-staging",
            "verbs": ["get", "list"],
            "namespace": "staging",
            "risk_level": "Medium"
        }
    ]

def get_demo_encryption_checks() -> List[Dict[str, Any]]:
    return [
        {
            "check_name": "Control Plane EncryptionConfiguration Status",
            "status": "FAIL",
            "provider_chain": ["identity", "aescbc"],
            "wildcard_configured": False,
            "identity_fallback_detected": True,
            "explanation": "Control-plane EncryptionConfiguration specifies 'identity' (plaintext unencrypted) before 'aescbc'. Kubernetes API server will write Secrets in unencrypted plaintext to etcd.",
            "recommendation": "Reorder providers in EncryptionConfiguration so aescbc or kms is listed first, followed by identity as last fallback during migration."
        },
        {
            "check_name": "KMS Provider v2 Integration",
            "status": "WARNING",
            "provider_chain": ["aescbc"],
            "wildcard_configured": False,
            "identity_fallback_detected": False,
            "explanation": "Static AES-CBC encryption key configured without Hardware Security Module (HSM) or cloud KMS provider integration.",
            "recommendation": "Integrate AWS KMS, Azure Key Vault, or HashiCorp Vault via KMS v2 provider for automated key rotation and envelope encryption."
        },
        {
            "check_name": "Wildcard Resource Encryption Range",
            "status": "PASS",
            "provider_chain": ["aescbc"],
            "wildcard_configured": True,
            "identity_fallback_detected": False,
            "explanation": "Encryption rule targets wildcard resources including all core Secret objects.",
            "recommendation": "Maintain current wildcard resource scope for newly defined custom resources storing sensitive tokens."
        }
    ]

def get_demo_findings() -> List[Dict[str, Any]]:
    return [
        {
            "rule_id": "KSA-001",
            "title": "Encryption at Rest Not Enabled / Unverified",
            "description": "Kubernetes API server etcd storage for Secrets is not configured with active EncryptionConfiguration or identity fallback is default.",
            "rationale": "Etcd snapshots or unencrypted storage volumes expose raw secret data if stolen or backed up without node-level disk encryption.",
            "severity": "Critical",
            "category": "Encryption",
            "namespace": "production",
            "resource_type": "EncryptionConfiguration",
            "resource_name": "kube-apiserver-config",
            "status": "Open",
            "evidence": {"provider_first": "identity", "etcd_encrypted": False},
            "impact": "Full compromise of etcd datastore reveals all cluster passwords, tokens, and certificates.",
            "recommendation": "Configure --encryption-provider-config on kube-apiserver with KMS or AES-CBC provider.",
            "remediation": "Create /etc/kubernetes/enc/config.yaml with aescbc or kms v2 provider and restart apiserver.",
            "references": ["https://kubernetes.io/docs/tasks/administer-cluster/encrypt-data/"]
        },
        {
            "rule_id": "KSA-002",
            "title": "Broad RBAC Secret Permissions Assigned to ServiceAccount",
            "description": "ServiceAccount 'ci-cd-deployer' holds wildcard '*' or get/list/watch secret permissions across all namespaces.",
            "rationale": "Over-privileged ServiceAccounts can be exploited to dump all secrets from production namespaces.",
            "severity": "High",
            "category": "RBAC",
            "namespace": "production",
            "resource_type": "ClusterRoleBinding",
            "resource_name": "ci-cd-deployer-binding",
            "status": "Open",
            "evidence": {"verbs": ["*"], "resources": ["secrets"], "subject": "ci-cd-deployer"},
            "impact": "An attacker compromising the CI/CD pod can read all production secrets.",
            "recommendation": "Restrict ServiceAccount to specific secret resources using fine-grained RoleBindings.",
            "remediation": "Replace cluster-admin binding with namespace-scoped RoleBinding listing explicit secret resourceNames.",
            "references": ["https://kubernetes.io/docs/concepts/security/rbac-good-practices/"]
        },
        {
            "rule_id": "KSA-003",
            "title": "Cluster-Wide Secret Access via ClusterRoleBinding",
            "description": "ClusterRoleBinding 'monitoring-prom-sa' allows reading secrets across every namespace in the cluster.",
            "rationale": "Monitoring agents rarely require reading raw Kubernetes Secret objects in production namespaces.",
            "severity": "High",
            "category": "RBAC",
            "namespace": "monitoring",
            "resource_type": "ClusterRoleBinding",
            "resource_name": "monitoring-secret-reader",
            "status": "Open",
            "evidence": {"verbs": ["get", "list", "watch"], "resources": ["secrets"]},
            "impact": "Potential secret leakage from system and tenant namespaces into monitoring logs.",
            "recommendation": "Remove secret read permissions from Prometheus/Grafana service accounts.",
            "remediation": "Audit Prometheus ClusterRole rules and delete rules granting secret access.",
            "references": ["https://kubernetes.io/docs/reference/access-authn-authz/rbac/"]
        },
        {
            "rule_id": "KSA-004",
            "title": "Sensitive Secret Referenced by Multiple Workloads",
            "description": "Secret 'db-postgres-credentials' is directly mounted across 5 separate deployments across production.",
            "rationale": "Sharing credentials across multiple microservices increases blast radius if any single microservice is compromised.",
            "severity": "Medium",
            "category": "Secret Hygiene",
            "namespace": "production",
            "resource_type": "Secret",
            "resource_name": "db-postgres-credentials",
            "status": "Open",
            "evidence": {"deployments": ["api-gateway", "user-service", "billing-worker", "analytics-job", "notification-svc"]},
            "impact": "Credential leakage in notification-svc compromises primary database.",
            "recommendation": "Issue dedicated, least-privilege DB credentials per microservice.",
            "remediation": "Create database roles per microservice with separate K8s secret mounts.",
            "references": ["https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html"]
        },
        {
            "rule_id": "KSA-005",
            "title": "Potentially Stale Secret Exceeding Rotation Lifecycle",
            "description": "Secret 'db-postgres-credentials' has not been rotated in 210 days (threshold: 90 days).",
            "rationale": "Unrotated secrets increase the risk of long-term undetected credential exposure.",
            "severity": "Medium",
            "category": "Secret Hygiene",
            "namespace": "production",
            "resource_type": "Secret",
            "resource_name": "db-postgres-credentials",
            "status": "Acknowledged",
            "evidence": {"age_days": 210, "threshold_days": 90},
            "impact": "Exposed old credentials remain valid indefinitely.",
            "recommendation": "Implement automated secret rotation using HashiCorp Vault or AWS Secrets Manager.",
            "remediation": "Rotate database password and update Kubernetes Secret object.",
            "references": ["https://kubernetes.io/docs/concepts/configuration/secret/"]
        },
        {
            "rule_id": "KSA-006",
            "title": "Secret Exposed via Workload Environment Variables",
            "description": "Secret 'db-postgres-credentials' is injected using envFrom or env instead of tmpfs volume mounts.",
            "rationale": "Environment variables are frequently logged by crashed process dumps, /proc/1/environ inspection, or diagnostic tools.",
            "severity": "Medium",
            "category": "Workload Exposure",
            "namespace": "production",
            "resource_type": "Deployment",
            "resource_name": "api-gateway",
            "status": "Open",
            "evidence": {"injection_type": "envFrom", "secret": "db-postgres-credentials"},
            "impact": "Secret values leaked in error logs or container crash dumps.",
            "recommendation": "Mount secrets as memory-backed tmpfs secret volumes instead of environment variables.",
            "remediation": "Update deployment manifest to use spec.volumes[].secret and spec.containers[].volumeMounts.",
            "references": ["https://kubernetes.io/docs/concepts/configuration/secret/#using-secrets-as-files-from-a-pod"]
        },
        {
            "rule_id": "KSA-007",
            "title": "Excessive ServiceAccount Secret Tokens Auto-Mounted",
            "description": "Legacy auto-created ServiceAccount tokens are present in default namespace without automountServiceAccountToken: false.",
            "rationale": "Pods in default namespace auto-mount API tokens even when they do not interact with the Kubernetes API.",
            "severity": "Low",
            "category": "Secret Hygiene",
            "namespace": "default",
            "resource_type": "ServiceAccount",
            "resource_name": "default",
            "status": "Open",
            "evidence": {"automount": True, "token_present": True},
            "impact": "Containers compromised by RCE gain default service account API tokens.",
            "recommendation": "Set automountServiceAccountToken: false on default ServiceAccounts.",
            "remediation": "Edit ServiceAccount default and add automountServiceAccountToken: false.",
            "references": ["https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/"]
        },
        {
            "rule_id": "KSA-008",
            "title": "Weak or Static Encryption Provider Configuration",
            "description": "EncryptionConfiguration relies on static aescbc key without KMS automated envelope encryption.",
            "rationale": "Static keys in configuration files require master key rotation processes and risk exposure in git/backups.",
            "severity": "High",
            "category": "Encryption",
            "namespace": "kube-system",
            "resource_type": "EncryptionConfiguration",
            "resource_name": "encryption-config",
            "status": "Open",
            "evidence": {"active_provider": "aescbc", "kms_enabled": False},
            "impact": "Compromise of control plane host configuration file leaks master encryption key.",
            "recommendation": "Upgrade to KMS v2 provider plugin for AWS KMS, Azure Key Vault, or HashiCorp Vault.",
            "remediation": "Configure gRPC KMS plugin in kube-apiserver manifest.",
            "references": ["https://kubernetes.io/docs/tasks/administer-cluster/kms-provider/"]
        },
        {
            "rule_id": "KSA-009",
            "title": "Identity Provider Fallback Enabled Before Cipher Providers",
            "description": "The 'identity' provider is listed prior to encryption providers in EncryptionConfiguration.",
            "rationale": "When 'identity' precedes ciphers, newly written secrets are written in plaintext unencrypted format.",
            "severity": "Critical",
            "category": "Encryption",
            "namespace": "kube-system",
            "resource_type": "EncryptionConfiguration",
            "resource_name": "encryption-config",
            "status": "Open",
            "evidence": {"provider_sequence": ["identity", "aescbc"]},
            "impact": "All newly created Kubernetes Secrets remain unencrypted in etcd datastore.",
            "recommendation": "Place identity provider as the last item in the providers list.",
            "remediation": "Reorder providers list in EncryptionConfiguration YAML file.",
            "references": ["https://kubernetes.io/docs/tasks/administer-cluster/encrypt-data/"]
        },
        {
            "rule_id": "KSA-010",
            "title": "Secret Management Configuration Requires Review",
            "description": "General audit flag: 2 secrets contain unencrypted database passwords in staging namespace.",
            "rationale": "Staging environments often mirror production data structures without enforced compliance policies.",
            "severity": "Low",
            "category": "Secret Hygiene",
            "namespace": "staging",
            "resource_type": "Secret",
            "resource_name": "redis-cluster-auth",
            "status": "Open",
            "evidence": {"environment": "staging", "risk": "Medium"},
            "impact": "Developers or contractors with staging access can read staging DB credentials.",
            "recommendation": "Apply uniform secret encryption and RBAC policies across staging and production.",
            "remediation": "Enforce RBAC rules on staging namespace.",
            "references": ["https://kubernetes.io/docs/concepts/security/"]
        }
    ]
