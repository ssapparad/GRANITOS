from pydantic import BaseModel


class GraniteCreate(BaseModel):
    granite_name: str