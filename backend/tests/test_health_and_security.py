import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from jose import jwt
from app.main import app
from app.core.config import settings
from app.core.db import Base, get_db, engine
from app.models.models import User, Cluster, Audit
from app.core.security import get_password_hash

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code in [200, 503]
    data = response.json()
    assert "status" in data
    assert "service" in data
    assert "database" in data
    assert "connected" in data["database"]

def test_liveness_endpoint():
    response = client.get("/health/live")
    assert response.status_code == 200
    assert response.json() == {"status": "alive"}

def test_cors_preflight():
    response = client.options(
        "/api/v1/dashboard/summary",
        headers={
            "Origin": "https://k8s-secret-audit.vercel.app",
            "Access-Control-Request-Method": "GET"
        }
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://k8s-secret-audit.vercel.app"

def test_invalid_and_expired_token():
    # 1. Invalid token
    res_invalid = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid.token.payload"}
    )
    assert res_invalid.status_code == 401

    # 2. Expired token
    expired_time = datetime.now(timezone.utc) - timedelta(hours=2)
    expired_token = jwt.encode(
        {"exp": expired_time, "sub": "test-user-id"},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    res_expired = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"}
    )
    assert res_expired.status_code == 401

def test_tenant_data_isolation():
    # Register User A
    user_a_email = f"user_a_{datetime.now().timestamp()}@secops.io"
    reg_a = client.post(
        "/api/v1/auth/register",
        json={"email": user_a_email, "password": "Password123!", "full_name": "User A"}
    )
    assert reg_a.status_code == 200
    user_a_id = reg_a.json()["id"]

    login_a = client.post(
        "/api/v1/auth/login",
        json={"email": user_a_email, "password": "Password123!"}
    )
    token_a = login_a.json()["access_token"]

    # Register User B
    user_b_email = f"user_b_{datetime.now().timestamp()}@secops.io"
    reg_b = client.post(
        "/api/v1/auth/register",
        json={"email": user_b_email, "password": "Password123!", "full_name": "User B"}
    )
    assert reg_b.status_code == 200
    user_b_id = reg_b.json()["id"]

    login_b = client.post(
        "/api/v1/auth/login",
        json={"email": user_b_email, "password": "Password123!"}
    )
    token_b = login_b.json()["access_token"]

    # User A creates a cluster
    cluster_a = client.post(
        "/api/v1/clusters",
        headers={"Authorization": f"Bearer {token_a}"},
        json={"name": "cluster-isolated-a", "auth_type": "demo"}
    ).json()

    # User B lists clusters - should NOT see User A's cluster
    clusters_b = client.get(
        "/api/v1/clusters",
        headers={"Authorization": f"Bearer {token_b}"}
    ).json()

    cluster_b_ids = [c["id"] for c in clusters_b]
    assert cluster_a["id"] not in cluster_b_ids

    # User B attempting to access User A's cluster directly should be 404
    direct_access = client.get(
        f"/api/v1/clusters/{cluster_a['id']}",
        headers={"Authorization": f"Bearer {token_b}"}
    )
    assert direct_access.status_code == 404

def test_dashboard_summary_with_token():
    # Login as admin
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "testsec@example.com", "password": "Password123!"}
    )
    if login_res.status_code != 200:
        # Register if needed
        client.post(
            "/api/v1/auth/register",
            json={"email": "testsec@example.com", "password": "Password123!", "full_name": "Test Sec"}
        )
        login_res = client.post(
            "/api/v1/auth/login",
            json={"email": "testsec@example.com", "password": "Password123!"}
        )
    token = login_res.json()["access_token"]

    summary_res = client.get(
        "/api/v1/dashboard/summary",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert "total_clusters" in summary
    assert "security_score" in summary
    assert "critical_findings" in summary
    assert "recent_audits" in summary
