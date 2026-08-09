from datetime import date
from decimal import Decimal
from typing import List

from pydantic import BaseModel


# ==========================================
# Low Stock Lot
# ==========================================

class DashboardLowStockLot(BaseModel):
    lot_id: int

    granite_name: str

    lot_number: str

    available_sqft: Decimal

    available_slabs: int

    class Config:
        from_attributes = True


# ==========================================
# Granite Velocity (Fast / Slow Moving)
# ==========================================

class DashboardGraniteVelocity(BaseModel):
    granite_name: str

    total_sqft_sold: Decimal

    avg_sqft_per_day: Decimal

    class Config:
        from_attributes = True


# ==========================================
# Recent Sale
# ==========================================

class DashboardRecentSale(BaseModel):
    sale_id: int

    invoice_no: str

    customer_name: str

    sale_date: date

    grand_total: Decimal

    class Config:
        from_attributes = True


# ==========================================
# Dashboard Summary
# ==========================================

class DashboardSummaryResponse(BaseModel):
    todays_sales_count: int
    todays_sales_total: Decimal

    cash_collected_today: Decimal
    online_payments_today: Decimal
    credit_sales_today: Decimal

    total_inventory_value: Decimal
    total_inventory_sqft: Decimal
    total_inventory_slabs: int

    total_outstanding: Decimal
    outstanding_sales_count: int

    low_stock_lots: List[DashboardLowStockLot]

    fast_moving_granites: List[DashboardGraniteVelocity]
    slow_moving_granites: List[DashboardGraniteVelocity]

    recent_sales: List[DashboardRecentSale]