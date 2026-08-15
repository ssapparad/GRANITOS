from datetime import date
from decimal import Decimal
from typing import List, Optional

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
# Monthly Sales Trend Point
# ==========================================

class DashboardMonthlySales(BaseModel):
    month: str  # "YYYY-MM"

    total_sales: Decimal

    class Config:
        from_attributes = True


# ==========================================
# Payment Method Breakdown
# ==========================================

class DashboardPaymentBreakdown(BaseModel):
    payment_method: str

    total: Decimal

    class Config:
        from_attributes = True


# ==========================================
# Top Granite By Revenue
# ==========================================

class DashboardGraniteRevenue(BaseModel):
    granite_name: str

    revenue: Decimal

    class Config:
        from_attributes = True


# ==========================================
# Sales Trend (7-day comparison)
# ==========================================

class DashboardSalesTrend(BaseModel):
    last_7_days_total: Decimal

    prior_7_days_total: Decimal

    percent_change: Optional[Decimal] = None


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
    outstanding_commission: Decimal
    outstanding_loading: Decimal

    low_stock_lots: List[DashboardLowStockLot]

    fast_moving_granites: List[DashboardGraniteVelocity]
    slow_moving_granites: List[DashboardGraniteVelocity]

    recent_sales: List[DashboardRecentSale]

    sales_trend_7d: DashboardSalesTrend
    monthly_sales_trend: List[DashboardMonthlySales]
    payment_method_breakdown: List[DashboardPaymentBreakdown]
    top_granites_by_revenue: List[DashboardGraniteRevenue]