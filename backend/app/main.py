from fastapi import FastAPI

from app.routers import granite
from app.routers import customer
from app.routers import lot
from app.routers import sale

app = FastAPI(
    title="GRANITOS API",
    version="1.0.0"
)

app.include_router(granite.router)
app.include_router(customer.router)
app.include_router(lot.router)
app.include_router(sale.router)


@app.get("/")
def home():
    return {
        "message": "Welcome to GRANITOS Backend 🚀"
    }