import psycopg2

from fastapi import APIRouter, HTTPException

from app.database import get_connection
from app.schemas.settings import SettingsUpdate


router = APIRouter(
    prefix="/settings",
    tags=["Settings"]
)


# ==========================================
# GET SETTINGS
# (single row, setting_id = 1; created on the
# fly if the seed row is somehow missing)
# ==========================================

@router.get("/")
def get_settings():

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                business_name,
                business_address,
                business_phone,
                business_email,
                gst_number,
                invoice_prefix,
                currency_symbol
            FROM Settings
            WHERE setting_id = 1
            """
        )

        settings = cursor.fetchone()

        if settings is None:

            cursor.execute(
                "INSERT INTO Settings (setting_id) VALUES (1) ON CONFLICT (setting_id) DO NOTHING"
            )

            connection.commit()

            cursor.execute(
                """
                SELECT
                    business_name,
                    business_address,
                    business_phone,
                    business_email,
                    gst_number,
                    invoice_prefix,
                    currency_symbol
                FROM Settings
                WHERE setting_id = 1
                """
            )

            settings = cursor.fetchone()

        return settings

    finally:

        if cursor:
            cursor.close()

        if connection:
            connection.close()


# ==========================================
# UPDATE SETTINGS
# ==========================================

@router.put("/")
def update_settings(settings: SettingsUpdate):

    connection = None
    cursor = None

    try:

        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            "INSERT INTO Settings (setting_id) VALUES (1) ON CONFLICT (setting_id) DO NOTHING"
        )

        cursor.execute(
            """
            UPDATE Settings
            SET
                business_name = %s,
                business_address = %s,
                business_phone = %s,
                business_email = %s,
                gst_number = %s,
                invoice_prefix = %s,
                currency_symbol = %s
            WHERE setting_id = 1
            """,
            (
                settings.business_name,
                settings.business_address,
                settings.business_phone,
                settings.business_email,
                settings.gst_number,
                settings.invoice_prefix,
                settings.currency_symbol
            )
        )

        connection.commit()

        cursor.execute(
            """
            SELECT
                business_name,
                business_address,
                business_phone,
                business_email,
                gst_number,
                invoice_prefix,
                currency_symbol
            FROM Settings
            WHERE setting_id = 1
            """
        )

        updated = cursor.fetchone()

        updated["message"] = "Settings updated successfully."

        return updated

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