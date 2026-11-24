
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

# Support local development and Vercel deployment.
try:
    from backend.models import (
        User,
        UserSession,
        AuditLog,
        Listing,
        Group,
        GroupMember,
    )
    from backend.schemas import AdminBulkBanUpdate
except ModuleNotFoundError as error:
    if error.name != "backend":
        raise

    from models import (
        User,
        UserSession,
        AuditLog,
        Listing,
        Group,
        GroupMember,
    )
    from schemas import AdminBulkBanUpdate


# ========================================
# ADMIN USER LIST
# Existing behavior preserved
# ========================================

def get_admin_users_service(db: Session):
    """Return all users for existing Admin dashboard routes."""
    return db.scalars(
        select(User).order_by(
            User.created_at.desc(),
            User.id.desc(),
        )
    ).all()


# ========================================
# PAGINATED ADMIN USER LIST
# ========================================

def get_paginated_admin_users_service(
    db: Session,
    page: int = 1,
    page_size: int = 10,
):
    """
    Return users one page at a time.

    Example:
    page=1, page_size=10 -> first 10 users
    page=2, page_size=10 -> next 10 users
    """

    if page < 1:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Page must be at least 1.",
        )

    if page_size < 1 or page_size > 100:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Page size must be between 1 and 100.",
        )

    total = db.scalar(
        select(func.count()).select_from(User)
    ) or 0

    offset = (page - 1) * page_size

    users = db.scalars(
        select(User)
        .order_by(
            User.created_at.desc(),
            User.id.desc(),
        )
        .offset(offset)
        .limit(page_size)
    ).all()

    total_pages = (
        (total + page_size - 1) // page_size
        if total > 0
        else 0
    )

    return {
        "items": users,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


# ========================================
# DETAILED ADMIN USER VIEW
# ========================================

def get_admin_user_detail_service(
    target_user_id: int,
    db: Session,
):
    """
    Return detailed information about one user.

    Includes:
    - Basic user information
    - Listings
    - Owned groups
    - Group memberships
    - Login sessions
    - Recent audit activity
    """

    user = db.get(User, target_user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    listings = db.scalars(
        select(Listing)
        .where(Listing.owner_id == target_user_id)
        .order_by(
            Listing.created_at.desc(),
            Listing.id.desc(),
        )
    ).all()

    owned_groups = db.scalars(
        select(Group)
        .where(Group.owner_id == target_user_id)
        .order_by(
            Group.created_at.desc(),
            Group.id.desc(),
        )
    ).all()

    group_memberships = db.scalars(
        select(GroupMember)
        .where(GroupMember.user_id == target_user_id)
        .order_by(
            GroupMember.created_at.desc(),
            GroupMember.id.desc(),
        )
    ).all()

    sessions = db.scalars(
        select(UserSession)
        .where(UserSession.user_id == target_user_id)
        .order_by(
            UserSession.created_at.desc(),
            UserSession.id.desc(),
        )
    ).all()

    recent_activity = db.scalars(
        select(AuditLog)
        .where(
            or_(
                AuditLog.actor_id == target_user_id,
                (
                    (AuditLog.target_type == "user")
                    & (
                        AuditLog.target_id
                        == str(target_user_id)
                    )
                ),
            )
        )
        .order_by(
            AuditLog.created_at.desc(),
            AuditLog.id.desc(),
        )
        .limit(50)
    ).all()

    # Use ORM attribute mapping for the basic user fields.
    # The router will validate this against
    # AdminUserDetailResponse.
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "is_banned": user.is_banned,
        "ban_reason": user.ban_reason,
        "banned_at": user.banned_at,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
        "listings": listings,
        "owned_groups": owned_groups,
        "group_memberships": group_memberships,
        "sessions": sessions,
        "recent_activity": recent_activity,
    }


# ========================================
# CHANGE USER ROLE
# ========================================

def update_user_role_service(
    target_user_id: int,
    new_role: str,
    db: Session,
    current_admin: User,
):
    """Change a user's role and invalidate existing sessions."""

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


# ========================================
# SINGLE USER BAN / UNBAN
# ========================================

def update_user_ban_service(
    target_user_id: int,
    is_banned: bool,
    reason: str | None,
    db: Session,
    current_admin: User,
):
    """Ban or unban a user. Banning revokes their sessions."""

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
                "reason": (
                    reason.strip()
                    if is_banned and reason
                    else None
                ),
            },
        )
    )

    db.commit()
    db.refresh(target_user)

    return target_user


# ========================================
# BULK BAN / UNBAN
# ========================================

def bulk_update_user_ban_service(
    data: AdminBulkBanUpdate,
    db: Session,
    current_admin: User,
):
    """
    Ban or unban multiple users in one transaction.

    Skip:
    - Missing users
    - The current Admin
    - Other Admin accounts
    - Users already in the requested state
    """

    now = datetime.now(timezone.utc)

    reason = (
        data.reason.strip()
        if data.is_banned and data.reason
        else None
    )

    users = db.scalars(
        select(User).where(
            User.id.in_(data.user_ids)
        )
    ).all()

    users_by_id = {
        user.id: user
        for user in users
    }

    skipped_user_ids = []
    updated_count = 0

    try:
        for user_id in data.user_ids:
            target_user = users_by_id.get(user_id)

            if target_user is None:
                skipped_user_ids.append(user_id)
                continue

            if target_user.id == current_admin.id:
                skipped_user_ids.append(user_id)
                continue

            if target_user.role == "admin":
                skipped_user_ids.append(user_id)
                continue

            if target_user.is_banned == data.is_banned:
                skipped_user_ids.append(user_id)
                continue

            if data.is_banned:
                target_user.is_banned = True
                target_user.ban_reason = reason
                target_user.banned_at = now

                for user_session in target_user.sessions:
                    if user_session.revoked_at is None:
                        user_session.revoked_at = now

                        for refresh_token in user_session.refresh_tokens:
                            if refresh_token.revoked_at is None:
                                refresh_token.revoked_at = now

                action = "user_banned"

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
                        "reason": reason,
                        "bulk_action": True,
                    },
                )
            )

            updated_count += 1

        if updated_count > 0:
            db.commit()

        return {
            "requested_count": len(data.user_ids),
            "updated_count": updated_count,
            "skipped_count": len(skipped_user_ids),
            "skipped_user_ids": skipped_user_ids,
        }

    except Exception:
        db.rollback()
        raise


# ========================================
# REVOKE USER SESSIONS
# ========================================

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
