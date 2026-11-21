
from sqlalchemy import select, func, case
from sqlalchemy.orm import Session

# Support both local development and Vercel deployment
try:
    from backend.models import LoginRateLimit
except ModuleNotFoundError as error:
    if error.name != "backend":
        raise

    from models import LoginRateLimit


def get_failed_login_attempts_service(
    db: Session,
    limit: int = 50,
):
    is_blocked_expression = case(
        (
            LoginRateLimit.blocked_until > func.now(),
            True,
        ),
        else_=False,
    ).label("is_blocked")

    records = db.execute(
        select(LoginRateLimit, is_blocked_expression)
        .order_by(
            LoginRateLimit.failed_attempts.desc(),
            LoginRateLimit.updated_at.desc(),
        )
        .limit(limit)
    ).all()

    return [
        {
            "identifier_reference": record.identifier_hash[:12],
            "failed_attempts": record.failed_attempts,
            "blocked_until": record.blocked_until,
            "updated_at": record.updated_at,
            "is_blocked": is_blocked,
        }
        for record, is_blocked in records
    ]
