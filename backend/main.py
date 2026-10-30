
from pathlib import Path

from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    Response,
    status,
)
from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials,
)
from fastapi.staticfiles import StaticFiles

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session


# Support both local development and Vercel deployment
try:
    from backend.database import get_session_factory
    from backend.models import Listing, User
    from backend.schemas import (
        ListingCreate,
        ListingUpdate,
        ListingResponse,
        UserCreate,
        UserResponse,
        UserLogin,
    )
    from backend.security import (
        hash_password,
        verify_password,
        create_access_token,
        decode_access_token,
    )

except ModuleNotFoundError as error:
    if error.name != "backend":
        raise

    from database import get_session_factory
    from models import Listing, User
    from schemas import (
        ListingCreate,
        ListingUpdate,
        ListingResponse,
        UserCreate,
        UserResponse,
        UserLogin,
    )
    from security import (
        hash_password,
        verify_password,
        create_access_token,
        decode_access_token,
    )


app = FastAPI(
    title="WarmShare API",
    description="REST API documentation for WarmShare Donation Management MVP",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)


# ========================================
# HEALTH CHECK
# ========================================

@app.get("/api/health")
def health():
    return {"status": "ok"}


# ========================================
# HELLO API
# ========================================

@app.get("/api/hello")
def hello(name: str = "World"):
    return {"message": f"Hello, {name}!"}


# ========================================
# DATABASE SESSION
# ========================================

def get_db():
    SessionLocal = get_session_factory()
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# ========================================
# USER REGISTRATION
# ========================================

@app.post(
    "/api/auth/register",
    response_model=UserResponse,
    status_code=201,
)
def register_user(
    user: UserCreate,
    db: Session = Depends(get_db),
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


# ========================================
# USER LOGIN
# ========================================

@app.post("/api/auth/login")
def login_user(
    user: UserLogin,
    db: Session = Depends(get_db),
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


# ========================================
# JWT AUTHENTICATION
# ========================================

bearer_scheme = HTTPBearer(auto_error=False)


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

    # Verify the authentication scheme
    if credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication scheme",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Decode and verify JWT
    user_id = decode_access_token(
        credentials.credentials
    )

    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Find authenticated user
    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


# ========================================
# GET LOGGED-IN USER PROFILE
# ========================================

@app.get(
    "/api/auth/me",
    response_model=UserResponse,
)
def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user


# ========================================
# DONATION OWNERSHIP VERIFICATION
# ========================================

def verify_listing_owner(
    listing: Listing,
    current_user: User,
):
    """
    Only the user who created a donation
    can update or delete that donation.
    """

    # Existing donations may not have an owner
    if listing.owner_id is None:
        raise HTTPException(
            status_code=403,
            detail=(
                "This donation has no assigned owner "
                "and cannot be modified."
            ),
        )

    # Reject users who do not own the donation
    if listing.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail=(
                "You do not have permission "
                "to modify this donation."
            ),
        )


# ========================================
# 1. CREATE DONATION
# Authentication required
# ========================================

@app.post(
    "/api/listings",
    response_model=ListingResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_listing(
    listing: ListingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Create donation and assign its owner
    new_listing = Listing(
        **listing.model_dump(),
        owner_id=current_user.id,
    )

    db.add(new_listing)
    db.commit()
    db.refresh(new_listing)

    return new_listing


# ========================================
# 2. READ ALL DONATIONS
# Public access
# ========================================

@app.get(
    "/api/listings",
    response_model=list[ListingResponse],
)
def get_all_listings(
    db: Session = Depends(get_db),
):
    statement = select(Listing).order_by(
        Listing.id.desc()
    )

    listings = db.scalars(statement).all()

    return listings


# ========================================
# 3. READ SINGLE DONATION
# Public access
# ========================================

@app.get(
    "/api/listings/{listing_id}",
    response_model=ListingResponse,
)
def get_single_listing(
    listing_id: int,
    db: Session = Depends(get_db),
):
    listing = db.get(Listing, listing_id)

    if listing is None:
        raise HTTPException(
            status_code=404,
            detail="Listing not found",
        )

    return listing


# ========================================
# 4. UPDATE DONATION
# Owner only
# ========================================

@app.put(
    "/api/listings/{listing_id}",
    response_model=ListingResponse,
)
def update_listing(
    listing_id: int,
    updated_data: ListingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    listing = db.get(Listing, listing_id)

    if listing is None:
        raise HTTPException(
            status_code=404,
            detail="Listing not found",
        )

    # Check ownership before updating
    verify_listing_owner(
        listing,
        current_user,
    )

    # Update only permitted listing fields
    editable_fields = {
        "title",
        "category",
        "size",
        "age_group",
        "gender",
        "condition",
        "quantity",
        "pickup_address",
    }

    changes = updated_data.model_dump(
        exclude_unset=True
    )

    for field, value in changes.items():
        if field in editable_fields:
            setattr(listing, field, value)

    db.commit()
    db.refresh(listing)

    return listing


# ========================================
# 5. DELETE DONATION
# Owner only
# ========================================

@app.delete(
    "/api/listings/{listing_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    listing = db.get(Listing, listing_id)

    if listing is None:
        raise HTTPException(
            status_code=404,
            detail="Listing not found",
        )

    # Check ownership before deleting
    verify_listing_owner(
        listing,
        current_user,
    )

    db.delete(listing)
    db.commit()

    return Response(
        status_code=status.HTTP_204_NO_CONTENT
    )


# ========================================
# SERVE BUILT REACT FRONTEND
# ========================================

FRONTEND_DIR = (
    Path(__file__).resolve().parent.parent
    / "frontend"
    / "dist"
)

if FRONTEND_DIR.is_dir():
    app.mount(
        "/",
        StaticFiles(
            directory=FRONTEND_DIR,
            html=True,
        ),
        name="frontend",
    )
