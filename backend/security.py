
import os
from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError

password_hasher = PasswordHasher()

ACCESS_TOKEN_EXPIRE_MINUTES = 15
JWT_ALGORITHM = "HS256"


# Hash password during registration
def hash_password(password: str) -> str:
    return password_hasher.hash(password)


# Verify password during login
def verify_password(password: str, stored_hash: str) -> bool:
    try:
        return password_hasher.verify(stored_hash, password)
    except (VerifyMismatchError, VerificationError):
        return False


# Generate a short-lived JWT after successful login
def create_access_token(
    user_id: int,
    role: str,
    session_id: str,
) -> str:
    secret = os.getenv("JWT_SECRET_KEY")

    if not secret:
        raise RuntimeError("JWT_SECRET_KEY is missing")

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


# Verify a JWT and return its claims
def decode_access_token(token: str) -> dict | None:
    secret = os.getenv("JWT_SECRET_KEY")

    if not secret:
        raise RuntimeError("JWT_SECRET_KEY is missing")

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

        if role not in ("user", "moderator", "admin"):
            return None

        if not isinstance(session_id, str) or not session_id:
            return None

        if not isinstance(payload["jti"], str) or not payload["jti"]:
            return None

        return payload

    except (jwt.InvalidTokenError, KeyError, ValueError, TypeError):
        return None
