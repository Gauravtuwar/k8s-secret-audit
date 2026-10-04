from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.models.models import Audit, Cluster, User, Finding, AuditLog
from app.schemas.schemas import AuditCreateRequest, AuditOut, FindingOut
from app.api.deps import get_current_user
from app.audit.engine import AuditEngine

router = APIRouter(prefix="/audits", tags=["Audits"])

def execute_audit_background(audit_id: str):
    """Background runner for audit pipeline."""
    from app.core.db import SessionLocal
    db = SessionLocal()
    try:
        engine = AuditEngine(db, audit_id)
        engine.run()
    finally:
        db.close()

@router.post("", response_model=AuditOut)
def create_audit(
    req: AuditCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cluster = db.query(Cluster).filter(Cluster.id == req.cluster_id, Cluster.user_id == current_user.id).first()
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")

    audit = Audit(
        user_id=current_user.id,
        cluster_id=cluster.id,
        status="in_progress",
        current_step="Initializing audit engine",
        is_demo=cluster.is_demo
    )
    db.add(audit)
    db.commit()
    db.refresh(audit)

    # Execute synchronously if demo/test for fast response or run background task
    engine = AuditEngine(db, audit.id)
    engine.run()

    db.refresh(audit)
    db.add(AuditLog(user_id=current_user.id, action="AUDIT_EXECUTED", target_type="Audit", target_id=audit.id))
    db.commit()

    return audit

@router.get("", response_model=List[AuditOut])
def list_audits(cluster_id: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Audit).filter(Audit.user_id == current_user.id)
    if cluster_id:
        query = query.filter(Audit.cluster_id == cluster_id)
    
    audits = query.order_by(Audit.started_at.desc()).all()
    if not audits:
        # Create an initial demo audit if user has no audits yet
        cluster = db.query(Cluster).filter(Cluster.user_id == current_user.id).first()
        if cluster:
            demo_audit = Audit(
                user_id=current_user.id,
                cluster_id=cluster.id,
                status="in_progress",
                is_demo=cluster.is_demo
            )
            db.add(demo_audit)
            db.commit()
            db.refresh(demo_audit)
            engine = AuditEngine(db, demo_audit.id)
            engine.run()
            db.refresh(demo_audit)
            return [demo_audit]
    return audits

@router.get("/{id}", response_model=AuditOut)
def get_audit(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    audit = db.query(Audit).filter(Audit.id == id, Audit.user_id == current_user.id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    return audit

@router.get("/{id}/findings", response_model=List[FindingOut])
def get_audit_findings(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    audit = db.query(Audit).filter(Audit.id == id, Audit.user_id == current_user.id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    findings = db.query(Finding).filter(Finding.audit_id == id).all()
    return findings
