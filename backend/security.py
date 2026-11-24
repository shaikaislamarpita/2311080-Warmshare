
import os
import hashlib
import hmac

from datetime import datetime, timedelta, timezone

import jwt

from argon2 import PasswordHasher
from argon2.exceptions import (
    VerifyMismatchError,
    VerificationError,
)


# ========================================
# PASSWORD SECURITY CONFIGURATION
# ========================================

password_hasher = PasswordHasher()

PASSWORD_HASH_PREFIX = "pepper$v1$"

ACCESS_TOKEN_EXPIRE_MINUTES = 15
JWT_ALGORITHM = "HS256"


def get_password_pepper() -> str:
    """
    Retrieve the server-side password pepper.
    The pepper must never be stored in the database.
    """

    pepper = os.getenv("PASSWORD_PEPPER")

    if not pepper:
        raise RuntimeError(
            "PASSWORD_PEPPER is missing."
        )

    if len(pepper) < 32:
        raise RuntimeError(
            "PASSWORD_PEPPER must contain at least 32 characters."
        )

    return pepper


# ========================================
# PASSWORD PRE-HASHING
# ========================================

def pepper_password(password: str) -> str:
    """
    Apply HMAC-SHA256 using the server-side pepper
    before passing the password to Argon2.
    """

    pepper = get_password_pepper()

    return hmac.new(
        pepper.encode("utf-8"),
        b"warmshare-password-v1:" + password.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


# ========================================
# HASH PASSWORD
# ========================================

def hash_password(password: str) -> str:
    """
    Create a pepper-protected Argon2 password hash.
    """

    protected_password = pepper_password(password)

    argon_hash = password_hasher.hash(
        protected_password
    )

    return PASSWORD_HASH_PREFIX + argon_hash


# ========================================
# VERIFY PASSWORD
# ========================================

def verify_password(
    password: str,
    stored_hash: str,
) -> bool:
    """
    Verify both legacy and pepper-protected hashes.

    Legacy hashes:
        Original Argon2 hashes without pepper.

    New hashes:
        Argon2 hashes protected with HMAC-SHA256 pepper.
    """

    try:
        if stored_hash.startswith(PASSWORD_HASH_PREFIX):
            argon_hash = stored_hash[
                len(PASSWORD_HASH_PREFIX):
            ]

            protected_password = pepper_password(
                password
            )

            return password_hasher.verify(
                argon_hash,
                protected_password,
            )

        # Backward compatibility for existing accounts.
        return password_hasher.verify(
            stored_hash,
            password,
        )

    except (
        VerifyMismatchError,
        VerificationError,
        ValueError,
        TypeError,
    ):
        return False


# ========================================
# CHECK WHETHER PASSWORD HASH NEEDS UPGRADE
# ========================================

def password_hash_needs_upgrade(
    stored_hash: str,
) -> bool:
    """
    Identify existing password hashes that
    have not yet been upgraded to pepper protection.
    """

    return not stored_hash.startswith(
        PASSWORD_HASH_PREFIX
    )


# ========================================
# GENERATE ACCESS TOKEN
# ========================================

def create_access_token(
    user_id: int,
    role: str,
    session_id: str,
) -> str:
    """
    Generate a short-lived JWT after successful login.
    """

    secret = os.getenv("JWT_SECRET_KEY")

    if not secret:
        raise RuntimeError(
            "JWT_SECRET_KEY is missing"
        )

    now = datetime.now(timezone.utc)

    expiration = now + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user_id),
        "role": role,
        "sid": session_id,
        "iat": now,
        "exp": expiration,
        "jti": os.urandom(16).hex(),
    }

    return jwt.encode(
        payload,
        secret,
        algorithm=JWT_ALGORITHM,
    )


# ========================================
# VERIFY ACCESS TOKEN
# ========================================

def decode_access_token(
    token: str,
) -> dict | None:
    """
    Verify a JWT and return its claims.
    """

    secret = os.getenv("JWT_SECRET_KEY")

    if not secret:
        raise RuntimeError(
            "JWT_SECRET_KEY is missing"
        )

    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=[JWT_ALGORITHM],
            options={
                "require": [
                    "sub",
                    "role",
                    "sid",
                    "iat",
                    "exp",
                    "jti",
                ]
            },
        )

        user_id = int(payload["sub"])
        role = payload["role"]
        session_id = payload["sid"]

        if user_id <= 0:
            return None

        if role not in (
            "user",
            "moderator",
            "admin",
        ):
            return None

        if (
            not isinstance(session_id, str)
            or not session_id
        ):
            return None

        if (
            not isinstance(payload["jti"], str)
            or not payload["jti"]
        ):
            return None

        return payload

    except (
        jwt.InvalidTokenError,
        KeyError,
        ValueError,
        TypeError,
    ):
        return None
