from typing import Dict, Any, List

RULES_METADATA = {
    "KSA-001": {
        "rule_id": "KSA-001",
        "title": "Encryption at Rest Not Verified / Enabled",
        "description": "Kubernetes Secrets etcd datastore is not configured with verified active encryption or relies on unencrypted default identity provider.",
        "rationale": "Etcd datastore backups or raw disk snapshots expose all Kubernetes Secrets if encryption at rest is omitted.",
        "severity": "Critical",
        "category": "Encryption",
        "recommendation": "Enable EncryptionConfiguration on kube-apiserver using AES-CBC, Secretbox, or KMS provider.",
        "remediation": "Create /etc/kubernetes/enc/config.yaml specifying aescbc or kms provider and restart control plane.",
        "references": ["https://kubernetes.io/docs/tasks/administer-cluster/encrypt-data/"]
    },
    "KSA-002": {
        "rule_id": "KSA-002",
        "title": "Broad RBAC Permissions to Secret Resources",
        "description": "Role or ServiceAccount holds wildcard '*' or get/list/watch permissions over all Secret resources in namespace.",
        "rationale": "Over-privileged roles allow compromised applications to retrieve unrelated credentials in the namespace.",
        "severity": "High",
        "category": "RBAC",
        "recommendation": "Restrict secret access using explicit resourceNames in RBAC Role rules.",
        "remediation": "Update Role manifest to set rules[].resourceNames to specific required secret names.",
        "references": ["https://kubernetes.io/docs/concepts/security/rbac-good-practices/"]
    },
    "KSA-003": {
        "rule_id": "KSA-003",
        "title": "Cluster-Wide Secret Access via ClusterRoleBindings",
        "description": "ClusterRoleBinding grants permissions to read or list secrets across all namespaces cluster-wide.",
        "rationale": "Cluster-wide secret access violates least privilege and amplifies breach blast radius.",
        "severity": "High",
        "category": "RBAC",
        "recommendation": "Scope secret permissions using namespace-specific RoleBindings instead of ClusterRoleBindings.",
        "remediation": "Delete ClusterRoleBinding and deploy targeted RoleBindings per required namespace.",
        "references": ["https://kubernetes.io/docs/reference/access-authn-authz/rbac/"]
    },
    "KSA-004": {
        "rule_id": "KSA-004",
        "title": "Sensitive Secret Referenced by Multiple Workloads",
        "description": "A single Secret object is shared and mounted across 3 or more independent workloads.",
        "rationale": "Sharing credentials across workloads connects independent microservices, increasing lateral movement risk.",
        "severity": "Medium",
        "category": "Secret Hygiene",
        "recommendation": "Issue dedicated, scoped credentials per workload/microservice.",
        "remediation": "Split shared Secret into distinct workload-specific Secret resources.",
        "references": ["https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html"]
    },
    "KSA-005": {
        "rule_id": "KSA-005",
        "title": "Potentially Stale Secret Exceeding Rotation Lifecycle",
        "description": "Kubernetes Secret has not been modified or rotated in > 90 days.",
        "rationale": "Unrotated secrets increase the probability that leaked or compromised credentials remain valid.",
        "severity": "Medium",
        "category": "Secret Hygiene",
        "recommendation": "Establish automated credential rotation policies (e.g. 90-day maximum age).",
        "remediation": "Rotate secret value in backing provider and update Secret resource metadata.",
        "references": ["https://kubernetes.io/docs/concepts/configuration/secret/"]
    },
    "KSA-006": {
        "rule_id": "KSA-006",
        "title": "Secret Exposed via Workload Environment Variables",
        "description": "Secret values injected via env or envFrom instead of memory-backed tmpfs secret volumes.",
        "rationale": "Environment variables risk exposure in process listings, crash dumps, and application logs.",
        "severity": "Medium",
        "category": "Workload Exposure",
        "recommendation": "Mount Secrets as tmpfs volume files under /etc/secrets/ instead of environment variables.",
        "remediation": "Modify Pod spec.volumes and container volumeMounts to reference secret.",
        "references": ["https://kubernetes.io/docs/concepts/configuration/secret/#using-secrets-as-files-from-a-pod"]
    },
    "KSA-007": {
        "rule_id": "KSA-007",
        "title": "Excessive ServiceAccount Permissions Involving Secrets",
        "description": "ServiceAccount auto-mounts API credentials while possessing secret creation or deletion privileges.",
        "rationale": "Compromising pod container code allows abusing auto-mounted token to manipulate secrets.",
        "severity": "High",
        "category": "RBAC",
        "recommendation": "Disable automountServiceAccountToken: false on ServiceAccounts not interacting with API server.",
        "remediation": "Set automountServiceAccountToken: false on Pod or ServiceAccount spec.",
        "references": ["https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/"]
    },
    "KSA-008": {
        "rule_id": "KSA-008",
        "title": "Weak or Static Encryption Provider Configuration",
        "description": "Encryption relies on static local file key without cloud KMS or Hardware Security Module (HSM) integration.",
        "rationale": "Static keys in host files are vulnerable to host compromises and manual key management errors.",
        "severity": "High",
        "category": "Encryption",
        "recommendation": "Integrate Cloud KMS (AWS KMS, Azure Key Vault, GCP KMS) via KMS v2 provider plugin.",
        "remediation": "Configure KMS provider gRPC socket in EncryptionConfiguration.",
        "references": ["https://kubernetes.io/docs/tasks/administer-cluster/kms-provider/"]
    },
    "KSA-009": {
        "rule_id": "KSA-009",
        "title": "Identity Provider Fallback Detected Before Ciphers",
        "description": "EncryptionConfiguration lists 'identity' (plaintext unencrypted) before cipher providers (aescbc, secretbox, kms).",
        "rationale": "Kubernetes reads the providers array in order. If 'identity' comes first, new secrets are written unencrypted.",
        "severity": "Critical",
        "category": "Encryption",
        "recommendation": "Ensure 'identity' provider is placed last in provider list as fallback for unencrypting legacy secrets.",
        "remediation": "Edit /etc/kubernetes/enc/config.yaml and move identity to end of provider list.",
        "references": ["https://kubernetes.io/docs/tasks/administer-cluster/encrypt-data/"]
    },
    "KSA-010": {
        "rule_id": "KSA-010",
        "title": "Secret Management Configuration Requires Review",
        "description": "Secret hygiene anomaly detected such as default namespace usage or unannotated sensitive secrets.",
        "rationale": "Non-production or default namespaces often lack proper access controls and security boundary isolation.",
        "severity": "Low",
        "category": "Secret Hygiene",
        "recommendation": "Move application workloads and secrets out of default namespace into designated namespaces.",
        "remediation": "Re-deploy workload into dedicated namespace with RBAC controls.",
        "references": ["https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/"]
    }
}
