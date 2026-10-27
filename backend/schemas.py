
from pydantic import BaseModel, Field, ConfigDict
from typing import Literal


Category = Literal["jacket", "sweater", "blanket", "shawl", "socks"]
Condition = Literal["like_new", "good", "worn"]


class ListingCreate(BaseModel):
    title: str = Field(min_length=3, max_length=150)
    category: Category
    size: str = Field(max_length=30)
    age_group: Literal["child", "adult"]
    gender: Literal["male", "female", "unisex"]
    condition: Condition
    quantity: int = Field(gt=0)
    pickup_address: str = Field(min_length=5, max_length=255)


class ListingUpdate(ListingCreate):
    pass


class ListingResponse(ListingCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)

# Schema for registering a new user
class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)


# Schema for returning user information safely
class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str

    model_config = ConfigDict(from_attributes=True)
# Schema for login
class UserLogin(BaseModel):
    email: str = Field(min_length=5,max_length=255)
    password: str