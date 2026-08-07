from pydantic import BaseModel


class CustomerCreate(BaseModel):
    customer_name: str
    phone: str
    address: str