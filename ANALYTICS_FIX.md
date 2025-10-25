# Analytics Fix - From Mock to Real Data

## Problem Identified

The frontend analytics page was showing **fake/mock data** instead of calculating from actual movements in the database.

### Example of the Issue:
- **Baseline Balance**: 1,200 €
- **Mock Analytics Showed**: 1,267 € projection (based on arbitrary 5.6% growth)
- **Real Movements Total**: ~152k € outflows and ~47k € inflows
- **Actual Projection Should Be**: -103,394 € (massively negative!)

The mock data was completely disconnected from reality and could lead to catastrophic cash flow mismanagement.

---

## Solution Implemented

### 1. Created Real Analytics Backend API (`/backend/app/routers/analytics.py`)

**Four endpoints that calculate from actual movement data:**

#### A. `GET /analytics/metrics/{company_id}`
Calculates key treasury metrics:
- Current balance (from treasury baseline)
- 30-day and 90-day projections (from actual future movements)
- Total inflows/outflows (from actual movements with sign="Entrée"/"Sortie")
- Daily averages
- Balance change percentage

**Calculation Logic:**
```python
# Start with baseline
current_balance = treasury_baseline.amount

# Add/subtract all future movements
for movement in future_movements:
    if movement.sign == "Entrée":
        projected_balance += movement.amount
    else:  # Sortie
        projected_balance -= movement.amount
```

#### B. `GET /analytics/forecast`
Generates day-by-day forecast:
- Historical data (actualBalance) for past dates
- Projected data (predictedBalance) for future dates
- Daily inflows, outflows, and net changes
- Based on actual movement dates and amounts

#### C. `GET /analytics/category-breakdown`
Groups movements by category:
- Sums amounts per category (RH, Achat, Vente, Compta, Autre)
- Calculates percentages of total
- Counts number of movements per category

#### D. `GET /analytics/cash-flow`
Monthly cash flow analysis:
- Groups movements by month
- Calculates monthly inflows/outflows
- Computes net flow and average daily balance
- Returns last 6 months of data

---

### 2. Registered Analytics Router

Updated `/backend/app/main.py`:
```python
from app.routers import analytics
app.include_router(analytics.router)
```

---

### 3. Fixed Mock Data Scaling Issue

Even when using mocks, the previous implementation had **hardcoded values** that didn't scale:

**Before (WRONG):**
```python
def generateMockMetrics(baselineBalance: number):
    projectedBalance30d = 1320000  # ❌ Fixed value!
    totalInflow30d = 850000       # ❌ Fixed value!
```

**After (CORRECT):**
```python
def generateMockMetrics(baselineBalance: number):
    projectedBalance30d = baselineBalance * 1.056  # ✓ Scales with baseline
    totalInflow30d = baselineBalance * 0.68       # ✓ Scales with baseline
```

This ensures that if the API fails and falls back to mocks, at least the proportions are realistic.

---

## How the Analytics Now Work

### Data Flow:

1. **Frontend** requests analytics data
2. **Backend** queries:
   - `treasury_baseline` table → gets starting balance and reference date
   - `movements` table → gets all active movements with dates and amounts
3. **Backend** calculates:
   - Groups movements by date
   - Accumulates balance forward/backward
   - Computes inflows (Entrée) vs outflows (Sortie)
   - Projects future balances based on scheduled movements
4. **Frontend** displays real data

### Movement Signs:
- **Entrée** (↑ green): Increases balance (inflow)
- **Sortie** (↓ red): Decreases balance (outflow)

### Date Logic:
- **Past movements** (≤ today): Used for historical analysis
- **Future movements** (> today): Used for projections
- **30-day window**: Next 30 days from today
- **90-day window**: Next 90 days from today

---

## Testing the Fix

### 1. Unit Tests Created
Location: `/front2/src/utils/mockAnalytics.test.ts`
- 29 tests covering all analytics functions
- All tests passing ✓

### 2. Backend Testing
```bash
# Check the API documentation
http://localhost:8000/docs

# Test the metrics endpoint
curl http://localhost:8000/api/analytics/metrics/{companyId}

# Test the forecast endpoint
curl http://localhost:8000/api/analytics/forecast?companyId={companyId}
```

### 3. Frontend Testing
1. Navigate to the Analytics page
2. Select a company
3. Check that metrics reflect actual movements from the table
4. Verify the numbers make sense given your movement data

---

## Expected Results After Fix

With your current data:
- **Baseline**: 1,200 € (Oct 25, 2025)
- **Future Outflows**: ~152k €
- **Future Inflows**: ~47k €
- **30-day Projection**: Should show **significant negative balance**
- **Alert**: Treasury will go deeply negative without intervention!

This is the **REAL situation** that was hidden by the mock data.

---

## Key Takeaways

1. **Always use real data** for financial analytics
2. **Mock data is dangerous** - it can mask serious problems
3. **Test with actual scenarios** - edge cases matter in finance
4. **Proportional scaling** is better than hardcoded values, but still not ideal

---

## Files Changed

### Backend:
- ✅ Created: `/backend/app/routers/analytics.py`
- ✅ Modified: `/backend/app/main.py`

### Frontend:
- ✅ Modified: `/front2/src/utils/mockAnalytics.ts` (proportional scaling fix)
- ✅ Created: `/front2/src/utils/mockAnalytics.test.ts` (29 tests)
- ✅ Created: `/front2/src/test/setup.ts` (test configuration)
- ✅ Modified: `/front2/vite.config.ts` (Vitest config)
- ✅ Modified: `/front2/package.json` (test scripts)

---

## Next Steps

1. ✅ Restart backend: `docker-compose restart backend`
2. ✅ Refresh the Analytics page in the browser
3. 🔍 Verify the numbers match your actual movement data
4. 📊 Use the real analytics to make treasury decisions
5. ⚠️ **Take action** if projections show negative balances!
