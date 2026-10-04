from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_generate_and_download_json_report():
    audits = client.get("/api/v1/audits").json()
    audit_id = audits[0]["id"]

    # Generate JSON report
    create_res = client.post("/api/v1/reports", json={"audit_id": audit_id, "format": "json"})
    assert create_res.status_code == 200
    report = create_res.json()
    assert report["format"] == "json"

    # Download report
    dl_res = client.get(f"/api/v1/reports/{report['id']}/download")
    assert dl_res.status_code == 200
    json_data = dl_res.json()
    assert "findings" in json_data
    assert "secrets_inventory_summary" in json_data
