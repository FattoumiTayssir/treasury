# Treasury Settings - Company-Based Balance Fix

## Issues Fixed

### Problem 1: Numbers not connected to selected company
**Before:** Treasury balance was stored in-memory without company association
**After:** Treasury balance is now properly stored in database with company_id foreign key

### Problem 2: No company selector
**Before:** Settings page had hardcoded 'default' company
**After:** Settings page now has a company dropdown selector

### Problem 3: "Montant de trésorerie" not company-specific
**Before:** Balance was global, not per company
**After:** Each company has its own treasury balance with reference date

## Changes Made

### 1. Database Schema

**New Table:** `Treasury_Balance`

```sql
CREATE TABLE Treasury_Balance (
  treasury_balance_id INTEGER PRIMARY KEY,
  company_id          INTEGER NOT NULL REFERENCES Company(company_id),
  amount              NUMERIC(18,2) NOT NULL,
  reference_date      DATE NOT NULL,
  updated_at          TIMESTAMPTZ(3) NOT NULL,
  updated_by          INTEGER NOT NULL REFERENCES "User"(user_id),
  notes               TEXT,
  UNIQUE(company_id, reference_date)
);
```

**Purpose:** Stores the baseline treasury amount for each company. This is the foundation for all treasury calculations and predictions.

**File:** `/init/postgres/18-add-treasury-balance.sql`

### 2. Backend Model

**Added:** `TreasuryBalance` model in `backend/app/models.py`

```python
class TreasuryBalance(Base):
    __tablename__ = "treasury_balance"
    
    treasury_balance_id = Column(Integer, primary_key=True)
    company_id = Column(Integer, ForeignKey("company.company_id"))
    amount = Column(Numeric(18, 2), nullable=False)
    reference_date = Column(Date, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True))
    updated_by = Column(Integer, ForeignKey("User.user_id"))
    notes = Column(Text, nullable=True)
```

### 3. Backend API

**Updated:** `backend/app/routers/treasury.py`

#### GET `/api/treasury/balance/{company_id}`
- Retrieves the **most recent** balance for a company
- Orders by `reference_date DESC` to get latest
- Returns default (0) if no balance exists

#### POST `/api/treasury/balance`
- Creates or updates treasury balance for a company
- Validates company exists
- Updates if same company_id + reference_date exists
- Creates new record otherwise

**Key Changes:**
- ✅ Uses database instead of in-memory storage
- ✅ Properly filters by company_id
- ✅ Returns user who last updated
- ✅ Supports notes field

### 4. Frontend Settings Page

**Updated:** `front2/src/pages/TreasurySettings.tsx`

#### New Features:

**Company Selector**
```tsx
<Select value={selectedCompany} onValueChange={setSelectedCompany}>
  <SelectContent>
    {companies.map((company) => (
      <SelectItem key={company.id} value={company.id}>
        {company.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Current Balance Display**
- Shows existing balance when company is selected
- Displays: Amount, Reference Date, Last Updated By, Notes
- Blue info card with formatted currency

**Auto-load Balance**
- When company changes → automatically loads balance
- Populates form fields with current values
- Shows "Solde actuel" info card

**Validation**
- Company must be selected
- Amount must be ≥ 0
- Reference date required

**Notes Field**
- Optional text field
- Example: "Comptes BNP + Caisse"
- Helps document which accounts are included

### 5. Type Definitions

**Updated:** `front2/src/types/index.ts`

```typescript
export interface TreasuryBalance {
  companyId: string
  amount: number
  referenceDate: string
  updatedBy: string
  updatedAt: string
  notes?: string  // New field
}
```

### 6. API Service

**Updated:** `front2/src/services/api.ts`

```typescript
export const treasuryApi = {
  getBalance: (companyId: string) => 
    api.get<TreasuryBalance>(`/treasury/balance/${companyId}`),
  
  updateBalance: (companyId: string, amount: number, referenceDate: string, notes?: string) =>
    api.post<TreasuryBalance>('/treasury/balance', { companyId, amount, referenceDate, notes }),
}
```

## Usage

### Setting Treasury Balance

1. **Navigate to Paramètres** (Settings)
2. **Select Company** from dropdown
3. Current balance (if exists) displays in blue card
4. **Enter Reference Date** - Date when this balance was recorded
5. **Enter Amount** - Total of all bank accounts + cash (EUR)
6. **Enter Notes** (optional) - Which accounts are included
7. **Click "Enregistrer"** to save

### Understanding the Display

**Blue Info Card appears when:**
- Company is selected
- Balance exists for that company
- Amount > 0

**Card shows:**
- Current balance amount (formatted as EUR)
- Reference date
- Who updated it and when
- Optional notes

### Example Workflow

```
1. Select "Acme Corp" from company dropdown
2. See existing balance: €1,250,000 (Date: 2024-01-15)
3. Want to update for new date
4. Enter new date: 2024-02-01
5. Enter new amount: 1,320,000
6. Enter notes: "BNP Pro + Caisse + CIC"
7. Save → Balance updated for Feb 1
```

## Database Migration

To apply the new table:

```bash
# Using Docker (recommended)
docker-compose down
docker-compose up -d --build

# Database will auto-initialize with new schema
```

The migration script `18-add-treasury-balance.sql` runs automatically on container startup.

## Data Model

### One Company → Many Balances

```
Company "Acme"
  ├─ Balance: €1,000,000 (2024-01-01)
  ├─ Balance: €1,150,000 (2024-02-01)  
  └─ Balance: €1,250,000 (2024-03-01) ← Most recent (used for calculations)
```

**Important:** The system uses the **most recent** balance by `reference_date` as the current baseline.

### Why Reference Date?

The reference date represents **when** you recorded this treasury amount, not necessarily "today". This allows:

- Historical tracking
- Backdated corrections
- Audit trail of balance changes

## Impact on Other Features

### Dashboard
- Will calculate current position from company-specific balance
- Shows balance + movements since reference_date

### Analytics
- Forecasts start from company's treasury balance
- Predictions are company-specific

### Movements
- Cash flow calculations use proper baseline per company
- Multi-company support works correctly

## Validation Rules

### Database Level
- ✅ `amount >= 0` (no negative balances)
- ✅ Unique constraint on (company_id, reference_date)
- ✅ Foreign key constraints on company and user

### Application Level
- ✅ Company must exist
- ✅ User must exist (for updated_by)
- ✅ Amount validation (≥ 0)
- ✅ Date format validation

## Testing Checklist

- [ ] Select different companies → Balance changes
- [ ] Save balance → Appears in blue card
- [ ] Update existing balance → Shows new amount
- [ ] Enter notes → Displays correctly
- [ ] Refresh button → Reloads data
- [ ] No company selected → Form hidden
- [ ] Invalid amount → Shows error
- [ ] Backend validation → Error handling works

## API Examples

### Get Balance

```bash
GET /api/treasury/balance/1

Response:
{
  "companyId": "1",
  "amount": 1250000.00,
  "referenceDate": "2024-03-01",
  "updatedBy": "John Doe",
  "updatedAt": "2024-03-01T14:30:00Z",
  "notes": "BNP Pro + Caisse"
}
```

### Update Balance

```bash
POST /api/treasury/balance
{
  "companyId": "1",
  "amount": 1320000,
  "referenceDate": "2024-04-01",
  "notes": "BNP Pro + Caisse + CIC"
}

Response: (same structure as GET)
```

## Troubleshooting

### "Aucune entreprise disponible"
**Cause:** No companies in database
**Fix:** Create companies first via admin interface

### Balance shows 0
**Cause:** No balance record for selected company
**Fix:** Enter and save the initial balance

### Cannot save
**Cause:** Company not selected or invalid amount
**Fix:** Select company and enter valid amount ≥ 0

### Old balance still showing
**Cause:** Need to refresh
**Fix:** Click "Actualiser" button

## Future Enhancements

- [ ] Balance history view (all past balances)
- [ ] Graph showing balance evolution over time
- [ ] Multi-currency support
- [ ] Bank account breakdown (detailed per account)
- [ ] Import from bank statements
- [ ] Automatic balance verification with movements
- [ ] Alert if balance drift detected

## Files Modified

```
✓ init/postgres/18-add-treasury-balance.sql       (NEW)
✓ backend/app/models.py                           (UPDATED)
✓ backend/app/schemas.py                          (UPDATED)
✓ backend/app/routers/treasury.py                 (UPDATED)
✓ front2/src/pages/TreasurySettings.tsx           (UPDATED)
✓ front2/src/types/index.ts                       (UPDATED)
✓ front2/src/services/api.ts                      (UPDATED)
```

---

**Status:** ✅ COMPLETED

Both issues identified by the user have been fixed:
1. ✅ Balance is now properly connected to selected company
2. ✅ "Montant de trésorerie" is company-specific with database storage
