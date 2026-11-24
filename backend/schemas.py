
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, ConfigDict, model_validator


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

    # Optional: None means a personal donation.
    # A group donation requires backend permission checks.
    group_id: int | None = Field(
        default=None,
        gt=0,
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
# USER PROFILE UPDATE SCHEMA
# ISSUE #31
# ========================================

class UserProfileUpdate(BaseModel):
    full_name: str = Field(
        min_length=2,
        max_length=100,
    )

    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )


# ========================================
# PASSWORD CHANGE SCHEMA
# ISSUE #31
# ========================================

class PasswordChangeRequest(BaseModel):
    current_password: str = Field(
        min_length=1,
    )

    new_password: str = Field(
        min_length=8,
        max_length=128,
    )

    confirm_password: str = Field(
        min_length=1,
    )

    model_config = ConfigDict(
        extra="forbid",
    )

    @model_validator(mode="after")
    def validate_password_change(self):
        if self.new_password != self.confirm_password:
            raise ValueError(
                "New password and confirmation do not match."
            )

        if self.current_password == self.new_password:
            raise ValueError(
                "New password must be different from current password."
            )

        return self


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

    model_config = ConfigDict(
        from_attributes=True,
    )


class FailedLoginAttemptResponse(BaseModel):
    identifier_reference: str
    failed_attempts: int
    blocked_until: datetime | None = None
    updated_at: datetime
    is_blocked: bool


# ========================================
# SHARED GROUP SCHEMAS
# ISSUE #33
# ========================================

class GroupCreate(BaseModel):
    name: str = Field(
        min_length=3,
        max_length=150,
    )

    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )


class GroupUpdate(BaseModel):
    name: str = Field(
        min_length=3,
        max_length=150,
    )

    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
    )


class GroupMemberCreate(BaseModel):
    user_id: int = Field(
        gt=0,
    )

    can_create: bool = False
    can_edit: bool = False
    can_assign: bool = False

    model_config = ConfigDict(
        extra="forbid",
    )


class GroupMemberPermissionUpdate(BaseModel):
    can_create: bool
    can_edit: bool
    can_assign: bool

    model_config = ConfigDict(
        extra="forbid",
    )


class GroupMemberResponse(BaseModel):
    id: int
    group_id: int
    user_id: int
    can_create: bool
    can_edit: bool
    can_assign: bool
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class GroupResponse(BaseModel):
    id: int
    name: str
    owner_id: int
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class GroupDetailResponse(GroupResponse):
    members: list[GroupMemberResponse] = Field(
        default_factory=list,
    )

    listings: list[ListingResponse] = Field(
        default_factory=list,
    )


# ========================================
# ADMIN BULK USER MANAGEMENT
# ISSUE #33
# ========================================

class AdminBulkBanUpdate(BaseModel):
    user_ids: list[int] = Field(
        min_length=1,
        max_length=100,
    )

    is_banned: bool

    reason: str | None = Field(
        default=None,
        max_length=500,
    )

    model_config = ConfigDict(
        extra="forbid",
    )

    @model_validator(mode="after")
    def validate_bulk_ban(self):
        if len(set(self.user_ids)) != len(self.user_ids):
            raise ValueError(
                "Duplicate user IDs are not allowed."
            )

        if any(user_id <= 0 for user_id in self.user_ids):
            raise ValueError(
                "Every user ID must be positive."
            )

        if self.is_banned and (
            not self.reason or not self.reason.strip()
        ):
            raise ValueError(
                "A reason is required when banning users."
            )

        return self


class AdminBulkBanResult(BaseModel):
    requested_count: int
    updated_count: int
    skipped_count: int
    skipped_user_ids: list[int] = Field(
        default_factory=list,
    )


# ========================================
# ADMIN USER DETAIL AND PAGINATION
# ISSUE #33
# ========================================

class AdminUserDetailResponse(AdminUserResponse):
    listings: list[ListingResponse] = Field(
        default_factory=list,
    )

    owned_groups: list[GroupResponse] = Field(
        default_factory=list,
    )

    group_memberships: list[GroupMemberResponse] = Field(
        default_factory=list,
    )

    sessions: list[UserSessionResponse] = Field(
        default_factory=list,
    )

    recent_activity: list[AuditLogResponse] = Field(
        default_factory=list,
    )


class AdminUserPageResponse(BaseModel):
    items: list[AdminUserResponse]
    total: int = Field(
        ge=0,
    )
    page: int = Field(
        ge=1,
    )
    page_size: int = Field(
        ge=1,
    )
    total_pages: int = Field(
        ge=0,
    )
