
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

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

    # User who created the donation
    # Nullable to preserve existing donations
    owner_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Date and time when the listing was created
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationship to the registered user
    owner: Mapped["User | None"] = relationship(
        "User",
        back_populates="listings",
    )


# Database model for registered WarmShare users
class User(Base):
    __tablename__ = "users"

    # Unique ID for each user
    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    # User's full name
    full_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    # Email used for login
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )

    # Store hashed passwords, never plaintext passwords
    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    # Default account role
    role: Mapped[str] = mapped_column(
        String(20),
        default="user",
        nullable=False,
    )

    # Account creation timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Donations created by this user
    listings: Mapped[list["Listing"]] = relationship(
        "Listing",
        back_populates="owner",
        passive_deletes=True,
    )
