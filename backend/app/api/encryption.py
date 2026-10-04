from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.models.models import EncryptionCheck, Audit, User
from app.schemas.schemas import EncryptionCheckOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/encryption", tags=["Encryption at Rest"])

@router.get("", response_model=List[EncryptionCheckOut])
def list_encryption_checks(
    audit_id: Optional[str] = None,
    cluster_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(EncryptionCheck).join(Audit).filter(Audit.user_id == current_user.id)

    if audit_id:
        query = query.filter(EncryptionCheck.audit_id == audit_id)
    if cluster_id:
        query = query.filter(EncryptionCheck.cluster_id == cluster_id)

    return query.all()
