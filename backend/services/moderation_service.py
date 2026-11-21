
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

try:
    from backend.models import Listing, ListingReport, AuditLog, User
except ModuleNotFoundError as error:
    if error.name != "backend":
        raise

    from models import Listing, ListingReport, AuditLog, User


def create_listing_report_service(
    listing_id: int,
    report_data,
    db: Session,
    current_user: User,
):
    listing = db.query(Listing).filter(
        Listing.id == listing_id
    ).first()

    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found.",
        )

    if listing.owner_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot report your own donation.",
        )

    existing_report = db.query(ListingReport).filter(
        ListingReport.listing_id == listing_id,
        ListingReport.reporter_id == current_user.id,
        ListingReport.status == "pending",
    ).first()

    if existing_report:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have a pending report for this donation.",
        )

    report = ListingReport(
        listing_id=listing_id,
        reporter_id=current_user.id,
        reason=report_data.reason,
        details=report_data.details,
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    return report


def get_moderation_reports_service(db: Session):
    return (
        db.query(ListingReport)
        .filter(ListingReport.status == "pending")
        .order_by(ListingReport.created_at.desc())
        .all()
    )


def moderate_listing_service(
    listing_id: int,
    moderation_data,
    db: Session,
    current_user: User,
):
    listing = db.query(Listing).filter(
        Listing.id == listing_id
    ).first()

    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found.",
        )

    if listing.moderation_status == moderation_data.status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Donation already has this moderation status.",
        )

    old_status = listing.moderation_status

    listing.moderation_status = moderation_data.status
    listing.moderation_reason = moderation_data.reason
    listing.moderated_at = datetime.now(timezone.utc)
    listing.moderated_by = current_user.id

    audit = AuditLog(
        actor_id=current_user.id,
        action="listing_moderation",
        target_type="listing",
        target_id=str(listing.id),
        details={
            "previous_status": old_status,
            "new_status": moderation_data.status,
            "reason": moderation_data.reason,
        },
    )

    db.add(audit)
    db.commit()
    db.refresh(listing)

    return listing


def review_listing_report_service(
    report_id: int,
    review_data,
    db: Session,
    current_user: User,
):
    report = db.query(ListingReport).filter(
        ListingReport.id == report_id
    ).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found.",
        )

    if report.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This report has already been reviewed.",
        )

    report.status = review_data.status
    report.reviewed_by = current_user.id
    report.reviewed_at = datetime.now(timezone.utc)
    report.resolution_note = review_data.resolution_note

    audit = AuditLog(
        actor_id=current_user.id,
        action="listing_report_review",
        target_type="listing_report",
        target_id=str(report.id),
        details={
            "listing_id": report.listing_id,
            "new_status": review_data.status,
            "resolution_note": review_data.resolution_note,
        },
    )

    db.add(audit)
    db.commit()
    db.refresh(report)

    return report
