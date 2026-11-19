
from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import HTTPException

# Support both local development and Vercel deployment
try:
    from backend.models import Listing, User
    from backend.schemas import ListingCreate, ListingUpdate
except ModuleNotFoundError as error:
    if error.name != "backend":
        raise

    from models import Listing, User
    from schemas import ListingCreate, ListingUpdate


# Verify donation ownership
def verify_listing_owner(
    listing: Listing,
    current_user: User,
):
    """
    Only the user who created a donation
    can update or delete that donation.
    """

    if listing.owner_id is None:
        raise HTTPException(
            status_code=403,
            detail=(
                "This donation has no assigned owner "
                "and cannot be modified."
            ),
        )

    if listing.owner_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail=(
                "You do not have permission "
                "to modify this donation."
            ),
        )


# Create a new donation
def create_listing_service(
    listing: ListingCreate,
    db: Session,
    current_user: User,
):
    new_listing = Listing(
        **listing.model_dump(),
        owner_id=current_user.id,
    )

    db.add(new_listing)
    db.commit()
    db.refresh(new_listing)

    return new_listing


# Get all donations
def get_all_listings_service(
    db: Session,
):
    statement = select(Listing).order_by(
        Listing.id.desc()
    )

    listings = db.scalars(statement).all()

    return listings


# Get one donation
def get_single_listing_service(
    listing_id: int,
    db: Session,
):
    listing = db.get(Listing, listing_id)

    if listing is None:
        raise HTTPException(
            status_code=404,
            detail="Listing not found",
        )

    return listing


# Update an existing donation
def update_listing_service(
    listing_id: int,
    updated_data: ListingUpdate,
    db: Session,
    current_user: User,
):
    listing = db.get(Listing, listing_id)

    if listing is None:
        raise HTTPException(
            status_code=404,
            detail="Listing not found",
        )

    verify_listing_owner(listing, current_user)

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


# Delete an existing donation
def delete_listing_service(
    listing_id: int,
    db: Session,
    current_user: User,
):
    listing = db.get(Listing, listing_id)

    if listing is None:
        raise HTTPException(
            status_code=404,
            detail="Listing not found",
        )

    verify_listing_owner(listing, current_user)

    db.delete(listing)
    db.commit()
