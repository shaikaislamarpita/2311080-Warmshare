
import csv
import io

from sqlalchemy import select
from sqlalchemy.orm import Session

# Support both local development and Vercel deployment
try:
    from backend.models import AuditLog
except ModuleNotFoundError as error:
    if error.name != "backend":
        raise

    from models import AuditLog


def export_audit_logs_service(db: Session) -> str:
    """Generate a CSV file containing audit-log records."""

    logs = db.scalars(
        select(AuditLog).order_by(AuditLog.created_at.desc())
    ).all()

    output = io.StringIO()

    writer = csv.writer(output)

    writer.writerow([
        "ID",
        "Actor ID",
        "Action",
        "Target Type",
        "Target ID",
        "Details",
        "Created At",
    ])

    for log in logs:
        writer.writerow([
            log.id,
            log.actor_id,
            log.action,
            log.target_type,
            log.target_id,
            log.details or {},
            log.created_at.isoformat() if log.created_at else "",
        ])

    return output.getvalue()
