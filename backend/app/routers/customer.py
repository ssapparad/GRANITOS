import mysql.connector

from fastapi import APIRouter, HTTPException
from app.database import get_connection
from app.schemas.customer import CustomerCreate

router = APIRouter(
    prefix="/customers",
    tags=["Customer"]
)


# ==========================================
# CREATE
# ==========================================

@router.post("/")
def add_customer(customer: CustomerCreate):

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            INSERT INTO Customer
            (customer_name, phone, address)
            VALUES (%s, %s, %s)
            """,
            (
                customer.customer_name,
                customer.phone,
                customer.address
            )
        )

        customer_id = cursor.lastrowid

        connection.commit()

        cursor.execute(
            """
            SELECT customer_id, customer_name, phone, address
            FROM Customer
            WHERE customer_id = %s
            """,
            (customer_id,)
        )

        created_customer = cursor.fetchone()

        created_customer["message"] = "Customer added successfully!"

        return created_customer

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
# READ
# ==========================================

@router.get("/")
def get_customers():

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT *
            FROM Customer
            WHERE is_active = TRUE
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
# UPDATE
# ==========================================

@router.put("/{customer_id}")
def update_customer(
    customer_id: int,
    customer: CustomerCreate
):

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE Customer
            SET customer_name = %s,
                phone = %s,
                address = %s
            WHERE customer_id = %s
                AND is_active = TRUE
            """,
            (
                customer.customer_name,
                customer.phone,
                customer.address,
                customer_id
            )
        )

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Customer not found."
            )

        connection.commit()

        return {
            "message": "Customer updated successfully!"
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


# ==========================================
# SOFT DELETE
# ==========================================

@router.delete("/{customer_id}")
def delete_customer(customer_id: int):

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute(
            """
            UPDATE Customer
            SET is_active = FALSE
            WHERE customer_id = %s
            """,
            (customer_id,)
        )

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Customer not found."
            )

        connection.commit()

        return {
            "message": "Customer deactivated successfully!"
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