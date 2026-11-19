
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.dependencies import get_db, get_current_user
from backend.models import User
from backend.schemas import (
    UserCreate,
    UserResponse,
    UserLogin,
)
from backend.services.auth_service import (
    register_user_service,
    login_user_service,
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


# User registration
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


# User login
@router.post("/login")
def login_user(
    user: UserLogin,
    db: Session = Depends(get_db),
):
    return login_user_service(user, db)


# Get logged-in user profile
@router.get(
    "/me",
    response_model=UserResponse,
)
def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user
