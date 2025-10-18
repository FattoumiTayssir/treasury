from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.post("/refresh")
def refresh_dashboard():
    # This would trigger dashboard data update
    return {"message": "Dashboard refresh triggered successfully"}

@router.get("/data")
def get_dashboard_data(db: Session = Depends(get_db)):
    # Return mock dashboard data
    # In production, this would aggregate data from movements and calculate projections
    return {
        "cashFlow": {
            "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            "income": [50000, 55000, 60000, 58000, 62000, 65000],
            "expenses": [40000, 42000, 45000, 44000, 46000, 48000],
            "balance": [10000, 13000, 15000, 14000, 16000, 17000]
        },
        "summary": {
            "totalIncome": 350000,
            "totalExpenses": 265000,
            "netBalance": 85000,
            "projectedBalance": 102000
        }
    }
