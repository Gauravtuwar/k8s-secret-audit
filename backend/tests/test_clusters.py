from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_clusters_list_and_create_demo():
    # Login to get token or test default user creation
    response = client.get("/api/v1/clusters")
    assert response.status_code == 200
    clusters = response.json()
    assert len(clusters) > 0
    assert clusters[0]["is_demo"] is True

def test_connect_demo_cluster():
    response = client.post(
        "/api/v1/clusters",
        json={"name": "test-demo-cluster", "auth_type": "demo"}
    )
    assert response.status_code == 200
    cluster = response.json()
    assert cluster["name"] == "test-demo-cluster"
    assert cluster["is_demo"] is True

def test_cluster_test_connection():
    clusters = client.get("/api/v1/clusters").json()
    c_id = clusters[0]["id"]
    test_res = client.post(f"/api/v1/clusters/{c_id}/test")
    assert test_res.status_code == 200
    assert test_res.json()["success"] is True
