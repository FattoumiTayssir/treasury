from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/users", tags=["users"])

@router.get("", response_model=List[schemas.UserResponse])
def get_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    
    return [
        schemas.UserResponse(
            id=str(u.user_id),
            name=u.display_name,
            email=u.email,
            role=u.role,
            companies=[str(uc.company_id) for uc in u.user_companies]
        )
        for u in users
    ]

@router.get("/me", response_model=schemas.UserResponse)
def get_current_user(db: Session = Depends(get_db)):
    # For demo purposes, return the first user
    # In production, extract user_id from JWT token
    user = db.query(models.User).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return schemas.UserResponse(
        id=str(user.user_id),
        name=user.display_name,
        email=user.email,
        role=user.role,
        companies=[str(uc.company_id) for uc in user.user_companies]
    )

@router.get("/{id}", response_model=schemas.UserResponse)
def get_user(id: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.user_id == int(id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return schemas.UserResponse(
        id=str(user.user_id),
        name=user.display_name,
        email=user.email,
        role=user.role,
        companies=[str(uc.company_id) for uc in user.user_companies]
    )

@router.post("", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = models.User(
        display_name=user.display_name,
        email=user.email,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return schemas.UserResponse(
        id=str(db_user.user_id),
        name=db_user.display_name,
        email=db_user.email,
        role=db_user.role,
        companies=[]
    )

@router.put("/{id}", response_model=schemas.UserResponse)
def update_user(id: str, user: schemas.UserUpdate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.user_id == int(id)).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.display_name is not None:
        db_user.display_name = user.display_name
    if user.email is not None:
        db_user.email = user.email
    if user.role is not None:
        db_user.role = user.role
    
    db.commit()
    db.refresh(db_user)
    
    return schemas.UserResponse(
        id=str(db_user.user_id),
        name=db_user.display_name,
        email=db_user.email,
        role=db_user.role,
        companies=[str(uc.company_id) for uc in db_user.user_companies]
    )

@router.delete("/{id}")
def delete_user(id: str, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.user_id == int(id)).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(db_user)
    db.commit()
    return {"message": "User deleted successfully"}
