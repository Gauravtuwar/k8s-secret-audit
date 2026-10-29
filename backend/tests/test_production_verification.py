import os
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy import text
from app.main import app
from app.core.config import settings
from app.core.db import engine, SessionLocal, check_db_connection, get_db
from app.models.models import User, Cluster, Audit, Finding, Report, SecretsInventory, EncryptionCheck

client = TestClient(app)

def test_database_readiness_select_1():
    """Verify that check_db_connection executes a real SELECT 1 query."""
    connected, msg = check_db_connection()
    assert connected is True, f"Database connectivity check failed: {msg}"
    assert msg == "Connected"

def test_health_endpoint_response_structure():
    """Verify GET /health returns structured status and database connection info."""
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "service" in data
    assert "version" in data
    assert data["database"]["connected"] is True
    assert data["database"]["status"] == "connected"

def test_liveness_probe():
    """Verify GET /health/live returns HTTP 200."""
    res = client.get("/health/live")
    assert res.status_code == 200
    assert res.json() == {"status": "alive"}

def test_full_database_persistence_and_isolation_cycle():
    """
    Verify complete database persistence and tenant isolation:
    1. Register User 1 and User 2.
    2. User 1 connects a cluster and runs an audit.
    3. User 1 modifies finding status.
    4. Confirm persistence via independent DB query.
    5. User 2 cannot access User 1's cluster, audit, finding, or report.
    6. Generate report and verify download.
    7. Clean up test records.
    """
    ts = int(datetime.now(timezone.utc).timestamp())
    email_u1 = f"auditor1_{ts}@enterprise-audit.io"
    email_u2 = f"auditor2_{ts}@enterprise-audit.io"
    password = "SecurePassword123!"

    # 1. Register User 1
    reg1 = client.post("/api/v1/auth/register", json={"email": email_u1, "password": password, "full_name": "Auditor 1"})
    assert reg1.status_code == 200
    u1_id = reg1.json()["id"]

    login1 = client.post("/api/v1/auth/login", json={"email": email_u1, "password": password})
    assert login1.status_code == 200
    token1 = login1.json()["access_token"]
    auth1 = {"Authorization": f"Bearer {token1}"}

    # Register User 2
    reg2 = client.post("/api/v1/auth/register", json={"email": email_u2, "password": password, "full_name": "Auditor 2"})
    assert reg2.status_code == 200
    u2_id = reg2.json()["id"]

    login2 = client.post("/api/v1/auth/login", json={"email": email_u2, "password": password})
    assert login2.status_code == 200
    token2 = login2.json()["access_token"]
    auth2 = {"Authorization": f"Bearer {token2}"}

    try:
        # 2. User 1 connects a cluster (Demo mode)
        c_res = client.post("/api/v1/clusters", headers=auth1, json={"name": f"test-cluster-{ts}", "auth_type": "demo"})
        assert c_res.status_code == 200
        cluster_id = c_res.json()["id"]

        # Test connectivity
        test_c = client.post(f"/api/v1/clusters/{cluster_id}/test", headers=auth1)
        assert test_c.status_code == 200
        assert test_c.json()["success"] is True

        # 3. User 1 executes an audit
        audit_res = client.post("/api/v1/audits", headers=auth1, json={"cluster_id": cluster_id})
        assert audit_res.status_code == 200
        audit_data = audit_res.json()
        audit_id = audit_data["id"]
        assert audit_data["status"] == "completed"
        assert audit_data["total_secrets_audited"] > 0

        # 4. Persistence check: Read audit and findings via independent request
        findings_res = client.get(f"/api/v1/audits/{audit_id}/findings", headers=auth1)
        assert findings_res.status_code == 200
        findings = findings_res.json()
        assert len(findings) > 0
        first_finding_id = findings[0]["id"]

        # Update finding status to 'Resolved'
        update_res = client.patch(f"/api/v1/findings/{first_finding_id}", headers=auth1, json={"status": "Resolved"})
        assert update_res.status_code == 200
        assert update_res.json()["status"] == "Resolved"

        # Verify persistence in DB
        db_gen = app.dependency_overrides.get(get_db, get_db)
        db = next(db_gen())
        try:
            persisted_f = db.query(Finding).filter(Finding.id == first_finding_id).first()
            assert persisted_f is not None
            assert persisted_f.status == "Resolved"
        finally:
            db.close()

        # Also verify persistence via fresh API request with filter
        resolved_findings = client.get("/api/v1/findings?status=Resolved", headers=auth1).json()
        assert any(f["id"] == first_finding_id for f in resolved_findings)

        # 5. Secrets Inventory: Redaction guarantee
        secrets_res = client.get("/api/v1/secrets", headers=auth1)
        assert secrets_res.status_code == 200
        secrets_list = secrets_res.json()
        for s in secrets_list:
            assert "[REDACTED" in s["value_display"]

        # 6. Encryption checks
        enc_res = client.get("/api/v1/encryption", headers=auth1)
        assert enc_res.status_code == 200
        assert len(enc_res.json()) > 0

        # 7. Generate report (JSON and PDF)
        rep_json = client.post("/api/v1/reports", headers=auth1, json={"audit_id": audit_id, "format": "json"})
        assert rep_json.status_code == 200
        rep_json_id = rep_json.json()["id"]

        dl_json = client.get(f"/api/v1/reports/{rep_json_id}/download", headers=auth1)
        assert dl_json.status_code == 200
        assert "application/json" in dl_json.headers.get("content-type", "")

        rep_pdf = client.post("/api/v1/reports", headers=auth1, json={"audit_id": audit_id, "format": "pdf"})
        assert rep_pdf.status_code == 200
        rep_pdf_id = rep_pdf.json()["id"]

        dl_pdf = client.get(f"/api/v1/reports/{rep_pdf_id}/download", headers=auth1)
        assert dl_pdf.status_code == 200
        assert "application/pdf" in dl_pdf.headers.get("content-type", "")

        # 8. User 2 Tenant Isolation: User 2 CANNOT access User 1's resources
        assert client.get(f"/api/v1/clusters/{cluster_id}", headers=auth2).status_code == 404
        assert client.get(f"/api/v1/audits/{audit_id}", headers=auth2).status_code == 404
        assert client.get(f"/api/v1/findings/{first_finding_id}", headers=auth2).status_code in [404, 405]
        assert client.get(f"/api/v1/reports/{rep_json_id}", headers=auth2).status_code == 404
        assert client.get(f"/api/v1/reports/{rep_json_id}/download", headers=auth2).status_code == 404

    finally:
        # Clean up test records
        db_gen = app.dependency_overrides.get(get_db, get_db)
        db = next(db_gen())
        try:
            db.query(User).filter(User.id.in_([u1_id, u2_id])).delete(synchronize_session=False)
            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()
