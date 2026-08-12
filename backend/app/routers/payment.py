import mysql.connector

from fastapi import APIRouter, HTTPException

from app.database import get_connection
from app.schemas.payment import PaymentCreate


router = APIRouter(
    prefix="/payments",
    tags=["Payment"]
)


# ==========================================
# HELPER: compute gross/net totals, amount
# paid, and balance due for a given sale
# (used by multiple endpoints). grand_total
# here is NET of returns.
# ==========================================

def _get_sale_totals(cursor, sale_id: int):

    cursor.execute(
        """
        SELECT
            s.sale_id,
            s.invoice_no,
            c.customer_name,
            COALESCE(SUM(si.sqft_sold * si.negotiated_rate_per_sqft), 0) AS gross_total,
            COALESCE(refund_totals.total_refunded, 0) AS total_refunded
        FROM Sale s
        INNER JOIN Customer c
            ON s.customer_id = c.customer_id
        LEFT JOIN Sale_Item si
            ON s.sale_id = si.sale_id
        LEFT JOIN (
            SELECT si2.sale_id, SUM(sr.refund_amount) AS total_refunded
            FROM Sale_Return sr
            INNER JOIN Sale_Item si2
                ON sr.sale_item_id = si2.sale_item_id
            GROUP BY si2.sale_id
        ) refund_totals
            ON s.sale_id = refund_totals.sale_id
        WHERE
            s.sale_id = %s
        GROUP BY
            s.sale_id,
            s.invoice_no,
            c.customer_name,
            refund_totals.total_refunded
        """,
        (sale_id,)
    )

    sale = cursor.fetchone()

    if sale is None:
        return None

    sale["grand_total"] = sale["gross_total"] - sale["total_refunded"]

    cursor.execute(
        """
        SELECT
            COALESCE(SUM(amount), 0) AS amount_paid
        FROM Payment
        WHERE sale_id = %s
        """,
        (sale_id,)
    )

    paid_row = cursor.fetchone()

    sale["amount_paid"] = paid_row["amount_paid"]
    sale["balance_due"] = sale["grand_total"] - paid_row["amount_paid"]

    return sale


# ==========================================
# RECORD PAYMENT
# ==========================================

@router.post("/")
def record_payment(payment: PaymentCreate):

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        sale = _get_sale_totals(cursor, payment.sale_id)

        if sale is None:
            raise HTTPException(
                status_code=404,
                detail="Sale not found."
            )

        if payment.amount > sale["balance_due"]:
            raise HTTPException(
                status_code=400,
                detail=(
                    f'Payment of {payment.amount:.2f} exceeds the outstanding '
                    f'balance of {sale["balance_due"]:.2f} for invoice '
                    f'{sale["invoice_no"]}.'
                )
            )

        cursor.execute(
            """
            INSERT INTO Payment
            (
                sale_id,
                payment_date,
                amount,
                payment_method,
                remarks
            )
            VALUES
            (%s, %s, %s, %s, %s)
            """,
            (
                payment.sale_id,
                payment.payment_date,
                payment.amount,
                payment.payment_method,
                payment.remarks
            )
        )

        payment_id = cursor.lastrowid

        connection.commit()

        cursor.execute(
            """
            SELECT
                p.payment_id,
                p.sale_id,
                s.invoice_no,
                p.payment_date,
                p.amount,
                p.payment_method,
                p.remarks
            FROM Payment p
            INNER JOIN Sale s
                ON p.sale_id = s.sale_id
            WHERE p.payment_id = %s
            """,
            (payment_id,)
        )

        return cursor.fetchone()

    except mysql.connector.Error as err:

        if connection:
            connection.rollback()

        raise HTTPException(
            status_code=500,
            detail=err.msg
        )

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ==========================================
# SALE BALANCE + PAYMENT HISTORY
# ==========================================

@router.get("/sale/{sale_id}")
def get_sale_balance(sale_id: int):

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        sale = _get_sale_totals(cursor, sale_id)

        if sale is None:
            raise HTTPException(
                status_code=404,
                detail="Sale not found."
            )

        cursor.execute(
            """
            SELECT
                p.payment_id,
                p.sale_id,
                s.invoice_no,
                p.payment_date,
                p.amount,
                p.payment_method,
                p.remarks
            FROM Payment p
            INNER JOIN Sale s
                ON p.sale_id = s.sale_id
            WHERE p.sale_id = %s
            ORDER BY p.payment_date, p.payment_id
            """,
            (sale_id,)
        )

        payments = cursor.fetchall()

        return {
            "sale_id": sale["sale_id"],
            "invoice_no": sale["invoice_no"],
            "customer_name": sale["customer_name"],
            "gross_total": sale["gross_total"],
            "total_refunded": sale["total_refunded"],
            "grand_total": sale["grand_total"],
            "amount_paid": sale["amount_paid"],
            "balance_due": sale["balance_due"],
            "payments": payments
        }

    except mysql.connector.Error as err:

        raise HTTPException(
            status_code=500,
            detail=err.msg
        )

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ==========================================
# CUSTOMER OUTSTANDING (across all sales)
# ==========================================

@router.get("/customer/{customer_id}/outstanding")
def get_customer_outstanding(customer_id: int):

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                customer_id,
                customer_name
            FROM Customer
            WHERE customer_id = %s
            """,
            (customer_id,)
        )

        customer = cursor.fetchone()

        if customer is None:
            raise HTTPException(
                status_code=404,
                detail="Customer not found."
            )

        cursor.execute(
            """
            SELECT
                COALESCE(SUM(si.sqft_sold * si.negotiated_rate_per_sqft), 0) AS total_billed
            FROM Sale s
            LEFT JOIN Sale_Item si
                ON s.sale_id = si.sale_id
            WHERE s.customer_id = %s
            """,
            (customer_id,)
        )

        billed = cursor.fetchone()

        cursor.execute(
            """
            SELECT
                COALESCE(SUM(sr.refund_amount), 0) AS total_refunded
            FROM Sale_Return sr
            INNER JOIN Sale_Item si
                ON sr.sale_item_id = si.sale_item_id
            INNER JOIN Sale s
                ON si.sale_id = s.sale_id
            WHERE s.customer_id = %s
            """,
            (customer_id,)
        )

        refunded = cursor.fetchone()

        cursor.execute(
            """
            SELECT
                COALESCE(SUM(p.amount), 0) AS total_paid
            FROM Payment p
            INNER JOIN Sale s
                ON p.sale_id = s.sale_id
            WHERE s.customer_id = %s
            """,
            (customer_id,)
        )

        paid = cursor.fetchone()

        total_billed = billed["total_billed"]
        total_refunded = refunded["total_refunded"]
        total_paid = paid["total_paid"]

        return {
            "customer_id": customer["customer_id"],
            "customer_name": customer["customer_name"],
            "total_billed": total_billed,
            "total_paid": total_paid,
            "total_outstanding": total_billed - total_refunded - total_paid
        }

    except mysql.connector.Error as err:

        raise HTTPException(
            status_code=500,
            detail=err.msg
        )

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ==========================================
# ALL PAYMENTS (for a payments log / history view)
# ==========================================

@router.get("/")
def get_all_payments():

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                p.payment_id,
                p.sale_id,
                s.invoice_no,
                c.customer_name,
                p.payment_date,
                p.amount,
                p.payment_method,
                p.remarks
            FROM Payment p
            INNER JOIN Sale s
                ON p.sale_id = s.sale_id
            INNER JOIN Customer c
                ON s.customer_id = c.customer_id
            ORDER BY
                p.payment_date DESC,
                p.payment_id DESC
            """
        )

        return cursor.fetchall()

    except mysql.connector.Error as err:

        raise HTTPException(
            status_code=500,
            detail=err.msg
        )

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()