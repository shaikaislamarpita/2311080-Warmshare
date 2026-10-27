
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

    # ID of the user who created the donation.
    # None for donations created before
    # ownership was introduced.
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
