from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from datetime import datetime
from dateutil.relativedelta import relativedelta
import json
import uuid

router = APIRouter(prefix="/manual-entries", tags=["manual-entries"])

@router.get("", response_model=List[schemas.ManualEntryResponse])
def get_manual_entries(db: Session = Depends(get_db)):
    entries = db.query(models.ManualEntry).all()
    
    result = []
    for entry in entries:
        # Get the first movement associated with this manual entry
        movement = db.query(models.Movement).filter(
            models.Movement.manual_entry_id == entry.manual_entry_id
        ).first()
        
        if movement:
            result.append(schemas.ManualEntryResponse(
                id=str(entry.manual_entry_id),
                companyId=str(movement.company_id),
                category=movement.category,
                type=movement.type,
                reference=movement.reference,
                referenceType=movement.reference_type,
                amount=float(movement.amount),
                sign=movement.sign,
                frequency=entry.frequency,
                start_date=entry.start_date.isoformat(),
                end_date=entry.end_date.isoformat() if entry.end_date else None,
                note=movement.note,
                visibility=movement.visibility,
                status=movement.status,
                createdBy=movement.creator.display_name if movement.creator else "",
                createdAt=movement.created_at.isoformat() if movement.created_at else "",
                updatedBy=None,
                updatedAt=movement.updated_at.isoformat() if movement.updated_at else None,
                referenceState=movement.reference_status
            ))
    
    return result

@router.get("/{id}", response_model=schemas.ManualEntryResponse)
def get_manual_entry(id: str, db: Session = Depends(get_db)):
    entry = db.query(models.ManualEntry).filter(models.ManualEntry.manual_entry_id == int(id)).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Manual entry not found")
    
    movement = db.query(models.Movement).filter(
        models.Movement.manual_entry_id == entry.manual_entry_id
    ).first()
    
    if not movement:
        raise HTTPException(status_code=404, detail="Movement not found for this manual entry")
    
    return schemas.ManualEntryResponse(
        id=str(entry.manual_entry_id),
        companyId=str(movement.company_id),
        category=movement.category,
        type=movement.type,
        reference=movement.reference,
        referenceType=movement.reference_type,
        amount=float(movement.amount),
        sign=movement.sign,
        frequency=entry.frequency,
        start_date=entry.start_date.isoformat(),
        end_date=entry.end_date.isoformat() if entry.end_date else None,
        note=movement.note,
        visibility=movement.visibility,
        status=movement.status,
        createdBy=movement.creator.display_name if movement.creator else "",
        createdAt=movement.created_at.isoformat() if movement.created_at else "",
        updatedBy=None,
        updatedAt=movement.updated_at.isoformat() if movement.updated_at else None,
        referenceState=movement.reference_status
    )

@router.post("", response_model=schemas.ManualEntryResponse)
def create_manual_entry(entry: schemas.ManualEntryCreate, db: Session = Depends(get_db)):
    # Parse dates
    start_date = datetime.strptime(entry.start_date, "%Y-%m-%d").date()
    end_date = datetime.strptime(entry.end_date, "%Y-%m-%d").date() if entry.end_date else start_date
    today = datetime.today().date()
    
    # Create manual entry
    db_entry = models.ManualEntry(
        frequency=entry.frequency,
        start_date=start_date,
        end_date=end_date if entry.frequency != "Une seule fois" else None,
    )
    db.add(db_entry)
    db.flush()
    
    # Generate movements based on frequency and date range
    movements = []
    current_date = start_date
    movement_index = 0
    
    while current_date <= end_date and current_date >= today:
        # Generate unique reference for each movement
        if entry.reference:
            unique_ref = f"{entry.reference}-{movement_index+1}"
        else:
            unique_ref = f"EM-{db_entry.manual_entry_id}-{movement_index+1}"
        
        movement = models.Movement(
            company_id=entry.company_id,
            manual_entry_id=db_entry.manual_entry_id,
            category=entry.category,
            type=entry.type,
            amount=entry.amount,
            sign=entry.sign,
            movement_date=current_date,
            reference_type=entry.reference_type or "Facture",
            reference=unique_ref,
            source="Entrée manuelle",
            note=entry.note,
            visibility=entry.visibility,
            status=entry.status,
            created_by=1  # TODO: Get from auth
        )
        db.add(movement)
        movements.append(movement)
        movement_index += 1
        
        # Calculate next date based on frequency
        if entry.frequency == "Une seule fois":
            break
        elif entry.frequency == "Mensuel":
            current_date = current_date + relativedelta(months=1)
        elif entry.frequency == "Annuel":
            current_date = current_date + relativedelta(years=1)
        else:
            break
    
    if not movements:
        raise HTTPException(status_code=400, detail="No future movements to create in the specified date range")
    
    db.commit()
    db.refresh(db_entry)
    
    # Get the first movement for response
    first_movement = movements[0]
    
    return schemas.ManualEntryResponse(
        id=str(db_entry.manual_entry_id),
        companyId=str(first_movement.company_id),
        category=first_movement.category,
        type=first_movement.type,
        reference=first_movement.reference,
        referenceType=first_movement.reference_type,
        amount=float(first_movement.amount),
        sign=first_movement.sign,
        frequency=db_entry.frequency,
        start_date=db_entry.start_date.isoformat(),
        end_date=db_entry.end_date.isoformat() if db_entry.end_date else None,
        note=first_movement.note,
        visibility=first_movement.visibility,
        status=first_movement.status,
        createdBy=first_movement.creator.display_name if first_movement.creator else "",
        createdAt=first_movement.created_at.isoformat(),
        updatedBy=None,
        updatedAt=None,
        referenceState=first_movement.reference_status
    )

@router.put("/{id}", response_model=schemas.ManualEntryResponse)
def update_manual_entry(id: str, entry: schemas.ManualEntryUpdate, db: Session = Depends(get_db)):
    db_entry = db.query(models.ManualEntry).filter(models.ManualEntry.manual_entry_id == int(id)).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Manual entry not found")
    
    # Update manual entry
    if entry.frequency:
        db_entry.frequency = entry.frequency
    if entry.dates:
        db_entry.dates_list = entry.dates
    
    # Update associated movement
    movement = db.query(models.Movement).filter(
        models.Movement.manual_entry_id == db_entry.manual_entry_id
    ).first()
    
    if movement:
        if entry.category:
            movement.category = entry.category
        if entry.type:
            movement.type = entry.type
        if entry.amount is not None:
            movement.amount = entry.amount
        if entry.sign:
            movement.sign = entry.sign
        if entry.note is not None:
            movement.note = entry.note
        if entry.visibility:
            movement.visibility = entry.visibility
        if entry.status:
            movement.status = entry.status
        if entry.reference:
            movement.reference = entry.reference
        if entry.reference_type:
            movement.reference_type = entry.reference_type
        
        movement.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_entry)
    
    return schemas.ManualEntryResponse(
        id=str(db_entry.manual_entry_id),
        companyId=str(movement.company_id),
        category=movement.category,
        type=movement.type,
        reference=movement.reference,
        referenceType=movement.reference_type,
        amount=float(movement.amount),
        sign=movement.sign,
        frequency=db_entry.frequency,
        dates=db_entry.dates_list if isinstance(db_entry.dates_list, list) else [],
        note=movement.note,
        visibility=movement.visibility,
        status=movement.status,
        createdBy=movement.creator.display_name if movement.creator else "",
        createdAt=movement.created_at.isoformat(),
        updatedBy=None,
        updatedAt=movement.updated_at.isoformat() if movement.updated_at else None,
        referenceState=movement.reference_status
    )

@router.post("/delete")
def delete_manual_entries(data: schemas.ManualEntryDelete, db: Session = Depends(get_db)):
    for entry_id in data.ids:
        # Delete associated movements first
        db.query(models.Movement).filter(
            models.Movement.manual_entry_id == int(entry_id)
        ).delete()
        
        # Delete manual entry
        db.query(models.ManualEntry).filter(
            models.ManualEntry.manual_entry_id == int(entry_id)
        ).delete()
    
    db.commit()
    return {"message": "Manual entries deleted successfully"}

@router.get("/{id}/movements", response_model=List[schemas.MovementResponse])
def get_manual_entry_movements(id: str, db: Session = Depends(get_db)):
    movements = db.query(models.Movement).filter(
        models.Movement.manual_entry_id == int(id)
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
            visibility=m.visibility,
            status=m.status,
            createdBy=m.creator.display_name if m.creator else None,
            createdAt=m.created_at.isoformat() if m.created_at else None,
            updatedAt=m.updated_at.isoformat() if m.updated_at else None,
        )
        for m in movements
    ]
