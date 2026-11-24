
import hashlib
import hmac
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import case, delete, select, update
from sqlalchemy.dialects.postgresql import insert as postgresql_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session


# Support both local development and Vercel deployment.
try:
    from backend.models import (
        User,
        UserSession,
        RefreshToken,
        LoginRateLimit,
        AuditLog,
    )
    from backend.schemas import (
        UserCreate,
        UserLogin,
        UserProfileUpdate,
        PasswordChangeRequest,
    )
    from backend.security import (
        hash_password,
        verify_password,
        password_hash_needs_upgrade,
        create_access_token,
    )
except ModuleNotFoundError as error:
    if error.name != "backend":
        raise

    from models import (
        User,
        UserSession,
        RefreshToken,
        LoginRateLimit,
        AuditLog,
    )
    from schemas import (
        UserCreate,
        UserLogin,
        UserProfileUpdate,
        PasswordChangeRequest,
    )
    from security import (
        hash_password,
        verify_password,
        password_hash_needs_upgrade,
        create_access_token,
    )


# ========================================
# AUTHENTICATION CONFIGURATION
# ========================================

SESSION_EXPIRE_DAYS = 30

LOGIN_MAX_ATTEMPTS = 5
LOGIN_WINDOW_MINUTES = 15
LOGIN_COOLDOWN_MINUTES = 15


# Use a dummy Argon2 hash when an email does not exist.
# This reduces timing differences between valid and invalid emails.
DUMMY_PASSWORD_HASH = hash_password(
    secrets.token_urlsafe(32)
)


# ========================================
# REFRESH TOKEN HASHING
# ========================================

def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()


# ========================================
# LOGIN IDENTIFIER PROTECTION
# ========================================

def hash_login_identifier(email: str) -> str:
    secret = os.getenv("LOGIN_RATE_LIMIT_SECRET")

    if not secret:
        raise RuntimeError(
            "LOGIN_RATE_LIMIT_SECRET is not configured"
        )

    normalized_email = email.strip().lower()

    return hmac.new(
        secret.encode("utf-8"),
        normalized_email.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


# ========================================
# CHECK LOGIN RATE LIMIT
# ========================================

def check_login_rate_limit(
    email: str,
    db: Session,
    now: datetime,
):
    identifier_hash = hash_login_identifier(email)

    rate_limit = db.get(
        LoginRateLimit,
        identifier_hash,
    )

    if (
        rate_limit is not None
        and rate_limit.blocked_until is not None
        and rate_limit.blocked_until > now
    ):
        raise HTTPException(
            status_code=429,
            detail=(
                "Too many failed login attempts. "
                "Please try again later."
            ),
        )


# ========================================
# RECORD FAILED LOGIN
# ========================================

def record_failed_login(
    email: str,
    db: Session,
    now: datetime,
):
    identifier_hash = hash_login_identifier(email)

    window_start = now - timedelta(
        minutes=LOGIN_WINDOW_MINUTES
    )

    cooldown_end = now + timedelta(
        minutes=LOGIN_COOLDOWN_MINUTES
    )

    reset_window = (
        LoginRateLimit.window_started_at <= window_start
    )

    new_attempt_count = case(
        (
            reset_window,
            1,
        ),
        else_=LoginRateLimit.failed_attempts + 1,
    )

    new_blocked_until = case(
        (
            new_attempt_count >= LOGIN_MAX_ATTEMPTS,
            cooldown_end,
        ),
        (
            reset_window,
            None,
        ),
        else_=LoginRateLimit.blocked_until,
    )

    values = {
        "identifier_hash": identifier_hash,
        "failed_attempts": 1,
        "window_started_at": now,
        "blocked_until": None,
        "updated_at": now,
    }

    if db.bind.dialect.name == "postgresql":
        statement = postgresql_insert(
            LoginRateLimit
        ).values(**values)

    elif db.bind.dialect.name == "sqlite":
        statement = sqlite_insert(
            LoginRateLimit
        ).values(**values)

    else:
        raise RuntimeError(
            "Login rate limiting requires PostgreSQL or SQLite"
        )

    statement = statement.on_conflict_do_update(
        index_elements=[
            LoginRateLimit.identifier_hash
        ],
        set_={
            "failed_attempts": new_attempt_count,
            "window_started_at": case(
                (
                    reset_window,
                    now,
                ),
                else_=LoginRateLimit.window_started_at,
            ),
            "blocked_until": new_blocked_until,
            "updated_at": now,
        },
    )

    try:
        db.execute(statement)
        db.commit()

    except Exception:
        db.rollback()
        raise


# ========================================
# CLEAR FAILED LOGIN ATTEMPTS
# ========================================

def clear_failed_logins(
    email: str,
    db: Session,
):
    identifier_hash = hash_login_identifier(email)

    db.execute(
        delete(LoginRateLimit).where(
            LoginRateLimit.identifier_hash
            == identifier_hash
        )
    )


# ========================================
# REVOKE SESSION AND REFRESH TOKENS
# ========================================

def revoke_session(
    user_session: UserSession,
    db: Session,
    now: datetime,
):
    user_session.revoked_at = now

    db.execute(
        update(RefreshToken)
        .where(
            RefreshToken.session_id == user_session.id
        )
        .values(revoked_at=now)
    )


# ========================================
# USER REGISTRATION
# ========================================

def register_user_service(
    user: UserCreate,
    db: Session,
):
    full_name = user.full_name.strip()
    email = user.email.strip().lower()

    if len(full_name) < 2:
        raise HTTPException(
            status_code=422,
            detail="Full name must contain at least 2 characters",
        )

    if (
        email.count("@") != 1
        or email.startswith("@")
        or email.endswith("@")
        or "." not in email.split("@")[-1]
        or " " in email
    ):
        raise HTTPException(
            status_code=422,
            detail="Please enter a valid email address",
        )

    existing_user = db.scalar(
        select(User).where(User.email == email)
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=409,
            detail="Email already registered",
        )

    # New accounts automatically use Argon2 + pepper.
    hashed_password = hash_password(
        user.password
    )

    new_user = User(
        full_name=full_name,
        email=email,
        password_hash=hashed_password,
        role="user",
    )

    db.add(new_user)

    try:
        db.commit()

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Email already registered",
        )

    db.refresh(new_user)

    return new_user


# ========================================
# USER LOGIN
# ========================================

def login_user_service(
    user: UserLogin,
    db: Session,
    user_agent: str | None = None,
    ip_address: str | None = None,
):
    email = user.email.strip().lower()
    now = datetime.now(timezone.utc)

    # Step 1: Check login rate limiting.
    check_login_rate_limit(
        email,
        db,
        now,
    )

    # Step 2: Find the account.
    existing_user = db.scalar(
        select(User).where(User.email == email)
    )

    # Step 3: Always perform Argon2 verification.
    password_hash = (
        existing_user.password_hash
        if existing_user is not None
        else DUMMY_PASSWORD_HASH
    )

    password_is_valid = verify_password(
        user.password,
        password_hash,
    )

    # Step 4: Reject invalid credentials.
    if existing_user is None or not password_is_valid:
        record_failed_login(
            email,
            db,
            now,
        )

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    # Step 5: Reject suspended accounts.
    if existing_user.is_banned:
        raise HTTPException(
            status_code=403,
            detail="Your account has been suspended.",
        )

    # ========================================
    # PASSWORD PEPPER MIGRATION
    # ========================================
    #
    # This runs ONLY after successful authentication.
    #
    # Legacy password:
    #   Argon2 hash without pepper
    #
    # Upgraded password:
    #   pepper$v1$ + Argon2 hash
    #
    # The change is committed together with the
    # login session and refresh token.
    #
    # If the transaction fails, rollback restores
    # the original password hash.
    # ========================================

    if password_hash_needs_upgrade(
        existing_user.password_hash
    ):
        existing_user.password_hash = hash_password(
            user.password
        )

    # Step 6: Create a new login session.
    session_id = str(uuid.uuid4())

    refresh_token = secrets.token_urlsafe(64)
    token_hash = hash_refresh_token(refresh_token)

    new_session = UserSession(
        id=session_id,
        user_id=existing_user.id,
        refresh_token_hash=token_hash,
        expires_at=now + timedelta(
            days=SESSION_EXPIRE_DAYS
        ),
        created_at=now,
        last_used_at=now,
        user_agent=(
            user_agent[:500]
            if user_agent
            else None
        ),
        ip_address=ip_address,
    )

    initial_refresh_record = RefreshToken(
        session_id=session_id,
        token_hash=token_hash,
        created_at=now,
    )

    # Step 7: Generate JWT.
    access_token = create_access_token(
        user_id=existing_user.id,
        role=existing_user.role,
        session_id=session_id,
    )

    # Step 8: Save login and hash migration atomically.
    try:
        clear_failed_logins(
            email,
            db,
        )

        db.add(new_session)
        db.add(initial_refresh_record)

        # SQLAlchemy also saves the modified
        # existing_user.password_hash, if changed.
        db.commit()

    except Exception:
        db.rollback()
        raise

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token,
    }


# ========================================
# REFRESH ACCESS TOKEN
# ========================================

def refresh_user_session_service(
    refresh_token: str,
    db: Session,
):
    old_token_hash = hash_refresh_token(
        refresh_token
    )

    now = datetime.now(timezone.utc)

    token_record = db.scalar(
        select(RefreshToken)
        .where(
            RefreshToken.token_hash == old_token_hash
        )
        .with_for_update()
    )

    if token_record is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid refresh token. Please log in again.",
        )

    user_session = db.scalar(
        select(UserSession)
        .where(
            UserSession.id == token_record.session_id
        )
        .with_for_update()
    )

    if user_session is None:
        raise HTTPException(
            status_code=401,
            detail="Session not found. Please log in again.",
        )

    if user_session.revoked_at is not None:
        raise HTTPException(
            status_code=401,
            detail=(
                "This session has been revoked. "
                "Please log in again."
            ),
        )

    if token_record.used_at is not None:
        revoke_session(
            user_session,
            db,
            now,
        )

        db.commit()

        raise HTTPException(
            status_code=401,
            detail=(
                "Refresh token reuse detected. "
                "Please log in again."
            ),
        )

    if token_record.revoked_at is not None:
        raise HTTPException(
            status_code=401,
            detail=(
                "Refresh token has been revoked. "
                "Please log in again."
            ),
        )

    if user_session.refresh_token_hash != old_token_hash:
        revoke_session(
            user_session,
            db,
            now,
        )

        db.commit()

        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid session token. "
                "Please log in again."
            ),
        )

    if user_session.expires_at <= now:
        revoke_session(
            user_session,
            db,
            now,
        )

        db.commit()

        raise HTTPException(
            status_code=401,
            detail="Session expired. Please log in again.",
        )

    user = db.get(
        User,
        user_session.user_id,
    )

    if user is None:
        revoke_session(
            user_session,
            db,
            now,
        )

        db.commit()

        raise HTTPException(
            status_code=401,
            detail="User account not found.",
        )

    if user.is_banned:
        revoke_session(
            user_session,
            db,
            now,
        )

        db.commit()

        raise HTTPException(
            status_code=403,
            detail="Your account has been suspended.",
        )

    new_refresh_token = secrets.token_urlsafe(64)

    new_token_hash = hash_refresh_token(
        new_refresh_token
    )

    new_access_token = create_access_token(
        user_id=user.id,
        role=user.role,
        session_id=user_session.id,
    )

    token_record.used_at = now

    user_session.refresh_token_hash = new_token_hash
    user_session.last_used_at = now

    new_token_record = RefreshToken(
        session_id=user_session.id,
        token_hash=new_token_hash,
        created_at=now,
    )

    db.add(new_token_record)

    try:
        db.commit()

    except Exception:
        db.rollback()
        raise

    return {
        "access_token": new_access_token,
        "token_type": "bearer",
        "refresh_token": new_refresh_token,
    }


# ========================================
# ISSUE #31: UPDATE USER PROFILE
# ========================================

def update_user_profile_service(
    user: User,
    profile: UserProfileUpdate,
    db: Session,
) -> User:
    """Update the authenticated user's full name."""

    full_name = profile.full_name.strip()

    if not 2 <= len(full_name) <= 100:
        raise HTTPException(
            status_code=422,
            detail=(
                "Full name must contain "
                "between 2 and 100 characters."
            ),
        )

    user.full_name = full_name

    db.add(
        AuditLog(
            actor_id=user.id,
            action="profile_updated",
            target_type="user",
            target_id=str(user.id),
            details={
                "changed_fields": ["full_name"]
            },
        )
    )

    try:
        db.commit()
        db.refresh(user)

    except Exception:
        db.rollback()
        raise

    return user


# ========================================
# ISSUE #31: CHANGE PASSWORD
# ========================================

def change_user_password_service(
    user: User,
    password_change: PasswordChangeRequest,
    db: Session,
    current_session_id: str,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> None:
    """
    Verify the current password, securely replace it,
    record audit events, and revoke other sessions.
    """

    audit_details = {
        "ip_address": ip_address,
        "user_agent": (
            user_agent[:500]
            if user_agent
            else None
        ),
    }

    # Step 1: Verify the current password.
    current_password_valid = verify_password(
        password_change.current_password,
        user.password_hash,
    )

    if not current_password_valid:
        db.add(
            AuditLog(
                actor_id=user.id,
                action="password_change_failed",
                target_type="user",
                target_id=str(user.id),
                details={
                    **audit_details,
                    "reason": "incorrect_current_password",
                },
            )
        )

        try:
            db.commit()

        except Exception:
            db.rollback()
            raise

        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect.",
        )

    # Step 2: Check the new password length.
    new_password = password_change.new_password

    if not 8 <= len(new_password) <= 128:
        raise HTTPException(
            status_code=422,
            detail=(
                "New password must contain "
                "between 8 and 128 characters."
            ),
        )

    # Step 3: Confirm both new-password fields match.
    if (
        new_password
        != password_change.confirm_password
    ):
        raise HTTPException(
            status_code=422,
            detail="New passwords do not match.",
        )

    # Step 4: Prevent reusing the existing password.
    if verify_password(
        new_password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "New password must be different "
                "from your current password."
            ),
        )

    # Step 5: Hash the new password with Argon2 + pepper.
    now = datetime.now(timezone.utc)

    user.password_hash = hash_password(
        new_password
    )

    # Step 6: Revoke other sessions.
    # Keep the current authenticated session active.
    other_sessions = db.scalars(
        select(UserSession).where(
            UserSession.user_id == user.id,
            UserSession.id != current_session_id,
            UserSession.revoked_at.is_(None),
        )
    ).all()

    for other_session in other_sessions:
        revoke_session(
            other_session,
            db,
            now,
        )

    # Step 7: Record a successful password change.
    db.add(
        AuditLog(
            actor_id=user.id,
            action="password_changed",
            target_type="user",
            target_id=str(user.id),
            details={
                **audit_details,
                "revoked_other_sessions": len(
                    other_sessions
                ),
            },
        )
    )

    # Step 8: Save everything in one transaction.
    try:
        db.commit()

    except Exception:
        db.rollback()
        raise
