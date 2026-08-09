import mysql.connector
from decimal import Decimal

from fastapi import APIRouter, HTTPException

from app.database import get_connection


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

VELOCITY_MIN_LOT_AGE_DAYS = 7
LOW_STOCK_SQFT_THRESHOLD = Decimal("100")


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
            WHERE s.sale_date = CURDATE()
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
            WHERE payment_date = CURDATE()
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
            WHERE refund_date = CURDATE()
            """
        )

        refunds_today = cursor.fetchone()

        cash_collected_today = payments_today["cash_collected_today"] - refunds_today["cash_refunded_today"]
        online_payments_today = payments_today["online_payments_today"] - refunds_today["online_refunded_today"]

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
                WHERE s.sale_date = CURDATE()
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
                    GREATEST(DATEDIFF(CURDATE(), l.purchase_date), 1) AS days_since_purchase
                FROM Lot l
                INNER JOIN Granite g ON l.granite_id = g.granite_id
                WHERE l.is_active = TRUE AND g.is_active = TRUE
                    AND DATEDIFF(CURDATE(), l.purchase_date) >= %s
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
            "low_stock_lots": low_stock_lots,
            "fast_moving_granites": fast_moving_granites,
            "slow_moving_granites": slow_moving_granites,
            "recent_sales": recent_sales
        }

    except mysql.connector.Error as err:

        raise HTTPException(status_code=500, detail=err.msg)

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()