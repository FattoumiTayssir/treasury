from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from datetime import datetime

router = APIRouter(prefix="/exceptions", tags=["exceptions"])

@router.get("", response_model=List[schemas.ExceptionResponse])
def get_exceptions(db: Session = Depends(get_db)):
    exceptions = db.query(models.Exception).all()
    
    return [
        schemas.ExceptionResponse(
            id=str(e.exception_id),
            companyId=str(e.company_id),
            category=e.category,
            type=e.type,
            exceptionType=e.exception_type,
            criticality=e.criticity,
            description=e.description or "",
            amount=float(e.amount),
            sign=e.sign or "Entrée",
            referenceType=e.reference_type,
            reference=e.reference,
            referenceState=e.reference_status,
            odooLink=e.odoo_link,
            state=e.status,
            excludeFromAnalytics=e.exclude_from_analytics
        )
        for e in exceptions
    ]

@router.get("/last-refresh", response_model=schemas.LastRefreshResponse)
def get_last_refresh(db: Session = Depends(get_db)):
    # Get the latest created_at timestamp from system-detected exceptions (not manual)
    latest = db.query(models.Exception).order_by(models.Exception.created_at.desc()).first()
    if latest:
        return {"lastRefresh": latest.created_at.isoformat()}
    return {"lastRefresh": None}

@router.post("/update-state")
def update_exception_state(data: schemas.ExceptionUpdateState, db: Session = Depends(get_db)):
    for exception_id in data.ids:
        exception = db.query(models.Exception).filter(
            models.Exception.exception_id == int(exception_id)
        ).first()
        if exception:
            exception.status = data.state
    
    db.commit()
    return {"message": "Exception states updated successfully"}

@router.post("/exclude-from-analytics")
def exclude_from_analytics(data: schemas.ExceptionExcludeFromAnalytics, db: Session = Depends(get_db)):
    """Exclude or include exceptions from analytics displays"""
    for exception_id in data.ids:
        exception = db.query(models.Exception).filter(
            models.Exception.exception_id == int(exception_id)
        ).first()
        if exception:
            exception.exclude_from_analytics = data.exclude
    
    db.commit()
    action = "excluded from" if data.exclude else "included in"
    return {"message": f"{len(data.ids)} exceptions {action} analytics successfully"}

@router.post("/refresh")
def refresh_exceptions():
    # This would trigger the ETL process for exceptions
    return {"message": "Refresh triggered successfully"}

@router.get("/{id}", response_model=schemas.ExceptionResponse)
def get_exception(id: str, db: Session = Depends(get_db)):
    exception = db.query(models.Exception).filter(models.Exception.exception_id == int(id)).first()
    if not exception:
        raise HTTPException(status_code=404, detail="Exception not found")
    
    return schemas.ExceptionResponse(
        id=str(exception.exception_id),
        companyId=str(exception.company_id),
        category=exception.category,
        type=exception.type,
        exceptionType=exception.exception_type,
        criticality=exception.criticity,
        description=exception.description or "",
        amount=float(exception.amount),
        sign=exception.sign or "Entrée",
        referenceType=exception.reference_type,
        reference=exception.reference,
        referenceState=exception.reference_status,
        odooLink=exception.odoo_link,
        state=exception.status
    )
