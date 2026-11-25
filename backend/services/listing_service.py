
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

# Support local development and Vercel deployment.
try:
    from backend.models import Listing, User
    from backend.schemas import ListingCreate, ListingUpdate
    from backend.services.group_service import (
        get_group_or_404,
        verify_group_permission,
    )
except ModuleNotFoundError as error:
    if error.name != "backend":
        raise

    from models import Listing, User
    from schemas import ListingCreate, ListingUpdate
    from services.group_service import (
        get_group_or_404,
        verify_group_permission,
    )


# ========================================
# VERIFY LISTING OWNER
# ========================================

def verify_listing_owner(
    listing: Listing,
    current_user: User,
):
    """
    Check ownership of a donation.

    This is required for personal donations,
    deletion, and changing group assignments.
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


# ========================================
# VERIFY GROUP LISTING PERMISSION
# ========================================

def verify_listing_edit_permission(
    listing: Listing,
    db: Session,
    current_user: User,
):
    """
    Personal donation:
        Only the listing owner can edit.

    Group donation:
        The group owner or a member with
        can_edit permission can edit.
    """

    if listing.group_id is None:
        verify_listing_owner(
            listing,
            current_user,
        )
        return

    group = get_group_or_404(
        listing.group_id,
        db,
    )

    verify_group_permission(
        group,
        current_user,
        db,
        "can_edit",
    )


# ========================================
# CREATE DONATION
# ========================================

def create_listing_service(
    listing: ListingCreate,
    db: Session,
    current_user: User,
):
    """
    Personal donations work as before.

    Creating a donation directly inside a
    group requires can_create permission.
    """

    if listing.group_id is not None:
        group = get_group_or_404(
            listing.group_id,
            db,
        )

        verify_group_permission(
            group,
            current_user,
            db,
            "can_create",
        )

    new_listing = Listing(
        **listing.model_dump(),
        owner_id=current_user.id,
    )

    db.add(new_listing)
    db.commit()
    db.refresh(new_listing)

    return new_listing


# ========================================
# GET ALL VISIBLE DONATIONS
# ========================================

def get_all_listings_service(
    db: Session,
):
    statement = (
        select(Listing)
        .where(
            Listing.moderation_status == "visible"
        )
        .order_by(Listing.id.desc())
    )

    return db.scalars(statement).all()


# ========================================
# GET ONE VISIBLE DONATION
# ========================================

def get_single_listing_service(
    listing_id: int,
    db: Session,
):
    statement = select(Listing).where(
        Listing.id == listing_id,
        Listing.moderation_status == "visible",
    )

    listing = db.scalars(statement).first()

    if listing is None:
        raise HTTPException(
            status_code=404,
            detail="Listing not found",
        )

    return listing


# ========================================
# UPDATE DONATION
# ========================================

def update_listing_service(
    listing_id: int,
    updated_data: ListingUpdate,
    db: Session,
    current_user: User,
):
    listing = db.get(
        Listing,
        listing_id,
    )

    if listing is None:
        raise HTTPException(
            status_code=404,
            detail="Listing not found",
        )

    changes = updated_data.model_dump(
        exclude_unset=True,
    )

    # First check permission to edit
    # the existing donation.
    verify_listing_edit_permission(
        listing,
        db,
        current_user,
    )

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

    # ====================================
    # GROUP ASSIGNMENT PERMISSION
    # ====================================

    if "group_id" in changes:
        new_group_id = changes["group_id"]
        old_group_id = listing.group_id

        if new_group_id != old_group_id:
            # Changing a donation's group is
            # more sensitive than editing its
            # description or quantity.
            #
            # Only the listing owner may
            # change its group assignment.
            verify_listing_owner(
                listing,
                current_user,
            )

            # Leaving or transferring from
            # an existing group requires
            # can_assign in that group.
            if old_group_id is not None:
                old_group = get_group_or_404(
                    old_group_id,
                    db,
                )

                verify_group_permission(
                    old_group,
                    current_user,
                    db,
                    "can_assign",
                )

            # Joining or transferring to
            # another group requires
            # can_assign in the target group.
            if new_group_id is not None:
                new_group = get_group_or_404(
                    new_group_id,
                    db,
                )

                verify_group_permission(
                    new_group,
                    current_user,
                    db,
                    "can_assign",
                )

            listing.group_id = new_group_id

    # Update ordinary donation fields.
    for field, value in changes.items():
        if field in editable_fields:
            setattr(
                listing,
                field,
                value,
            )

    db.commit()
    db.refresh(listing)

    return listing


# ========================================
# DELETE DONATION
# ========================================

def delete_listing_service(
    listing_id: int,
    db: Session,
    current_user: User,
):
    listing = db.get(
        Listing,
        listing_id,
    )

    if listing is None:
        raise HTTPException(
            status_code=404,
            detail="Listing not found",
        )

    # Preserve the original rule:
    # only the donation owner may delete it.
    verify_listing_owner(
        listing,
        current_user,
    )

    db.delete(listing)
    db.commit()

# ========================================
# GET ALL DONATIONS FOR MODERATION
# ========================================

def get_all_moderation_listings_service(
    db: Session,
):
    """
    Return all donations, including hidden ones.

    This function is only called by the protected
    moderator/admin endpoint.
    """

    statement = (
        select(Listing)
        .order_by(Listing.id.desc())
    )

    return db.scalars(statement).all()
