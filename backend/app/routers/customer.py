import mysql.connector

from fastapi import APIRouter, HTTPException
from app.database import get_connection
from app.schemas.customer import CustomerCreate

router = APIRouter(
    prefix="/customers",
    tags=["Customer"]
)


# CREATE
@router.post("/")
def add_customer(customer: CustomerCreate):

    try:
        connection = get_connection()
        cursor = connection.cursor()

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

        connection.commit()

        cursor.close()
        connection.close()

        return {
            "message": "Customer added successfully!"
        }

    except mysql.connector.Error as err:
        raise HTTPException(
            status_code=500,
            detail=f"MySQL Error {err.errno}: {err.msg}"
        )

# READ
@router.get("/")
def get_customers():

    connection = get_connection()

    cursor = connection.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT *
        FROM Customer
        WHERE is_active = TRUE
        """
    )

    customers = cursor.fetchall()

    cursor.close()
    connection.close()

    return customers


# UPDATE
@router.put("/{customer_id}")
def update_customer(
    customer_id: int,
    customer: CustomerCreate
):

    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        UPDATE Customer
        SET customer_name = %s,
            phone = %s,
            address = %s
        WHERE customer_id = %s
        """,
        (
            customer.customer_name,
            customer.phone,
            customer.address,
            customer_id
        )
    )

    connection.commit()

    cursor.close()
    connection.close()

    return {
        "message": "Customer updated successfully!"
    }


# SOFT DELETE
@router.delete("/{customer_id}")
def delete_customer(customer_id: int):

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

    connection.commit()

    cursor.close()
    connection.close()

    return {
        "message": "Customer deactivated successfully!"
    }