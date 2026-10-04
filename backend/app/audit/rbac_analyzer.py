from typing import Dict, Any, List

def analyze_rbac_permissions(rbac_data: Dict[str, Any], is_demo: bool = False) -> List[Dict[str, Any]]:
    """
    Analyzes Roles, ClusterRoles, RoleBindings, ClusterRoleBindings to detect broad secret access permissions.
    """
    if is_demo:
        from app.core.demo_data import get_demo_rbac_permissions
        return get_demo_rbac_permissions()

    analyzed_perms = []

    # Map cluster roles
    cluster_roles_map = {}
    for cr in rbac_data.get("cluster_roles", []):
        name = cr.get("name")
        rules = cr.get("rules", [])
        secret_verbs = set()
        for r in rules:
            resources = r.get("resources", [])
            verbs = r.get("verbs", [])
            if "*" in resources or "secrets" in resources:
                secret_verbs.update(verbs)
        if secret_verbs:
            cluster_roles_map[name] = list(secret_verbs)

    # Process ClusterRoleBindings
    for cb in rbac_data.get("cluster_role_bindings", []):
        role_ref = cb.get("role_ref")
        if role_ref in cluster_roles_map:
            verbs = cluster_roles_map[role_ref]
            is_broad = "*" in verbs or ("get" in verbs and "list" in verbs)
            risk = "Critical" if "*" in verbs else ("High" if is_broad else "Medium")
            
            for subj in cb.get("subjects", []):
                analyzed_perms.append({
                    "subject_kind": subj.get("kind", "Unknown"),
                    "subject_name": subj.get("name", "Unknown"),
                    "subject_namespace": subj.get("namespace"),
                    "role_kind": "ClusterRole",
                    "role_name": role_ref,
                    "verbs": verbs,
                    "namespace": "cluster-wide",
                    "risk_level": risk
                })

    return analyzed_perms
