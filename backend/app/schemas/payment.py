from datetime import date
from decimal import Decimal
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


# ==========================================
# Create Payment
# ==========================================

class PaymentCreate(BaseModel):
    sale_id: int

    payment_date: date

    amount: Decimal = Field(gt=0)

    payment_method: Literal["CASH", "UPI", "BANK_TRANSFER"]

    remarks: Optional[str] = None


# ==========================================
# Payment Response
# ==========================================

class PaymentResponse(BaseModel):
    payment_id: int

    sale_id: int

    invoice_no: str

    payment_date: date

    amount: Decimal

    payment_method: str

    remarks: Optional[str] = None

    class Config:
        from_attributes = True


# ==========================================
# Sale Balance (invoice + payment history)
# grand_total here is NET of returns — the
# actual amount owed. gross_total is the
# original, unadjusted invoice total.
# ==========================================

class SaleBalanceResponse(BaseModel):
    sale_id: int

    invoice_no: str

    customer_name: str

    gross_total: Decimal

    total_refunded: Decimal

    grand_total: Decimal

    amount_paid: Decimal

    balance_due: Decimal

    payments: List[PaymentResponse]


# ==========================================
# Customer Outstanding
# ==========================================

class CustomerOutstandingResponse(BaseModel):
    customer_id: int

    customer_name: str

    total_billed: Decimal

    total_paid: Decimal

    total_outstanding: Decimal