import logging
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routers import granite
from app.routers import customer
from app.routers import lot
from app.routers import sale
from app.routers import payment
from app.routers import dashboard
from app.routers import reports
from app.routers import settings
from app.routers import returns


# ==========================================
# LOGGING
# ==========================================

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)

logger = logging.getLogger("granitos")


# ==========================================
# APP
# ==========================================

app = FastAPI(
    title="GRANITOS API",
    version="1.0.0"
)


# ==========================================
# CORS
# ==========================================

cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# GLOBAL ERROR HANDLER
# ==========================================

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):

    logger.exception(f"Unhandled error on {request.method} {request.url.path}")

    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again."}
    )


# ==========================================
# ROUTERS
# ==========================================

app.include_router(granite.router)
app.include_router(customer.router)
app.include_router(lot.router)
app.include_router(sale.router)
app.include_router(payment.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(settings.router)
app.include_router(returns.router)


@app.get("/")
def home():
    return {
        "message": "Welcome to GRANITOS Backend 🚀"
    }