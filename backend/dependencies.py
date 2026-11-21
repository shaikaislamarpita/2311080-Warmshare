
from datetime import datetime, timezone

from fastapi import Depends, HTTPException
from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials,
)
from sqlalchemy.orm import Session

# Support both local development and Vercel deployment
try:
    from backend.database import get_session_factory
    from backend.models import User, UserSession
    from backend.security import decode_access_token
except ModuleNotFoundError as error:
    if error.name != "backend":
        raise

    from database import get_session_factory
    from models import User, UserSession
    from security import decode_access_token


# JWT authentication scheme
bearer_scheme = HTTPBearer(auto_error=False)


# Create and manage database sessions
def get_db():
    SessionLocal = get_session_factory()
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# Get the currently authenticated user
def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
    db: Session = Depends(get_db),
):
    # Reject requests without authentication
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify authentication scheme
    if credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication scheme",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Decode and verify JWT
    payload = decode_access_token(credentials.credentials)

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Extract user, role, and session information
    try:
        user_id = int(payload["sub"])
        token_role = payload["role"]
        session_id = payload["sid"]
    except (KeyError, ValueError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Find the authenticated user
    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Reject banned accounts
    if user.is_banned:
        raise HTTPException(
            status_code=403,
            detail="Your account has been suspended.",
        )

    # Reject tokens containing an outdated role
    if user.role != token_role:
        raise HTTPException(
            status_code=401,
            detail="Your permissions have changed. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Find the session associated with this token
    user_session = db.get(UserSession, session_id)

    if user_session is None or user_session.user_id != user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Reject revoked sessions
    if user_session.revoked_at is not None:
        raise HTTPException(
            status_code=401,
            detail="This session has been revoked. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Reject expired sessions
    now = datetime.now(timezone.utc)

    if user_session.expires_at <= now:
        raise HTTPException(
            status_code=401,
            detail="Session expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user
