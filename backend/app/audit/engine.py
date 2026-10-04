import logging
from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.models.models import Audit, Finding, SecretsInventory, RbacPermission, EncryptionCheck, Cluster, ClusterConnection
from app.audit.rules import RULES_METADATA
from app.audit.scoring import calculate_security_score
from app.audit.encryption_checker import analyze_encryption_at_rest
from app.audit.rbac_analyzer import analyze_rbac_permissions
from app.audit.workload_analyzer import analyze_secrets_workload_exposure
from app.kubernetes.client import KubernetesMetadataClient
from app.core.demo_data import get_demo_findings, get_demo_secrets_inventory, get_demo_rbac_permissions, get_demo_encryption_checks

logger = logging.getLogger("audit_engine")

class AuditEngine:
    def __init__(self, db: Session, audit_id: str):
        self.db = db
        self.audit_id = audit_id
        self.audit = db.query(Audit).filter(Audit.id == audit_id).first()
        if not self.audit:
            raise ValueError(f"Audit with ID {audit_id} not found.")
        self.cluster = db.query(Cluster).filter(Cluster.id == self.audit.cluster_id).first()

    def run(self) -> Audit:
        """
        Executes complete Kubernetes Secret Management and Encryption at Rest audit pipeline.
        Updates audit step progression, saves findings, secrets inventory, RBAC perms, and score.
        """
        try:
            # Step 1: Connecting
            self._update_step("Connecting to cluster", "in_progress")
            
            is_demo = self.audit.is_demo or (self.cluster and self.cluster.is_demo)

            if is_demo:
                self._run_demo_audit()
                return self.audit

            # Real Cluster Execution
            conn = self.db.query(ClusterConnection).filter(ClusterConnection.cluster_id == self.cluster.id).first()
            if not conn:
                raise ValueError("Cluster connection credentials missing.")

            k8s_client = KubernetesMetadataClient(
                auth_type=conn.auth_type,
                kubeconfig_str=conn.encrypted_credentials if conn.auth_type == "kubeconfig" else None,
                api_server=self.cluster.api_server,
                token=conn.encrypted_credentials if conn.auth_type == "token" else None
            )
            k8s_client.initialize()

            # Step 2: Collecting namespaces
            self._update_step("Collecting namespaces and metadata", "in_progress")
            namespaces = k8s_client.list_namespaces()
            if self.cluster:
                self.cluster.namespace_count = len(namespaces)
                self.cluster.kubernetes_version = k8s_client.get_cluster_version()
                nodes = k8s_client.list_nodes()
                if nodes:
                    self.cluster.node_count = len(nodes)
                self.db.commit()

            # Step 3: Analyzing Secrets
            self._update_step("Analyzing Secrets metadata", "in_progress")
            secrets_meta = k8s_client.list_secrets_metadata()
            workloads = k8s_client.list_workloads()
            secrets_inventory = analyze_secrets_workload_exposure(secrets_meta, workloads, is_demo=False)

            # Step 4: Analyzing RBAC
            self._update_step("Analyzing RBAC permissions", "in_progress")
            rbac_raw = k8s_client.list_rbac_rules()
            rbac_perms = analyze_rbac_permissions(rbac_raw, is_demo=False)

            # Step 5: Checking encryption
            self._update_step("Checking encryption at rest", "in_progress")
            enc_checks = analyze_encryption_at_rest(k8s_client_initialized=True, is_demo=False)

            # Step 6: Running security rules & Generating findings
            self._update_step("Running security rules (KSA-001 - KSA-010)", "in_progress")
            findings_data = self._evaluate_rules(secrets_inventory, rbac_perms, enc_checks, workloads)

            # Step 7: Calculate Security Score & Save Results
            self._update_step("Generating findings and calculating score", "in_progress")
            score_data = calculate_security_score(findings_data)

            self._save_results(findings_data, secrets_inventory, rbac_perms, enc_checks, score_data)

            self.audit.status = "completed"
            self.audit.completed_at = datetime.now(timezone.utc).replace(tzinfo=None)
            self.audit.current_step = "Completed"
            if self.cluster:
                self.cluster.last_audit_at = datetime.now(timezone.utc).replace(tzinfo=None)
                self.cluster.connection_status = "Connected"
            self.db.commit()

            return self.audit

        except Exception as e:
            logger.error(f"Audit failed for ID {self.audit_id}: {str(e)}", exc_info=True)
            self.audit.status = "failed"
            self.audit.current_step = f"Failed: {str(e)}"
            self.db.commit()
            raise e

    def _run_demo_audit(self):
        """Populates audit results with synthetic demo data for Demo Mode."""
        self._update_step("Connecting to Demo environment", "in_progress")
        self._update_step("Collecting namespaces and metadata", "in_progress")
        self._update_step("Analyzing Secrets metadata", "in_progress")
        self._update_step("Analyzing RBAC permissions", "in_progress")
        self._update_step("Checking encryption at rest", "in_progress")
        self._update_step("Running security rules (KSA-001 - KSA-010)", "in_progress")

        demo_findings = get_demo_findings()
        demo_secrets = get_demo_secrets_inventory()
        demo_rbac = get_demo_rbac_permissions()
        demo_enc = get_demo_encryption_checks()

        score_data = calculate_security_score(demo_findings)
        self._save_results(demo_findings, demo_secrets, demo_rbac, demo_enc, score_data)

        self.audit.status = "completed"
        self.audit.completed_at = datetime.now(timezone.utc).replace(tzinfo=None)
        self.audit.current_step = "Completed"
        if self.cluster:
            self.cluster.last_audit_at = datetime.now(timezone.utc).replace(tzinfo=None)
        self.db.commit()

    def _update_step(self, step_name: str, status: str):
        self.audit.current_step = step_name
        self.audit.status = status
        self.db.commit()

    def _evaluate_rules(
        self,
        secrets: List[Dict[str, Any]],
        rbac: List[Dict[str, Any]],
        enc_checks: List[Dict[str, Any]],
        workloads: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Applies KSA-001 through KSA-010 detection logic on collected metadata.
        """
        findings = []

        # KSA-001: Encryption at rest verification
        for ec in enc_checks:
            if ec.get("status") in ["FAIL", "UNKNOWN"]:
                meta = RULES_METADATA["KSA-001"]
                findings.append({
                    "rule_id": meta["rule_id"],
                    "title": meta["title"],
                    "description": ec.get("explanation", meta["description"]),
                    "rationale": meta["rationale"],
                    "severity": meta["severity"],
                    "category": meta["category"],
                    "namespace": "kube-system",
                    "resource_type": "EncryptionConfiguration",
                    "resource_name": ec.get("check_name", "apiserver-config"),
                    "status": "Open",
                    "evidence": ec,
                    "impact": "Unencrypted etcd storage allows plain reading of secret bytes from storage backups.",
                    "recommendation": meta["recommendation"],
                    "remediation": meta["remediation"],
                    "references": meta["references"]
                })

        # KSA-002 & KSA-003: RBAC perms
        for r in rbac:
            verbs = r.get("verbs", [])
            if "*" in verbs or ("get" in verbs and "list" in verbs):
                meta = RULES_METADATA["KSA-003"] if r.get("namespace") == "cluster-wide" else RULES_METADATA["KSA-002"]
                findings.append({
                    "rule_id": meta["rule_id"],
                    "title": meta["title"],
                    "description": f"Subject '{r.get('subject_name')}' holds elevated secret verbs ({', '.join(verbs)}) via {r.get('role_kind')} '{r.get('role_name')}'.",
                    "rationale": meta["rationale"],
                    "severity": r.get("risk_level", "High"),
                    "category": meta["category"],
                    "namespace": r.get("namespace", "default"),
                    "resource_type": r.get("role_kind", "RoleBinding"),
                    "resource_name": f"{r.get('subject_name')}-binding",
                    "status": "Open",
                    "evidence": r,
                    "impact": "Subject can inspect or manipulate sensitive credentials.",
                    "recommendation": meta["recommendation"],
                    "remediation": meta["remediation"],
                    "references": meta["references"]
                })

        # KSA-004 & KSA-005: Secret Hygiene (Stale secrets & multi-workload reference)
        for s in secrets:
            age = s.get("age_days", 0)
            used_by = s.get("used_by", [])

            if age > 90:
                meta = RULES_METADATA["KSA-005"]
                findings.append({
                    "rule_id": meta["rule_id"],
                    "title": meta["title"],
                    "description": f"Secret '{s.get('name')}' in namespace '{s.get('namespace')}' has been active for {age} days without rotation.",
                    "rationale": meta["rationale"],
                    "severity": meta["severity"],
                    "category": meta["category"],
                    "namespace": s.get("namespace"),
                    "resource_type": "Secret",
                    "resource_name": s.get("name"),
                    "status": "Open",
                    "evidence": {"age_days": age, "threshold": 90},
                    "impact": "Prolonged credential lifetime increases risk of unnoticed exposure.",
                    "recommendation": meta["recommendation"],
                    "remediation": meta["remediation"],
                    "references": meta["references"]
                })

            if len(used_by) >= 3:
                meta = RULES_METADATA["KSA-004"]
                findings.append({
                    "rule_id": meta["rule_id"],
                    "title": meta["title"],
                    "description": f"Secret '{s.get('name')}' is shared across {len(used_by)} separate workloads.",
                    "rationale": meta["rationale"],
                    "severity": meta["severity"],
                    "category": meta["category"],
                    "namespace": s.get("namespace"),
                    "resource_type": "Secret",
                    "resource_name": s.get("name"),
                    "status": "Open",
                    "evidence": {"shared_count": len(used_by), "workloads": used_by},
                    "impact": "Breaching one service grants lateral access to shared credential.",
                    "recommendation": meta["recommendation"],
                    "remediation": meta["remediation"],
                    "references": meta["references"]
                })

        # KSA-006: Environment variable exposure
        for w in workloads:
            for ref in w.get("referenced_secrets", []):
                if ref.get("via") in ["env", "envFrom"]:
                    meta = RULES_METADATA["KSA-006"]
                    findings.append({
                        "rule_id": meta["rule_id"],
                        "title": meta["title"],
                        "description": f"Workload '{w.get('name')}' extracts secret '{ref.get('secret')}' via environment variable injection ({ref.get('via')}).",
                        "rationale": meta["rationale"],
                        "severity": meta["severity"],
                        "category": meta["category"],
                        "namespace": w.get("namespace"),
                        "resource_type": w.get("kind", "Deployment"),
                        "resource_name": w.get("name"),
                        "status": "Open",
                        "evidence": {"secret": ref.get("secret"), "injection": ref.get("via")},
                        "impact": "Secrets may leak into process environment listings, stack traces, or monitoring tools.",
                        "recommendation": meta["recommendation"],
                        "remediation": meta["remediation"],
                        "references": meta["references"]
                    })

        return findings

    def _save_results(
        self,
        findings_data: List[Dict[str, Any]],
        secrets_data: List[Dict[str, Any]],
        rbac_data: List[Dict[str, Any]],
        enc_data: List[Dict[str, Any]],
        score_data: Dict[str, Any]
    ):
        # Update Audit summary metrics
        self.audit.security_score = score_data["score"]
        self.audit.critical_count = score_data["critical_count"]
        self.audit.high_count = score_data["high_count"]
        self.audit.medium_count = score_data["medium_count"]
        self.audit.low_count = score_data["low_count"]
        self.audit.informational_count = score_data["informational_count"]
        self.audit.total_secrets_audited = len(secrets_data)
        self.audit.summary_json = {
            "score_rating": score_data["rating"],
            "total_deduction": score_data["total_deduction"],
            "namespaces_audited": list(set([s.get("namespace", "default") for s in secrets_data]))
        }

        # Clear previous run items if re-running
        self.db.query(Finding).filter(Finding.audit_id == self.audit_id).delete()
        self.db.query(SecretsInventory).filter(SecretsInventory.audit_id == self.audit_id).delete()
        self.db.query(RbacPermission).filter(RbacPermission.audit_id == self.audit_id).delete()
        self.db.query(EncryptionCheck).filter(EncryptionCheck.audit_id == self.audit_id).delete()

        # Save Findings
        for f in findings_data:
            finding_obj = Finding(
                audit_id=self.audit_id,
                cluster_id=self.audit.cluster_id,
                rule_id=f["rule_id"],
                title=f["title"],
                description=f["description"],
                rationale=f.get("rationale"),
                severity=f["severity"],
                category=f["category"],
                namespace=f.get("namespace", "default"),
                resource_type=f["resource_type"],
                resource_name=f["resource_name"],
                status=f.get("status", "Open"),
                evidence=f.get("evidence"),
                impact=f.get("impact"),
                recommendation=f["recommendation"],
                remediation=f.get("remediation"),
                references=f.get("references")
            )
            self.db.add(finding_obj)

        # Save Secrets Inventory (Metadata ONLY!)
        for s in secrets_data:
            sec_obj = SecretsInventory(
                audit_id=self.audit_id,
                cluster_id=self.audit.cluster_id,
                name=s["name"],
                namespace=s["namespace"],
                type=s.get("type", "Opaque"),
                created_at_k8s=s.get("created_at_k8s"),
                age_days=s.get("age_days", 0),
                used_by=s.get("used_by"),
                rbac_exposure=s.get("rbac_exposure", "Low"),
                encryption_status=s.get("encryption_status", "UNKNOWN"),
                risk_level=s.get("risk_level", "Low"),
                labels=s.get("labels"),
                annotations=s.get("annotations")
            )
            self.db.add(sec_obj)

        # Save RBAC Permissions
        for r in rbac_data:
            rbac_obj = RbacPermission(
                audit_id=self.audit_id,
                cluster_id=self.audit.cluster_id,
                subject_kind=r["subject_kind"],
                subject_name=r["subject_name"],
                subject_namespace=r.get("subject_namespace"),
                role_kind=r["role_kind"],
                role_name=r["role_name"],
                verbs=r["verbs"],
                namespace=r.get("namespace", "cluster-wide"),
                risk_level=r.get("risk_level", "Low")
            )
            self.db.add(rbac_obj)

        # Save Encryption Checks
        for e in enc_data:
            enc_obj = EncryptionCheck(
                audit_id=self.audit_id,
                cluster_id=self.audit.cluster_id,
                check_name=e["check_name"],
                status=e["status"],
                provider_chain=e.get("provider_chain"),
                wildcard_configured=e.get("wildcard_configured", False),
                identity_fallback_detected=e.get("identity_fallback_detected", False),
                explanation=e["explanation"],
                recommendation=e.get("recommendation")
            )
            self.db.add(enc_obj)

        self.db.commit()
