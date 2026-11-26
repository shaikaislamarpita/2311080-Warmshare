from sqlalchemy import func, select
from sqlalchemy.orm import Session

# Support both local development and Vercel deployment
try:
    from backend.models import User, Listing, ListingReport, UserSession

except ModuleNotFoundError as error:
    if error.name != "backend":
        raise

    from models import User, Listing, ListingReport, UserSession


# ========================================
# ADMIN DASHBOARD STATISTICS
# ========================================

def get_admin_dashboard_stats_service(db: Session):
    """Return summary statistics for the Admin dashboard."""

    total_users = db.scalar(
        select(func.count(User.id))
    ) or 0

    total_donors = db.scalar(
        select(func.count(User.id)).where(
            User.role == "user"
        )
    ) or 0

    total_moderators = db.scalar(
        select(func.count(User.id)).where(
            User.role == "moderator"
        )
    ) or 0

    total_banned_users = db.scalar(
        select(func.count(User.id)).where(
            User.is_banned.is_(True)
        )
    ) or 0

    total_listings = db.scalar(
        select(func.count(Listing.id))
    ) or 0

    visible_listings = db.scalar(
        select(func.count(Listing.id)).where(
            Listing.moderation_status == "visible"
        )
    ) or 0

    hidden_listings = db.scalar(
        select(func.count(Listing.id)).where(
            Listing.moderation_status == "hidden"
        )
    ) or 0

    pending_reports = db.scalar(
        select(func.count(ListingReport.id)).where(
            ListingReport.status == "pending"
        )
    ) or 0

    active_sessions = db.scalar(
        select(func.count(UserSession.id)).where(
            UserSession.revoked_at.is_(None),
            UserSession.expires_at > func.now(),
        )
    ) or 0

    return {
        "total_users": total_users,
        "total_donors": total_donors,
        "total_moderators": total_moderators,
        "total_banned_users": total_banned_users,
        "total_listings": total_listings,
        "visible_listings": visible_listings,
        "hidden_listings": hidden_listings,
        "pending_reports": pending_reports,
        "active_sessions": active_sessions,
    }


# ========================================
# GET ACTIVE SESSION DETAILS
# ========================================

def get_active_sessions_service(db: Session):
    """Return active login sessions with basic user information."""

    sessions = db.execute(
        select(
            UserSession.id.label("session_id"),
            UserSession.user_id,
            User.full_name,
            User.email,
            User.role,
            UserSession.created_at,
            UserSession.expires_at,
        )
        .join(
            User,
            User.id == UserSession.user_id,
        )
        .where(
            UserSession.revoked_at.is_(None),
            UserSession.expires_at > func.now(),
        )
        .order_by(
            UserSession.created_at.desc(),
            UserSession.id.desc(),
        )
    ).mappings().all()

    return [
        {
            "session_id": str(session["session_id"]),
            "user_id": session["user_id"],
            "full_name": session["full_name"],
            "email": session["email"],
            "role": session["role"],
            "created_at": session["created_at"],
            "expires_at": session["expires_at"],
        }
        for session in sessions
    ]