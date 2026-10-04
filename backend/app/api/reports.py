import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import FileResponse, PlainTextResponse
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.models.models import Report, Audit, User, AuditLog
from app.schemas.schemas import ReportCreateRequest, ReportOut
from app.api.deps import get_current_user
from app.services.report_generator import AuditReportGenerator

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("", response_model=ReportOut)
def generate_report(req: ReportCreateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    audit = db.query(Audit).filter(Audit.id == req.audit_id, Audit.user_id == current_user.id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")

    report_name = f"k8s_secret_audit_{audit.cluster_id[:8]}_{audit.id[:8]}.{req.format}"

    report = Report(
        user_id=current_user.id,
        audit_id=audit.id,
        cluster_id=audit.cluster_id,
        report_name=report_name,
        format=req.format
    )
    db.add(report)
    db.add(AuditLog(user_id=current_user.id, action="REPORT_GENERATED", target_type="Report", target_id=report.id))
    db.commit()
    db.refresh(report)

    return report

@router.get("", response_model=List[ReportOut])
def list_reports(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Report).filter(Report.user_id == current_user.id).order_by(Report.created_at.desc()).all()

@router.get("/{id}", response_model=ReportOut)
def get_report(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = db.query(Report).filter(Report.id == id, Report.user_id == current_user.id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@router.get("/{id}/download")
def download_report(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = db.query(Report).filter(Report.id == id, Report.user_id == current_user.id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    generator = AuditReportGenerator(db, report.audit_id)

    if report.format == "json":
        json_content = generator.generate_json_report()
        return Response(
            content=json_content,
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={report.report_name}"}
        )
    else:
        # Generate PDF into temp file
        temp_dir = os.path.join(os.getcwd(), "temp_reports")
        os.makedirs(temp_dir, exist_ok=True)
        pdf_path = os.path.join(temp_dir, report.report_name)
        generator.generate_pdf_report(pdf_path)

        return FileResponse(
            path=pdf_path,
            filename=report.report_name,
            media_type="application/pdf"
        )
