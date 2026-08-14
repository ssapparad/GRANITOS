import psycopg2
from psycopg2 import errorcodes

from fastapi import APIRouter, HTTPException
from app.schemas.granite import GraniteCreate
from app.database import get_connection

router = APIRouter(
    prefix="/granites",
    tags=["Granite"]
)


# ==========================================
# CREATE
# ==========================================

@router.post("/")
def add_granite(granite: GraniteCreate):

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            "INSERT INTO Granite (granite_name) VALUES (%s)",
            (granite.granite_name,)
        )

        connection.commit()

        return {
            "message": "Granite added successfully!"
        }

    except psycopg2.Error as err:

        if connection:
            connection.rollback()

        if err.pgcode == errorcodes.UNIQUE_VIOLATION:
            raise HTTPException(
                status_code=409,
                detail="Granite already exists."
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
# READ
# ==========================================

@router.get("/")
def get_granites():

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT *
            FROM Granite
            WHERE is_active = TRUE
            """
        )

        return cursor.fetchall()

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ==========================================
# UPDATE
# ==========================================

@router.put("/{granite_id}")
def update_granite(
    granite_id: int,
    granite: GraniteCreate
):

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE Granite
            SET granite_name = %s
            WHERE granite_id = %s
                AND is_active = TRUE
            """,
            (granite.granite_name, granite_id)
        )

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Granite not found."
            )

        connection.commit()

        return {
            "message": "Granite updated successfully!"
        }

    except psycopg2.Error as err:

        if connection:
            connection.rollback()

        if err.pgcode == errorcodes.UNIQUE_VIOLATION:
            raise HTTPException(
                status_code=409,
                detail="Granite already exists."
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
# SOFT DELETE
# ==========================================

@router.delete("/{granite_id}")
def delete_granite(granite_id: int):

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE Granite
            SET is_active = FALSE
            WHERE granite_id = %s
            """,
            (granite_id,)
        )

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Granite not found."
            )

        connection.commit()

        return {
            "message": "Granite deactivated successfully!"
        }

    except psycopg2.Error as err:

        if connection:
            connection.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(err).strip()
        )

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()