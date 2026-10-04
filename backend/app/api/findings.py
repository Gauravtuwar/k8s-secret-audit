from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.models.models import Finding, Audit, User, AuditLog
from app.schemas.schemas import FindingOut, FindingStatusUpdate
from app.api.deps import get_current_user

router = APIRouter(prefix="/findings", tags=["Findings"])

@router.get("", response_model=List[FindingOut])
def list_findings(
    cluster_id: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    namespace: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Finding).join(Audit).filter(Audit.user_id == current_user.id)

    if cluster_id:
        query = query.filter(Finding.cluster_id == cluster_id)
    if severity:
        query = query.filter(Finding.severity == severity)
    if status:
        query = query.filter(Finding.status == status)
    if namespace:
        query = query.filter(Finding.namespace == namespace)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Finding.title.ilike(search_pattern)) |
            (Finding.rule_id.ilike(search_pattern)) |
            (Finding.resource_name.ilike(search_pattern))
        )

    return query.order_by(Finding.last_detected.desc()).all()

@router.patch("/{id}", response_model=FindingOut)
def update_finding_status(
    id: str,
    status_update: FindingStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    finding = db.query(Finding).join(Audit).filter(Finding.id == id, Audit.user_id == current_user.id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    finding.status = status_update.status
    db.add(AuditLog(
        user_id=current_user.id,
        action="FINDING_STATUS_UPDATED",
        target_type="Finding",
        target_id=id,
        details={"new_status": status_update.status}
    ))
    db.commit()
    db.refresh(finding)

    # Recalculate security score for parent audit
    parent_audit = db.query(Audit).filter(Audit.id == finding.audit_id).first()
    if parent_audit:
        all_findings = db.query(Finding).filter(Finding.audit_id == parent_audit.id).all()
        from app.audit.scoring import calculate_security_score
        score_res = calculate_security_score([{"severity": f.severity, "status": f.status} for f in all_findings])
        parent_audit.security_score = score_res["score"]
        parent_audit.critical_count = score_res["critical_count"]
        parent_audit.high_count = score_res["high_count"]
        parent_audit.medium_count = score_res["medium_count"]
        parent_audit.low_count = score_res["low_count"]
        db.commit()

    return finding
