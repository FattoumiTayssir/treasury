from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.database import get_db
from app import models
from datetime import datetime, timedelta
from decimal import Decimal
from collections import defaultdict

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/metrics/{company_id}")
def get_metrics(company_id: str, db: Session = Depends(get_db)):
    """Calculate treasury metrics from actual movements and baseline"""
    
    # Get treasury baseline
    treasury_baseline = db.query(models.TreasuryBalance).filter(
        models.TreasuryBalance.company_id == company_id
    ).first()
    
    if not treasury_baseline:
        return {
            "error": "No treasury baseline found for this company"
        }
    
    current_balance = float(treasury_baseline.amount)
    reference_date = treasury_baseline.reference_date
    
    # Get all active movements for this company (excluding those marked to exclude from analytics)
    movements = db.query(models.Movement).filter(
        models.Movement.company_id == company_id,
        models.Movement.status == "Actif",
        models.Movement.exclude_from_analytics == False
    ).all()
    
    # Calculate date ranges
    today = datetime.now().date()
    date_30_days_ago = today - timedelta(days=30)
    date_30_days_future = today + timedelta(days=30)
    date_90_days_future = today + timedelta(days=90)
    
    # Initialize counters
    total_inflow_30d = Decimal(0)
    total_outflow_30d = Decimal(0)
    projected_balance_30d = Decimal(current_balance)
    projected_balance_90d = Decimal(current_balance)
    
    # Calculate flows and projections from movements
    for movement in movements:
        movement_date = movement.movement_date
        amount = movement.amount
        
        # For 30-day metrics (future movements only)
        if today < movement_date <= date_30_days_future:
            if movement.sign == "Entrée":
                total_inflow_30d += amount
            else:  # Sortie
                total_outflow_30d += amount
        
        # For 30-day projection (all future movements up to 30 days)
        if today < movement_date <= date_30_days_future:
            if movement.sign == "Entrée":
                projected_balance_30d += amount
            else:  # Sortie
                projected_balance_30d -= amount
        
        # For 90-day projection (all future movements up to 90 days)
        if today < movement_date <= date_90_days_future:
            if movement.sign == "Entrée":
                projected_balance_90d += amount
            else:  # Sortie
                projected_balance_90d -= amount
    
    # Calculate derived metrics
    net_cash_flow_30d = total_inflow_30d - total_outflow_30d
    avg_daily_inflow = float(total_inflow_30d) / 30 if total_inflow_30d > 0 else 0
    avg_daily_outflow = float(total_outflow_30d) / 30 if total_outflow_30d > 0 else 0
    balance_change_30d = float(projected_balance_30d) - current_balance
    balance_change_percent_30d = (balance_change_30d / current_balance * 100) if current_balance != 0 else 0
    
    return {
        "currentBalance": current_balance,
        "projectedBalance30d": float(projected_balance_30d),
        "projectedBalance90d": float(projected_balance_90d),
        "totalInflow30d": float(total_inflow_30d),
        "totalOutflow30d": float(total_outflow_30d),
        "netCashFlow30d": float(net_cash_flow_30d),
        "avgDailyInflow": round(avg_daily_inflow, 2),
        "avgDailyOutflow": round(avg_daily_outflow, 2),
        "balanceChange30d": round(balance_change_30d, 2),
        "balanceChangePercent30d": round(balance_change_percent_30d, 2)
    }


@router.get("/forecast")
def get_forecast(
    company_id: str = Query(..., alias="companyId"),
    date_from: Optional[str] = Query(None, alias="dateFrom"),
    date_to: Optional[str] = Query(None, alias="dateTo"),
    forecast_days: int = Query(90, alias="forecastDays"),
    db: Session = Depends(get_db)
):
    """Generate forecast with actual and predicted balances from movements"""
    
    # Get treasury baseline
    treasury_baseline = db.query(models.TreasuryBalance).filter(
        models.TreasuryBalance.company_id == company_id
    ).first()
    
    if not treasury_baseline:
        return []
    
    baseline_balance = float(treasury_baseline.amount)
    reference_date = treasury_baseline.reference_date
    
    # Get all active movements (excluding those marked to exclude from analytics)
    movements = db.query(models.Movement).filter(
        models.Movement.company_id == company_id,
        models.Movement.status == "Actif",
        models.Movement.exclude_from_analytics == False
    ).order_by(models.Movement.movement_date).all()
    
    # Create a dictionary of movements by date
    movements_by_date = defaultdict(lambda: {"inflow": 0, "outflow": 0})
    for movement in movements:
        date_str = movement.movement_date.isoformat()
        if movement.sign == "Entrée":
            movements_by_date[date_str]["inflow"] += float(movement.amount)
        else:
            movements_by_date[date_str]["outflow"] += float(movement.amount)
    
    # Generate forecast data
    forecast_data = []
    today = datetime.now().date()
    
    # Use provided date range or defaults
    if date_from:
        start_date = datetime.fromisoformat(date_from).date()
    else:
        start_date = today - timedelta(days=30)
    
    if date_to:
        end_date = datetime.fromisoformat(date_to).date()
    else:
        end_date = today + timedelta(days=forecast_days)
    
    current_balance = baseline_balance
    current_date = start_date
    
    while current_date <= end_date:
        date_str = current_date.isoformat()
        inflow = movements_by_date.get(date_str, {}).get("inflow", 0)
        outflow = movements_by_date.get(date_str, {}).get("outflow", 0)
        net_change = inflow - outflow
        
        # Determine if this is historical or future
        is_past = current_date <= today
        
        forecast_data.append({
            "date": date_str,
            "actualBalance": current_balance if is_past else None,
            "baselineBalance": round(baseline_balance, 2),  # Constant baseline for reference
            "predictedBalance": round(current_balance + net_change, 2),
            "inflow": round(inflow, 2),
            "outflow": round(outflow, 2),
            "netChange": round(net_change, 2)
        })
        
        current_balance += net_change
        current_date += timedelta(days=1)
    
    return forecast_data


@router.get("/category-breakdown")
def get_category_breakdown(
    company_id: str = Query(..., alias="companyId"),
    date_from: Optional[str] = Query(None, alias="dateFrom"),
    date_to: Optional[str] = Query(None, alias="dateTo"),
    db: Session = Depends(get_db)
):
    """Get breakdown of movements by category"""
    
    # Build query
    query = db.query(
        models.Movement.category,
        func.sum(models.Movement.amount).label("total_amount"),
        func.count(models.Movement.movement_id).label("count")
    ).filter(
        models.Movement.company_id == company_id,
        models.Movement.status == "Actif",
        models.Movement.exclude_from_analytics == False
    )
    
    # Apply date filters if provided
    if date_from:
        query = query.filter(models.Movement.movement_date >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.filter(models.Movement.movement_date <= datetime.fromisoformat(date_to))
    
    # Group by category
    results = query.group_by(models.Movement.category).all()
    
    # Calculate total for percentages
    total_amount = sum(float(r.total_amount) for r in results)
    
    # Format response
    breakdown = []
    for result in results:
        amount = float(result.total_amount)
        percentage = (amount / total_amount * 100) if total_amount > 0 else 0
        
        breakdown.append({
            "category": result.category,
            "amount": round(amount, 2),
            "percentage": round(percentage, 2),
            "count": result.count
        })
    
    # Sort by amount descending
    breakdown.sort(key=lambda x: x["amount"], reverse=True)
    
    return breakdown


@router.get("/cash-flow")
def get_cash_flow_analysis(
    company_id: str = Query(..., alias="companyId"),
    date_from: Optional[str] = Query(None, alias="dateFrom"),
    date_to: Optional[str] = Query(None, alias="dateTo"),
    db: Session = Depends(get_db)
):
    """Get monthly cash flow analysis"""
    
    # Get treasury baseline
    treasury_baseline = db.query(models.TreasuryBalance).filter(
        models.TreasuryBalance.company_id == company_id
    ).first()
    
    if not treasury_baseline:
        return []
    
    # Get all active movements (excluding those marked to exclude from analytics)
    movements = db.query(models.Movement).filter(
        models.Movement.company_id == company_id,
        models.Movement.status == "Actif",
        models.Movement.exclude_from_analytics == False
    ).order_by(models.Movement.movement_date).all()
    
    # Apply date filters to movements if provided
    filtered_movements = movements
    if date_from:
        from_date = datetime.fromisoformat(date_from).date()
        filtered_movements = [m for m in filtered_movements if m.movement_date >= from_date]
    if date_to:
        to_date = datetime.fromisoformat(date_to).date()
        filtered_movements = [m for m in filtered_movements if m.movement_date <= to_date]
    
    # Group movements by month
    monthly_data = defaultdict(lambda: {
        "inflow": 0,
        "outflow": 0,
        "balances": []
    })
    
    baseline_balance = float(treasury_baseline.amount)
    running_balance = baseline_balance
    
    for movement in filtered_movements:
        month_key = movement.movement_date.strftime("%b %Y")
        amount = float(movement.amount)
        
        if movement.sign == "Entrée":
            monthly_data[month_key]["inflow"] += amount
            running_balance += amount
        else:
            monthly_data[month_key]["outflow"] += amount
            running_balance -= amount
        
        monthly_data[month_key]["balances"].append(running_balance)
    
    # Get unique months from filtered movements, sorted
    if filtered_movements:
        unique_months = sorted(set(m.movement_date.strftime("%b %Y") for m in filtered_movements))
    else:
        # If no movements in range, show current month
        unique_months = [datetime.now().strftime("%b %Y")]
    
    cash_flow = []
    
    for month_key in unique_months:
        
        data = monthly_data.get(month_key, {"inflow": 0, "outflow": 0, "balances": [baseline_balance]})
        inflow = data["inflow"]
        outflow = data["outflow"]
        net_flow = inflow - outflow
        avg_daily_balance = sum(data["balances"]) / len(data["balances"]) if data["balances"] else baseline_balance
        
        cash_flow.append({
            "period": month_key,
            "inflow": round(inflow, 2),
            "outflow": round(outflow, 2),
            "netFlow": round(net_flow, 2),
            "avgDailyBalance": round(avg_daily_balance, 2)
        })
    
    return cash_flow
