from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/companies", tags=["companies"])

@router.get("", response_model=List[schemas.CompanyResponse])
def get_companies(db: Session = Depends(get_db)):
    companies = db.query(models.Company).all()
    return [
        schemas.CompanyResponse(
            id=str(c.company_id),
            name=c.name
        )
        for c in companies
    ]

@router.get("/{id}", response_model=schemas.CompanyResponse)
def get_company(id: str, db: Session = Depends(get_db)):
    company = db.query(models.Company).filter(models.Company.company_id == int(id)).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    return schemas.CompanyResponse(
        id=str(company.company_id),
        name=company.name
    )
