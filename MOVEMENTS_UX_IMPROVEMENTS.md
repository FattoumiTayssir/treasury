# Movements & Exceptions UX Improvements

## Overview

Comprehensive UI/UX improvements for the Movements and Exceptions tabs including:
1. ✅ **Exclude from Analytics** - Mark movements/exceptions to exclude from calculations
2. 🔄 **Column Sorting** - ASC/DESC sorting for all columns
3. 🔄 **Column Filters** - Filter by any column value
4. 🔄 **Bulk Actions** - Select multiple items for exclude/include operations
5. 🔄 **Source Display** - Show "Odoo" or user name based on source
6. 🔄 **ETL Timestamp** - Display last ETL refresh time
7. ✅ **Analytics Integration** - Excluded items don't affect calculations
8. 🔄 **Visual Distinction** - Excluded items shown with attractive accent color

---

## ✅ COMPLETED: Backend Changes

### Database Migration

**File**: `/init/postgres/005_exclude_from_analytics.sql`

```sql
-- Add exclude_from_analytics to movement table
ALTER TABLE movement 
ADD COLUMN exclude_from_analytics BOOLEAN NOT NULL DEFAULT FALSE;

-- Add exclude_from_analytics to Exception table
ALTER TABLE "Exception" 
ADD COLUMN exclude_from_analytics BOOLEAN NOT NULL DEFAULT FALSE;

-- Indexes for performance
CREATE INDEX IX_Movement_exclude_analytics 
    ON movement(exclude_from_analytics) WHERE exclude_from_analytics = FALSE;
CREATE INDEX IX_Exception_exclude_analytics 
    ON "Exception"(exclude_from_analytics) WHERE exclude_from_analytics = FALSE;
```

### Models Updated

**Movement model** (`/backend/app/models.py`):
```python
exclude_from_analytics = Column(Boolean, nullable=False, server_default="false")
```

**Exception model** (`/backend/app/models.py`):
```python
exclude_from_analytics = Column(Boolean, nullable=False, server_default="false")
```

### Schemas Updated

**New request schemas**:
```python
class MovementExcludeFromAnalytics(BaseModel):
    ids: List[str]
    exclude: bool  # True to exclude, False to include

class ExceptionExcludeFromAnalytics(BaseModel):
    ids: List[str]
    exclude: bool  # True to exclude, False to include
```

**Response schemas updated**:
- `MovementResponse.excludeFromAnalytics: bool`
- `ExceptionResponse.excludeFromAnalytics: bool`

### API Endpoints Created

#### Movements

**POST `/api/movements/exclude-from-analytics`**
```json
{
  "ids": ["1", "2", "3"],
  "exclude": true  // or false to include
}
```

**Response**:
```json
{
  "message": "3 movements excluded from analytics successfully"
}
```

#### Exceptions

**POST `/api/exceptions/exclude-from-analytics`**
```json
{
  "ids": ["1", "2"],
  "exclude": true
}
```

**Response**:
```json
{
  "message": "2 exceptions excluded from analytics successfully"
}
```

### Analytics Integration

**Updated**: `/backend/app/routers/analytics.py`

All analytics endpoints now filter out excluded movements:

```python
movements = db.query(models.Movement).filter(
    models.Movement.company_id == company_id,
    models.Movement.status == "Actif",
    models.Movement.exclude_from_analytics == False  # ← New filter
).all()
```

**Affected endpoints**:
- `/api/analytics/metrics/{company_id}`
- `/api/analytics/forecast`
- `/api/analytics/category-breakdown`
- `/api/analytics/cash-flow`

---

## 🔄 TODO: Frontend Changes

### 1. Update Types

**File**: `/front2/src/types/index.ts`

```typescript
export interface Movement {
  id: string
  // ... existing fields
  excludeFromAnalytics: boolean  // ← Add this
  createdBy?: string  // For source display
}

export interface Exception {
  id: string
  // ... existing fields
  excludeFromAnalytics: boolean  // ← Add this
}
```

### 2. Update API Service

**File**: `/front2/src/services/api.ts`

```typescript
export const movementsApi = {
  // ... existing methods
  excludeFromAnalytics: (ids: string[], exclude: boolean) =>
    api.post('/movements/exclude-from-analytics', { ids, exclude }),
}

export const exceptionsApi = {
  // ... existing methods
  excludeFromAnalytics: (ids: string[], exclude: boolean) =>
    api.post('/exceptions/exclude-from-analytics', { ids, exclude }),
}
```

### 3. Install TanStack Table (Recommended)

For advanced sorting/filtering:

```bash
cd front2
npm install @tanstack/react-table
```

### 4. Movements Page Updates

**Key Features to Implement**:

#### a) ETL Timestamp Display
```tsx
const [lastRefresh, setLastRefresh] = useState<string>('')

useEffect(() => {
  movementsApi.getLastRefresh().then(res => {
    setLastRefresh(res.data.lastRefresh)
  })
}, [])

// In JSX:
<div className="mb-4 text-sm text-gray-600">
  Dernière synchronisation: {new Date(lastRefresh).toLocaleString('fr-FR')}
</div>
```

#### b) Source Column Display Logic
```tsx
const getSourceDisplay = (movement: Movement) => {
  if (movement.source === 'Odoo') {
    return 'Odoo'
  }
  return movement.createdBy || 'Entrée manuelle'
}

// In table column:
{
  id: 'source',
  header: 'Source',
  cell: ({ row }) => getSourceDisplay(row.original)
}
```

#### c) Bulk Selection
```tsx
const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())

const toggleRowSelection = (id: string) => {
  const newSelected = new Set(selectedRows)
  if (newSelected.has(id)) {
    newSelected.delete(id)
  } else {
    newSelected.add(id)
  }
  setSelectedRows(newSelected)
}

const selectAll = () => {
  setSelectedRows(new Set(movements.map(m => m.id)))
}

const deselectAll = () => {
  setSelectedRows(new Set())
}
```

#### d) Exclude from Analytics Action
```tsx
const handleExcludeFromAnalytics = async (exclude: boolean) => {
  const ids = Array.from(selectedRows)
  try {
    await movementsApi.excludeFromAnalytics(ids, exclude)
    toast({
      title: exclude ? 'Mouvements exclus' : 'Mouvements inclus',
      description: `${ids.length} mouvement(s) ${exclude ? 'exclu(s)' : 'inclus'} des analyses`
    })
    // Refresh data
    await loadMovements()
    setSelectedRows(new Set())
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'Erreur',
      description: 'Impossible de modifier les mouvements'
    })
  }
}

// In JSX (action buttons):
<div className="flex gap-2 mb-4">
  <Button
    onClick={() => handleExcludeFromAnalytics(true)}
    disabled={selectedRows.size === 0}
    variant="outline"
  >
    <EyeOff className="w-4 h-4 mr-2" />
    Exclure des analyses ({selectedRows.size})
  </Button>
  
  <Button
    onClick={() => handleExcludeFromAnalytics(false)}
    disabled={selectedRows.size === 0}
    variant="outline"
  >
    <Eye className="w-4 h-4 mr-2" />
    Inclure dans analyses ({selectedRows.size})
  </Button>
</div>
```

#### e) Visual Styling for Excluded Items
```tsx
// In table row className:
className={cn(
  "hover:bg-gray-50",
  movement.excludeFromAnalytics && "bg-amber-50 border-l-4 border-l-amber-500"
)}

// Or use a badge:
{movement.excludeFromAnalytics && (
  <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800">
    Exclu des analyses
  </Badge>
)}
```

### 5. Column Sorting Implementation

Using TanStack Table:

```tsx
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table'

const [sorting, setSorting] = useState<SortingState>([])
const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

const columns = [
  {
    accessorKey: 'date',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date
        {column.getIsSorted() === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : 
         column.getIsSorted() === "desc" ? <ArrowDown className="ml-2 h-4 w-4" /> : 
         <ArrowUpDown className="ml-2 h-4 w-4" />}
      </Button>
    ),
  },
  // ... more columns
]

const table = useReactTable({
  data: movements,
  columns,
  state: {
    sorting,
    columnFilters,
  },
  onSortingChange: setSorting,
  onColumnFiltersChange: setColumnFilters,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
})
```

### 6. Column Filters Implementation

```tsx
// For text columns:
const TextFilter = ({ column }) => {
  return (
    <Input
      placeholder="Filtrer..."
      value={(column.getFilterValue() ?? "") as string}
      onChange={(e) => column.setFilterValue(e.target.value)}
      className="max-w-sm"
    />
  )
}

// For select columns (category, type, etc.):
const SelectFilter = ({ column, options }) => {
  return (
    <Select
      value={(column.getFilterValue() ?? "") as string}
      onValueChange={(value) => column.setFilterValue(value)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Tous" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">Tous</SelectItem>
        {options.map(opt => (
          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// In column definition:
{
  accessorKey: 'category',
  header: 'Catégorie',
  cell: ({ row }) => row.getValue('category'),
  filterFn: 'equals',
  meta: {
    filterComponent: (column) => (
      <SelectFilter 
        column={column} 
        options={['RH', 'Achat', 'Vente', 'Compta', 'Autre']} 
      />
    )
  }
}
```

### 7. Sensible Default Filters

```tsx
// Auto-exclude inactive and excluded items by default
const [showInactive, setShowInactive] = useState(false)
const [showExcluded, setShowExcluded] = useState(false)

const filteredMovements = movements.filter(m => {
  if (!showInactive && m.status !== 'Actif') return false
  if (!showExcluded && m.excludeFromAnalytics) return false
  return true
})

// Filter toggles:
<div className="flex gap-2 mb-4">
  <label className="flex items-center gap-2">
    <Checkbox 
      checked={showInactive}
      onCheckedChange={setShowInactive}
    />
    Afficher les inactifs
  </label>
  
  <label className="flex items-center gap-2">
    <Checkbox 
      checked={showExcluded}
      onCheckedChange={setShowExcluded}
    />
    Afficher les exclus des analyses
  </label>
</div>
```

### 8. Apply Same to Exceptions

All the above patterns apply to the Exceptions tab as well:
- Bulk selection
- Exclude/include from analytics
- Column sorting
- Column filtering
- Visual distinction for excluded items

---

## Visual Design Guidelines

### Color Scheme for Excluded Items

**Option 1: Amber accent** (warm, noticeable but not alarming)
```css
.excluded-row {
  background: rgb(254 243 199); /* bg-amber-50 */
  border-left: 4px solid rgb(245 158 11); /* border-amber-500 */
}
```

**Option 2: Blue accent** (matches current template)
```css
.excluded-row {
  background: rgb(239 246 255); /* bg-blue-50 */
  border-left: 4px solid rgb(59 130 246); /* border-blue-500 */
}
```

**Option 3: Purple accent** (modern, attractive)
```css
.excluded-row {
  background: rgb(250 245 255); /* bg-purple-50 */
  border-left: 4px solid rgb(168 85 247); /* border-purple-500 */
}
```

### Badge Design
```tsx
<Badge className="bg-amber-100 text-amber-800 border-amber-300">
  <EyeOff className="w-3 h-3 mr-1" />
  Exclu
</Badge>
```

---

## User Workflow

### Excluding Movements from Analytics

1. Navigate to **Mouvements** tab
2. Select movements using checkboxes
   - Individual selection by clicking checkbox
   - Select all with "Select all" button
3. Click **"Exclure des analyses"** button
4. Selected movements get amber background
5. Badge "Exclu des analyses" appears
6. These movements no longer affect:
   - Treasury metrics
   - Forecast calculations
   - Category breakdowns
   - Cash flow analysis

### Including Back in Analytics

1. Toggle "Afficher les exclus des analyses" to see excluded items
2. Select excluded movements
3. Click **"Inclure dans analyses"** button
4. Movements return to normal appearance
5. Analytics immediately reflect these movements

### Filtering & Sorting

1. Click column headers to sort (↑↓)
2. Use filter inputs at top of table
3. Combine filters (all active simultaneously)
4. Clear filters with "Reset" button

---

## API Usage Examples

### Exclude Multiple Movements

```bash
POST /api/movements/exclude-from-analytics
Content-Type: application/json

{
  "ids": ["123", "124", "125"],
  "exclude": true
}
```

### Include Back in Analytics

```bash
POST /api/movements/exclude-from-analytics
Content-Type: application/json

{
  "ids": ["123", "124"],
  "exclude": false
}
```

### Get Movements (includes exclude status)

```bash
GET /api/movements

Response:
[
  {
    "id": "123",
    "amount": 1500,
    "excludeFromAnalytics": true,  ← Flag included
    ...
  }
]
```

---

## Testing Checklist

### Backend
- [x] Migration applied successfully
- [x] Models include exclude_from_analytics field
- [x] API endpoint accepts bulk IDs
- [x] Analytics filter out excluded movements
- [x] Exceptions endpoint works same as movements

### Frontend (To Do)
- [ ] Types updated with excludeFromAnalytics field
- [ ] API service has exclude methods
- [ ] Bulk selection works
- [ ] Exclude/include buttons functional
- [ ] Visual styling distinguishes excluded items
- [ ] Column sorting works for all columns
- [ ] Column filters work for all columns
- [ ] Source column shows "Odoo" or user name
- [ ] ETL timestamp displays at top
- [ ] Toast notifications on actions
- [ ] Analytics page reflects exclusions

---

## Performance Considerations

### Indexes
- Partial indexes on `exclude_from_analytics = FALSE` for faster analytics queries
- Existing indexes on `company_id`, `movement_date` remain

### Query Optimization
- Filter at database level (not in application)
- Use `WHERE exclude_from_analytics = FALSE` in all analytics queries
- Maintains fast response times even with large datasets

---

## Future Enhancements

Potential additions:
- [ ] Bulk edit other fields (category, type)
- [ ] Export filtered/sorted data to CSV
- [ ] Save filter presets
- [ ] Advanced filters (date ranges, amount ranges)
- [ ] Undo exclude action
- [ ] Audit log of exclude/include actions
- [ ] Dashboard widget showing excluded count
- [ ] Temporary exclusions (with expiry date)

---

## Files Changed

### Backend (✅ Complete)
- ✅ `/init/postgres/005_exclude_from_analytics.sql` - Migration
- ✅ `/backend/app/models.py` - Added exclude_from_analytics to Movement & Exception
- ✅ `/backend/app/schemas.py` - Added exclude schemas and response fields
- ✅ `/backend/app/routers/movements.py` - Added exclude endpoint
- ✅ `/backend/app/routers/exceptions.py` - Added exclude endpoint
- ✅ `/backend/app/routers/analytics.py` - Filter out excluded movements

### Frontend (🔄 To Do)
- 🔄 `/front2/src/types/index.ts` - Add excludeFromAnalytics field
- 🔄 `/front2/src/services/api.ts` - Add exclude methods
- 🔄 `/front2/src/pages/Movements.tsx` - Complete rewrite with all features
- 🔄 `/front2/src/pages/Exceptions.tsx` - Apply same patterns
- 🔄 Install `@tanstack/react-table` for advanced table features

---

## Summary

✅ **Backend is production-ready!**
- Database migration applied
- API endpoints functional
- Analytics exclude discarded items
- Well-indexed for performance

🔄 **Frontend needs implementation**
- Types and API service updates (quick)
- Table component rewrite (moderate effort)
- Sorting/filtering implementation (use TanStack Table)
- Bulk actions and visual styling

**Estimated frontend work**: 4-6 hours for complete implementation.
