from fastapi import APIRouter, Response, status
from app.core.config import settings
from app.core.db import check_db_connection

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check(response: Response):
    db_connected, db_msg = check_db_connection()
    
    overall_status = "healthy" if db_connected else "degraded"
    
    # If database is down, return 503 so load balancers / readiness probes recognize degradation if configured
    if not db_connected:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": overall_status,
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "database": {
            "connected": db_connected,
            "status": "connected" if db_connected else "unreachable"
        }
    }

@router.get("/health/live")
def liveness_check():
    """Liveness probe: returns 200 as long as FastAPI process is alive."""
    return {"status": "alive"}
