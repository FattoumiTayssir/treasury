# Global Company Selector - Final Implementation

## Overview
All pages now use the **single company selector in the Header** instead of having individual dropdowns.

## Architecture

### Global State (dataStore)
```typescript
// store/dataStore.ts
{
  companies: Company[]           // All available companies
  selectedCompanies: string[]    // Currently selected company IDs
  setSelectedCompanies()        // Function to change selection
}
```

### Header Component
The Header has the **master company selector**:
```tsx
<Select value={selectedCompanyId} onValueChange={handleCompanyChange}>
  {companies.map((company) => (
    <SelectItem value={company.id}>{company.name}</SelectItem>
  ))}
</Select>
```

**Location:** Always visible in the header at the top of every page

### Pages Using Global Selection

#### 1. Paramètres (Settings)
**Before:** ❌ Had its own company dropdown
**After:** ✅ Uses `selectedCompanies` from dataStore

```typescript
const { selectedCompanies, companies } = useDataStore()
const selectedCompany = selectedCompanies[0] || ''
```

**Display:**
- Shows "Entreprise sélectionnée: [Company Name]"
- Loads treasury balance for that company
- No separate dropdown

#### 2. Analyse (Analytics)
**Before:** ❌ Had its own company dropdown  
**After:** ✅ Uses `selectedCompanies` from dataStore

```typescript
const { selectedCompanies, companies } = useDataStore()
const selectedCompany = selectedCompanies[0] || ''
```

**Display:**
- Shows "Entreprise sélectionnée: [Company Name]"
- Loads baseline and charts for that company
- No separate dropdown

## User Flow

### Selecting a Company
```
1. User clicks Header company dropdown
   ↓
2. Selects "Acme Corp"
   ↓
3. dataStore.setSelectedCompanies(['18'])
   ↓
4. ALL pages automatically update:
   - Dashboard
   - Movements
   - Manual Entries
   - Exceptions
   - Settings ← uses new selection
   - Analytics ← uses new selection
```

### Page Behavior

**Settings Page:**
```
Header shows: [Acme Corp ▼]
    ↓
Settings displays:
┌─────────────────────────────────┐
│ Montant de Trésorerie           │
├─────────────────────────────────┤
│ Entreprise sélectionnée:        │
│ Acme Corp                       │
│                                 │
│ ┌─ Solde actuel ──────────────┐ │
│ │ €345,253,456.00             │ │
│ │ Date: 2025-10-25            │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Analytics Page:**
```
Header shows: [Acme Corp ▼]
    ↓
Analytics displays:
┌─────────────────────────────────┐
│ Analyse de Trésorerie           │
├─────────────────────────────────┤
│ Entreprise sélectionnée:        │
│ Acme Corp                       │
│                                 │
│ ┌─ Solde de référence ────────┐ │
│ │ €345,253,456.00             │ │
│ │ Date: 19 octobre 2025       │ │
│ │ Base des calculs            │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Charts starting from baseline] │
└─────────────────────────────────┘
```

## Benefits

### ✅ Single Source of Truth
- One company selector controls everything
- No confusion about which company you're viewing
- Consistent across all pages

### ✅ Better UX
- Change company once in header
- All pages update automatically
- No need to select company on each page

### ✅ Cleaner UI
- Less clutter on individual pages
- More space for actual content
- Consistent visual design

### ✅ Easier Maintenance
- Company selection logic in one place (dataStore)
- Pages just read the selection
- Changes propagate automatically

## Implementation Details

### Code Changes

**Settings Page:**
```typescript
// REMOVED
const [companies, setCompanies] = useState<Company[]>([])
const [selectedCompany, setSelectedCompany] = useState<string>('')
const loadCompanies = async () => { ... }

// ADDED
const { selectedCompanies, companies } = useDataStore()
const selectedCompany = selectedCompanies[0] || ''
```

**Analytics Page:**
```typescript
// REMOVED
const [companies, setCompanies] = useState<Company[]>([])
const [selectedCompany, setSelectedCompany] = useState<string>('')
const loadCompanies = async () => { ... }

// ADDED
const { selectedCompanies, companies } = useDataStore()
const selectedCompany = selectedCompanies[0] || ''
```

### State Management Flow

```
┌─────────────────────┐
│   dataStore         │
│  (Zustand/Context)  │
├─────────────────────┤
│ selectedCompanies   │◄─── Header changes this
│ companies           │
└──────────┬──────────┘
           │
           ├──► Dashboard (reads)
           ├──► Movements (reads)
           ├──► Manual Entries (reads)
           ├──► Exceptions (reads)
           ├──► Settings (reads)
           └──► Analytics (reads)
```

## Testing

### Test Scenario: Company Switch
1. **Start:** On Settings page, Company A selected
2. **See:** Settings shows Company A's balance
3. **Change:** Click Header → Select Company B
4. **Result:** 
   - ✅ Settings instantly shows Company B's balance
   - ✅ No page reload needed
   - ✅ Company name updates

### Test Scenario: Navigation with Selection
1. **Start:** Select Company A in Header
2. **Navigate:** Settings → See Company A data
3. **Navigate:** Analytics → See Company A data
4. **Navigate:** Dashboard → See Company A data
5. **Result:** 
   - ✅ Same company across all pages
   - ✅ No need to reselect

### Test Scenario: No Company Selected
1. **Start:** No company in Header
2. **Navigate:** To Settings
3. **See:** Message or placeholder (no data)
4. **Select:** Company in Header
5. **Result:**
   - ✅ Settings immediately loads data

## Edge Cases Handled

### No Company Selected
```typescript
const selectedCompany = selectedCompanies[0] || ''

if (!selectedCompany) {
  // Show placeholder or message
  return <div>Veuillez sélectionner une entreprise</div>
}
```

### Company Not Found
```typescript
const companyName = companies.find(c => c.id === selectedCompany)?.name

{companyName ? (
  <Label>Entreprise: {companyName}</Label>
) : (
  <Label>Entreprise non trouvée</Label>
)}
```

### Multiple Companies Selected
```typescript
// We only support single selection
const selectedCompany = selectedCompanies[0] || ''
// Even if array has multiple, we take first one
```

## Future Enhancements

### Multi-Company View (Optional)
If needed in the future:
```typescript
// Support multiple selected companies
const selectedCompanyIds = selectedCompanies // array

// Show comparison
{selectedCompanyIds.map(id => (
  <CompanyCard companyId={id} key={id} />
))}
```

### Company Context Menu
```
[Acme Corp ▼]
  │
  ├─ View Details
  ├─ Settings
  ├─ Switch Company
  └─ Recent Companies
```

### Persistence
```typescript
// Save selection to localStorage
useEffect(() => {
  localStorage.setItem('selectedCompany', selectedCompanies[0])
}, [selectedCompanies])

// Load on app start
useEffect(() => {
  const saved = localStorage.getItem('selectedCompany')
  if (saved) setSelectedCompanies([saved])
}, [])
```

## Files Modified

```
✓ front2/src/pages/TreasurySettings.tsx
  - Removed local company state
  - Import useDataStore
  - Use selectedCompanies from store
  - Show selected company name

✓ front2/src/pages/Analytics.tsx
  - Removed local company state
  - Import useDataStore
  - Use selectedCompanies from store
  - Show selected company name

✓ docs/GLOBAL_COMPANY_SELECTOR.md
  - This documentation
```

## Summary

**Before:**
- ❌ Each page had its own company selector
- ❌ Could select different companies on different pages
- ❌ Confusing UX
- ❌ Duplicate code

**After:**
- ✅ Single company selector in Header
- ✅ Consistent selection across all pages
- ✅ Clear UX - one place to select
- ✅ Cleaner code - reuse global state

**User Experience:**
1. Select company in Header → **Once**
2. Navigate anywhere → **Same company everywhere**
3. Change company → **Everything updates**

**Developer Experience:**
1. No state management in individual pages
2. Just read from dataStore
3. Automatic updates via React
4. Less code to maintain

---

**Status:** ✅ IMPLEMENTED
**Date:** October 19, 2025
**Impact:** All pages now use global company selection from Header
