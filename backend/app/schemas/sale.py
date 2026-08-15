from datetime import date
from decimal import Decimal
from typing import List, Literal, Optional

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
    invoice_no: str = Field(min_length=1)
    customer_id: int
    sale_date: date
    remarks: Optional[str] = None
    commission: Optional[Decimal] = Field(default=None, ge=0)
    loading_charge: Optional[Decimal] = Field(default=None, ge=0)
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
    commission: Optional[Decimal] = None
    commission_paid: bool = False
    commission_paid_date: Optional[date] = None
    commission_paid_method: Optional[str] = None
    loading_charge: Optional[Decimal] = None
    loading_paid: bool = False
    loading_paid_date: Optional[date] = None
    loading_paid_method: Optional[str] = None
    total_line_items: int
    total_slabs: int
    total_sqft: Decimal
    grand_total: Decimal
    items: List[SaleDetailItem]


# ==========================================
# Pay Commission / Loading (per sale)
# Both are money the business pays OUT — to
# the agent who brought the sale (commission)
# or to loading labour (loading_charge) — not
# money the customer owes.
# ==========================================

class PayoutCreate(BaseModel):
    payment_date: date
    payment_method: Literal["CASH", "UPI", "BANK_TRANSFER"]


# ==========================================
# Payables (unpaid commission/loading, across
# all sales) — kept separate from customer
# Outstanding Dues since it's the opposite
# direction of money.
# ==========================================

class PayableSale(BaseModel):
    sale_id: int
    invoice_no: str
    customer_name: str
    sale_date: date
    commission: Optional[Decimal] = None
    commission_paid: bool = False
    loading_charge: Optional[Decimal] = None
    loading_paid: bool = False


class PayablesResponse(BaseModel):
    total_unpaid_commission: Decimal
    total_unpaid_loading: Decimal
    sales: List[PayableSale]