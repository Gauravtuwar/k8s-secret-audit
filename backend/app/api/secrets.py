from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.models.models import SecretsInventory, Audit, User
from app.schemas.schemas import SecretsInventoryOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/secrets", tags=["Secrets Inventory"])

@router.get("", response_model=List[SecretsInventoryOut])
def list_secrets_inventory(
    audit_id: Optional[str] = None,
    cluster_id: Optional[str] = None,
    namespace: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(SecretsInventory).join(Audit).filter(Audit.user_id == current_user.id)

    if audit_id:
        query = query.filter(SecretsInventory.audit_id == audit_id)
    if cluster_id:
        query = query.filter(SecretsInventory.cluster_id == cluster_id)
    if namespace:
        query = query.filter(SecretsInventory.namespace == namespace)

    secrets = query.order_by(SecretsInventory.risk_level.desc(), SecretsInventory.name.asc()).all()
    
    # Ensure redacted guarantee
    for s in secrets:
        s.value_display = "[REDACTED - Secret Values Are Intentionally Never Accessed or Stored]"
        
    return secrets
