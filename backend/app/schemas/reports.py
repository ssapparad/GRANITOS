from datetime import date
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel


# ==========================================
# Sales Report
# ==========================================

class SalesReportRow(BaseModel):
    sale_id: int
    invoice_no: str
    customer_name: str
    sale_date: date
    total_slabs: int
    total_sqft: Decimal
    grand_total: Decimal

    class Config:
        from_attributes = True


class SalesReportResponse(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    total_sales_count: int
    total_slabs: int
    total_sqft: Decimal
    total_revenue: Decimal
    sales: List[SalesReportRow]


# ==========================================
# Inventory Report
# ==========================================

class InventoryReportRow(BaseModel):
    granite_name: str
    lot_number: str
    purchase_date: date
    purchase_price_per_sqft: Decimal
    total_slabs: int
    available_slabs: int
    total_sqft: Decimal
    available_sqft: Decimal
    inventory_value: Decimal

    class Config:
        from_attributes = True


class InventoryReportResponse(BaseModel):
    total_inventory_value: Decimal
    total_available_sqft: Decimal
    total_available_slabs: int
    lots: List[InventoryReportRow]


# ==========================================
# Customer Report
# ==========================================

class CustomerReportRow(BaseModel):
    customer_id: int
    customer_name: str
    total_billed: Decimal
    total_paid: Decimal
    total_outstanding: Decimal

    class Config:
        from_attributes = True


class CustomerReportResponse(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    customers: List[CustomerReportRow]


# ==========================================
# Outstanding Report
# ==========================================

class OutstandingReportRow(BaseModel):
    sale_id: int
    invoice_no: str
    customer_name: str
    sale_date: date
    grand_total: Decimal
    total_refunded: Decimal
    amount_paid: Decimal
    balance_due: Decimal
    days_outstanding: int

    class Config:
        from_attributes = True


class OutstandingReportResponse(BaseModel):
    total_outstanding: Decimal
    sales: List[OutstandingReportRow]


# ==========================================
# Day Closing Report
# (mirrors the paper day-closing form)
# ==========================================

class DayClosingSaleRow(BaseModel):
    sale_id: int
    invoice_no: str
    customer_name: str
    sqft_sold: Decimal
    cash_received: Decimal
    phone_pay_received: Decimal
    total_amount: Decimal
    commission: Optional[Decimal] = None
    pending_amount: Decimal
    loading_amount: Optional[Decimal] = None

    class Config:
        from_attributes = True


class DayClosingTotals(BaseModel):
    sqft_sold: Decimal
    cash_received: Decimal
    phone_pay_received: Decimal
    total_amount: Decimal
    commission: Decimal
    pending_amount: Decimal
    loading_amount: Decimal


class DayClosingPendingReceived(BaseModel):
    total_amount: Decimal
    cash: Decimal
    phone_pay: Decimal


class DayClosingLoading(BaseModel):
    paid_today: Decimal
    unpaid_total: Decimal


class DayClosingReportResponse(BaseModel):
    report_date: date
    sales: List[DayClosingSaleRow]
    totals: DayClosingTotals
    pending_received: DayClosingPendingReceived
    loading: DayClosingLoading