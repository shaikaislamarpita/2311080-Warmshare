
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
