from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth_utils import (
    verify_password,
    create_access_token,
    get_current_user
)

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=schemas.LoginResponse)
def login(credentials: schemas.LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user and return JWT token
    """
    # Find user by email
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    
    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create access token (sub must be string for JWT validation)
    access_token = create_access_token(data={"sub": str(user.user_id)})
    
    # Get user permissions
    permissions = []
    for perm in user.user_permissions:
        permissions.append(schemas.UserTabPermissionResponse(
            tabId=perm.tab.tab_id,
            tabName=perm.tab.tab_name,
            tabLabel=perm.tab.tab_label,
            canView=perm.can_view,
            canModify=perm.can_modify,
            ownDataOnly=perm.own_data_only
        ))
    
    return schemas.LoginResponse(
        token=access_token,
        user=schemas.UserResponse(
            id=str(user.user_id),
            name=user.display_name,
            email=user.email,
            role=user.role,
            companies=[str(uc.company_id) for uc in user.user_companies],
            permissions=permissions
        )
    )

@router.post("/logout")
def logout():
    """
    Logout endpoint (client should discard token)
    """
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Get current authenticated user information
    """
    # Get user permissions
    permissions = []
    for perm in current_user.user_permissions:
        permissions.append(schemas.UserTabPermissionResponse(
            tabId=perm.tab.tab_id,
            tabName=perm.tab.tab_name,
            tabLabel=perm.tab.tab_label,
            canView=perm.can_view,
            canModify=perm.can_modify
        ))
    
    return schemas.UserResponse(
        id=str(current_user.user_id),
        name=current_user.display_name,
        email=current_user.email,
        role=current_user.role,
        companies=[str(uc.company_id) for uc in current_user.user_companies],
        permissions=permissions
    )
