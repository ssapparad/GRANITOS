from decimal import Decimal

from pydantic import BaseModel, Field


# ==========================================
# Create Lot
# ==========================================

class LotCreate(BaseModel):
    granite_id: int

    lot_number: str = Field(
        min_length=1,
        max_length=50
    )

    purchase_price_per_sqft: Decimal = Field(gt=0)

    total_slabs: int = Field(gt=0)

    total_sqft: Decimal = Field(gt=0)


# ==========================================
# Update Lot
# ==========================================

class LotUpdate(BaseModel):

    lot_number: str = Field(
        min_length=1,
        max_length=50
    )

    purchase_price_per_sqft: Decimal = Field(gt=0)


# ==========================================
# Lot Response
# ==========================================

class LotResponse(BaseModel):
    lot_id: int

    granite_name: str

    lot_number: str

    purchase_price_per_sqft: Decimal

    total_slabs: int
    available_slabs: int

    total_sqft: Decimal
    available_sqft: Decimal

    class Config:
        from_attributes = True