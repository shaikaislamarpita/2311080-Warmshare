
from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

# Support both local development and Vercel deployment
try:
    from backend.dependencies import get_db, get_current_user
    from backend.models import User
    from backend.schemas import (
        ListingCreate,
        ListingUpdate,
        ListingResponse,
    )
    from backend.services.listing_service import (
        create_listing_service,
        get_all_listings_service,
        get_single_listing_service,
        update_listing_service,
        delete_listing_service,
    )
except ModuleNotFoundError as error:
    if error.name != "backend":
        raise

    from dependencies import get_db, get_current_user
    from models import User
    from schemas import (
        ListingCreate,
        ListingUpdate,
        ListingResponse,
    )
    from services.listing_service import (
        create_listing_service,
        get_all_listings_service,
        get_single_listing_service,
        update_listing_service,
        delete_listing_service,
    )


router = APIRouter(
    prefix="/api/listings",
    tags=["Listings"],
)


# 1. Create donation
@router.post(
    "",
    response_model=ListingResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_listing(
    listing: ListingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_listing_service(
        listing,
        db,
        current_user,
    )


# 2. Read all donations
@router.get(
    "",
    response_model=list[ListingResponse],
)
def get_all_listings(
    db: Session = Depends(get_db),
):
    return get_all_listings_service(db)


# 3. Read single donation
@router.get(
    "/{listing_id}",
    response_model=ListingResponse,
)
def get_single_listing(
    listing_id: int,
    db: Session = Depends(get_db),
):
    return get_single_listing_service(
        listing_id,
        db,
    )


# 4. Update donation
@router.put(
    "/{listing_id}",
    response_model=ListingResponse,
)
def update_listing(
    listing_id: int,
    updated_data: ListingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_listing_service(
        listing_id,
        updated_data,
        db,
        current_user,
    )


# 5. Delete donation
@router.delete(
    "/{listing_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    delete_listing_service(
        listing_id,
        db,
        current_user,
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT
    )
