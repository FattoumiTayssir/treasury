# Treasury Sources Feature - Multiple Sources & Date Management

## Overview

This feature implements comprehensive treasury baseline management with:
1. **Multiple sources per company** (bank accounts, cash, etc.) with individual dates
2. **Date warnings** for past reference dates
3. **Automatic total calculation** from all sources
4. **Clear UI notes** about baseline behavior in analytics

---

## Database Changes

### New Table: `treasury_balance_source`

```sql
CREATE TABLE treasury_balance_source (
    source_id SERIAL PRIMARY KEY,
    treasury_balance_id INTEGER NOT NULL,
    source_name VARCHAR(255) NOT NULL,
    amount NUMERIC(18, 2) NOT NULL,
    source_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT FK_TreasuryBalanceSource_TreasuryBalance 
        FOREIGN KEY (treasury_balance_id) 
        REFERENCES treasury_balance(treasury_balance_id) 
        ON DELETE CASCADE
);
```

**Purpose**: Store individual sources (BNP Account, Caisse, Crédit Agricole, etc.) that make up a treasury balance.

**Key Features**:
- Each source has its own date (`source_date`)
- Multiple sources can be linked to one `treasury_balance`
- Cascade delete when parent balance is deleted

---

## Backend Changes

### Models (`/backend/app/models.py`)

**Updated `TreasuryBalance` model**:
```python
sources = relationship("TreasuryBalanceSource", back_populates="treasury_balance", cascade="all, delete-orphan")
```

**New `TreasuryBalanceSource` model**:
- Stores individual source details
- Links to parent `TreasuryBalance` via foreign key
- Tracks source-specific date and notes

### Schemas (`/backend/app/schemas.py`)

**New schemas**:
```python
class TreasuryBalanceSourceCreate(BaseModel):
    sourceName: str
    amount: float
    sourceDate: str
    notes: Optional[str] = None

class TreasuryBalanceSourceResponse(BaseModel):
    sourceId: int
    sourceName: str
    amount: float
    sourceDate: str
    notes: Optional[str] = None
    createdAt: str
```

**Updated `TreasuryBalanceUpdate`**:
- Added `sources` field to accept array of sources

**Updated `TreasuryBalanceResponse`**:
- Returns `sources` array with all source details

### API Endpoints (`/backend/app/routers/treasury.py`)

**GET `/treasury/balance/{company_id}`**:
- Returns treasury balance with all associated sources
- Sources include name, amount, date, and notes

**POST `/treasury/balance`**:
- Accepts array of sources in request body
- Deletes old sources and creates new ones (replace strategy)
- Calculates total amount from all sources
- Validates each source before saving

---

## Frontend Changes

### Types (`/front2/src/types/index.ts`)

**New interface**:
```typescript
export interface TreasuryBalanceSource {
  sourceId?: number
  sourceName: string
  amount: number
  sourceDate: string
  notes?: string
  createdAt?: string
}
```

**Updated `TreasuryBalance`**:
```typescript
sources?: TreasuryBalanceSource[]
```

### Treasury Settings Page (`/front2/src/pages/TreasurySettings.tsx`)

#### Key Features:

**1. Multiple Sources Management**
- Add unlimited sources with "Ajouter une source" button
- Each source has:
  - Name (e.g., "BNP Paribas", "Caisse")
  - Amount (EUR)
  - Individual date (can differ from general reference date)
  - Optional notes
- Remove sources (minimum 1 required)
- Real-time total calculation displayed

**2. Date Warnings**
- **General reference date warning**: Shows amber alert if date is in the past
- **Per-source date warnings**: Small warning icon for each source with past date
- Warning message explains behavior:
  > "Cette date de référence est dans le passé (il y a X jours). Les analyses utiliseront ce solde comme point de départ mais resteront constant depuis cette date jusqu'à aujourd'hui, car les analyses commencent toujours à partir d'aujourd'hui."

**3. Validation**
- All sources must have a name
- All amounts must be valid and non-negative
- Total amount cannot be negative
- Clear error messages for each validation failure

**4. UI Components**
```
┌─────────────────────────────────────┐
│ Date de référence générale: [date]  │ ← Can be in past (shows warning)
├─────────────────────────────────────┤
│ Sources de Trésorerie               │
│ [+ Ajouter une source]              │
│                                     │
│ ┌──────────────────────────────┐   │
│ │ Source 1            [🗑️]     │   │
│ │ Nom: [BNP Paribas      ]     │   │
│ │ Montant: [50000        ]     │   │
│ │ Date: [2025-10-20] ⚠️        │   │ ← Past date warning
│ │ Notes: [Compte courant ]     │   │
│ └──────────────────────────────┘   │
│                                     │
│ ┌──────────────────────────────┐   │
│ │ Source 2            [🗑️]     │   │
│ │ Nom: [Caisse           ]     │   │
│ │ Montant: [1200         ]     │   │
│ │ Date: [2025-10-25]           │   │
│ │ Notes: [               ]     │   │
│ └──────────────────────────────┘   │
├─────────────────────────────────────┤
│ Montant Total: 51,200 €             │ ← Auto-calculated
│ Somme de toutes les sources (2)     │
└─────────────────────────────────────┘
```

### Analytics Page (`/front2/src/pages/Analytics.tsx`)

**Added baseline date note**:
When reference date is in the past, shows amber warning:

```
⚠️ Note importante: La date de référence est dans le passé (il y a X jours).
Ce solde restera constant depuis cette date jusqu'à aujourd'hui dans les analyses,
car les calculs commencent toujours à partir d'aujourd'hui.
```

**Why this matters**:
- Users need to understand that if baseline is dated 30 days ago, the balance doesn't "move" for those 30 days
- Projections start from "today" forward, not from the baseline date
- Historical gap between baseline date and today shows as flat line

---

## User Workflow

### Setting Up Treasury Sources

1. Navigate to **Paramètres** tab
2. Select company
3. Set general reference date (can be in past)
4. Add sources:
   - Click "+ Ajouter une source"
   - Enter source name (e.g., "BNP Paribas - Compte Courant")
   - Enter amount from bank statement
   - Set date of bank statement (can differ per source)
   - Add notes if needed
5. Review total amount (auto-calculated)
6. Click "Enregistrer"

### Understanding Date Warnings

**When setting a past date**:
- ⚠️ **Warning shown**: Date is in the past
- **What it means**: This balance is "frozen" from that date until today
- **In Analytics**: Gap between baseline date and today shows as constant balance
- **Projections**: Start from today forward using this baseline

**Example Scenario**:
- Today: October 25, 2025
- Baseline date: October 1, 2025 (24 days ago)
- Baseline amount: 50,000 €
- **Result**: Analytics show 50,000 € flat from Oct 1 → Oct 25, then projections start

---

## Technical Details

### Data Flow

```
Frontend (TreasurySettings)
    ↓
    Creates array of sources with dates
    ↓
POST /api/treasury/balance
    {
        companyId: "1",
        amount: 51200,  ← Total calculated from sources
        referenceDate: "2025-10-25",
        notes: "Quarterly review",
        sources: [
            {
                sourceName: "BNP Paribas",
                amount: 50000,
                sourceDate: "2025-10-20",  ← Individual date
                notes: "Main account"
            },
            {
                sourceName: "Caisse",
                amount: 1200,
                sourceDate: "2025-10-25",  ← Different date
                notes: null
            }
        ]
    }
    ↓
Backend validates and saves
    ↓
Database: treasury_balance + treasury_balance_source records
    ↓
Analytics API uses total amount for calculations
```

### Why Individual Source Dates?

**Real-world scenario**:
- BNP account statement: dated October 20 (50,000 €)
- Cash count: dated October 25 (1,200 €)
- **Problem**: How to represent this accurately?

**Solution**:
- Each source keeps its own date
- General reference date: Most recent or representative date
- Users see when each component was checked
- Warnings help identify stale data

---

## Date Behavior in Analytics

### Reference Date in FUTURE
✅ **No warning**
- Analytics use this as starting point
- Projections flow naturally from this date

### Reference Date in PAST
⚠️ **Warning shown**

**What happens**:
1. **Baseline date → Today**: Balance stays constant at baseline amount
2. **Today → Future**: Projections based on movements
3. **Visual**: Flat line in past, then projections start from today

**Example**:
```
Oct 1    Oct 15    Oct 25 (today)    Nov 10    Nov 25
│────────────────────│─────────────────│─────────│
50k €  (constant)                   Projections based
                                    on movements
```

---

## Migration

**File**: `/init/postgres/004_treasury_sources.sql`

**What it does**:
- Creates `treasury_balance_source` table
- Sets up foreign key constraint with CASCADE delete
- Adds indexes for performance

**Applied**: Automatically on `docker-compose up -d --build`

**Backwards compatible**: Yes
- Existing balances continue to work
- Sources array is optional
- Empty sources array = single source (legacy behavior)

---

## API Examples

### Create Treasury Balance with Sources

```bash
POST /api/treasury/balance
Content-Type: application/json

{
  "companyId": "1",
  "amount": 51200,
  "referenceDate": "2025-10-25",
  "notes": "Q4 Review",
  "sources": [
    {
      "sourceName": "BNP Paribas - Compte Principal",
      "amount": 45000,
      "sourceDate": "2025-10-20",
      "notes": "Relevé bancaire"
    },
    {
      "sourceName": "BNP Paribas - Compte Épargne",
      "amount": 5000,
      "sourceDate": "2025-10-20",
      "notes": null
    },
    {
      "sourceName": "Caisse",
      "amount": 1200,
      "sourceDate": "2025-10-25",
      "notes": "Comptage physique"
    }
  ]
}
```

### Get Treasury Balance with Sources

```bash
GET /api/treasury/balance/1

Response:
{
  "companyId": "1",
  "amount": 51200,
  "referenceDate": "2025-10-25",
  "updatedBy": "John Doe",
  "updatedAt": "2025-10-25T14:30:00Z",
  "notes": "Q4 Review",
  "sources": [
    {
      "sourceId": 1,
      "sourceName": "BNP Paribas - Compte Principal",
      "amount": 45000,
      "sourceDate": "2025-10-20",
      "notes": "Relevé bancaire",
      "createdAt": "2025-10-25T14:30:00Z"
    },
    // ... more sources
  ]
}
```

---

## Files Changed

### Backend
- ✅ `/backend/app/models.py` - Added `TreasuryBalanceSource` model
- ✅ `/backend/app/schemas.py` - Added source schemas
- ✅ `/backend/app/routers/treasury.py` - Updated endpoints for sources
- ✅ `/init/postgres/004_treasury_sources.sql` - Database migration

### Frontend
- ✅ `/front2/src/types/index.ts` - Added `TreasuryBalanceSource` interface
- ✅ `/front2/src/services/api.ts` - Updated `updateBalance` to accept sources
- ✅ `/front2/src/pages/TreasurySettings.tsx` - Complete rewrite with source management
- ✅ `/front2/src/pages/Analytics.tsx` - Added past date warning

---

## Testing

### Manual Testing Checklist

**Treasury Settings**:
- [ ] Can add multiple sources
- [ ] Can remove sources (keeps minimum 1)
- [ ] Total amount calculates correctly
- [ ] Past dates show warning
- [ ] Can save with multiple sources
- [ ] Sources persist after refresh
- [ ] Validation prevents empty source names
- [ ] Validation prevents negative amounts

**Analytics**:
- [ ] Past baseline date shows warning
- [ ] Warning explains constant balance behavior
- [ ] Warning disappears when date is today/future
- [ ] Analytics calculate correctly with sources

**API**:
- [ ] GET returns sources array
- [ ] POST accepts and saves sources
- [ ] Sources cascade delete with parent balance
- [ ] Empty sources array works (backwards compatible)

---

## Benefits

### For Users
1. **Accurate tracking**: Each bank account tracked separately
2. **Date transparency**: See when each source was last checked
3. **Clear warnings**: Understand implications of past dates
4. **Flexibility**: Can enter data as it becomes available

### For Business
1. **Audit trail**: Know which accounts comprise total treasury
2. **Risk management**: Identify stale data (old source dates)
3. **Compliance**: Detailed source tracking
4. **Better decisions**: Complete picture of treasury composition

---

## Future Enhancements

Potential improvements:
- [ ] Source categories (bank/cash/other)
- [ ] Source-specific currency support
- [ ] Historical source tracking (versions)
- [ ] Automated bank integration per source
- [ ] Alert when source date > X days old
- [ ] Source reconciliation workflow
- [ ] Export sources to CSV/Excel

---

## Support

If you encounter issues:
1. Check backend logs: `docker-compose logs backend`
2. Verify migration ran: Check `treasury_balance_source` table exists
3. Clear browser cache if UI doesn't update
4. Restart services: `docker-compose restart`
