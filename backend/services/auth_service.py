
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from fastapi import HTTPException

from backend.models import User
from backend.schemas import UserCreate, UserLogin
from backend.security import (
    hash_password,
    verify_password,
    create_access_token,
)


# Register a new user
def register_user_service(
    user: UserCreate,
    db: Session,
):
    full_name = user.full_name.strip()
    email = user.email.strip().lower()

    # Validate full name
    if len(full_name) < 2:
        raise HTTPException(
            status_code=422,
            detail="Full name must contain at least 2 characters",
        )

    # Validate email
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

    # Check whether email already exists
    existing_user = db.scalar(
        select(User).where(User.email == email)
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=409,
            detail="Email already registered",
        )

    # Hash password before storing
    hashed_password = hash_password(user.password)

    # Create new user
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


# Authenticate an existing user
def login_user_service(
    user: UserLogin,
    db: Session,
):
    email = user.email.strip().lower()

    existing_user = db.scalar(
        select(User).where(User.email == email)
    )

    if existing_user is None or not verify_password(
        user.password,
        existing_user.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    token = create_access_token(existing_user.id)

    return {
        "access_token": token,
        "token_type": "bearer",
    }
