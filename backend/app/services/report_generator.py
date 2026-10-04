import json
import os
from datetime import datetime, timezone
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.models import Audit, Finding, SecretsInventory, RbacPermission, EncryptionCheck, Cluster

class AuditReportGenerator:
    def __init__(self, db: Session, audit_id: str):
        self.db = db
        self.audit_id = audit_id
        self.audit = db.query(Audit).filter(Audit.id == audit_id).first()
        if not self.audit:
            raise ValueError(f"Audit {audit_id} not found.")
        self.cluster = db.query(Cluster).filter(Cluster.id == self.audit.cluster_id).first()
        self.findings = db.query(Finding).filter(Finding.audit_id == audit_id).all()
        self.secrets = db.query(SecretsInventory).filter(SecretsInventory.audit_id == audit_id).all()
        self.rbac_perms = db.query(RbacPermission).filter(RbacPermission.audit_id == audit_id).all()
        self.enc_checks = db.query(EncryptionCheck).filter(EncryptionCheck.audit_id == audit_id).all()

    def generate_json_report(self) -> str:
        report_data = {
            "title": "Kubernetes Secret Management & Encryption at Rest Audit Report",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "audit": {
                "id": self.audit.id,
                "status": self.audit.status,
                "started_at": self.audit.started_at.isoformat() if self.audit.started_at else None,
                "completed_at": self.audit.completed_at.isoformat() if self.audit.completed_at else None,
                "security_score": self.audit.security_score,
                "is_demo": self.audit.is_demo,
                "metrics": {
                    "critical": self.audit.critical_count,
                    "high": self.audit.high_count,
                    "medium": self.audit.medium_count,
                    "low": self.audit.low_count,
                    "informational": self.audit.informational_count,
                    "total_secrets_audited": self.audit.total_secrets_audited
                }
            },
            "cluster": {
                "name": self.cluster.name if self.cluster else "Unknown Cluster",
                "kubernetes_version": self.cluster.kubernetes_version if self.cluster else "Unknown",
                "api_server": self.cluster.api_server if self.cluster else "N/A"
            },
            "findings": [
                {
                    "rule_id": f.rule_id,
                    "title": f.title,
                    "severity": f.severity,
                    "category": f.category,
                    "namespace": f.namespace,
                    "resource_type": f.resource_type,
                    "resource_name": f.resource_name,
                    "status": f.status,
                    "description": f.description,
                    "recommendation": f.recommendation,
                    "remediation": f.remediation
                } for f in self.findings
            ],
            "secrets_inventory_summary": [
                {
                    "name": s.name,
                    "namespace": s.namespace,
                    "type": s.type,
                    "age_days": s.age_days,
                    "risk_level": s.risk_level,
                    "value_status": "[REDACTED - Secret Values Are Never Access/Stored]"
                } for s in self.secrets
            ],
            "encryption_checks": [
                {
                    "check_name": e.check_name,
                    "status": e.status,
                    "explanation": e.explanation,
                    "recommendation": e.recommendation
                } for e in self.enc_checks
            ]
        }
        return json.dumps(report_data, indent=2)

    def generate_pdf_report(self, output_path: str) -> str:
        """
        Generates a professional PDF report using ReportLab.
        """
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib import colors

            doc = SimpleDocTemplate(
                output_path,
                pagesize=letter,
                rightMargin=36,
                leftMargin=36,
                topMargin=36,
                bottomMargin=36
            )

            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                'TitleStyle',
                parent=styles['Heading1'],
                fontSize=22,
                leading=26,
                textColor=colors.HexColor('#0f172a'),
                spaceAfter=12
            )
            h2_style = ParagraphStyle(
                'H2Style',
                parent=styles['Heading2'],
                fontSize=14,
                leading=18,
                textColor=colors.HexColor('#1e293b'),
                spaceBefore=12,
                spaceAfter=8
            )
            body_style = ParagraphStyle(
                'BodyStyle',
                parent=styles['Normal'],
                fontSize=9,
                leading=13,
                textColor=colors.HexColor('#334155')
            )
            badge_style = ParagraphStyle(
                'BadgeStyle',
                parent=styles['Normal'],
                fontSize=10,
                leading=14,
                textColor=colors.HexColor('#2563eb')
            )

            story = []

            # Document Header
            story.append(Paragraph("KUBERNETES SECRET MANAGEMENT & ENCRYPTION AT REST AUDIT REPORT", title_style))
            story.append(Paragraph(f"Generated on {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')} | Confidential Security Assessment", badge_style))
            story.append(Spacer(1, 15))
            story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#cbd5e1'), spaceAfter=15))

            # Executive Summary Table
            story.append(Paragraph("Executive Summary", h2_style))
            summary_data = [
                ["Cluster Name", self.cluster.name if self.cluster else "Demo Cluster", "Security Score", f"{self.audit.security_score} / 100"],
                ["Kubernetes Version", self.cluster.kubernetes_version if self.cluster else "v1.29.3", "Total Secrets Audited", str(self.audit.total_secrets_audited)],
                ["Audit ID", self.audit.id[:12] + "...", "Audit Mode", "Demo Mode" if self.audit.is_demo else "Real Cluster Audit"],
                ["Critical Findings", str(self.audit.critical_count), "High Findings", str(self.audit.high_count)],
                ["Medium Findings", str(self.audit.medium_count), "Low Findings", str(self.audit.low_count)]
            ]
            t_summary = Table(summary_data, colWidths=[120, 150, 120, 150])
            t_summary.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
                ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#0f172a')),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
                ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
                ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
                ('PADDING', (0,0), (-1,-1), 6),
            ]))
            story.append(t_summary)
            story.append(Spacer(1, 15))

            # Encryption at Rest Section
            story.append(Paragraph("Encryption at Rest Analysis", h2_style))
            enc_rows = [["Check Name", "Status", "Explanation"]]
            for ec in self.enc_checks:
                enc_rows.append([ec.check_name, ec.status, Paragraph(ec.explanation, body_style)])
            t_enc = Table(enc_rows, colWidths=[150, 70, 320])
            t_enc.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e293b')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
                ('PADDING', (0,0), (-1,-1), 5),
            ]))
            story.append(t_enc)
            story.append(Spacer(1, 15))

            # Findings Section
            story.append(Paragraph("Audit Findings Breakdown", h2_style))
            finding_rows = [["Rule ID", "Title", "Severity", "Resource", "Status"]]
            for f in self.findings:
                finding_rows.append([
                    f.rule_id,
                    Paragraph(f.title, body_style),
                    f.severity,
                    f.resource_name,
                    f.status
                ])
            t_findings = Table(finding_rows, colWidths=[60, 200, 70, 130, 80])
            t_findings.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
                ('PADDING', (0,0), (-1,-1), 5),
            ]))
            story.append(t_findings)
            story.append(Spacer(1, 15))

            # Secret Values Protection Disclaimer
            story.append(Paragraph("Secret Values Protection Notice", h2_style))
            story.append(Paragraph("<b>Note:</b> Kubernetes Secret data and stringData values are strictly REDACTED and never fetched, displayed, or stored by this application in compliance with zero-trust cybersecurity standards.", body_style))

            doc.build(story)
            return output_path
        except Exception as e:
            raise Exception(f"Failed to compile PDF report: {str(e)}")
