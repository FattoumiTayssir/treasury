from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from datetime import datetime

router = APIRouter(prefix="/movements", tags=["movements"])

@router.get("", response_model=List[schemas.MovementResponse])
def get_movements(db: Session = Depends(get_db)):
    movements = db.query(models.Movement).filter(
        models.Movement.status != "Archivé"
    ).all()
    
    return [
        schemas.MovementResponse(
            id=str(m.movement_id),
            companyId=str(m.company_id),
            category=m.category,
            type=m.type,
            amount=float(m.amount),
            sign=m.sign,
            date=m.movement_date.isoformat(),
            referenceType=m.reference_type,
            reference=m.reference,
            referenceState=m.reference_status,
            odooLink=m.odoo_link,
            source=m.source,
            note=m.note,
            status=m.status,
            createdBy=m.creator.display_name if m.creator else "Système",
            createdAt=m.created_at.isoformat() if m.created_at else None,
            updatedAt=m.updated_at.isoformat() if m.updated_at else None,
            deactivatedAt=m.disabled_at.isoformat() if m.disabled_at else None,
            deactivationReason=m.disable_reason,
            excludeFromAnalytics=m.exclude_from_analytics
        )
        for m in movements
    ]

@router.get("/last-refresh", response_model=schemas.LastRefreshResponse)
def get_last_refresh(db: Session = Depends(get_db)):
    # Get the latest created_at timestamp from Odoo source only (not manual entries)
    latest = db.query(models.Movement).filter(
        models.Movement.source == "Odoo"
    ).order_by(models.Movement.created_at.desc()).first()
    if latest:
        return {"lastRefresh": latest.created_at.isoformat()}
    return {"lastRefresh": None}

@router.post("/deactivate")
def deactivate_movements(data: schemas.MovementDeactivate, db: Session = Depends(get_db)):
    for movement_id in data.ids:
        movement = db.query(models.Movement).filter(models.Movement.movement_id == int(movement_id)).first()
        if movement:
            movement.status = "Désactivé"
            movement.disabled_at = datetime.utcnow()
            movement.disable_reason = data.reason
    
    db.commit()
    return {"message": "Movements deactivated successfully"}

@router.post("/activate")
def activate_movements(data: schemas.MovementActivate, db: Session = Depends(get_db)):
    for movement_id in data.ids:
        movement = db.query(models.Movement).filter(models.Movement.movement_id == int(movement_id)).first()
        if movement:
            movement.status = "Actif"
            movement.disabled_at = None
            movement.disable_reason = None
    
    db.commit()
    return {"message": "Movements activated successfully"}

@router.post("/exclude-from-analytics")
def exclude_from_analytics(data: schemas.MovementExcludeFromAnalytics, db: Session = Depends(get_db)):
    """Exclude or include movements from analytics calculations"""
    updated_count = 0
    for movement_id in data.ids:
        movement = db.query(models.Movement).filter(models.Movement.movement_id == int(movement_id)).first()
        if movement:
            movement.exclude_from_analytics = data.exclude
            movement.updated_at = datetime.utcnow()
            updated_count += 1
    
    db.commit()
    action = "excluded from" if data.exclude else "included in"
    return {"message": f"{updated_count} movements {action} analytics successfully"}

@router.post("/refresh")
def refresh_movements():
    # This would trigger the ETL process
    # For now, return success
    return {"message": "Refresh triggered successfully"}

@router.get("/{id}", response_model=schemas.MovementResponse)
def get_movement(id: str, db: Session = Depends(get_db)):
    movement = db.query(models.Movement).filter(models.Movement.movement_id == int(id)).first()
    if not movement:
        raise HTTPException(status_code=404, detail="Movement not found")
    
    return schemas.MovementResponse(
        id=str(movement.movement_id),
        companyId=str(movement.company_id),
        category=movement.category,
        type=movement.type,
        amount=float(movement.amount),
        sign=movement.sign,
        date=movement.movement_date.isoformat(),
        referenceType=movement.reference_type,
        reference=movement.reference,
        referenceState=movement.reference_status,
        odooLink=movement.odoo_link,
        source=movement.source,
        note=movement.note,
        status=movement.status,
        createdBy=movement.creator.display_name if movement.creator else "Système",
        createdAt=movement.created_at.isoformat() if movement.created_at else None,
        updatedAt=movement.updated_at.isoformat() if movement.updated_at else None,
        deactivatedAt=movement.disabled_at.isoformat() if movement.disabled_at else None,
        deactivationReason=movement.disable_reason,
        excludeFromAnalytics=movement.exclude_from_analytics
    )
