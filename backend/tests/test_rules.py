from app.audit.rules import RULES_METADATA
from app.audit.scoring import calculate_security_score

def test_rules_metadata_coverage():
    # Verify KSA-001 through KSA-010 exist
    for i in range(1, 11):
        rule_key = f"KSA-{i:03d}"
        assert rule_key in RULES_METADATA
        rule = RULES_METADATA[rule_key]
        assert "title" in rule
        assert "severity" in rule
        assert "recommendation" in rule

def test_scoring_algorithm():
    findings = [
        {"severity": "Critical", "status": "Open"},
        {"severity": "High", "status": "Open"}
    ]
    score_res = calculate_security_score(findings)
    # Critical=25, High=15 -> 100 - 40 = 60.0
    assert score_res["score"] == 60.0
    assert score_res["rating"] == "Needs Improvement"

def test_resolved_findings_excluded_from_scoring():
    findings = [
        {"severity": "Critical", "status": "Resolved"},
        {"severity": "Low", "status": "Open"}
    ]
    score_res = calculate_security_score(findings)
    # Resolved ignored, Low=3 -> 100 - 3 = 97.0
    assert score_res["score"] == 97.0
    assert score_res["rating"] == "Excellent"
