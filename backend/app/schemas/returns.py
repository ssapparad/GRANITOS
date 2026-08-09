from datetime import date
from decimal import Decimal
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


# ==========================================
# Create Return
# ==========================================

class ReturnCreate(BaseModel):
    sale_item_id: int
    return_date: date
    sqft_returned: Decimal = Field(gt=0)
    slabs_returned: int = Field(gt=0)
    remarks: Optional[str] = None
    refund_method: Optional[Literal["CASH", "UPI", "BANK_TRANSFER"]] = None


# ==========================================
# Return Response
# ==========================================

class ReturnResponse(BaseModel):
    return_id: int
    sale_item_id: int
    granite_name: str
    lot_number: str
    return_date: date
    sqft_returned: Decimal
    slabs_returned: int
    deduction_percent: Decimal
    refund_amount: Decimal
    remarks: Optional[str] = None
    refund_method: Optional[str] = None
    refunded: bool = False

    class Config:
        from_attributes = True


# ==========================================
# Per-Item Return Status
# ==========================================

class SaleItemReturnStatus(BaseModel):
    sale_item_id: int
    granite_name: str
    lot_number: str
    negotiated_rate_per_sqft: Decimal
    slabs_sold: int
    sqft_sold: Decimal
    slabs_returned: int
    sqft_returned: Decimal
    slabs_returnable: int
    sqft_returnable: Decimal


# ==========================================
# Sale Return Summary
# ==========================================

class SaleReturnSummaryResponse(BaseModel):
    sale_id: int
    invoice_no: str
    sale_date: date
    days_since_sale: int
    window_open: bool
    total_refunded: Decimal
    items: List[SaleItemReturnStatus]
    returns: List[ReturnResponse]