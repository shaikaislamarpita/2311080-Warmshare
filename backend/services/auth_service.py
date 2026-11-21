
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

# Support both local development and Vercel deployment
try:
    from backend.models import (
        User,
        UserSession,
        RefreshToken,
        LoginRateLimit,
    )
    from backend.schemas import UserCreate, UserLogin
    from backend.security import (
        hash_password,
        verify_password,
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
    )
    from schemas import UserCreate, UserLogin
    from security import (
        hash_password,
        verify_password,
        create_access_token,
    )


SESSION_EXPIRE_DAYS = 30

LOGIN_MAX_ATTEMPTS = 5
LOGIN_WINDOW_MINUTES = 15
LOGIN_COOLDOWN_MINUTES = 15

# Generate one dummy Argon2 hash per application process.
# This ensures unknown email addresses also undergo password verification.
DUMMY_PASSWORD_HASH = hash_password(
    secrets.token_urlsafe(32)
)


# Hash a refresh token before storing it in the database
def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()


# Create a keyed hash of the normalized email address
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


# Check whether the account is currently blocked from login
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
            detail="Too many failed login attempts. Please try again later.",
        )


# Record a failed login attempt using an atomic database upsert
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
        statement = postgresql_insert(LoginRateLimit).values(
            **values
        )
    elif db.bind.dialect.name == "sqlite":
        statement = sqlite_insert(LoginRateLimit).values(
            **values
        )
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


# Clear failed login attempts within the current transaction
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


# Revoke a session and all its refresh-token records
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


# Register a new user
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

    hashed_password = hash_password(user.password)

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


# Authenticate an existing user and create a session
def login_user_service(
    user: UserLogin,
    db: Session,
    user_agent: str | None = None,
    ip_address: str | None = None,
):
    email = user.email.strip().lower()
    now = datetime.now(timezone.utc)

    check_login_rate_limit(
        email,
        db,
        now,
    )

    existing_user = db.scalar(
        select(User).where(User.email == email)
    )

    # Always perform Argon2 verification.
    password_hash = (
        existing_user.password_hash
        if existing_user is not None
        else DUMMY_PASSWORD_HASH
    )

    password_is_valid = verify_password(
        user.password,
        password_hash,
    )

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

    if existing_user.is_banned:
        raise HTTPException(
            status_code=403,
            detail="Your account has been suspended.",
        )

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
        user_agent=user_agent[:500] if user_agent else None,
        ip_address=ip_address,
    )

    initial_refresh_record = RefreshToken(
        session_id=session_id,
        token_hash=token_hash,
        created_at=now,
    )

    access_token = create_access_token(
        user_id=existing_user.id,
        role=existing_user.role,
        session_id=session_id,
    )

    # Clear failed attempts and create the session in one transaction.
    try:
        clear_failed_logins(
            email,
            db,
        )

        db.add(new_session)
        db.add(initial_refresh_record)

        db.commit()
    except Exception:
        db.rollback()
        raise

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token,
    }


# Rotate a refresh token and detect reuse of older tokens
def refresh_user_session_service(
    refresh_token: str,
    db: Session,
):
    old_token_hash = hash_refresh_token(refresh_token)
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
            detail="This session has been revoked. Please log in again.",
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
            detail="Refresh token reuse detected. Please log in again.",
        )

    if token_record.revoked_at is not None:
        raise HTTPException(
            status_code=401,
            detail="Refresh token has been revoked. Please log in again.",
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
            detail="Invalid session token. Please log in again.",
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
