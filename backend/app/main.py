from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import granite
from app.routers import customer
from app.routers import lot
from app.routers import sale
from app.routers import payment

app = FastAPI(
    title="GRANITOS API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(granite.router)
app.include_router(customer.router)
app.include_router(lot.router)
app.include_router(sale.router)
app.include_router(payment.router)


@app.get("/")
def home():
    return {
        "message": "Welcome to GRANITOS Backend 🚀"
    }