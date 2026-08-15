import psycopg2
from datetime import date
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, HTTPException

from app.database import get_connection


router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


# ==========================================
# SALES REPORT
# ==========================================

@router.get("/sales")
def get_sales_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        conditions = []
        params = []

        if start_date:
            conditions.append("s.sale_date >= %s")
            params.append(start_date)

        if end_date:
            conditions.append("s.sale_date <= %s")
            params.append(end_date)

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        cursor.execute(
            f"""
            SELECT
                s.sale_id, s.invoice_no, c.customer_name, s.sale_date,
                SUM(si.slabs_sold) AS total_slabs,
                SUM(si.sqft_sold) AS total_sqft,
                SUM(si.sqft_sold * si.negotiated_rate_per_sqft) AS grand_total
            FROM Sale s
            INNER JOIN Customer c ON s.customer_id = c.customer_id
            INNER JOIN Sale_Item si ON s.sale_id = si.sale_id
            {where_clause}
            GROUP BY s.sale_id, s.invoice_no, c.customer_name, s.sale_date
            ORDER BY s.sale_date DESC, s.sale_id DESC
            """,
            params
        )

        sales = cursor.fetchall()

        return {
            "start_date": start_date,
            "end_date": end_date,
            "total_sales_count": len(sales),
            "total_slabs": sum(row["total_slabs"] for row in sales),
            "total_sqft": sum((row["total_sqft"] for row in sales), Decimal("0")),
            "total_revenue": sum((row["grand_total"] for row in sales), Decimal("0")),
            "sales": sales
        }

    except psycopg2.Error as err:

        raise HTTPException(status_code=500, detail=str(err).strip())

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ==========================================
# INVENTORY REPORT
# ==========================================

@router.get("/inventory")
def get_inventory_report(
    granite_id: Optional[int] = None
):

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        conditions = ["l.is_active = TRUE", "g.is_active = TRUE"]
        params = []

        if granite_id:
            conditions.append("l.granite_id = %s")
            params.append(granite_id)

        where_clause = f"WHERE {' AND '.join(conditions)}"

        cursor.execute(
            f"""
            SELECT
                g.granite_name, l.lot_number, l.purchase_date, l.purchase_price_per_sqft,
                l.total_slabs, l.available_slabs, l.total_sqft, l.available_sqft,
                (l.available_sqft * l.purchase_price_per_sqft) AS inventory_value
            FROM Lot l
            INNER JOIN Granite g ON l.granite_id = g.granite_id
            {where_clause}
            ORDER BY g.granite_name, l.lot_number
            """,
            params
        )

        lots = cursor.fetchall()

        return {
            "total_inventory_value": sum((row["inventory_value"] for row in lots), Decimal("0")),
            "total_available_sqft": sum((row["available_sqft"] for row in lots), Decimal("0")),
            "total_available_slabs": sum(row["available_slabs"] for row in lots),
            "lots": lots
        }

    except psycopg2.Error as err:

        raise HTTPException(status_code=500, detail=str(err).strip())

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ==========================================
# CUSTOMER REPORT
# ==========================================

@router.get("/customers")
def get_customer_report(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            "SELECT customer_id, customer_name FROM Customer WHERE is_active = TRUE"
        )

        customers = cursor.fetchall()

        billed_conditions = []
        billed_params = []

        if start_date:
            billed_conditions.append("s.sale_date >= %s")
            billed_params.append(start_date)

        if end_date:
            billed_conditions.append("s.sale_date <= %s")
            billed_params.append(end_date)

        billed_where = f"AND {' AND '.join(billed_conditions)}" if billed_conditions else ""

        cursor.execute(
            f"""
            SELECT s.customer_id, COALESCE(SUM(si.sqft_sold * si.negotiated_rate_per_sqft), 0) AS total_billed
            FROM Sale s
            LEFT JOIN Sale_Item si ON s.sale_id = si.sale_id
            WHERE 1=1 {billed_where}
            GROUP BY s.customer_id
            """,
            billed_params
        )

        billed_by_customer = {row["customer_id"]: row["total_billed"] for row in cursor.fetchall()}

        paid_conditions = []
        paid_params = []

        if start_date:
            paid_conditions.append("p.payment_date >= %s")
            paid_params.append(start_date)

        if end_date:
            paid_conditions.append("p.payment_date <= %s")
            paid_params.append(end_date)

        paid_where = f"AND {' AND '.join(paid_conditions)}" if paid_conditions else ""

        cursor.execute(
            f"""
            SELECT s.customer_id, COALESCE(SUM(p.amount), 0) AS total_paid
            FROM Payment p
            INNER JOIN Sale s ON p.sale_id = s.sale_id
            WHERE 1=1 {paid_where}
            GROUP BY s.customer_id
            """,
            paid_params
        )

        paid_by_customer = {row["customer_id"]: row["total_paid"] for row in cursor.fetchall()}

        cursor.execute(
            """
            SELECT
                s.customer_id,
                COALESCE(
                    SUM(
                        GREATEST(
                            sale_totals.grand_total
                                - COALESCE(refund_totals.total_refunded, 0)
                                - COALESCE(payment_totals.amount_paid, 0),
                            0
                        )
                    ), 0
                ) AS total_outstanding
            FROM Sale s
            INNER JOIN (
                SELECT sale_id, SUM(sqft_sold * negotiated_rate_per_sqft) AS grand_total
                FROM Sale_Item
                GROUP BY sale_id
            ) sale_totals ON s.sale_id = sale_totals.sale_id
            LEFT JOIN (
                SELECT si.sale_id, SUM(sr.refund_amount) AS total_refunded
                FROM Sale_Return sr
                INNER JOIN Sale_Item si ON sr.sale_item_id = si.sale_item_id
                GROUP BY si.sale_id
            ) refund_totals ON s.sale_id = refund_totals.sale_id
            LEFT JOIN (
                SELECT sale_id, SUM(amount) AS amount_paid
                FROM Payment
                GROUP BY sale_id
            ) payment_totals ON s.sale_id = payment_totals.sale_id
            GROUP BY s.customer_id
            """
        )

        outstanding_by_customer = {row["customer_id"]: row["total_outstanding"] for row in cursor.fetchall()}

        report_rows = []

        for customer in customers:

            cid = customer["customer_id"]

            report_rows.append({
                "customer_id": cid,
                "customer_name": customer["customer_name"],
                "total_billed": billed_by_customer.get(cid, Decimal("0")),
                "total_paid": paid_by_customer.get(cid, Decimal("0")),
                "total_outstanding": outstanding_by_customer.get(cid, Decimal("0"))
            })

        return {
            "start_date": start_date,
            "end_date": end_date,
            "customers": report_rows
        }

    except psycopg2.Error as err:

        raise HTTPException(status_code=500, detail=str(err).strip())

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ==========================================
# OUTSTANDING REPORT
# ==========================================

@router.get("/outstanding")
def get_outstanding_report():

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                s.sale_id, s.invoice_no, c.customer_name, s.sale_date,
                sale_totals.grand_total,
                COALESCE(refund_totals.total_refunded, 0) AS total_refunded,
                COALESCE(payment_totals.amount_paid, 0) AS amount_paid,
                (
                    sale_totals.grand_total
                        - COALESCE(refund_totals.total_refunded, 0)
                        - COALESCE(payment_totals.amount_paid, 0)
                ) AS balance_due,
                (CURRENT_DATE - s.sale_date) AS days_outstanding
            FROM Sale s
            INNER JOIN Customer c ON s.customer_id = c.customer_id
            INNER JOIN (
                SELECT sale_id, SUM(sqft_sold * negotiated_rate_per_sqft) AS grand_total
                FROM Sale_Item
                GROUP BY sale_id
            ) sale_totals ON s.sale_id = sale_totals.sale_id
            LEFT JOIN (
                SELECT si.sale_id, SUM(sr.refund_amount) AS total_refunded
                FROM Sale_Return sr
                INNER JOIN Sale_Item si ON sr.sale_item_id = si.sale_item_id
                GROUP BY si.sale_id
            ) refund_totals ON s.sale_id = refund_totals.sale_id
            LEFT JOIN (
                SELECT sale_id, SUM(amount) AS amount_paid
                FROM Payment
                GROUP BY sale_id
            ) payment_totals ON s.sale_id = payment_totals.sale_id
            WHERE (
                sale_totals.grand_total
                    - COALESCE(refund_totals.total_refunded, 0)
                    - COALESCE(payment_totals.amount_paid, 0)
            ) > 0
            ORDER BY days_outstanding DESC
            """
        )

        sales = cursor.fetchall()

        return {
            "total_outstanding": sum((row["balance_due"] for row in sales), Decimal("0")),
            "sales": sales
        }

    except psycopg2.Error as err:

        raise HTTPException(status_code=500, detail=str(err).strip())

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ==========================================
# DAY CLOSING REPORT
# ==========================================

@router.get("/day-closing")
def get_day_closing_report(
    report_date: Optional[date] = None
):

    if report_date is None:
        report_date = date.today()

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
                s.sale_id, s.invoice_no, c.customer_name,
                SUM(si.sqft_sold) AS sqft_sold,
                COALESCE(SUM(si.sqft_sold * si.negotiated_rate_per_sqft), 0) AS total_amount,
                s.commission, s.loading_charge,
                COALESCE(pay.cash_received, 0) AS cash_received,
                COALESCE(pay.phone_pay_received, 0) AS phone_pay_received
            FROM Sale s
            INNER JOIN Customer c ON s.customer_id = c.customer_id
            INNER JOIN Sale_Item si ON s.sale_id = si.sale_id
            LEFT JOIN (
                SELECT
                    sale_id,
                    SUM(CASE WHEN payment_method = 'CASH' THEN amount ELSE 0 END) AS cash_received,
                    SUM(CASE WHEN payment_method IN ('UPI', 'BANK_TRANSFER') THEN amount ELSE 0 END) AS phone_pay_received
                FROM Payment
                WHERE payment_date = %s
                GROUP BY sale_id
            ) pay ON s.sale_id = pay.sale_id
            WHERE s.sale_date = %s
            GROUP BY s.sale_id, s.invoice_no, c.customer_name, s.commission, s.loading_charge,
                     pay.cash_received, pay.phone_pay_received
            ORDER BY s.sale_id
            """,
            (report_date, report_date)
        )

        sale_rows = cursor.fetchall()

        sale_ids = [row["sale_id"] for row in sale_rows]
        balances_by_sale = {}

        if sale_ids:

            placeholders = ",".join(["%s"] * len(sale_ids))

            cursor.execute(
                f"""
                SELECT
                    sale_totals.sale_id,
                    (
                        sale_totals.grand_total
                            - COALESCE(refund_totals.total_refunded, 0)
                            - COALESCE(payment_totals.amount_paid, 0)
                    ) AS balance_due
                FROM (
                    SELECT sale_id, SUM(sqft_sold * negotiated_rate_per_sqft) AS grand_total
                    FROM Sale_Item
                    WHERE sale_id IN ({placeholders})
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
                """,
                sale_ids
            )

            for row in cursor.fetchall():
                balances_by_sale[row["sale_id"]] = row["balance_due"]

        sales = []
        totals = {
            "sqft_sold": Decimal("0"), "cash_received": Decimal("0"), "phone_pay_received": Decimal("0"),
            "total_amount": Decimal("0"), "commission": Decimal("0"), "pending_amount": Decimal("0"),
            "loading_amount": Decimal("0")
        }

        for row in sale_rows:

            commission = row["commission"] or Decimal("0")
            loading_amount = row["loading_charge"] or Decimal("0")
            pending_amount = balances_by_sale.get(row["sale_id"], Decimal("0"))

            sales.append({
                "sale_id": row["sale_id"],
                "invoice_no": row["invoice_no"],
                "customer_name": row["customer_name"],
                "sqft_sold": row["sqft_sold"],
                "cash_received": row["cash_received"],
                "phone_pay_received": row["phone_pay_received"],
                "total_amount": row["total_amount"],
                "commission": row["commission"],
                "pending_amount": pending_amount,
                "loading_amount": row["loading_charge"]
            })

            totals["sqft_sold"] += row["sqft_sold"]
            totals["cash_received"] += row["cash_received"]
            totals["phone_pay_received"] += row["phone_pay_received"]
            totals["total_amount"] += row["total_amount"]
            totals["commission"] += commission
            totals["pending_amount"] += pending_amount
            totals["loading_amount"] += loading_amount

        # ==========================================
        # PENDING AMOUNT RECEIVED (old dues collected today)
        # ==========================================

        cursor.execute(
            """
            SELECT
                COALESCE(SUM(p.amount), 0) AS total_amount,
                COALESCE(SUM(CASE WHEN p.payment_method = 'CASH' THEN p.amount ELSE 0 END), 0) AS cash,
                COALESCE(SUM(CASE WHEN p.payment_method IN ('UPI', 'BANK_TRANSFER') THEN p.amount ELSE 0 END), 0) AS phone_pay
            FROM Payment p
            INNER JOIN Sale s ON p.sale_id = s.sale_id
            WHERE p.payment_date = %s AND s.sale_date != %s
            """,
            (report_date, report_date)
        )

        pending_received = cursor.fetchone()

        # ==========================================
        # LOADING CHARGES: PAID TODAY / UNPAID TOTAL
        # ==========================================

        cursor.execute(
            """
            SELECT COALESCE(SUM(loading_charge), 0) AS paid_today
            FROM Sale
            WHERE loading_paid = TRUE AND loading_paid_date = %s
            """,
            (report_date,)
        )

        loading_paid_today = cursor.fetchone()["paid_today"]

        cursor.execute(
            """
            SELECT COALESCE(SUM(loading_charge), 0) AS unpaid_total
            FROM Sale
            WHERE loading_paid = FALSE AND loading_charge IS NOT NULL
            """
        )

        loading_unpaid_total = cursor.fetchone()["unpaid_total"]

        # ==========================================
        # COMMISSION: PAID TODAY / UNPAID TOTAL
        # (mirrors Loading above — this is money YOU
        # pay OUT to the agent who brought the sale)
        # ==========================================

        cursor.execute(
            """
            SELECT COALESCE(SUM(commission), 0) AS paid_today
            FROM Sale
            WHERE commission_paid = TRUE AND commission_paid_date = %s
            """,
            (report_date,)
        )

        commission_paid_today = cursor.fetchone()["paid_today"]

        cursor.execute(
            """
            SELECT COALESCE(SUM(commission), 0) AS unpaid_total
            FROM Sale
            WHERE commission_paid = FALSE AND commission IS NOT NULL
            """
        )

        commission_unpaid_total = cursor.fetchone()["unpaid_total"]

        # ==========================================
        # PAYOUTS TODAY (commission + loading combined,
        # by method) — money that left the till on this
        # date, separate from what came in. Useful for
        # reconciling actual cash in hand.
        # ==========================================

        cursor.execute(
            """
            SELECT
                COALESCE(SUM(CASE WHEN commission_paid_date = %s AND commission_paid_method = 'CASH' THEN commission ELSE 0 END), 0)
                    + COALESCE(SUM(CASE WHEN loading_paid_date = %s AND loading_paid_method = 'CASH' THEN loading_charge ELSE 0 END), 0)
                    AS cash,
                COALESCE(SUM(CASE WHEN commission_paid_date = %s AND commission_paid_method IN ('UPI', 'BANK_TRANSFER') THEN commission ELSE 0 END), 0)
                    + COALESCE(SUM(CASE WHEN loading_paid_date = %s AND loading_paid_method IN ('UPI', 'BANK_TRANSFER') THEN loading_charge ELSE 0 END), 0)
                    AS online
            FROM Sale
            WHERE commission_paid_date = %s OR loading_paid_date = %s
            """,
            (report_date, report_date, report_date, report_date, report_date, report_date)
        )

        payouts_today = cursor.fetchone()

        return {
            "report_date": report_date,
            "sales": sales,
            "totals": totals,
            "pending_received": pending_received,
            "loading": {
                "paid_today": loading_paid_today,
                "unpaid_total": loading_unpaid_total
            },
            "commission": {
                "paid_today": commission_paid_today,
                "unpaid_total": commission_unpaid_total
            },
            "payouts_today": payouts_today
        }

    except psycopg2.Error as err:

        raise HTTPException(status_code=500, detail=str(err).strip())

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()