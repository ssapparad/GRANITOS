from typing import Optional

from pydantic import BaseModel, Field


# ==========================================
# Update Settings
# ==========================================

class SettingsUpdate(BaseModel):
    business_name: str = Field(min_length=1, max_length=150)

    business_address: Optional[str] = None
    business_phone: Optional[str] = None
    business_email: Optional[str] = None

    gst_number: Optional[str] = None

    invoice_prefix: str = Field(min_length=1, max_length=20)

    currency_symbol: str = Field(min_length=1, max_length=5)


# ==========================================
# Settings Response
# ==========================================

class SettingsResponse(BaseModel):
    business_name: str

    business_address: Optional[str] = None
    business_phone: Optional[str] = None
    business_email: Optional[str] = None

    gst_number: Optional[str] = None

    invoice_prefix: str

    currency_symbol: str

    class Config:
        from_attributes = True