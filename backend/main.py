
from pathlib import Path

from fastapi import FastAPI, Depends, HTTPException, Response
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.database import get_session_factory
from backend.models import Listing
from backend.schemas import (
    ListingCreate,
    ListingUpdate,
    ListingResponse,
)


app = FastAPI(title="WarmShare API")


# HEALTH CHECK
@app.get("/api/health")
def health():
    return {"status": "ok"}


# HELLO API
@app.get("/api/hello")
def hello(name: str = "World"):
    return {"message": f"Hello, {name}!"}


# DATABASE SESSION
def get_db():
    SessionLocal = get_session_factory()
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# 1. CREATE: Add a donation listing
@app.post(
    "/api/listings",
    response_model=ListingResponse,
    status_code=201
)
def create_listing(
    listing: ListingCreate,
    db: Session = Depends(get_db)
):
    new_listing = Listing(**listing.model_dump())

    db.add(new_listing)
    db.commit()
    db.refresh(new_listing)

    return new_listing


# 2. READ LIST: Get all donation listings
@app.get(
    "/api/listings",
    response_model=list[ListingResponse]
)
def get_all_listings(db: Session = Depends(get_db)):
    statement = select(Listing).order_by(Listing.id.desc())
    listings = db.scalars(statement).all()

    return listings


# 3. READ SINGLE: Get a listing by ID
@app.get(
    "/api/listings/{listing_id}",
    response_model=ListingResponse
)
def get_single_listing(
    listing_id: int,
    db: Session = Depends(get_db)
):
    listing = db.get(Listing, listing_id)

    if listing is None:
        raise HTTPException(
            status_code=404,
            detail="Listing not found"
        )

    return listing


# 4. UPDATE: Edit an existing donation listing
@app.put(
    "/api/listings/{listing_id}",
    response_model=ListingResponse
)
def update_listing(
    listing_id: int,
    updated_data: ListingUpdate,
    db: Session = Depends(get_db)
):
    listing = db.get(Listing, listing_id)

    if listing is None:
        raise HTTPException(
            status_code=404,
            detail="Listing not found"
        )

    # Update all editable fields
    for field, value in updated_data.model_dump().items():
        setattr(listing, field, value)

    db.commit()
    db.refresh(listing)

    return listing


# 5. DELETE: Remove a donation listing
@app.delete(
    "/api/listings/{listing_id}",
    status_code=204
)
def delete_listing(
    listing_id: int,
    db: Session = Depends(get_db)
):
    listing = db.get(Listing, listing_id)

    if listing is None:
        raise HTTPException(
            status_code=404,
            detail="Listing not found"
        )

    db.delete(listing)
    db.commit()

    return Response(status_code=204)


# SERVE BUILT REACT FRONTEND
FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend" / "dist"

if FRONTEND_DIR.is_dir():
    app.mount(
        "/",
        StaticFiles(directory=FRONTEND_DIR, html=True),
        name="frontend"
    )
