
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, ConfigDict


# ========================================
# DONATION FIELD OPTIONS
# ========================================

Category = Literal[
    "jacket",
    "sweater",
    "blanket",
    "shawl",
    "socks",
]

Condition = Literal[
    "like_new",
    "good",
    "worn",
]


# ========================================
# CREATE DONATION SCHEMA
# ========================================

class ListingCreate(BaseModel):
    title: str = Field(
        min_length=3,
        max_length=150,
    )

    category: Category

    size: str = Field(
        max_length=30,
    )

    age_group: Literal[
        "child",
        "adult",
    ]

    gender: Literal[
        "male",
        "female",
        "unisex",
    ]

    condition: Condition

    quantity: int = Field(
        gt=0,
    )

    pickup_address: str = Field(
        min_length=5,
        max_length=255,
    )


# ========================================
# UPDATE DONATION SCHEMA
# ========================================

class ListingUpdate(ListingCreate):
    pass


# ========================================
# DONATION RESPONSE SCHEMA
# ========================================

class ListingResponse(ListingCreate):
    id: int

    # None for donations created before ownership
    # was introduced.
    owner_id: int | None = None

    model_config = ConfigDict(
        from_attributes=True,
    )


# ========================================
# USER REGISTRATION SCHEMA
# ========================================

class UserCreate(BaseModel):
    full_name: str = Field(
        min_length=2,
        max_length=100,
    )

    email: str = Field(
        min_length=5,
        max_length=255,
    )

    password: str = Field(
        min_length=8,
        max_length=128,
    )


# ========================================
# USER RESPONSE SCHEMA
# ========================================

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str

    model_config = ConfigDict(
        from_attributes=True,
    )


# ========================================
# USER LOGIN SCHEMA
# ========================================

class UserLogin(BaseModel):
    email: str = Field(
        min_length=5,
        max_length=255,
    )

    password: str


# ========================================
# USER SESSION RESPONSE SCHEMA
# ========================================

class UserSessionResponse(BaseModel):
    id: str
    created_at: datetime
    last_used_at: datetime
    expires_at: datetime
    user_agent: str | None = None
    ip_address: str | None = None

    model_config = ConfigDict(
        from_attributes=True,
    )


# ========================================
# CREATE LISTING REPORT SCHEMA
# ========================================

class ListingReportCreate(BaseModel):
    reason: Literal[
        "inappropriate",
        "misleading",
        "duplicate",
        "incorrect_category",
        "other",
    ]

    details: str | None = Field(
        default=None,
        max_length=1000,
    )


# ========================================
# LISTING REPORT RESPONSE SCHEMA
# ========================================

class ListingReportResponse(BaseModel):
    id: int
    listing_id: int
    reporter_id: int
    reason: str
    details: str | None
    status: str
    reviewed_by: int | None
    reviewed_at: datetime | None
    resolution_note: str | None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


# ========================================
# LISTING MODERATION SCHEMA
# ========================================

class ListingModerationUpdate(BaseModel):
    status: Literal[
        "visible",
        "hidden",
    ]

    reason: str = Field(
        min_length=3,
        max_length=500,
    )


# ========================================
# REPORT REVIEW SCHEMA
# ========================================

class ReportReviewUpdate(BaseModel):
    status: Literal[
        "resolved",
        "dismissed",
    ]

    resolution_note: str | None = Field(
        default=None,
        max_length=1000,
    )

# ========================================
# ADMIN USER MANAGEMENT SCHEMAS
# ========================================

class AdminUserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    is_banned: bool
    ban_reason: str | None = None
    banned_at: datetime | None = None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class AdminRoleUpdate(BaseModel):
    role: Literal[
        "user",
        "moderator",
    ]


class AdminBanUpdate(BaseModel):
    is_banned: bool
    reason: str | None = Field(
        default=None,
        max_length=500,
    )

class AdminDashboardStats(BaseModel):
    total_users: int
    total_donors: int
    total_moderators: int
    total_banned_users: int
    total_listings: int
    visible_listings: int
    hidden_listings: int
    pending_reports: int
    active_sessions: int

class AuditLogResponse(BaseModel):
    id: int
    actor_id: int | None = None
    action: str
    target_type: str
    target_id: str | None = None
    details: dict | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class FailedLoginAttemptResponse(BaseModel):
    identifier_reference: str
    failed_attempts: int
    blocked_until: datetime | None = None
    updated_at: datetime
    is_blocked: bool
