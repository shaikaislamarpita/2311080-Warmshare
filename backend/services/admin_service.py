from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

# Support both local development and Vercel deployment.
try:
    from backend.models import User, UserSession, AuditLog
except ModuleNotFoundError as error:
    if error.name != "backend":
        raise

    from models import User, UserSession, AuditLog

def get_admin_users_service(db: Session):
    """Return all users for the Admin dashboard."""
    return db.scalars(
        select(User).order_by(User.created_at.desc())
    ).all()


def update_user_role_service(
    target_user_id: int,
    new_role: str,
    db: Session,
    current_admin: User,
):
    """Change a user's role and invalidate their existing sessions."""

    target_user = db.get(User, target_user_id)

    if target_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if target_user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own role.",
        )

    if target_user.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The Admin role cannot be changed.",
        )

    if new_role not in ("user", "moderator"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role.",
        )

    if target_user.role == new_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has this role.",
        )

    target_user.role = new_role

    now = datetime.now(timezone.utc)

    for user_session in target_user.sessions:
        if user_session.revoked_at is None:
            user_session.revoked_at = now

            for refresh_token in user_session.refresh_tokens:
                if refresh_token.revoked_at is None:
                    refresh_token.revoked_at = now

    db.add(
        AuditLog(
            actor_id=current_admin.id,
            action="user_role_changed",
            target_type="user",
            target_id=str(target_user.id),
            details={
                "new_role": new_role,
            },
        )
    )

    db.commit()
    db.refresh(target_user)

    return target_user


def update_user_ban_service(
    target_user_id: int,
    is_banned: bool,
    reason: str | None,
    db: Session,
    current_admin: User,
):
    """Ban or unban a user. Banning also revokes their sessions."""

    target_user = db.get(User, target_user_id)

    if target_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if target_user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot ban or unban yourself.",
        )

    if target_user.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="An Admin cannot be banned or unbanned.",
        )

    now = datetime.now(timezone.utc)

    if is_banned:
        if not reason or not reason.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A reason is required when banning a user.",
            )

        target_user.is_banned = True
        target_user.ban_reason = reason.strip()
        target_user.banned_at = now

        action = "user_banned"

        for user_session in target_user.sessions:
            if user_session.revoked_at is None:
                user_session.revoked_at = now

                for refresh_token in user_session.refresh_tokens:
                    if refresh_token.revoked_at is None:
                        refresh_token.revoked_at = now

    else:
        target_user.is_banned = False
        target_user.ban_reason = None
        target_user.banned_at = None

        action = "user_unbanned"

    db.add(
        AuditLog(
            actor_id=current_admin.id,
            action=action,
            target_type="user",
            target_id=str(target_user.id),
            details={
                "reason": reason.strip() if is_banned and reason else None,
            },
        )
    )

    db.commit()
    db.refresh(target_user)

    return target_user


def revoke_user_sessions_service(
    target_user_id: int,
    db: Session,
    current_admin: User,
):
    """Revoke all active sessions belonging to a user."""

    target_user = db.get(User, target_user_id)

    if target_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if target_user.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot revoke your own sessions from this action.",
        )

    now = datetime.now(timezone.utc)
    revoked_count = 0

    for user_session in target_user.sessions:
        if user_session.revoked_at is None:
            user_session.revoked_at = now
            revoked_count += 1

            for refresh_token in user_session.refresh_tokens:
                if refresh_token.revoked_at is None:
                    refresh_token.revoked_at = now

    db.add(
        AuditLog(
            actor_id=current_admin.id,
            action="user_sessions_revoked",
            target_type="user",
            target_id=str(target_user.id),
            details={
                "revoked_sessions": revoked_count,
            },
        )
    )

    db.commit()

    return {
        "message": "User sessions revoked successfully.",
        "revoked_sessions": revoked_count,
    }
