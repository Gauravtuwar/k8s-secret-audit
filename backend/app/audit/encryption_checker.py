from typing import Dict, Any, List, Optional

def analyze_encryption_at_rest(
    k8s_client_initialized: bool,
    config_yaml_str: Optional[str] = None,
    is_demo: bool = False
) -> List[Dict[str, Any]]:
    """
    Analyzes Encryption at Rest status for Kubernetes Secrets.
    Supports parsing explicit EncryptionConfiguration YAML or evaluating cluster capabilities.
    Returns clear PASS, FAIL, WARNING, or UNKNOWN statuses with rationale explanations.
    """
    if is_demo:
        from app.core.demo_data import get_demo_encryption_checks
        return get_demo_encryption_checks()

    results = []

    if config_yaml_str:
        try:
            import yaml
            parsed = yaml.safe_load(config_yaml_str)
            resources = parsed.get("resources", [])
            
            secret_enc = None
            for r in resources:
                res_list = r.get("resources", [])
                if "secrets" in res_list or "*.*" in res_list or "*" in res_list:
                    secret_enc = r
                    break
            
            if not secret_enc:
                results.append({
                    "check_name": "EncryptionConfiguration Resource Scope",
                    "status": "FAIL",
                    "provider_chain": [],
                    "wildcard_configured": False,
                    "identity_fallback_detected": True,
                    "explanation": "EncryptionConfiguration exists but does not list 'secrets' or '*.*' in protected resources.",
                    "recommendation": "Add 'secrets' to resources array in EncryptionConfiguration."
                })
            else:
                providers = secret_enc.get("providers", [])
                provider_names = []
                for p in providers:
                    if isinstance(p, dict):
                        provider_names.extend(list(p.keys()))

                first_provider = provider_names[0] if provider_names else "identity"
                identity_fallback = "identity" in provider_names

                if first_provider == "identity":
                    results.append({
                        "check_name": "Control Plane Encryption Provider Ordering",
                        "status": "FAIL",
                        "provider_chain": provider_names,
                        "wildcard_configured": "*.*" in secret_enc.get("resources", []),
                        "identity_fallback_detected": True,
                        "explanation": "The 'identity' (unencrypted) provider is listed FIRST in EncryptionConfiguration. etcd will write secrets in plaintext.",
                        "recommendation": "Reorder providers so aescbc, secretbox, or kms is first, and identity is last."
                    })
                elif first_provider in ["aescbc", "secretbox", "kms"]:
                    has_kms = "kms" in provider_names
                    status = "PASS" if has_kms else "WARNING"
                    results.append({
                        "check_name": "Etcd Secret Storage Encryption",
                        "status": status,
                        "provider_chain": provider_names,
                        "wildcard_configured": "*.*" in secret_enc.get("resources", []),
                        "identity_fallback_detected": identity_fallback,
                        "explanation": f"Active encryption enabled using '{first_provider}' provider. " + ("KMS envelope encryption active." if has_kms else "Static key cipher active. Cloud KMS recommended for key rotation."),
                        "recommendation": None if has_kms else "Upgrade static key to Cloud KMS v2 plugin."
                    })
        except Exception as e:
            results.append({
                "check_name": "EncryptionConfiguration Parsing",
                "status": "WARNING",
                "provider_chain": [],
                "wildcard_configured": False,
                "identity_fallback_detected": False,
                "explanation": f"Failed to parse provided EncryptionConfiguration YAML: {str(e)}",
                "recommendation": "Verify EncryptionConfiguration YAML formatting."
            })
    else:
        # Standard API server access check (managed K8s vs self-hosted)
        results.append({
            "check_name": "Control Plane Encryption at Rest Verification",
            "status": "UNKNOWN",
            "provider_chain": [],
            "wildcard_configured": False,
            "identity_fallback_detected": False,
            "explanation": "Encryption at rest status COULD NOT BE VERIFIED directly via standard Kubernetes API because cloud providers (EKS, GKE, AKS) and standard worker permissions do not expose kube-apiserver file configurations.",
            "recommendation": "Verify encryption configuration in your cloud provider console (e.g. AWS EKS KMS Secrets Encryption setting, Google Cloud GKE Application-layer Secret Encryption, or Azure Key Vault integration)."
        })

    return results
