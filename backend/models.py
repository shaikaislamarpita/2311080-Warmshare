
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    text,
)
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

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    category: Mapped[str] = mapped_column(String(30), nullable=False)
    size: Mapped[str] = mapped_column(String(30), nullable=False)
    age_group: Mapped[str] = mapped_column(String(20), nullable=False)
    gender: Mapped[str] = mapped_column(String(20), nullable=False)
    condition: Mapped[str] = mapped_column(String(20), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    pickup_address: Mapped[str] = mapped_column(String(255), nullable=False)

    owner_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    owner: Mapped["User | None"] = relationship(
        "User",
        back_populates="listings",
    )


# Database model for registered accounts
class User(Base):
    __tablename__ = "users"

    __table_args__ = (
        CheckConstraint(
            "role IN ('user', 'moderator', 'admin')",
            name="ck_users_valid_role",
        ),
        Index(
            "uq_users_single_admin",
            "role",
            unique=True,
            postgresql_where=text("role = 'admin'"),
        ),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    full_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    role: Mapped[str] = mapped_column(
        String(20),
        default="user",
        nullable=False,
    )

    is_banned: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default=text("false"),
        nullable=False,
    )

    ban_reason: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    banned_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
    )

    listings: Mapped[list["Listing"]] = relationship(
        "Listing",
        back_populates="owner",
        passive_deletes=True,
    )
