import mysql.connector

from fastapi import APIRouter, HTTPException

from app.database import get_connection
from app.schemas.sale import (
    SaleCreate,
    SaleSummaryResponse
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

        # ==========================================
        # VALIDATE ITEMS
        # ==========================================

        if len(sale.items) == 0:
            raise HTTPException(
                status_code=400,
                detail="Sale must contain at least one item."
            )

        # ==========================================
        # CHECK DUPLICATE LOTS
        # ==========================================

        lot_ids = []

        for item in sale.items:

            if item.lot_id in lot_ids:

                raise HTTPException(
                    status_code=400,
                    detail=f"Lot ID {item.lot_id} appears more than once in the invoice."
                )

            lot_ids.append(item.lot_id)

        # ==========================================
        # DATABASE CONNECTION
        # ==========================================

        connection = get_connection()

        cursor = connection.cursor(
            dictionary=True
        )

        # ==========================================
        # VALIDATE CUSTOMER
        # ==========================================

        cursor.execute(
            """
            SELECT
                customer_name
            FROM Customer
            WHERE
                customer_id = %s
                AND is_active = TRUE
            """,
            (sale.customer_id,)
        )

        customer = cursor.fetchone()

        if customer is None:

            raise HTTPException(
                status_code=404,
                detail="Customer not found."
            )

        # ==========================================
        # START TRANSACTION
        # ==========================================

        

        # ==========================================
        # VALIDATE EVERY LOT
        # ==========================================

        for item in sale.items:

            cursor.execute(
                """
                SELECT
                    l.lot_id,
                    l.lot_number,
                    l.available_sqft,
                    g.granite_name
                FROM Lot l
                INNER JOIN Granite g
                    ON l.granite_id = g.granite_id
                WHERE
                    l.lot_id = %s
                    AND l.is_active = TRUE
                    AND g.is_active = TRUE
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
                        f'{lot["granite_name"]} '
                        f'(Lot {lot["lot_number"]}): '
                        f'requested {item.sqft_sold:.2f} sq.ft '
                        f'but only {lot["available_sqft"]:.2f} sq.ft is available.'
                    )
                )
            
                    # ==========================================
        # INSERT SALE
        # ==========================================

        cursor.execute(
            """
            INSERT INTO Sale
            (
                invoice_no,
                customer_id,
                sale_date,
                remarks
            )
            VALUES
            (%s, %s, %s, %s)
            """,
            (
                sale.invoice_no,
                sale.customer_id,
                sale.sale_date,
                sale.remarks
            )
        )

        sale_id = cursor.lastrowid

        # ==========================================
        # INSERT SALE ITEMS
        # UPDATE INVENTORY
        # ==========================================

        for item in sale.items:

            cursor.execute(
                """
                INSERT INTO Sale_Item
                (
                    sale_id,
                    lot_id,
                    slabs_sold,
                    sqft_sold,
                    negotiated_rate_per_sqft
                )
                VALUES
                (%s, %s, %s, %s, %s)
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
                SET
                    available_slabs = available_slabs - %s,
                    available_sqft = available_sqft - %s
                WHERE
                    lot_id = %s
                """,
                (
                    item.slabs_sold,
                    item.sqft_sold,
                    item.lot_id
                )
            )

        # ==========================================
        # COMMIT TRANSACTION
        # ==========================================

        connection.commit()

        # ==========================================
        # FETCH SALE SUMMARY
        # ==========================================

        cursor.execute(
            """
            SELECT

                s.sale_id,

                s.invoice_no,

                c.customer_name,

                s.sale_date,

                COUNT(si.sale_item_id) AS total_line_items,

                SUM(si.slabs_sold) AS total_slabs,

                SUM(si.sqft_sold) AS total_sqft,

                SUM(
                    si.sqft_sold *
                    si.negotiated_rate_per_sqft
                ) AS grand_total

            FROM Sale s

            INNER JOIN Customer c
                ON s.customer_id = c.customer_id

            INNER JOIN Sale_Item si
                ON s.sale_id = si.sale_id

            WHERE
                s.sale_id = %s

            GROUP BY
                s.sale_id,
                s.invoice_no,
                c.customer_name,
                s.sale_date
            """,
            (sale_id,)
        )

        summary = cursor.fetchone()

        return summary
    
    except mysql.connector.Error as err:

        if connection:
            connection.rollback()

        if err.errno == 1062:

            raise HTTPException(
                status_code=409,
                detail="Invoice number already exists."
            )

        raise HTTPException(
            status_code=500,
            detail=err.msg
        )

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()