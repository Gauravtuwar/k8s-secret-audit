from typing import Dict, Any, List

SEVERITY_WEIGHTS = {
    "Critical": 25.0,
    "High": 15.0,
    "Medium": 8.0,
    "Low": 3.0,
    "Informational": 0.0
}

def calculate_security_score(findings: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Calculates Application Security Score based on finding severity weights.
    Max Score: 100.0. Clamped between 0.0 and 100.0.
    """
    critical_count = 0
    high_count = 0
    medium_count = 0
    low_count = 0
    info_count = 0

    total_deduction = 0.0

    for f in findings:
        status = f.get("status", "Open")
        # Ignore false positives or resolved findings in score calculation
        if status in ["Resolved", "False Positive"]:
            continue

        sev = f.get("severity", "Low")
        weight = SEVERITY_WEIGHTS.get(sev, 3.0)
        total_deduction += weight

        if sev == "Critical":
            critical_count += 1
        elif sev == "High":
            high_count += 1
        elif sev == "Medium":
            medium_count += 1
        elif sev == "Low":
            low_count += 1
        else:
            info_count += 1

    calculated_score = max(0.0, min(100.0, 100.0 - total_deduction))
    rounded_score = round(calculated_score, 1)

    # Security Rating Label
    if rounded_score >= 90.0:
        rating = "Excellent"
    elif rounded_score >= 75.0:
        rating = "Good"
    elif rounded_score >= 50.0:
        rating = "Needs Improvement"
    else:
        rating = "Critical Risk"

    return {
        "score": rounded_score,
        "rating": rating,
        "critical_count": critical_count,
        "high_count": high_count,
        "medium_count": medium_count,
        "low_count": low_count,
        "informational_count": info_count,
        "total_deduction": round(total_deduction, 1)
    }
