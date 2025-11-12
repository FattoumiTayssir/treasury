from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.auth_utils import (
    get_current_admin_user,
    get_current_user,
    get_password_hash,
    verify_password
)

router = APIRouter(prefix="/users", tags=["users"])

def build_user_response(user: models.User) -> schemas.UserResponse:
    """Helper function to build UserResponse with permissions"""
    permissions = []
    for perm in user.user_permissions:
        permissions.append(schemas.UserTabPermissionResponse(
            tabId=perm.tab.tab_id,
            tabName=perm.tab.tab_name,
            tabLabel=perm.tab.tab_label,
            canView=perm.can_view,
            canModify=perm.can_modify,
            ownDataOnly=perm.own_data_only,
            allowedCategories=perm.allowed_categories
        ))
    
    return schemas.UserResponse(
        id=str(user.user_id),
        name=user.display_name,
        email=user.email,
        role=user.role,
        companies=[str(uc.company_id) for uc in user.user_companies],
        permissions=permissions
    )

@router.get("", response_model=List[schemas.UserResponse])
def get_users(
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all users (Admin only)"""
    users = db.query(models.User).all()
    return [build_user_response(u) for u in users]

@router.get("/tabs", response_model=List[schemas.TabPermissionResponse])
def get_available_tabs(
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all available tabs for permission assignment (Admin only)"""
    tabs = db.query(models.TabPermission).all()
    return [
        schemas.TabPermissionResponse(
            id=t.tab_id,
            name=t.tab_name,
            label=t.tab_label,
            description=t.description
        )
        for t in tabs
    ]

@router.get("/{id}", response_model=schemas.UserResponse)
def get_user(
    id: str,
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get a specific user (Admin only)"""
    user = db.query(models.User).filter(models.User.user_id == int(id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return build_user_response(user)

@router.post("", response_model=schemas.UserResponse)
def create_user(
    user: schemas.UserCreate,
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new user (Admin only)"""
    # Check if email already exists
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password
    password_hash = get_password_hash(user.password)
    
    # Create user
    db_user = models.User(
        display_name=user.display_name,
        email=user.email,
        role=user.role,
        password_hash=password_hash
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return build_user_response(db_user)

@router.put("/{id}", response_model=schemas.UserResponse)
def update_user(
    id: str,
    user_update: schemas.UserWithPermissionsUpdate,
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update user information, companies, and permissions (Admin only)"""
    db_user = db.query(models.User).filter(models.User.user_id == int(id)).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Protect System and Admin users (user_id 1 and 2) from modification
    if int(id) in [1, 2]:
        # Only allow password changes for these users
        if user_update.password is not None:
            db_user.password_hash = get_password_hash(user_update.password)
            db.commit()
            db.refresh(db_user)
            return build_user_response(db_user)
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="System and Admin users cannot be modified. Only password can be changed."
            )
    
    # Update basic info
    if user_update.display_name is not None:
        db_user.display_name = user_update.display_name
    if user_update.email is not None:
        # Check if email is already taken by another user
        existing = db.query(models.User).filter(
            models.User.email == user_update.email,
            models.User.user_id != int(id)
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already taken"
            )
        db_user.email = user_update.email
    if user_update.role is not None:
        db_user.role = user_update.role
    if user_update.password is not None:
        db_user.password_hash = get_password_hash(user_update.password)
    
    # Update companies
    if user_update.companies is not None:
        # Remove existing company associations
        db.query(models.UserCompany).filter(
            models.UserCompany.user_id == int(id)
        ).delete()
        
        # Add new company associations
        for company_id in user_update.companies:
            user_company = models.UserCompany(
                user_id=int(id),
                company_id=company_id
            )
            db.add(user_company)
    
    # Update permissions
    if user_update.permissions is not None:
        # Remove existing permissions
        db.query(models.UserTabPermission).filter(
            models.UserTabPermission.user_id == int(id)
        ).delete()
        
        # Add new permissions
        for perm in user_update.permissions:
            # Get tab by name
            tab = db.query(models.TabPermission).filter(
                models.TabPermission.tab_name == perm.tabName
            ).first()
            
            if tab:
                user_perm = models.UserTabPermission(
                    user_id=int(id),
                    tab_id=tab.tab_id,
                    can_view=perm.canView,
                    can_modify=perm.canModify,
                    own_data_only=perm.ownDataOnly,
                    allowed_categories=perm.allowedCategories
                )
                db.add(user_perm)
    
    db.commit()
    db.refresh(db_user)
    
    return build_user_response(db_user)

@router.delete("/{id}")
def delete_user(
    id: str,
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a user (Admin only)"""
    # Protect System and Admin users (user_id 1 and 2) from deletion
    if int(id) in [1, 2]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="System and Admin users cannot be deleted"
        )
    
    if str(current_user.user_id) == id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    db_user = db.query(models.User).filter(models.User.user_id == int(id)).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(db_user)
    db.commit()
    return {"message": "User deleted successfully"}

@router.post("/change-password")
def change_password(
    password_data: schemas.PasswordChangeRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change password for current user (any authenticated user can access)"""
    # Verify current password
    if not verify_password(password_data.currentPassword, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password
    if len(password_data.newPassword) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 4 characters long"
        )
    
    if password_data.currentPassword == password_data.newPassword:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password"
        )
    
    # Update password
    current_user.password_hash = get_password_hash(password_data.newPassword)
    db.commit()
    
    return {"message": "Password changed successfully"}
