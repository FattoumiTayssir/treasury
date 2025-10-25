from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app import schemas, models
from datetime import datetime

router = APIRouter(prefix="/treasury", tags=["treasury"])

@router.get("/balance/{company_id}", response_model=schemas.TreasuryBalanceResponse)
def get_balance(company_id: str, db: Session = Depends(get_db)):
    """
    Get the most recent treasury balance for a company.
    This is the baseline amount used for all treasury calculations.
    """
    # Get the most recent balance for this company
    balance = db.query(models.TreasuryBalance).filter(
        models.TreasuryBalance.company_id == int(company_id)
    ).order_by(desc(models.TreasuryBalance.reference_date)).first()
    
    if not balance:
        # Return default balance if none exists
        return schemas.TreasuryBalanceResponse(
            companyId=company_id,
            amount=0.0,
            referenceDate=datetime.today().isoformat(),
            updatedBy="system",
            updatedAt=datetime.utcnow().isoformat(),
            notes=None
        )
    
    # Get user info
    user = db.query(models.User).filter(
        models.User.user_id == balance.updated_by
    ).first()
    
    # Get sources
    sources = [
        schemas.TreasuryBalanceSourceResponse(
            sourceId=s.source_id,
            sourceName=s.source_name,
            amount=float(s.amount),
            sourceDate=s.source_date.isoformat(),
            notes=s.notes,
            createdAt=s.created_at.isoformat()
        )
        for s in balance.sources
    ]
    
    return schemas.TreasuryBalanceResponse(
        companyId=str(balance.company_id),
        amount=float(balance.amount),
        referenceDate=balance.reference_date.isoformat(),
        updatedBy=user.display_name if user else "Unknown",
        updatedAt=balance.updated_at.isoformat(),
        notes=balance.notes,
        sources=sources
    )

@router.post("/balance", response_model=schemas.TreasuryBalanceResponse)
def update_balance(data: schemas.TreasuryBalanceUpdate, db: Session = Depends(get_db)):
    """
    Update or create a treasury balance for a company.
    This sets the baseline amount for all treasury calculations.
    """
    # Verify company exists
    company = db.query(models.Company).filter(
        models.Company.company_id == int(data.companyId)
    ).first()
    
    if not company:
        raise HTTPException(status_code=404, detail=f"Company {data.companyId} not found")
    
    # Get first user as default (TODO: Get from auth)
    user = db.query(models.User).first()
    if not user:
        raise HTTPException(status_code=400, detail="No users found in system")
    
    # Check if balance exists for this company and date
    existing_balance = db.query(models.TreasuryBalance).filter(
        models.TreasuryBalance.company_id == int(data.companyId),
        models.TreasuryBalance.reference_date == data.referenceDate
    ).first()
    
    if existing_balance:
        # Update existing balance
        existing_balance.amount = data.amount
        existing_balance.notes = data.notes
        existing_balance.updated_by = user.user_id
        existing_balance.updated_at = datetime.utcnow()
        balance = existing_balance
        
        # Delete existing sources and add new ones
        db.query(models.TreasuryBalanceSource).filter(
            models.TreasuryBalanceSource.treasury_balance_id == balance.treasury_balance_id
        ).delete()
    else:
        # Create new balance
        balance = models.TreasuryBalance(
            company_id=int(data.companyId),
            amount=data.amount,
            reference_date=data.referenceDate,
            updated_by=user.user_id,
            notes=data.notes
        )
        db.add(balance)
        db.flush()  # Get the ID
    
    # Add sources if provided
    if data.sources:
        for source_data in data.sources:
            source = models.TreasuryBalanceSource(
                treasury_balance_id=balance.treasury_balance_id,
                source_name=source_data.sourceName,
                amount=source_data.amount,
                source_date=source_data.sourceDate,
                notes=source_data.notes
            )
            db.add(source)
    
    db.commit()
    db.refresh(balance)
    
    # Get sources for response
    sources = [
        schemas.TreasuryBalanceSourceResponse(
            sourceId=s.source_id,
            sourceName=s.source_name,
            amount=float(s.amount),
            sourceDate=s.source_date.isoformat(),
            notes=s.notes,
            createdAt=s.created_at.isoformat()
        )
        for s in balance.sources
    ]
    
    return schemas.TreasuryBalanceResponse(
        companyId=str(balance.company_id),
        amount=float(balance.amount),
        referenceDate=balance.reference_date.isoformat(),
        updatedBy=user.display_name,
        updatedAt=balance.updated_at.isoformat(),
        notes=balance.notes,
        sources=sources
    )
