# Analytics Backend Implementation Example

## FastAPI Endpoint Examples

Here are reference implementations for the analytics API endpoints using FastAPI.

### 1. Forecast Endpoint

```python
# backend/app/routers/analytics.py
from fastapi import APIRouter, Depends, Query
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import FinancialMovement, ManualEntry, TreasuryBalance

router = APIRouter(prefix="/analytics", tags=["analytics"])

class TreasuryForecast(BaseModel):
    date: str
    actualBalance: Optional[float]
    predictedBalance: float
    inflow: float
    outflow: float
    netChange: float

@router.get("/forecast", response_model=List[TreasuryForecast])
async def get_forecast(
    dateFrom: Optional[str] = Query(None),
    dateTo: Optional[str] = Query(None),
    category: Optional[List[str]] = Query(None),
    forecastDays: int = Query(90),
    companyId: str = "default",
    db: Session = Depends(get_db),
):
    """
    Generate treasury forecast based on historical movements and scheduled entries.
    """
    today = datetime.utcnow().date()
    start_date = datetime.fromisoformat(dateFrom).date() if dateFrom else today - timedelta(days=30)
    end_date = datetime.fromisoformat(dateTo).date() if dateTo else today + timedelta(days=forecastDays)
    
    # Get initial balance
    treasury_balance = db.query(TreasuryBalance).filter(
        TreasuryBalance.companyId == companyId
    ).first()
    
    current_balance = treasury_balance.amount if treasury_balance else 0
    forecast_data = []
    
    # Process each date in range
    current_date = start_date
    while current_date <= end_date:
        date_str = current_date.isoformat()
        
        # Get movements for this date
        movements_query = db.query(FinancialMovement).filter(
            FinancialMovement.date == date_str,
            FinancialMovement.status == 'Actif',
            FinancialMovement.companyId == companyId
        )
        
        if category:
            movements_query = movements_query.filter(
                FinancialMovement.category.in_(category)
            )
        
        movements = movements_query.all()
        
        # Calculate inflow/outflow
        inflow = sum(m.amount for m in movements if m.sign == 'Entrée')
        outflow = sum(m.amount for m in movements if m.sign == 'Sortie')
        net_change = inflow - outflow
        
        # Update balance
        current_balance += net_change
        
        # Determine if this is actual or predicted
        is_past = current_date <= today
        actual_balance = current_balance if is_past else None
        predicted_balance = current_balance
        
        # For future dates, add prediction variance based on historical volatility
        if not is_past:
            # Simple prediction: could be enhanced with ML
            historical_volatility = calculate_volatility(db, companyId, days=30)
            predicted_balance += historical_volatility * 0.1  # Add 10% volatility factor
        
        forecast_data.append(
            TreasuryForecast(
                date=date_str,
                actualBalance=actual_balance,
                predictedBalance=predicted_balance,
                inflow=inflow,
                outflow=outflow,
                netChange=net_change,
            )
        )
        
        current_date += timedelta(days=1)
    
    return forecast_data


def calculate_volatility(db: Session, company_id: str, days: int = 30) -> float:
    """Calculate standard deviation of daily net changes."""
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=days)
    
    daily_changes = []
    current_date = start_date
    
    while current_date <= end_date:
        movements = db.query(FinancialMovement).filter(
            FinancialMovement.date == current_date.isoformat(),
            FinancialMovement.companyId == company_id,
            FinancialMovement.status == 'Actif'
        ).all()
        
        net_change = sum(
            m.amount if m.sign == 'Entrée' else -m.amount
            for m in movements
        )
        daily_changes.append(net_change)
        current_date += timedelta(days=1)
    
    # Calculate standard deviation
    if not daily_changes:
        return 0
    
    mean = sum(daily_changes) / len(daily_changes)
    variance = sum((x - mean) ** 2 for x in daily_changes) / len(daily_changes)
    return variance ** 0.5
```

### 2. Category Breakdown Endpoint

```python
class CategoryBreakdown(BaseModel):
    category: str
    amount: float
    percentage: float
    count: int

@router.get("/category-breakdown", response_model=List[CategoryBreakdown])
async def get_category_breakdown(
    dateFrom: Optional[str] = Query(None),
    dateTo: Optional[str] = Query(None),
    category: Optional[List[str]] = Query(None),
    companyId: str = "default",
    db: Session = Depends(get_db),
):
    """
    Get breakdown of movements by category.
    """
    query = db.query(
        FinancialMovement.category,
        func.sum(FinancialMovement.amount).label('total_amount'),
        func.count(FinancialMovement.id).label('count')
    ).filter(
        FinancialMovement.companyId == companyId,
        FinancialMovement.status == 'Actif'
    )
    
    if dateFrom:
        query = query.filter(FinancialMovement.date >= dateFrom)
    if dateTo:
        query = query.filter(FinancialMovement.date <= dateTo)
    if category:
        query = query.filter(FinancialMovement.category.in_(category))
    
    results = query.group_by(FinancialMovement.category).all()
    
    # Calculate total for percentages
    total_amount = sum(r.total_amount for r in results)
    
    breakdown = []
    for result in results:
        percentage = (result.total_amount / total_amount * 100) if total_amount > 0 else 0
        breakdown.append(
            CategoryBreakdown(
                category=result.category,
                amount=result.total_amount,
                percentage=round(percentage, 2),
                count=result.count,
            )
        )
    
    return breakdown
```

### 3. Cash Flow Analysis Endpoint

```python
class CashFlowAnalysis(BaseModel):
    period: str
    inflow: float
    outflow: float
    netFlow: float
    avgDailyBalance: float

@router.get("/cash-flow", response_model=List[CashFlowAnalysis])
async def get_cash_flow_analysis(
    dateFrom: Optional[str] = Query(None),
    dateTo: Optional[str] = Query(None),
    category: Optional[List[str]] = Query(None),
    companyId: str = "default",
    db: Session = Depends(get_db),
):
    """
    Get monthly cash flow analysis.
    """
    start_date = datetime.fromisoformat(dateFrom).date() if dateFrom else datetime.utcnow().date() - timedelta(days=180)
    end_date = datetime.fromisoformat(dateTo).date() if dateTo else datetime.utcnow().date()
    
    # Get movements in date range
    query = db.query(FinancialMovement).filter(
        FinancialMovement.companyId == companyId,
        FinancialMovement.status == 'Actif',
        FinancialMovement.date >= start_date.isoformat(),
        FinancialMovement.date <= end_date.isoformat()
    )
    
    if category:
        query = query.filter(FinancialMovement.category.in_(category))
    
    movements = query.all()
    
    # Group by month
    monthly_data = {}
    
    for movement in movements:
        movement_date = datetime.fromisoformat(movement.date).date()
        period_key = movement_date.strftime('%b %Y')  # e.g., "Jan 2024"
        
        if period_key not in monthly_data:
            monthly_data[period_key] = {
                'inflow': 0,
                'outflow': 0,
                'balances': [],
                'month': movement_date.month,
                'year': movement_date.year,
            }
        
        if movement.sign == 'Entrée':
            monthly_data[period_key]['inflow'] += movement.amount
        else:
            monthly_data[period_key]['outflow'] += movement.amount
    
    # Convert to response format
    cash_flow = []
    for period, data in sorted(
        monthly_data.items(),
        key=lambda x: (x[1]['year'], x[1]['month'])
    ):
        net_flow = data['inflow'] - data['outflow']
        
        # Calculate average daily balance for the month
        # This is simplified - you'd want to calculate actual daily balances
        avg_daily_balance = calculate_avg_monthly_balance(
            db, companyId, data['year'], data['month']
        )
        
        cash_flow.append(
            CashFlowAnalysis(
                period=period,
                inflow=data['inflow'],
                outflow=data['outflow'],
                netFlow=net_flow,
                avgDailyBalance=avg_daily_balance,
            )
        )
    
    return cash_flow


def calculate_avg_monthly_balance(
    db: Session,
    company_id: str,
    year: int,
    month: int
) -> float:
    """Calculate average daily balance for a month."""
    import calendar
    
    # Get treasury balance at start of month
    start_date = datetime(year, month, 1).date()
    days_in_month = calendar.monthrange(year, month)[1]
    
    treasury_balance = db.query(TreasuryBalance).filter(
        TreasuryBalance.companyId == company_id
    ).first()
    
    starting_balance = treasury_balance.amount if treasury_balance else 0
    daily_balances = []
    current_balance = starting_balance
    
    for day in range(1, days_in_month + 1):
        current_date = datetime(year, month, day).date()
        
        # Get movements for this day
        movements = db.query(FinancialMovement).filter(
            FinancialMovement.date == current_date.isoformat(),
            FinancialMovement.companyId == company_id,
            FinancialMovement.status == 'Actif'
        ).all()
        
        for movement in movements:
            if movement.sign == 'Entrée':
                current_balance += movement.amount
            else:
                current_balance -= movement.amount
        
        daily_balances.append(current_balance)
    
    return sum(daily_balances) / len(daily_balances) if daily_balances else 0
```

### 4. Treasury Metrics Endpoint

```python
class TreasuryMetrics(BaseModel):
    currentBalance: float
    projectedBalance30d: float
    projectedBalance90d: float
    totalInflow30d: float
    totalOutflow30d: float
    netCashFlow30d: float
    avgDailyInflow: float
    avgDailyOutflow: float
    balanceChange30d: float
    balanceChangePercent30d: float

@router.get("/metrics/{company_id}", response_model=TreasuryMetrics)
async def get_metrics(
    company_id: str,
    db: Session = Depends(get_db),
):
    """
    Get key treasury metrics.
    """
    today = datetime.utcnow().date()
    date_30d_ago = today - timedelta(days=30)
    date_30d_future = today + timedelta(days=30)
    date_90d_future = today + timedelta(days=90)
    
    # Get current balance
    treasury_balance = db.query(TreasuryBalance).filter(
        TreasuryBalance.companyId == company_id
    ).first()
    
    current_balance = treasury_balance.amount if treasury_balance else 0
    
    # Get movements from last 30 days
    past_movements = db.query(FinancialMovement).filter(
        FinancialMovement.companyId == company_id,
        FinancialMovement.status == 'Actif',
        FinancialMovement.date >= date_30d_ago.isoformat(),
        FinancialMovement.date <= today.isoformat()
    ).all()
    
    total_inflow_30d = sum(m.amount for m in past_movements if m.sign == 'Entrée')
    total_outflow_30d = sum(m.amount for m in past_movements if m.sign == 'Sortie')
    
    # Get movements for next 30 days
    future_movements_30d = db.query(FinancialMovement).filter(
        FinancialMovement.companyId == company_id,
        FinancialMovement.status == 'Actif',
        FinancialMovement.date > today.isoformat(),
        FinancialMovement.date <= date_30d_future.isoformat()
    ).all()
    
    future_inflow_30d = sum(m.amount for m in future_movements_30d if m.sign == 'Entrée')
    future_outflow_30d = sum(m.amount for m in future_movements_30d if m.sign == 'Sortie')
    projected_balance_30d = current_balance + future_inflow_30d - future_outflow_30d
    
    # Get movements for next 90 days
    future_movements_90d = db.query(FinancialMovement).filter(
        FinancialMovement.companyId == company_id,
        FinancialMovement.status == 'Actif',
        FinancialMovement.date > today.isoformat(),
        FinancialMovement.date <= date_90d_future.isoformat()
    ).all()
    
    future_inflow_90d = sum(m.amount for m in future_movements_90d if m.sign == 'Entrée')
    future_outflow_90d = sum(m.amount for m in future_movements_90d if m.sign == 'Sortie')
    projected_balance_90d = current_balance + future_inflow_90d - future_outflow_90d
    
    # Calculate balance change
    balance_30d_ago = current_balance - (total_inflow_30d - total_outflow_30d)
    balance_change_30d = current_balance - balance_30d_ago
    balance_change_percent = (balance_change_30d / balance_30d_ago * 100) if balance_30d_ago != 0 else 0
    
    return TreasuryMetrics(
        currentBalance=current_balance,
        projectedBalance30d=projected_balance_30d,
        projectedBalance90d=projected_balance_90d,
        totalInflow30d=total_inflow_30d,
        totalOutflow30d=total_outflow_30d,
        netCashFlow30d=total_inflow_30d - total_outflow_30d,
        avgDailyInflow=total_inflow_30d / 30,
        avgDailyOutflow=total_outflow_30d / 30,
        balanceChange30d=balance_change_30d,
        balanceChangePercent30d=round(balance_change_percent, 2),
    )
```

### 5. Register Router

```python
# backend/app/main.py
from app.routers import analytics

app.include_router(analytics.router)
```

## Testing the Endpoints

```bash
# Test forecast
curl http://localhost:8000/api/analytics/forecast?forecastDays=90

# Test category breakdown
curl http://localhost:8000/api/analytics/category-breakdown?dateFrom=2024-01-01&dateTo=2024-12-31

# Test cash flow
curl http://localhost:8000/api/analytics/cash-flow

# Test metrics
curl http://localhost:8000/api/analytics/metrics/default
```

## Performance Optimization

For large datasets, consider:

1. **Caching**: Cache frequently accessed metrics
2. **Indexing**: Add database indexes on `date`, `companyId`, `category`
3. **Materialized Views**: Pre-calculate aggregations
4. **Pagination**: For very long date ranges
5. **Background Jobs**: Calculate complex forecasts asynchronously

```python
# Example: Add caching
from fastapi_cache import FastAPICache
from fastapi_cache.decorator import cache

@router.get("/metrics/{company_id}")
@cache(expire=300)  # Cache for 5 minutes
async def get_metrics(company_id: str, db: Session = Depends(get_db)):
    # ... implementation
```
