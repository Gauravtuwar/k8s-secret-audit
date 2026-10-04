from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_run_audit_pipeline():
    # Fetch clusters
    clusters = client.get("/api/v1/clusters").json()
    c_id = clusters[0]["id"]

    # Trigger audit creation
    response = client.post("/api/v1/audits", json={"cluster_id": c_id})
    assert response.status_code == 200
    audit = response.json()
    assert audit["status"] == "completed"
    assert audit["security_score"] >= 0.0
    assert audit["total_secrets_audited"] > 0

def test_get_findings_and_secrets():
    audits = client.get("/api/v1/audits").json()
    audit_id = audits[0]["id"]

    # Check audit findings
    f_res = client.get(f"/api/v1/audits/{audit_id}/findings")
    assert f_res.status_code == 200
    findings = f_res.json()
    assert len(findings) > 0

    # Check secrets inventory (Must be redacted!)
    s_res = client.get("/api/v1/secrets")
    assert s_res.status_code == 200
    secrets = s_res.json()
    assert len(secrets) > 0
    assert secrets[0]["value_display"] == "[REDACTED - Secret Values Are Intentionally Never Accessed or Stored]"
