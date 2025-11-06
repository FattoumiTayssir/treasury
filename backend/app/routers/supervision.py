"""
Supervision API Router
Admin-only endpoint for viewing audit logs of changes to movements, manual entries, and data refresh
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime

from app.database import get_db
from app.auth_utils import get_current_admin_user
from app import models, schemas

router = APIRouter(prefix="/supervision", tags=["Supervision"])


@router.get("/logs", response_model=List[schemas.SupervisionLogResponse])
def get_supervision_logs(
    entity_type: Optional[str] = Query(None, description="Filter by entity type: movement, manual_entry, data_refresh"),
    action: Optional[str] = Query(None, description="Filter by action"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    company_id: Optional[int] = Query(None, description="Filter by company ID"),
    date_from: Optional[str] = Query(None, description="Filter from date (ISO format)"),
    date_to: Optional[str] = Query(None, description="Filter to date (ISO format)"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of logs to return"),
    offset: int = Query(0, ge=0, description="Number of logs to skip"),
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get supervision logs with optional filters (Admin only)
    Returns audit logs for movements, manual entries, and data refresh activities
    """
    query = db.query(models.SupervisionLog)
    
    # Apply filters
    if entity_type:
        query = query.filter(models.SupervisionLog.entity_type == entity_type)
    
    if action:
        query = query.filter(models.SupervisionLog.action == action)
    
    if user_id:
        query = query.filter(models.SupervisionLog.user_id == user_id)
    
    if company_id:
        query = query.filter(models.SupervisionLog.company_id == company_id)
    
    if date_from:
        query = query.filter(models.SupervisionLog.timestamp >= datetime.fromisoformat(date_from))
    
    if date_to:
        query = query.filter(models.SupervisionLog.timestamp <= datetime.fromisoformat(date_to))
    
    # Order by most recent first
    query = query.order_by(desc(models.SupervisionLog.timestamp))
    
    # Apply pagination
    query = query.offset(offset).limit(limit)
    
    logs = query.all()
    
    # Format response
    return [
        schemas.SupervisionLogResponse(
            logId=log.log_id,
            entityType=log.entity_type,
            entityId=log.entity_id,
            action=log.action,
            userId=log.user_id,
            userName=log.user_name,
            timestamp=log.timestamp,
            details=log.details,
            description=log.description,
            companyId=log.company_id
        )
        for log in logs
    ]


@router.get("/stats")
def get_supervision_stats(
    current_user: models.User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get statistics about supervision logs (Admin only)
    """
    from sqlalchemy import func
    
    # Total logs
    total_logs = db.query(func.count(models.SupervisionLog.log_id)).scalar()
    
    # Logs by entity type
    logs_by_entity = db.query(
        models.SupervisionLog.entity_type,
        func.count(models.SupervisionLog.log_id).label('count')
    ).group_by(models.SupervisionLog.entity_type).all()
    
    # Logs by action
    logs_by_action = db.query(
        models.SupervisionLog.action,
        func.count(models.SupervisionLog.log_id).label('count')
    ).group_by(models.SupervisionLog.action).all()
    
    # Most active users
    top_users = db.query(
        models.SupervisionLog.user_name,
        func.count(models.SupervisionLog.log_id).label('count')
    ).group_by(models.SupervisionLog.user_name).order_by(desc('count')).limit(10).all()
    
    return {
        "totalLogs": total_logs,
        "logsByEntity": [{"entityType": e, "count": c} for e, c in logs_by_entity],
        "logsByAction": [{"action": a, "count": c} for a, c in logs_by_action],
        "topUsers": [{"userName": u, "count": c} for u, c in top_users]
    }


# Helper function to create supervision logs (to be called from other routers)
def create_supervision_log(
    db: Session,
    entity_type: str,
    action: str,
    user: models.User,
    entity_id: Optional[int] = None,
    details: Optional[dict] = None,
    description: Optional[str] = None,
    company_id: Optional[int] = None
):
    """
    Helper function to create a supervision log entry
    Can be called from other routers when tracking changes
    """
    log = models.SupervisionLog(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        user_id=user.user_id,
        user_name=user.display_name,
        details=details,
        description=description,
        company_id=company_id
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
