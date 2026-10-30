from fastapi import APIRouter, Response, status
from app.core.config import settings
from app.core.db import check_db_connection

router = APIRouter(tags=["Health"])

@router.get("/health")
@router.get("/api/health")
@router.get("/api/v1/health")
def health_check():
    db_connected, db_msg = check_db_connection()
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "database": {
            "connected": db_connected,
            "status": "connected" if db_connected else "degraded",
            "message": "Connected" if db_connected else db_msg
        }
    }

@router.get("/health/live")
def liveness_check():
    """Liveness probe: returns 200 as long as FastAPI process is alive."""
    return {"status": "alive"}
