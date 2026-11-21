
from sqlalchemy import select
from sqlalchemy.orm import Session

# Support both local development and Vercel deployment
try:
    from backend.models import AuditLog
except ModuleNotFoundError as error:
    if error.name != "backend":
        raise

    from models import AuditLog


def get_audit_logs_service(
    db: Session,
    limit: int = 50,
):
    """Return the latest administrative and moderation audit logs."""

    return db.scalars(
        select(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
    ).all()
