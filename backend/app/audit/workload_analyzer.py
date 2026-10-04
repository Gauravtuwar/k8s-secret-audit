from typing import Dict, Any, List

def analyze_secrets_workload_exposure(
    secrets_meta: List[Dict[str, Any]],
    workloads: List[Dict[str, Any]],
    is_demo: bool = False
) -> List[Dict[str, Any]]:
    """
    Correlates Secret metadata with Workloads (Deployments, StatefulSets, Pods)
    to calculate usage count, injection mechanism (env vs volume), and risk exposure.
    NEVER reads or exposes secret data/stringData.
    """
    if is_demo:
        from app.core.demo_data import get_demo_secrets_inventory
        return get_demo_secrets_inventory()

    inventory = []

    # Map workloads by secret reference
    secret_usage_map = {} # secret_name -> list of workloads
    for w in workloads:
        for ref in w.get("referenced_secrets", []):
            sec_name = ref.get("secret")
            via = ref.get("via", "volume")
            if sec_name not in secret_usage_map:
                secret_usage_map[sec_name] = []
            secret_usage_map[sec_name].append({
                "kind": w.get("kind"),
                "name": w.get("name"),
                "namespace": w.get("namespace"),
                "via": via
            })

    for s in secrets_meta:
        s_name = s.get("name")
        ns = s.get("namespace")
        used_by = secret_usage_map.get(s_name, [])
        usage_count = len(used_by)
        age_days = s.get("age_days", 0)

        # Risk scoring heuristic (Metadata only!)
        risk = "Low"
        if age_days > 180 or usage_count >= 3:
            risk = "High"
        elif age_days > 90 or usage_count > 1:
            risk = "Medium"

        inventory.append({
            "name": s_name,
            "namespace": ns,
            "type": s.get("type", "Opaque"),
            "created_at_k8s": s.get("created_at"),
            "age_days": age_days,
            "used_by": used_by,
            "rbac_exposure": "Medium" if usage_count > 0 else "Low",
            "encryption_status": "UNKNOWN",
            "risk_level": risk,
            "labels": s.get("labels", {}),
            "annotations": s.get("annotations", {})
        })

    return inventory
