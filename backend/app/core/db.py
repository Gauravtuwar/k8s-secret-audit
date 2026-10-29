import logging
from typing import Tuple
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

logger = logging.getLogger("k8s_audit.db")

def normalize_database_url(url: str) -> str:
    """Ensure database URL uses correct driver scheme and dialect format."""
    if not url:
        return "sqlite:///./k8s_audit.db"
    
    # Handle legacy postgres:// URLs (Heroku/Render/Supabase)
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    return url

db_url = normalize_database_url(settings.DATABASE_URL)

engine_kwargs = {
    "pool_pre_ping": True,
}

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
else:
    # PostgreSQL / Supabase connection pooling parameters
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 10
    engine_kwargs["pool_recycle"] = 300

engine = create_engine(db_url, connect_args=connect_args, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Idempotently initialize all database tables without crashing on network delays."""
    try:
        from app.models.models import User, Cluster, ClusterConnection, Audit, Finding, SecretsInventory, RbacPermission, EncryptionCheck, Report, AuditLog  # noqa
        Base.metadata.create_all(bind=engine)
        logger.info("Database schema initialized successfully.")
    except Exception as e:
        logger.error(f"Database schema auto-creation encountered error: {e}")

def check_db_connection() -> Tuple[bool, str]:
    """Test actual database connectivity with a live SELECT 1 ping."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True, "Connected"
    except Exception as e:
        logger.warning(f"Database ping check failed: {e}")
        return False, str(e)
