from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import (
    movements,
    manual_entries,
    exceptions,
    users,
    companies,
    auth,
    treasury,
    dashboard,
    odoo,
    analytics
)

app = FastAPI(
    title="Treasury Management API",
    description="API for managing treasury and financial movements",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(movements.router)
app.include_router(manual_entries.router)
app.include_router(exceptions.router)
app.include_router(users.router)
app.include_router(companies.router)
app.include_router(auth.router)
app.include_router(treasury.router)
app.include_router(dashboard.router)
app.include_router(odoo.router)
app.include_router(analytics.router)

@app.get("/")
def root():
    return {
        "message": "Treasury Management API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}
