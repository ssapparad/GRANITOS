import mysql.connector

from fastapi import APIRouter, HTTPException

from app.database import get_connection
from app.schemas.lot import LotCreate, LotUpdate


router = APIRouter(
    prefix="/lots",
    tags=["Lot"]
)


LOT_SELECT_COLUMNS = """
    l.lot_id,
    g.granite_name,
    l.lot_number,
    l.purchase_date,
    l.purchase_price_per_sqft,
    l.total_slabs,
    l.available_slabs,
    l.total_sqft,
    l.available_sqft
"""


# ==========================================
# CREATE LOT
# ==========================================

@router.post("/")
def add_lot(lot: LotCreate):

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            INSERT INTO Lot
            (
                granite_id,
                lot_number,
                purchase_date,
                purchase_price_per_sqft,
                total_slabs,
                available_slabs,
                total_sqft,
                available_sqft
            )
            VALUES
            (%s,%s,%s,%s,%s,%s,%s,%s)
            """,
            (
                lot.granite_id,
                lot.lot_number,
                lot.purchase_date,
                lot.purchase_price_per_sqft,
                lot.total_slabs,
                lot.total_slabs,
                lot.total_sqft,
                lot.total_sqft
            )
        )

        lot_id = cursor.lastrowid

        connection.commit()

        cursor.execute(
            f"""
            SELECT {LOT_SELECT_COLUMNS}
            FROM Lot l
            INNER JOIN Granite g
                ON l.granite_id = g.granite_id
            WHERE l.lot_id = %s
            """,
            (lot_id,)
        )

        created_lot = cursor.fetchone()

        created_lot["message"] = "Lot created successfully."

        return created_lot

    except mysql.connector.Error as err:

        if connection:
            connection.rollback()

        if err.errno == 1062:
            raise HTTPException(
                status_code=409,
                detail="Lot already exists."
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


# ==========================================
# GET ALL LOTS
# ==========================================

@router.get("/")
def get_lots():

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            f"""
            SELECT {LOT_SELECT_COLUMNS}
            FROM Lot l
            INNER JOIN Granite g
                ON l.granite_id = g.granite_id
            WHERE l.is_active = TRUE
            ORDER BY g.granite_name, l.lot_number
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


# ==========================================
# GET SINGLE LOT
# ==========================================

@router.get("/{lot_id}")
def get_lot(lot_id: int):

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            f"""
            SELECT {LOT_SELECT_COLUMNS}
            FROM Lot l
            INNER JOIN Granite g
                ON l.granite_id = g.granite_id
            WHERE
                l.lot_id = %s
                AND l.is_active = TRUE
            """,
            (lot_id,)
        )

        lot = cursor.fetchone()

        if lot is None:
            raise HTTPException(
                status_code=404,
                detail="Lot not found."
            )

        return lot

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
# UPDATE LOT
# ==========================================

@router.put("/{lot_id}")
def update_lot(
    lot_id: int,
    lot: LotUpdate
):

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            UPDATE Lot
            SET
                lot_number = %s,
                purchase_price_per_sqft = %s
            WHERE
                lot_id = %s
                AND is_active = TRUE
            """,
            (
                lot.lot_number,
                lot.purchase_price_per_sqft,
                lot_id
            )
        )

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Lot not found."
            )

        connection.commit()

        cursor.execute(
            f"""
            SELECT {LOT_SELECT_COLUMNS}
            FROM Lot l
            INNER JOIN Granite g
                ON l.granite_id = g.granite_id
            WHERE l.lot_id = %s
            """,
            (lot_id,)
        )

        updated_lot = cursor.fetchone()

        updated_lot["message"] = "Lot updated successfully."

        return updated_lot

    except mysql.connector.Error as err:

        if connection:
            connection.rollback()

        if err.errno == 1062:
            raise HTTPException(
                status_code=409,
                detail="Lot already exists."
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


# ==========================================
# SOFT DELETE
# ==========================================

@router.delete("/{lot_id}")
def delete_lot(lot_id: int):

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE Lot
            SET is_active = FALSE
            WHERE lot_id = %s
            """,
            (lot_id,)
        )

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Lot not found."
            )

        connection.commit()

        return {
            "message": "Lot deleted successfully."
        }

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