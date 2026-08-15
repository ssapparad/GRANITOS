import psycopg2
from datetime import date, timedelta
from decimal import Decimal

from fastapi import APIRouter, HTTPException

from app.database import get_connection


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

VELOCITY_MIN_LOT_AGE_DAYS = 7
LOW_STOCK_SQFT_THRESHOLD = Decimal("100")
MONTHLY_TREND_MONTHS = 12
PAYMENT_BREAKDOWN_DAYS = 30
TOP_GRANITES_LIMIT = 5


# ==========================================
# SUMMARY
# ==========================================

@router.get("/summary")
def get_dashboard_summary(
    low_stock_sqft_threshold: Decimal = LOW_STOCK_SQFT_THRESHOLD
):

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        # ==========================================
        # TODAY'S SALES
        # ==========================================

        cursor.execute(
            """
            SELECT
                COUNT(DISTINCT s.sale_id) AS todays_sales_count,
                COALESCE(SUM(si.sqft_sold * si.negotiated_rate_per_sqft), 0) AS todays_sales_total
            FROM Sale s
            INNER JOIN Sale_Item si ON s.sale_id = si.sale_id
            WHERE s.sale_date = CURRENT_DATE
            """
        )

        todays_sales = cursor.fetchone()

        # ==========================================
        # PAYMENTS COLLECTED TODAY
        # ==========================================

        cursor.execute(
            """
            SELECT
                COALESCE(SUM(CASE WHEN payment_method = 'CASH' THEN amount ELSE 0 END), 0) AS cash_collected_today,
                COALESCE(SUM(CASE WHEN payment_method IN ('UPI', 'BANK_TRANSFER') THEN amount ELSE 0 END), 0) AS online_payments_today
            FROM Payment
            WHERE payment_date = CURRENT_DATE
            """
        )

        payments_today = cursor.fetchone()

        # ==========================================
        # REFUNDS PAID OUT TODAY
        # (netted out of cash/online collected)
        # ==========================================

        cursor.execute(
            """
            SELECT
                COALESCE(SUM(CASE WHEN refund_method = 'CASH' THEN amount ELSE 0 END), 0) AS cash_refunded_today,
                COALESCE(SUM(CASE WHEN refund_method IN ('UPI', 'BANK_TRANSFER') THEN amount ELSE 0 END), 0) AS online_refunded_today
            FROM Refund
            WHERE refund_date = CURRENT_DATE
            """
        )

        refunds_today = cursor.fetchone()

        # ==========================================
        # COMMISSION / LOADING PAID OUT TODAY
        # (also netted out of cash/online collected —
        # this is money paid to agents/labour, same
        # till as customer payments)
        # ==========================================

        cursor.execute(
            """
            SELECT
                COALESCE(SUM(CASE WHEN commission_paid_date = CURRENT_DATE AND commission_paid_method = 'CASH' THEN commission ELSE 0 END), 0)
                    + COALESCE(SUM(CASE WHEN loading_paid_date = CURRENT_DATE AND loading_paid_method = 'CASH' THEN loading_charge ELSE 0 END), 0)
                    AS cash_paid_out_today,
                COALESCE(SUM(CASE WHEN commission_paid_date = CURRENT_DATE AND commission_paid_method IN ('UPI', 'BANK_TRANSFER') THEN commission ELSE 0 END), 0)
                    + COALESCE(SUM(CASE WHEN loading_paid_date = CURRENT_DATE AND loading_paid_method IN ('UPI', 'BANK_TRANSFER') THEN loading_charge ELSE 0 END), 0)
                    AS online_paid_out_today
            FROM Sale
            WHERE commission_paid_date = CURRENT_DATE OR loading_paid_date = CURRENT_DATE
            """
        )

        payouts_today = cursor.fetchone()

        cash_collected_today = (
            payments_today["cash_collected_today"]
            - refunds_today["cash_refunded_today"]
            - payouts_today["cash_paid_out_today"]
        )
        online_payments_today = (
            payments_today["online_payments_today"]
            - refunds_today["online_refunded_today"]
            - payouts_today["online_paid_out_today"]
        )

        # ==========================================
        # CREDIT SALES TODAY (net of returns)
        # ==========================================

        cursor.execute(
            """
            SELECT
                COALESCE(
                    SUM(
                        GREATEST(
                            sale_totals.grand_total
                                - COALESCE(refund_totals.total_refunded, 0)
                                - COALESCE(payment_totals.amount_paid, 0),
                            0
                        )
                    ), 0
                ) AS credit_sales_today
            FROM (
                SELECT si.sale_id, SUM(si.sqft_sold * si.negotiated_rate_per_sqft) AS grand_total
                FROM Sale_Item si
                INNER JOIN Sale s ON si.sale_id = s.sale_id
                WHERE s.sale_date = CURRENT_DATE
                GROUP BY si.sale_id
            ) sale_totals
            LEFT JOIN (
                SELECT si.sale_id, SUM(sr.refund_amount) AS total_refunded
                FROM Sale_Return sr
                INNER JOIN Sale_Item si ON sr.sale_item_id = si.sale_item_id
                GROUP BY si.sale_id
            ) refund_totals ON sale_totals.sale_id = refund_totals.sale_id
            LEFT JOIN (
                SELECT sale_id, SUM(amount) AS amount_paid
                FROM Payment
                GROUP BY sale_id
            ) payment_totals ON sale_totals.sale_id = payment_totals.sale_id
            """
        )

        credit_sales = cursor.fetchone()

        # ==========================================
        # INVENTORY VALUE + AVAILABLE STOCK
        # ==========================================

        cursor.execute(
            """
            SELECT
                COALESCE(SUM(available_sqft * purchase_price_per_sqft), 0) AS total_inventory_value,
                COALESCE(SUM(available_sqft), 0) AS total_inventory_sqft,
                COALESCE(SUM(available_slabs), 0) AS total_inventory_slabs
            FROM Lot
            WHERE is_active = TRUE
            """
        )

        inventory = cursor.fetchone()

        # ==========================================
        # OUTSTANDING DUES (net of returns)
        # ==========================================

        cursor.execute(
            """
            SELECT
                COALESCE(
                    SUM(
                        GREATEST(
                            sale_totals.grand_total
                                - COALESCE(refund_totals.total_refunded, 0)
                                - COALESCE(payment_totals.amount_paid, 0),
                            0
                        )
                    ), 0
                ) AS total_outstanding,
                COUNT(
                    CASE
                        WHEN (
                            sale_totals.grand_total
                                - COALESCE(refund_totals.total_refunded, 0)
                                - COALESCE(payment_totals.amount_paid, 0)
                        ) > 0
                        THEN 1
                    END
                ) AS outstanding_sales_count
            FROM (
                SELECT sale_id, SUM(sqft_sold * negotiated_rate_per_sqft) AS grand_total
                FROM Sale_Item
                GROUP BY sale_id
            ) sale_totals
            LEFT JOIN (
                SELECT si.sale_id, SUM(sr.refund_amount) AS total_refunded
                FROM Sale_Return sr
                INNER JOIN Sale_Item si ON sr.sale_item_id = si.sale_item_id
                GROUP BY si.sale_id
            ) refund_totals ON sale_totals.sale_id = refund_totals.sale_id
            LEFT JOIN (
                SELECT sale_id, SUM(amount) AS amount_paid
                FROM Payment
                GROUP BY sale_id
            ) payment_totals ON sale_totals.sale_id = payment_totals.sale_id
            """
        )

        outstanding = cursor.fetchone()

        # ==========================================
        # OWED TO AGENTS / LABOUR (unpaid commission +
        # loading charges). This is money YOU pay OUT —
        # the opposite direction from customer Outstanding
        # Dues above, so it's kept as its own total rather
        # than merged in.
        # ==========================================

        cursor.execute(
            """
            SELECT
                COALESCE(SUM(CASE WHEN commission IS NOT NULL AND commission_paid = FALSE THEN commission ELSE 0 END), 0) AS outstanding_commission,
                COALESCE(SUM(CASE WHEN loading_charge IS NOT NULL AND loading_paid = FALSE THEN loading_charge ELSE 0 END), 0) AS outstanding_loading
            FROM Sale
            """
        )

        payables = cursor.fetchone()

        # ==========================================
        # LOW STOCK LOTS
        # ==========================================

        cursor.execute(
            """
            SELECT l.lot_id, g.granite_name, l.lot_number, l.available_sqft, l.available_slabs
            FROM Lot l
            INNER JOIN Granite g ON l.granite_id = g.granite_id
            WHERE l.is_active = TRUE AND g.is_active = TRUE AND l.available_sqft < %s
            ORDER BY l.available_sqft ASC
            """,
            (low_stock_sqft_threshold,)
        )

        low_stock_lots = cursor.fetchall()

        # ==========================================
        # FAST / SLOW MOVING GRANITE
        # ==========================================

        cursor.execute(
            """
            SELECT
                granite_name,
                SUM(sqft_sold) AS total_sqft_sold,
                ROUND(AVG(sqft_sold / days_since_purchase), 4) AS avg_sqft_per_day
            FROM (
                SELECT
                    g.granite_name,
                    (l.total_sqft - l.available_sqft) AS sqft_sold,
                    GREATEST((CURRENT_DATE - l.purchase_date), 1) AS days_since_purchase
                FROM Lot l
                INNER JOIN Granite g ON l.granite_id = g.granite_id
                WHERE l.is_active = TRUE AND g.is_active = TRUE
                    AND (CURRENT_DATE - l.purchase_date) >= %s
            ) lot_velocity
            GROUP BY granite_name
            ORDER BY avg_sqft_per_day DESC
            """,
            (VELOCITY_MIN_LOT_AGE_DAYS,)
        )

        velocity_rows = cursor.fetchall()

        fast_moving_granites = velocity_rows[:5]
        slow_moving_granites = list(reversed(velocity_rows[-5:])) if velocity_rows else []

        # ==========================================
        # RECENT SALES (last 5)
        # ==========================================

        cursor.execute(
            """
            SELECT
                s.sale_id, s.invoice_no, c.customer_name, s.sale_date,
                SUM(si.sqft_sold * si.negotiated_rate_per_sqft) AS grand_total
            FROM Sale s
            INNER JOIN Customer c ON s.customer_id = c.customer_id
            INNER JOIN Sale_Item si ON s.sale_id = si.sale_id
            GROUP BY s.sale_id, s.invoice_no, c.customer_name, s.sale_date
            ORDER BY s.sale_date DESC, s.sale_id DESC
            LIMIT 5
            """
        )

        recent_sales = cursor.fetchall()

        # ==========================================
        # 7-DAY SALES TREND
        # (real comparison: trailing 7 days vs the
        # 7 days before that — used for the dashboard
        # trend badge, never a fabricated number)
        # ==========================================

        cursor.execute(
            """
            SELECT
                COALESCE(SUM(
                    CASE WHEN s.sale_date >= (CURRENT_DATE - INTERVAL '6 days')
                    THEN si.sqft_sold * si.negotiated_rate_per_sqft ELSE 0 END
                ), 0) AS last_7_days_total,
                COALESCE(SUM(
                    CASE WHEN s.sale_date >= (CURRENT_DATE - INTERVAL '13 days')
                        AND s.sale_date < (CURRENT_DATE - INTERVAL '6 days')
                    THEN si.sqft_sold * si.negotiated_rate_per_sqft ELSE 0 END
                ), 0) AS prior_7_days_total
            FROM Sale s
            INNER JOIN Sale_Item si ON s.sale_id = si.sale_id
            WHERE s.sale_date >= (CURRENT_DATE - INTERVAL '13 days')
            """
        )

        trend_row = cursor.fetchone()

        last_7 = trend_row["last_7_days_total"]
        prior_7 = trend_row["prior_7_days_total"]

        percent_change = None
        if prior_7 > 0:
            percent_change = round(((last_7 - prior_7) / prior_7) * 100, 1)

        sales_trend_7d = {
            "last_7_days_total": last_7,
            "prior_7_days_total": prior_7,
            "percent_change": percent_change
        }

        # ==========================================
        # MONTHLY SALES TREND (last 12 months)
        # Gaps are filled with zero in Python so the
        # chart always shows a continuous 12-month axis.
        # ==========================================

        cursor.execute(
            """
            SELECT
                TO_CHAR(s.sale_date, 'YYYY-MM') AS month,
                COALESCE(SUM(si.sqft_sold * si.negotiated_rate_per_sqft), 0) AS total_sales
            FROM Sale s
            INNER JOIN Sale_Item si ON s.sale_id = si.sale_id
            WHERE s.sale_date >= (CURRENT_DATE - (%s * INTERVAL '1 month'))
            GROUP BY month
            ORDER BY month
            """,
            (MONTHLY_TREND_MONTHS - 1,)
        )

        monthly_rows = {row["month"]: row["total_sales"] for row in cursor.fetchall()}

        monthly_sales_trend = []
        today = date.today()
        cursor_month = today.replace(day=1)

        month_sequence = []
        for i in range(MONTHLY_TREND_MONTHS):
            month_sequence.append(cursor_month)
            if cursor_month.month == 1:
                cursor_month = cursor_month.replace(year=cursor_month.year - 1, month=12)
            else:
                cursor_month = cursor_month.replace(month=cursor_month.month - 1)

        for month_date in reversed(month_sequence):
            key = month_date.strftime("%Y-%m")
            monthly_sales_trend.append({
                "month": key,
                "total_sales": monthly_rows.get(key, Decimal("0"))
            })

        # ==========================================
        # PAYMENT METHOD BREAKDOWN (last 30 days)
        # ==========================================

        cursor.execute(
            """
            SELECT
                payment_method,
                COALESCE(SUM(amount), 0) AS total
            FROM Payment
            WHERE payment_date >= (CURRENT_DATE - (%s * INTERVAL '1 day'))
            GROUP BY payment_method
            """,
            (PAYMENT_BREAKDOWN_DAYS,)
        )

        payment_method_breakdown = cursor.fetchall()

        # ==========================================
        # TOP GRANITES BY REVENUE (all-time)
        # ==========================================

        cursor.execute(
            """
            SELECT
                g.granite_name,
                COALESCE(SUM(si.sqft_sold * si.negotiated_rate_per_sqft), 0) AS revenue
            FROM Sale_Item si
            INNER JOIN Lot l ON si.lot_id = l.lot_id
            INNER JOIN Granite g ON l.granite_id = g.granite_id
            GROUP BY g.granite_name
            ORDER BY revenue DESC
            LIMIT %s
            """,
            (TOP_GRANITES_LIMIT,)
        )

        top_granites_by_revenue = cursor.fetchall()

        return {
            "todays_sales_count": todays_sales["todays_sales_count"],
            "todays_sales_total": todays_sales["todays_sales_total"],
            "cash_collected_today": cash_collected_today,
            "online_payments_today": online_payments_today,
            "credit_sales_today": credit_sales["credit_sales_today"],
            "total_inventory_value": inventory["total_inventory_value"],
            "total_inventory_sqft": inventory["total_inventory_sqft"],
            "total_inventory_slabs": inventory["total_inventory_slabs"],
            "total_outstanding": outstanding["total_outstanding"],
            "outstanding_sales_count": outstanding["outstanding_sales_count"],
            "outstanding_commission": payables["outstanding_commission"],
            "outstanding_loading": payables["outstanding_loading"],
            "low_stock_lots": low_stock_lots,
            "fast_moving_granites": fast_moving_granites,
            "slow_moving_granites": slow_moving_granites,
            "recent_sales": recent_sales,
            "sales_trend_7d": sales_trend_7d,
            "monthly_sales_trend": monthly_sales_trend,
            "payment_method_breakdown": payment_method_breakdown,
            "top_granites_by_revenue": top_granites_by_revenue
        }

    except psycopg2.Error as err:

        raise HTTPException(status_code=500, detail=str(err).strip())

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()