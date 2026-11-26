from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

# Support both local development and Vercel deployment.
try:
    from backend.dependencies import get_db, get_current_user
    from backend.models import User

    from backend.schemas import (
        ListingCreate,
        ListingUpdate,
        ListingResponse,
        ModeratorListingResponse,
        ListingReportCreate,
        ListingReportResponse,
        ListingModerationUpdate,
        ReportReviewUpdate,
    )

    from backend.services.listing_service import (
        create_listing_service,
        get_all_listings_service,
        get_all_moderation_listings_service,
        get_single_listing_service,
        update_listing_service,
        delete_listing_service,
    )

    from backend.services.moderation_service import (
        create_listing_report_service,
        get_moderation_reports_service,
        get_moderation_report_history_service,
        moderate_listing_service,
        review_listing_report_service,
    )

    from backend.permissions import (
        PERMISSION_CREATE_LISTING,
        PERMISSION_UPDATE_OWN_LISTING,
        PERMISSION_DELETE_OWN_LISTING,
        PERMISSION_MODERATE_CONTENT,
    )

    from backend.rbac import require_permission

except ModuleNotFoundError as error:
    if error.name != "backend":
        raise

    from dependencies import get_db, get_current_user
    from models import User

    from schemas import (
        ListingCreate,
        ListingUpdate,
        ListingResponse,
        ModeratorListingResponse,
        ListingReportCreate,
        ListingReportResponse,
        ListingModerationUpdate,
        ReportReviewUpdate,
    )

    from services.listing_service import (
        create_listing_service,
        get_all_listings_service,
        get_all_moderation_listings_service,
        get_single_listing_service,
        update_listing_service,
        delete_listing_service,
    )

    from services.moderation_service import (
        create_listing_report_service,
        get_moderation_reports_service,
        get_moderation_report_history_service,
        moderate_listing_service,
        review_listing_report_service,
    )

    from permissions import (
        PERMISSION_CREATE_LISTING,
        PERMISSION_UPDATE_OWN_LISTING,
        PERMISSION_DELETE_OWN_LISTING,
        PERMISSION_MODERATE_CONTENT,
    )

    from rbac import require_permission


router = APIRouter(
    prefix="/api/listings",
    tags=["Listings"],
)


# ========================================
# EXISTING DONATION CRUD ENDPOINTS
# ========================================

# 1. Create donation.
@router.post(
    "",
    response_model=ListingResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_listing(
    listing: ListingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission(PERMISSION_CREATE_LISTING)
    ),
):
    return create_listing_service(
        listing,
        db,
        current_user,
    )


# 2. Read all visible donations.
@router.get(
    "",
    response_model=list[ListingResponse],
)
def get_all_listings(
    db: Session = Depends(get_db),
):
    return get_all_listings_service(db)


# ========================================
# MODERATOR DONATION MANAGEMENT
# ========================================

# 3. Get all donations, including hidden ones.
# Accessible only to Moderators and Admins.
@router.get(
    "/moderation/listings",
    response_model=list[ModeratorListingResponse],
)
def get_all_moderation_listings(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission(PERMISSION_MODERATE_CONTENT)
    ),
):
    return get_all_moderation_listings_service(db)


# 4. Read one visible donation.
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


# 5. Update donation.
@router.put(
    "/{listing_id}",
    response_model=ListingResponse,
)
def update_listing(
    listing_id: int,
    updated_data: ListingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission(PERMISSION_UPDATE_OWN_LISTING)
    ),
):
    return update_listing_service(
        listing_id,
        updated_data,
        db,
        current_user,
    )


# 6. Delete donation.
@router.delete(
    "/{listing_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission(PERMISSION_DELETE_OWN_LISTING)
    ),
):
    delete_listing_service(
        listing_id,
        db,
        current_user,
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT
    )


# ========================================
# REPORTING AND MODERATION ENDPOINTS
# ========================================

# 7. Submit a donation report.
@router.post(
    "/{listing_id}/reports",
    response_model=ListingReportResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_listing_report(
    listing_id: int,
    report_data: ListingReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_listing_report_service(
        listing_id,
        report_data,
        db,
        current_user,
    )


# 8. View pending reports.
# Accessible to Moderators and Admins.
@router.get(
    "/moderation/reports",
    response_model=list[ListingReportResponse],
)
def get_moderation_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission(PERMISSION_MODERATE_CONTENT)
    ),
):
    return get_moderation_reports_service(db)


# ========================================
# MODERATION REPORT HISTORY
# ========================================

# 9. View resolved and dismissed reports.
# Accessible to Moderators and Admins.
@router.get(
    "/moderation/reports/history",
    response_model=list[ListingReportResponse],
)
def get_moderation_report_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission(PERMISSION_MODERATE_CONTENT)
    ),
):
    return get_moderation_report_history_service(db)


# 10. Hide or restore a donation.
# Accessible to Moderators and Admins.
@router.patch(
    "/{listing_id}/moderation",
    response_model=ListingResponse,
)
def moderate_listing(
    listing_id: int,
    moderation_data: ListingModerationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission(PERMISSION_MODERATE_CONTENT)
    ),
):
    return moderate_listing_service(
        listing_id,
        moderation_data,
        db,
        current_user,
    )


# 11. Resolve or dismiss a report.
# Accessible to Moderators and Admins.
@router.patch(
    "/moderation/reports/{report_id}",
    response_model=ListingReportResponse,
)
def review_listing_report(
    report_id: int,
    review_data: ReportReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_permission(PERMISSION_MODERATE_CONTENT)
    ),
):
    return review_listing_report_service(
        report_id,
        review_data,
        db,
        current_user,
    )