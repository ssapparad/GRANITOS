import psycopg2
from psycopg2 import errorcodes
from datetime import date
from typing import Optional

from fastapi import APIRouter, HTTPException

from app.database import get_connection
from app.schemas.sale import (
    SaleCreate,
    SaleSummaryResponse,
    SaleListResponse,
    SaleDetailResponse,
    SaleDetailItem
)


router = APIRouter(
    prefix="/sales",
    tags=["Sale"]
)


# ==========================================
# CREATE SALE
# ==========================================

@router.post(
    "/",
    response_model=SaleSummaryResponse
)
def create_sale(sale: SaleCreate):

    connection = None
    cursor = None

    try:

        if len(sale.items) == 0:
            raise HTTPException(
                status_code=400,
                detail="Sale must contain at least one item."
            )

        lot_ids = []

        for item in sale.items:

            if item.lot_id in lot_ids:
                raise HTTPException(
                    status_code=400,
                    detail=f"Lot ID {item.lot_id} appears more than once in the invoice."
                )

            lot_ids.append(item.lot_id)

        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT customer_name
            FROM Customer
            WHERE customer_id = %s AND is_active = TRUE
            """,
            (sale.customer_id,)
        )

        customer = cursor.fetchone()

        if customer is None:
            raise HTTPException(
                status_code=404,
                detail="Customer not found."
            )

        for item in sale.items:

            cursor.execute(
                """
                SELECT
                    l.lot_id, l.lot_number, l.available_sqft, l.available_slabs, g.granite_name
                FROM Lot l
                INNER JOIN Granite g ON l.granite_id = g.granite_id
                WHERE l.lot_id = %s AND l.is_active = TRUE AND g.is_active = TRUE
                """,
                (item.lot_id,)
            )

            lot = cursor.fetchone()

            if lot is None:
                raise HTTPException(
                    status_code=404,
                    detail=f"Lot ID {item.lot_id} not found."
                )

            if lot["available_sqft"] < item.sqft_sold:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f'{lot["granite_name"]} (Lot {lot["lot_number"]}): '
                        f'requested {item.sqft_sold:.2f} sq.ft but only '
                        f'{lot["available_sqft"]:.2f} sq.ft is available.'
                    )
                )

            if lot["available_slabs"] < item.slabs_sold:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f'{lot["granite_name"]} (Lot {lot["lot_number"]}): '
                        f'requested {item.slabs_sold} slabs but only '
                        f'{lot["available_slabs"]} slabs available.'
                    )
                )

        cursor.execute(
            """
            INSERT INTO Sale
            (invoice_no, customer_id, sale_date, remarks, commission, loading_charge)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING sale_id
            """,
            (
                sale.invoice_no,
                sale.customer_id,
                sale.sale_date,
                sale.remarks,
                sale.commission,
                sale.loading_charge
            )
        )

        sale_id = cursor.fetchone()["sale_id"]

        for item in sale.items:

            cursor.execute(
                """
                INSERT INTO Sale_Item
                (sale_id, lot_id, slabs_sold, sqft_sold, negotiated_rate_per_sqft)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    sale_id,
                    item.lot_id,
                    item.slabs_sold,
                    item.sqft_sold,
                    item.negotiated_rate_per_sqft
                )
            )

            cursor.execute(
                """
                UPDATE Lot
                SET available_slabs = available_slabs - %s,
                    available_sqft = available_sqft - %s
                WHERE lot_id = %s
                """,
                (item.slabs_sold, item.sqft_sold, item.lot_id)
            )

        connection.commit()

        cursor.execute(
            """
            SELECT
                s.sale_id, s.invoice_no, c.customer_name, s.sale_date,
                COUNT(si.sale_item_id) AS total_line_items,
                SUM(si.slabs_sold) AS total_slabs,
                SUM(si.sqft_sold) AS total_sqft,
                SUM(si.sqft_sold * si.negotiated_rate_per_sqft) AS grand_total
            FROM Sale s
            INNER JOIN Customer c ON s.customer_id = c.customer_id
            INNER JOIN Sale_Item si ON s.sale_id = si.sale_id
            WHERE s.sale_id = %s
            GROUP BY s.sale_id, s.invoice_no, c.customer_name, s.sale_date
            """,
            (sale_id,)
        )

        return cursor.fetchone()

    except psycopg2.Error as err:

        if connection:
            connection.rollback()

        if err.pgcode == errorcodes.UNIQUE_VIOLATION:
            raise HTTPException(
                status_code=409,
                detail="Invoice number already exists."
            )

        raise HTTPException(
            status_code=500,
            detail=str(err).strip()
        )

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ==========================================
# GET ALL SALES (LIST)
# ==========================================

@router.get(
    "/",
    response_model=list[SaleListResponse]
)
def get_sales():

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                s.sale_id, s.invoice_no, c.customer_name, s.sale_date,
                SUM(si.slabs_sold) AS total_slabs,
                SUM(si.sqft_sold) AS total_sqft,
                SUM(si.sqft_sold * si.negotiated_rate_per_sqft) AS grand_total
            FROM Sale s
            INNER JOIN Customer c ON s.customer_id = c.customer_id
            INNER JOIN Sale_Item si ON s.sale_id = si.sale_id
            GROUP BY s.sale_id, s.invoice_no, c.customer_name, s.sale_date
            ORDER BY s.sale_date DESC, s.sale_id DESC
            """
        )

        return cursor.fetchall()

    except psycopg2.Error as err:

        raise HTTPException(status_code=500, detail=str(err).strip())

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ==========================================
# GET SALE DETAIL (INVOICE VIEW)
# ==========================================

@router.get(
    "/{sale_id}",
    response_model=SaleDetailResponse
)
def get_sale_detail(sale_id: int):

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                s.sale_id, s.invoice_no, c.customer_name, s.sale_date, s.remarks,
                s.commission, s.loading_charge, s.loading_paid, s.loading_paid_date
            FROM Sale s
            INNER JOIN Customer c ON s.customer_id = c.customer_id
            WHERE s.sale_id = %s
            """,
            (sale_id,)
        )

        sale = cursor.fetchone()

        if sale is None:
            raise HTTPException(status_code=404, detail="Sale not found.")

        cursor.execute(
            """
            SELECT
                g.granite_name, l.lot_number, si.slabs_sold, si.sqft_sold,
                si.negotiated_rate_per_sqft,
                (si.sqft_sold * si.negotiated_rate_per_sqft) AS line_total
            FROM Sale_Item si
            INNER JOIN Lot l ON si.lot_id = l.lot_id
            INNER JOIN Granite g ON l.granite_id = g.granite_id
            WHERE si.sale_id = %s
            ORDER BY si.sale_item_id
            """,
            (sale_id,)
        )

        items = cursor.fetchall()

        total_slabs = sum(item["slabs_sold"] for item in items)
        total_sqft = sum(item["sqft_sold"] for item in items)
        grand_total = sum(item["line_total"] for item in items)

        return {
            "sale_id": sale["sale_id"],
            "invoice_no": sale["invoice_no"],
            "customer_name": sale["customer_name"],
            "sale_date": sale["sale_date"],
            "remarks": sale["remarks"],
            "commission": sale["commission"],
            "loading_charge": sale["loading_charge"],
            "loading_paid": sale["loading_paid"],
            "loading_paid_date": sale["loading_paid_date"],
            "total_line_items": len(items),
            "total_slabs": total_slabs,
            "total_sqft": total_sqft,
            "grand_total": grand_total,
            "items": items
        }

    except psycopg2.Error as err:

        raise HTTPException(status_code=500, detail=str(err).strip())

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ==========================================
# PAY LOADING CHARGES (weekly batch action)
# Marks every currently-unpaid loading charge
# as paid as of the given date.
# ==========================================

@router.post("/loading-charges/pay")
def pay_loading_charges(payment_date: Optional[date] = None):

    if payment_date is None:
        payment_date = date.today()

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT COALESCE(SUM(loading_charge), 0) AS total_amount, COUNT(*) AS sales_count
            FROM Sale
            WHERE loading_paid = FALSE AND loading_charge IS NOT NULL AND loading_charge > 0
            """
        )

        summary = cursor.fetchone()

        cursor.execute(
            """
            UPDATE Sale
            SET loading_paid = TRUE, loading_paid_date = %s
            WHERE loading_paid = FALSE AND loading_charge IS NOT NULL AND loading_charge > 0
            """,
            (payment_date,)
        )

        connection.commit()

        return {
            "message": f'Marked {summary["sales_count"]} sale(s) as paid.',
            "sales_count": summary["sales_count"],
            "total_amount": summary["total_amount"],
            "payment_date": payment_date
        }

    except psycopg2.Error as err:

        if connection:
            connection.rollback()

        raise HTTPException(status_code=500, detail=str(err).strip())

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()