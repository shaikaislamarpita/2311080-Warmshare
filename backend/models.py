
from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

# Support both local development and Vercel deployment
try:
    from backend.database import Base
except ModuleNotFoundError as error:
    if error.name != "backend":
        raise

    from database import Base


# Database model for donation listings
class Listing(Base):
    __tablename__ = "listings"

    # Unique ID for each donation
    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    # Donation title
    title: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    # Clothing category
    category: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    # Clothing size
    size: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )

    # Age group
    age_group: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    # Gender
    gender: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    # Clothing condition
    condition: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    # Number of donated items
    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    # Address where donation can be collected
    pickup_address: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    # Date and time when the listing was created
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
