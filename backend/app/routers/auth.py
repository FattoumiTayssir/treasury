from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=schemas.LoginResponse)
def login(credentials: schemas.LoginRequest, db: Session = Depends(get_db)):
    # Simple mock authentication - in production, use proper password hashing and JWT
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    
    if not user:
        # For demo purposes, create a default user if not exists
        user = models.User(
            display_name="Demo User",
            email=credentials.email,
            role="Admin"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Mock token
    token = f"mock_token_{user.user_id}"
    
    return schemas.LoginResponse(
        token=token,
        user=schemas.UserResponse(
            id=str(user.user_id),
            name=user.display_name,
            email=user.email,
            role=user.role,
            companies=[str(uc.company_id) for uc in user.user_companies]
        )
    )

@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}

@router.post("/refresh", response_model=schemas.RefreshTokenResponse)
def refresh_token():
    # Mock token refresh
    return schemas.RefreshTokenResponse(token="refreshed_mock_token")
