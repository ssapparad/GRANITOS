import mysql.connector
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, HTTPException

from app.database import get_connection
from app.schemas.returns import ReturnCreate


router = APIRouter(
    prefix="/returns",
    tags=["Returns"]
)

RETURN_WINDOW_DAYS = 15
RETURN_DEDUCTION_PERCENT = Decimal("0.15")


# ==========================================
# RECORD A RETURN
# ==========================================

@router.post("/")
def add_return(ret: ReturnCreate):

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                si.sale_item_id, si.sale_id, si.lot_id, si.slabs_sold, si.sqft_sold,
                si.negotiated_rate_per_sqft, s.sale_date, g.granite_name, l.lot_number
            FROM Sale_Item si
            INNER JOIN Sale s ON si.sale_id = s.sale_id
            INNER JOIN Lot l ON si.lot_id = l.lot_id
            INNER JOIN Granite g ON l.granite_id = g.granite_id
            WHERE si.sale_item_id = %s
            """,
            (ret.sale_item_id,)
        )

        item = cursor.fetchone()

        if item is None:
            raise HTTPException(status_code=404, detail="Sale item not found.")

        days_since_sale = (ret.return_date - item["sale_date"]).days

        if days_since_sale < 0:
            raise HTTPException(
                status_code=400,
                detail="Return date cannot be before the sale date."
            )

        if days_since_sale > RETURN_WINDOW_DAYS:
            raise HTTPException(
                status_code=400,
                detail=(
                    f'Return window has closed. This item was sold on '
                    f'{item["sale_date"]}, {days_since_sale} days ago '
                    f'(window is {RETURN_WINDOW_DAYS} days).'
                )
            )

        cursor.execute(
            """
            SELECT
                COALESCE(SUM(sqft_returned), 0) AS sqft_returned,
                COALESCE(SUM(slabs_returned), 0) AS slabs_returned
            FROM Sale_Return
            WHERE sale_item_id = %s
            """,
            (ret.sale_item_id,)
        )

        already = cursor.fetchone()

        sqft_returnable = item["sqft_sold"] - already["sqft_returned"]
        slabs_returnable = item["slabs_sold"] - already["slabs_returned"]

        if ret.sqft_returned > sqft_returnable:
            raise HTTPException(
                status_code=400,
                detail=(
                    f'Only {sqft_returnable:.2f} sqft is returnable on this item '
                    f'(already returned: {already["sqft_returned"]:.2f} sqft).'
                )
            )

        if ret.slabs_returned > slabs_returnable:
            raise HTTPException(
                status_code=400,
                detail=(
                    f'Only {slabs_returnable} slab(s) returnable on this item '
                    f'(already returned: {already["slabs_returned"]} slab(s)).'
                )
            )

        refund_amount = round(
            ret.sqft_returned * item["negotiated_rate_per_sqft"] * (Decimal("1") - RETURN_DEDUCTION_PERCENT),
            2
        )

        deduction_percent_display = RETURN_DEDUCTION_PERCENT * 100

        cursor.execute(
            """
            INSERT INTO Sale_Return
            (sale_item_id, return_date, sqft_returned, slabs_returned, deduction_percent, refund_amount, remarks)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                ret.sale_item_id, ret.return_date, ret.sqft_returned, ret.slabs_returned,
                deduction_percent_display, refund_amount, ret.remarks
            )
        )

        return_id = cursor.lastrowid

        cursor.execute(
            """
            UPDATE Lot
            SET available_sqft = available_sqft + %s, available_slabs = available_slabs + %s
            WHERE lot_id = %s
            """,
            (ret.sqft_returned, ret.slabs_returned, item["lot_id"])
        )

        refunded = False

        if ret.refund_method:

            cursor.execute(
                """
                INSERT INTO Refund (return_id, refund_date, amount, refund_method, remarks)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (return_id, ret.return_date, refund_amount, ret.refund_method, ret.remarks)
            )

            refunded = True

        connection.commit()

        return {
            "return_id": return_id,
            "sale_item_id": ret.sale_item_id,
            "granite_name": item["granite_name"],
            "lot_number": item["lot_number"],
            "return_date": ret.return_date,
            "sqft_returned": ret.sqft_returned,
            "slabs_returned": ret.slabs_returned,
            "deduction_percent": deduction_percent_display,
            "refund_amount": refund_amount,
            "remarks": ret.remarks,
            "refund_method": ret.refund_method,
            "refunded": refunded
        }

    except mysql.connector.Error as err:

        if connection:
            connection.rollback()

        raise HTTPException(status_code=500, detail=err.msg)

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ==========================================
# RETURN SUMMARY FOR A SALE
# ==========================================

@router.get("/sale/{sale_id}")
def get_sale_return_summary(sale_id: int):

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            "SELECT sale_id, invoice_no, sale_date FROM Sale WHERE sale_id = %s",
            (sale_id,)
        )

        sale = cursor.fetchone()

        if sale is None:
            raise HTTPException(status_code=404, detail="Sale not found.")

        days_since_sale = (date.today() - sale["sale_date"]).days
        window_open = days_since_sale <= RETURN_WINDOW_DAYS

        cursor.execute(
            """
            SELECT
                si.sale_item_id, g.granite_name, l.lot_number, si.negotiated_rate_per_sqft,
                si.slabs_sold, si.sqft_sold,
                COALESCE(sr.slabs_returned, 0) AS slabs_returned,
                COALESCE(sr.sqft_returned, 0) AS sqft_returned
            FROM Sale_Item si
            INNER JOIN Lot l ON si.lot_id = l.lot_id
            INNER JOIN Granite g ON l.granite_id = g.granite_id
            LEFT JOIN (
                SELECT sale_item_id, SUM(slabs_returned) AS slabs_returned, SUM(sqft_returned) AS sqft_returned
                FROM Sale_Return
                GROUP BY sale_item_id
            ) sr ON si.sale_item_id = sr.sale_item_id
            WHERE si.sale_id = %s
            ORDER BY si.sale_item_id
            """,
            (sale_id,)
        )

        item_rows = cursor.fetchall()

        items = []

        for row in item_rows:
            items.append({
                "sale_item_id": row["sale_item_id"],
                "granite_name": row["granite_name"],
                "lot_number": row["lot_number"],
                "negotiated_rate_per_sqft": row["negotiated_rate_per_sqft"],
                "slabs_sold": row["slabs_sold"],
                "sqft_sold": row["sqft_sold"],
                "slabs_returned": row["slabs_returned"],
                "sqft_returned": row["sqft_returned"],
                "slabs_returnable": row["slabs_sold"] - row["slabs_returned"],
                "sqft_returnable": row["sqft_sold"] - row["sqft_returned"]
            })

        cursor.execute(
            """
            SELECT
                sr.return_id, sr.sale_item_id, g.granite_name, l.lot_number, sr.return_date,
                sr.sqft_returned, sr.slabs_returned, sr.deduction_percent, sr.refund_amount,
                sr.remarks, rf.refund_method
            FROM Sale_Return sr
            INNER JOIN Sale_Item si ON sr.sale_item_id = si.sale_item_id
            INNER JOIN Lot l ON si.lot_id = l.lot_id
            INNER JOIN Granite g ON l.granite_id = g.granite_id
            LEFT JOIN Refund rf ON rf.return_id = sr.return_id
            WHERE si.sale_id = %s
            ORDER BY sr.return_date DESC, sr.return_id DESC
            """,
            (sale_id,)
        )

        returns = cursor.fetchall()

        for r in returns:
            r["refunded"] = r["refund_method"] is not None

        total_refunded = sum((row["refund_amount"] for row in returns), Decimal("0"))

        return {
            "sale_id": sale["sale_id"],
            "invoice_no": sale["invoice_no"],
            "sale_date": sale["sale_date"],
            "days_since_sale": days_since_sale,
            "window_open": window_open,
            "total_refunded": total_refunded,
            "items": items,
            "returns": returns
        }

    except mysql.connector.Error as err:

        raise HTTPException(status_code=500, detail=err.msg)

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()