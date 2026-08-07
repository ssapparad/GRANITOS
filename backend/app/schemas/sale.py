from datetime import date
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field


# ==========================================
# Sale Item Create
# ==========================================

class SaleItemCreate(BaseModel):
    lot_id: int

    slabs_sold: int = Field(gt=0)

    sqft_sold: Decimal = Field(gt=0)

    negotiated_rate_per_sqft: Decimal = Field(gt=0)


# ==========================================
# Create Sale
# ==========================================

class SaleCreate(BaseModel):
    invoice_no: str

    customer_id: int

    sale_date: date

    remarks: Optional[str] = None

    items: List[SaleItemCreate]


# ==========================================
# Sale Summary Response
# ==========================================

class SaleSummaryResponse(BaseModel):
    sale_id: int

    invoice_no: str

    customer_name: str

    sale_date: date

    total_line_items: int

    total_slabs: int

    total_sqft: Decimal

    grand_total: Decimal


# ==========================================
# Sales List Response
# ==========================================

class SaleListResponse(BaseModel):
    sale_id: int

    invoice_no: str

    customer_name: str

    sale_date: date

    total_slabs: int

    total_sqft: Decimal

    grand_total: Decimal


# ==========================================
# Invoice Detail Item
# ==========================================

class SaleDetailItem(BaseModel):
    granite_name: str

    lot_number: str

    slabs_sold: int

    sqft_sold: Decimal

    negotiated_rate_per_sqft: Decimal

    line_total: Decimal


# ==========================================
# Invoice Detail Response
# ==========================================

class SaleDetailResponse(BaseModel):
    sale_id: int

    invoice_no: str

    customer_name: str

    sale_date: date

    remarks: Optional[str]

    total_line_items: int

    total_slabs: int

    total_sqft: Decimal

    grand_total: Decimal

    items: List[SaleDetailItem]