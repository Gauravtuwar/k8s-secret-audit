from app.audit.encryption_checker import analyze_encryption_at_rest

def test_encryption_yaml_parsing_identity_fallback():
    yaml_config = """
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
  - resources:
      - secrets
    providers:
      - identity: {}
      - aescbc:
          keys:
            - name: key1
              secret: c2VjcmV0IGlzIGEgc2VjcmV0
"""
    res = analyze_encryption_at_rest(k8s_client_initialized=True, config_yaml_str=yaml_config, is_demo=False)
    assert len(res) == 1
    assert res[0]["status"] == "FAIL"
    assert "identity" in res[0]["explanation"].lower()

def test_encryption_yaml_kms_pass():
    yaml_config = """
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
  - resources:
      - secrets
    providers:
      - kms:
          name: aws-kms-provider
          endpoint: unix:///var/run/kmsplugin/socket.sock
      - identity: {}
"""
    res = analyze_encryption_at_rest(k8s_client_initialized=True, config_yaml_str=yaml_config, is_demo=False)
    assert len(res) == 1
    assert res[0]["status"] == "PASS"
