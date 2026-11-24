
import os
from datetime import datetime, timezone

from fastapi import (
    APIRouter,
    Cookie,
    Depends,
    HTTPException,
    Request,
    Response,
)
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.orm import Session

# Support both local development and Vercel deployment
try:
    from backend.dependencies import (
        get_db,
        get_current_user,
        bearer_scheme,
    )
    from backend.models import User, UserSession, RefreshToken
    from backend.schemas import (
        UserCreate,
        UserResponse,
        UserLogin,
        UserSessionResponse,
        UserProfileUpdate,
        PasswordChangeRequest,
    )
    from backend.security import decode_access_token
    from backend.services.auth_service import (
        register_user_service,
        login_user_service,
        refresh_user_session_service,
        hash_refresh_token,
        revoke_session,
        update_user_profile_service,
        change_user_password_service,
    )
except ModuleNotFoundError as error:
    if error.name != "backend":
        raise

    from dependencies import (
        get_db,
        get_current_user,
        bearer_scheme,
    )
    from models import User, UserSession, RefreshToken
    from schemas import (
        UserCreate,
        UserResponse,
        UserLogin,
        UserSessionResponse,
        UserProfileUpdate,
        PasswordChangeRequest,
    )
    from security import decode_access_token
    from services.auth_service import (
        register_user_service,
        login_user_service,
        refresh_user_session_service,
        hash_refresh_token,
        revoke_session,
        update_user_profile_service,
        change_user_password_service,
    )


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)

REFRESH_COOKIE_NAME = "warmshare_refresh_token"
REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60


def is_production() -> bool:
    return (
        os.getenv("VERCEL") == "1"
        or os.getenv("ENVIRONMENT") == "production"
    )


def set_refresh_cookie(
    response: Response,
    refresh_token: str,
):
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=refresh_token,
        max_age=REFRESH_COOKIE_MAX_AGE,
        httponly=True,
        secure=is_production(),
        samesite="lax",
        path="/api/auth",
    )


def clear_refresh_cookie(response: Response):
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        path="/api/auth",
        httponly=True,
        secure=is_production(),
        samesite="lax",
    )


# Return an error response that also clears the refresh cookie.
def refresh_error_response(
    status_code: int,
    detail: str,
    headers: dict | None = None,
):
    response = JSONResponse(
        status_code=status_code,
        content={"detail": detail},
        headers=headers,
    )

    clear_refresh_cookie(response)

    return response


# ========================================
# USER REGISTRATION
# ========================================

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=201,
)
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db),
):
    return register_user_service(user, db)


# ========================================
# USER LOGIN
# ========================================

@router.post("/login")
def login_user(
    user: UserLogin,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    user_agent = request.headers.get("user-agent")

    ip_address = (
        request.client.host
        if request.client is not None
        else None
    )

    login_data = login_user_service(
        user,
        db,
        user_agent=user_agent,
        ip_address=ip_address,
    )

    refresh_token = login_data.pop("refresh_token")

    set_refresh_cookie(
        response,
        refresh_token,
    )

    return login_data


# ========================================
# REFRESH ACCESS TOKEN
# ========================================

@router.post("/refresh")
def refresh_token(
    response: Response,
    refresh_cookie: str | None = Cookie(
        default=None,
        alias=REFRESH_COOKIE_NAME,
    ),
    db: Session = Depends(get_db),
):
    if not refresh_cookie:
        return refresh_error_response(
            status_code=401,
            detail="Refresh token missing. Please log in again.",
        )

    try:
        refresh_data = refresh_user_session_service(
            refresh_cookie,
            db,
        )
    except HTTPException as error:
        return refresh_error_response(
            status_code=error.status_code,
            detail=error.detail,
            headers=error.headers,
        )

    new_refresh_token = refresh_data.pop("refresh_token")

    set_refresh_cookie(
        response,
        new_refresh_token,
    )

    return refresh_data


# ========================================
# LOGOUT
# ========================================

@router.post("/logout")
def logout_user(
    response: Response,
    refresh_cookie: str | None = Cookie(
        default=None,
        alias=REFRESH_COOKIE_NAME,
    ),
    db: Session = Depends(get_db),
):
    if refresh_cookie:
        token_hash = hash_refresh_token(refresh_cookie)

        token_record = db.scalar(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash
            )
        )

        if token_record is not None:
            user_session = db.scalar(
                select(UserSession).where(
                    UserSession.id == token_record.session_id
                )
            )

            if user_session is not None:
                if user_session.revoked_at is None:
                    revoke_session(
                        user_session,
                        db,
                        datetime.now(timezone.utc),
                    )
                    db.commit()

    clear_refresh_cookie(response)

    return {
        "message": "Logged out successfully"
    }


# ========================================
# GET LOGGED-IN USER PROFILE
# ========================================

@router.get(
    "/me",
    response_model=UserResponse,
)
def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user


# ========================================
# ISSUE #31: UPDATE USER PROFILE
# ========================================

@router.patch(
    "/me",
    response_model=UserResponse,
)
def update_my_profile(
    profile: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_user_profile_service(
        user=current_user,
        profile=profile,
        db=db,
    )


# ========================================
# ISSUE #31: CHANGE PASSWORD
# ========================================

@router.post("/change-password")
def change_my_password(
    password_change: PasswordChangeRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
    db: Session = Depends(get_db),
):
    # get_current_user has already verified:
    # - JWT validity
    # - User identity
    # - Account status
    # - User role
    # - Session ownership
    # - Session revocation and expiration

    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Authentication required.",
        )

    # Decode the same authenticated bearer token
    # to obtain its signed session ID.
    payload = decode_access_token(
        credentials.credentials
    )

    if payload is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token.",
        )

    session_id = payload["sid"]

    change_user_password_service(
        user=current_user,
        password_change=password_change,
        db=db,
        current_session_id=session_id,
        ip_address=(
            request.client.host
            if request.client is not None
            else None
        ),
        user_agent=request.headers.get("user-agent"),
    )

    return {
        "message": (
            "Password changed successfully. "
            "Other sessions have been revoked."
        )
    }


# ========================================
# LIST CURRENT USER'S ACTIVE SESSIONS
# ========================================

@router.get(
    "/sessions",
    response_model=list[UserSessionResponse],
)
def get_my_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)

    sessions = db.scalars(
        select(UserSession)
        .where(
            UserSession.user_id == current_user.id,
            UserSession.revoked_at.is_(None),
            UserSession.expires_at > now,
        )
        .order_by(UserSession.created_at.desc())
    ).all()

    return sessions


# ========================================
# REVOKE ONE OF THE USER'S SESSIONS
# ========================================

@router.delete("/sessions/{session_id}")
def revoke_my_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_session = db.scalar(
        select(UserSession).where(
            UserSession.id == session_id,
            UserSession.user_id == current_user.id,
        )
    )

    if user_session is None:
        raise HTTPException(
            status_code=404,
            detail="Session not found.",
        )

    if user_session.revoked_at is None:
        revoke_session(
            user_session,
            db,
            datetime.now(timezone.utc),
        )
        db.commit()

    return {
        "message": "Session revoked successfully"
    }
