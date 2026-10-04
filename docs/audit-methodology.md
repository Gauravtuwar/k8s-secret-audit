# Kubernetes Secret Management & Encryption at Rest — Audit Methodology

## Security Rule Catalog (KSA-001 - KSA-010)

| Rule ID | Severity | Category | Title | Detection Rationale |
|---|---|---|---|---|
| **KSA-001** | Critical | Encryption | Encryption at Rest Not Verified / Enabled | Detects if kube-apiserver etcd storage relies on identity (plaintext unencrypted) fallback. |
| **KSA-002** | High | RBAC | Broad RBAC Permissions to Secret Resources | Flags ServiceAccounts or Roles with wildcard `*` or `get`/`list`/`watch` permissions on secrets. |
| **KSA-003** | High | RBAC | Cluster-Wide Secret Access via ClusterRoleBindings | Identifies ClusterRoleBindings exposing secrets across all namespaces cluster-wide. |
| **KSA-004** | Medium | Secret Hygiene | Sensitive Secret Referenced by Multiple Workloads | Flags a single Secret object shared across $\ge 3$ distinct deployments. |
| **KSA-005** | Medium | Secret Hygiene | Potentially Stale Secret Exceeding Rotation Lifecycle | Detects secrets unrotated for $> 90$ days. |
| **KSA-006** | Medium | Workload Exposure | Secret Exposed via Workload Environment Variables | Flags secrets injected using `env` or `envFrom` instead of tmpfs secret volume mounts. |
| **KSA-007** | High | RBAC | Excessive ServiceAccount Permissions Involving Secrets | Identifies auto-mounted ServiceAccount API tokens holding secret modification rights. |
| **KSA-008** | High | Encryption | Weak or Static Encryption Provider Configuration | Flags static file key configurations without Cloud KMS envelope encryption. |
| **KSA-009** | Critical | Encryption | Identity Provider Fallback Enabled Before Cipher Providers | Detects `identity` listed prior to cipher providers in EncryptionConfiguration. |
| **KSA-010** | Low | Secret Hygiene | Secret Management Configuration Requires Review | Flags unannotated secrets in default namespace. |

---

## Application Security Score Algorithm

The **Application Security Score** is calculated deterministically based on open findings:

$$\text{Deduction} = \sum (\text{Critical} \times 25 + \text{High} \times 15 + \text{Medium} \times 8 + \text{Low} \times 3)$$

$$\text{Security Score} = \max(0.0, \, \min(100.0, \, 100.0 - \text{Deduction}))$$

- **Resolved** or **False Positive** findings are excluded from score deductions.
- Rating scale:
  - $\ge 90.0$: Excellent
  - $75.0 - 89.9$: Good
  - $50.0 - 74.9$: Needs Improvement
  - $< 50.0$: Critical Risk
