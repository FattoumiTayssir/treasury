from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import schemas
from datetime import datetime

router = APIRouter(prefix="/treasury", tags=["treasury"])

# Mock treasury balance storage (in production, use a database table)
treasury_balances = {}

@router.get("/balance/{company_id}", response_model=schemas.TreasuryBalanceResponse)
def get_balance(company_id: str):
    if company_id not in treasury_balances:
        return schemas.TreasuryBalanceResponse(
            companyId=company_id,
            amount=0.0,
            referenceDate=datetime.today().isoformat(),
            updatedBy="system",
            updatedAt=datetime.utcnow().isoformat()
        )
    return treasury_balances[company_id]

@router.post("/balance", response_model=schemas.TreasuryBalanceResponse)
def update_balance(data: schemas.TreasuryBalanceUpdate):
    balance = schemas.TreasuryBalanceResponse(
        companyId=data.companyId,
        amount=data.amount,
        referenceDate=data.referenceDate,
        updatedBy="current_user",  # TODO: Get from auth
        updatedAt=datetime.utcnow().isoformat()
    )
    treasury_balances[data.companyId] = balance
    return balance
