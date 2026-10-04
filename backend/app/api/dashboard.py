from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.db import get_db
from app.models.models import Cluster, Audit, Finding, SecretsInventory, EncryptionCheck, User
from app.schemas.schemas import DashboardSummaryOut, AuditOut
from app.api.deps import get_current_user
from app.audit.engine import AuditEngine

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary", response_model=DashboardSummaryOut)
def get_dashboard_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Fetch clusters count
    total_clusters = db.query(Cluster).filter(Cluster.user_id == current_user.id).count()

    # Fetch recent audits
    audits = db.query(Audit).filter(Audit.user_id == current_user.id).order_by(Audit.started_at.desc()).all()
    
    if not audits:
        # Guarantee initial demo cluster and audit if DB empty
        clusters = db.query(Cluster).filter(Cluster.user_id == current_user.id).all()
        if not clusters:
            from app.core.demo_data import get_demo_cluster_data
            demo_info = get_demo_cluster_data()
            c = Cluster(
                user_id=current_user.id,
                name=demo_info["name"],
                is_demo=True,
                api_server=demo_info["api_server"],
                kubernetes_version=demo_info["kubernetes_version"],
                node_count=demo_info["node_count"],
                namespace_count=demo_info["namespace_count"],
                connection_status="Connected"
            )
            db.add(c)
            db.commit()
            db.refresh(c)
            target_cluster = c
        else:
            target_cluster = clusters[0]

        initial_audit = Audit(
            user_id=current_user.id,
            cluster_id=target_cluster.id,
            status="in_progress",
            is_demo=target_cluster.is_demo
        )
        db.add(initial_audit)
        db.commit()
        db.refresh(initial_audit)

        engine = AuditEngine(db, initial_audit.id)
        engine.run()
        db.refresh(initial_audit)

        audits = [initial_audit]
        total_clusters = 1

    latest_audit = audits[0]
    previous_audit = audits[1] if len(audits) > 1 else None

    # Calculate metrics from latest audit
    total_secrets = latest_audit.total_secrets_audited
    critical = latest_audit.critical_count
    high = latest_audit.high_count
    medium = latest_audit.medium_count
    low = latest_audit.low_count

    current_score = latest_audit.security_score
    prev_score = previous_audit.security_score if previous_audit else current_score
    score_change = round(current_score - prev_score, 1)

    # Encryption status summary
    enc_checks = db.query(EncryptionCheck).filter(EncryptionCheck.audit_id == latest_audit.id).all()
    enc_summary = {"PASS": 0, "FAIL": 0, "WARNING": 0, "UNKNOWN": 0}
    for e in enc_checks:
        enc_summary[e.status] = enc_summary.get(e.status, 0) + 1
    if not enc_checks:
        enc_summary["FAIL"] = 1

    # Chart 1: Findings by Severity
    severity_breakdown = {
        "Critical": critical,
        "High": high,
        "Medium": medium,
        "Low": low
    }

    # Chart 2: Security Score Over Time
    score_history = []
    for a in reversed(audits[:10]):
        score_history.append({
            "date": a.started_at.strftime("%b %d %H:%M") if a.started_at else "Now",
            "score": a.security_score
        })

    # Chart 4: Findings by Namespace
    findings = db.query(Finding).filter(Finding.audit_id == latest_audit.id).all()
    ns_map = {}
    for f in findings:
        ns = f.namespace or "default"
        ns_map[ns] = ns_map.get(ns, 0) + 1
    namespace_breakdown = [{"namespace": k, "findings_count": v} for k, v in ns_map.items()]

    recent_audits_out = [AuditOut.model_validate(a) for a in audits[:5]]

    return DashboardSummaryOut(
        total_clusters=total_clusters,
        total_secrets_audited=total_secrets,
        critical_findings=critical,
        high_findings=high,
        medium_findings=medium,
        low_findings=low,
        encryption_status_summary=enc_summary,
        last_audit_at=latest_audit.completed_at or latest_audit.started_at,
        security_score=current_score,
        previous_score=prev_score,
        score_change=score_change,
        severity_breakdown=severity_breakdown,
        score_history=score_history,
        namespace_breakdown=namespace_breakdown,
        recent_audits=recent_audits_out
    )
