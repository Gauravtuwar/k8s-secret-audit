from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.models.models import Cluster, ClusterConnection, User, AuditLog
from app.schemas.schemas import ClusterConnectRequest, ClusterOut, ClusterTestResponse
from app.api.deps import get_current_user
from app.kubernetes.client import KubernetesMetadataClient
from app.core.demo_data import get_demo_cluster_data

router = APIRouter(prefix="/clusters", tags=["Kubernetes Clusters"])

@router.post("", response_model=ClusterOut)
def connect_cluster(req: ClusterConnectRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    is_demo = (req.auth_type == "demo")
    
    if is_demo:
        demo_info = get_demo_cluster_data()
        cluster = Cluster(
            user_id=current_user.id,
            name=req.name or demo_info["name"],
            is_demo=True,
            api_server=demo_info["api_server"],
            kubernetes_version=demo_info["kubernetes_version"],
            node_count=demo_info["node_count"],
            namespace_count=demo_info["namespace_count"],
            connection_status="Connected"
        )
        db.add(cluster)
        db.commit()
        db.refresh(cluster)

        conn = ClusterConnection(
            cluster_id=cluster.id,
            auth_type="demo",
            encrypted_credentials=None
        )
        db.add(conn)
        db.commit()
        return cluster

    # Real Cluster Connection
    creds = req.kubeconfig if req.auth_type == "kubeconfig" else req.token
    if not creds:
        raise HTTPException(status_code=400, detail="Credentials required for non-demo clusters.")

    client = KubernetesMetadataClient(
        auth_type=req.auth_type,
        kubeconfig_str=req.kubeconfig,
        api_server=req.api_server,
        token=req.token
    )
    if not client.initialize():
        raise HTTPException(status_code=400, detail="Failed to establish connection to Kubernetes API server.")

    ver = client.get_cluster_version()
    ns = client.list_namespaces()
    nodes = client.list_nodes()

    cluster = Cluster(
        user_id=current_user.id,
        name=req.name,
        is_demo=False,
        api_server=req.api_server or "Kubeconfig Default",
        kubernetes_version=ver,
        node_count=len(nodes),
        namespace_count=len(ns),
        connection_status="Connected"
    )
    db.add(cluster)
    db.commit()
    db.refresh(cluster)

    # Store safe encrypted credentials reference (NEVER in plain unencrypted text for production!)
    conn = ClusterConnection(
        cluster_id=cluster.id,
        auth_type=req.auth_type,
        encrypted_credentials=creds
    )
    db.add(conn)
    
    db.add(AuditLog(user_id=current_user.id, action="CLUSTER_CONNECTED", target_type="Cluster", target_id=cluster.id))
    db.commit()

    return cluster

@router.get("", response_model=List[ClusterOut])
def list_clusters(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    clusters = db.query(Cluster).filter(Cluster.user_id == current_user.id).all()
    if not clusters:
        # Auto-create a default Demo Cluster if user has no clusters yet
        demo_info = get_demo_cluster_data()
        default_cluster = Cluster(
            user_id=current_user.id,
            name=demo_info["name"],
            is_demo=True,
            api_server=demo_info["api_server"],
            kubernetes_version=demo_info["kubernetes_version"],
            node_count=demo_info["node_count"],
            namespace_count=demo_info["namespace_count"],
            connection_status="Connected"
        )
        db.add(default_cluster)
        db.commit()
        db.refresh(default_cluster)
        return [default_cluster]
    return clusters

@router.get("/{cluster_id}", response_model=ClusterOut)
def get_cluster(cluster_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cluster = db.query(Cluster).filter(Cluster.id == cluster_id, Cluster.user_id == current_user.id).first()
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
    return cluster

@router.post("/{cluster_id}/test", response_model=ClusterTestResponse)
def test_cluster_connection(cluster_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cluster = db.query(Cluster).filter(Cluster.id == cluster_id, Cluster.user_id == current_user.id).first()
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")

    if cluster.is_demo:
        return ClusterTestResponse(
            success=True,
            message="Demo Environment connection test successful.",
            kubernetes_version=cluster.kubernetes_version,
            node_count=cluster.node_count,
            namespace_count=cluster.namespace_count
        )

    conn = db.query(ClusterConnection).filter(ClusterConnection.cluster_id == cluster.id).first()
    if not conn:
        raise HTTPException(status_code=400, detail="Connection credentials missing.")

    client = KubernetesMetadataClient(
        auth_type=conn.auth_type,
        kubeconfig_str=conn.encrypted_credentials if conn.auth_type == "kubeconfig" else None,
        api_server=cluster.api_server,
        token=conn.encrypted_credentials if conn.auth_type == "token" else None
    )
    success = client.initialize()
    if success:
        ver = client.get_cluster_version()
        ns = client.list_namespaces()
        nodes = client.list_nodes()
        cluster.connection_status = "Connected"
        cluster.kubernetes_version = ver
        cluster.node_count = len(nodes)
        cluster.namespace_count = len(ns)
        db.commit()
        return ClusterTestResponse(
            success=True,
            message="Kubernetes API server connection test successful.",
            kubernetes_version=ver,
            node_count=len(nodes),
            namespace_count=len(ns)
        )
    else:
        cluster.connection_status = "Error"
        db.commit()
        return ClusterTestResponse(
            success=False,
            message="Failed to connect to Kubernetes API server."
        )

@router.delete("/{cluster_id}")
def delete_cluster(cluster_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cluster = db.query(Cluster).filter(Cluster.id == cluster_id, Cluster.user_id == current_user.id).first()
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")

    db.delete(cluster)
    db.add(AuditLog(user_id=current_user.id, action="CLUSTER_DELETED", target_type="Cluster", target_id=cluster_id))
    db.commit()
    return {"message": "Cluster connection disconnected and deleted successfully."}
