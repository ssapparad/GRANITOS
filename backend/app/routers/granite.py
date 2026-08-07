import mysql.connector

from fastapi import APIRouter, HTTPException
from app.schemas.granite import GraniteCreate
from app.database import get_connection

router = APIRouter(
    prefix="/granites",
    tags=["Granite"]
)


# CREATE
@router.post("/")
def add_granite(granite: GraniteCreate):

    try:

        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            "INSERT INTO Granite (granite_name) VALUES (%s)",
            (granite.granite_name,)
        )

        connection.commit()

        cursor.close()
        connection.close()

        return {
            "message": "Granite added successfully!"
        }

    except mysql.connector.Error as err:

        if err.errno == 1062:
            raise HTTPException(
                status_code=409,
                detail="Granite already exists."
            )

        raise HTTPException(
            status_code=500,
            detail="Database error."
        )


# READ
@router.get("/")
def get_granites():

    connection = get_connection()

    cursor = connection.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT *
        FROM Granite
        WHERE is_active = TRUE
        """
    )

    granites = cursor.fetchall()

    cursor.close()
    connection.close()

    return granites


# UPDATE
@router.put("/{granite_id}")
def update_granite(
    granite_id: int,
    granite: GraniteCreate
):

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        UPDATE Granite
        SET granite_name = %s
        WHERE granite_id = %s
        """,
        (granite.granite_name, granite_id)
    )

    connection.commit()

    cursor.close()
    connection.close()

    return {
        "message": "Granite updated successfully!"
    }


# SOFT DELETE
@router.delete("/{granite_id}")
def delete_granite(granite_id: int):

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

    connection.commit()

    cursor.close()
    connection.close()

    return {
        "message": "Granite deactivated successfully!"
    }