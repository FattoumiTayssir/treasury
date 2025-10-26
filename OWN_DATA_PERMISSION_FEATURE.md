# Own Data Only Permission Feature

## Summary of Changes

### 1. ✅ Fixed Permission Count Display
**Problem:** User with 1 tab showed "5 onglets"  
**Solution:** Now counts only tabs where `canView = true`

**Code Change:**
```typescript
// Before
{user.permissions.length} onglet(s)

// After  
{user.permissions.filter(p => p.canView).length} onglet(s)
```

### 2. ✅ Added "Own Data Only" Permission

New checkbox for **Movements** and **Manual Entries** tabs:
- **Label (French):** "Uniquement ses propres données"
- **Functionality:** When checked, user can only see/modify records they created
- **Appears:** Only when user has View permission for the tab

## Database Changes

### New Column Added
```sql
ALTER TABLE user_tab_permissions 
ADD COLUMN own_data_only BOOLEAN NOT NULL DEFAULT FALSE;
```

### Database Structure
```
user_tab_permissions
├── user_tab_permission_id (PK)
├── user_id (FK)
├── tab_id (FK)
├── can_view (BOOLEAN)
├── can_modify (BOOLEAN)
├── own_data_only (BOOLEAN) ← NEW
├── created_at
└── updated_at
```

## Frontend Changes

### 1. Type Definitions (`types/index.ts`)
```typescript
export interface TabPermission {
  tabId: number
  tabName: string
  tabLabel: string
  canView: boolean
  canModify: boolean
  ownDataOnly?: boolean  // NEW: For movements and manual-entries
}
```

### 2. User Dialog (`components/users/UserDialog.tsx`)

**New Checkbox UI:**
```tsx
{(perm.tabName === 'movements' || perm.tabName === 'manual-entries') && perm.canView && (
  <div className="ml-4 pt-2 border-t">
    <Checkbox
      checked={perm.ownDataOnly}
      onCheckedChange={(checked) =>
        handlePermissionChange(perm.tabName, 'ownDataOnly', checked)
      }
    />
    <label>Uniquement ses propres données</label>
  </div>
)}
```

**Permission Logic:**
- If `canView = false`, then `ownDataOnly = false`
- ownDataOnly only available for `movements` and `manual-entries` tabs
- Stored and sent to backend with permission updates

### 3. User Management Page (`pages/UserManagement.tsx`)
Fixed permission count to show only granted tabs:
```typescript
{user.permissions.filter(p => p.canView).length} onglet(s)
```

## Backend Changes

### 1. Models (`app/models.py`)
```python
class UserTabPermission(Base):
    # ... existing fields ...
    own_data_only = Column(Boolean, nullable=False, server_default="false")
```

### 2. Schemas (`app/schemas.py`)
```python
class UserTabPermissionResponse(BaseModel):
    tabId: int
    tabName: str
    tabLabel: str
    canView: bool
    canModify: bool
    ownDataOnly: bool = False  # NEW

class UserTabPermissionUpdate(BaseModel):
    tabName: str
    canView: bool
    canModify: bool
    ownDataOnly: bool = False  # NEW
```

### 3. Routers
Updated `users.py` and `auth.py` to include `ownDataOnly` in:
- Permission responses
- Permission updates
- Login responses

## How It Works

### User Creation/Editing Flow

1. **Admin opens User Dialog**
2. **Selects permissions** for each tab (View/Modify)
3. **For Movements and Manual Entries:**
   - If user has View permission → "Own Data Only" checkbox appears
   - Admin can check it to restrict user to their own data
4. **Save user** → `ownDataOnly` field saved to database

### Permission Levels

| Permission | View | Modify | Own Data Only | Result |
|------------|------|--------|---------------|--------|
| **None** | ❌ | ❌ | ❌ | Cannot see tab |
| **View All** | ✅ | ❌ | ❌ | Can see all records |
| **View Own** | ✅ | ❌ | ✅ | Can only see own records |
| **Modify All** | ✅ | ✅ | ❌ | Can edit all records |
| **Modify Own** | ✅ | ✅ | ✅ | Can only edit own records |

### Data Filtering Logic (To Be Implemented in Pages)

#### Movements Page
```typescript
// Filter by company (already implemented)
let filteredMovements = movements.filter(m => 
  selectedCompanies.includes(m.companyId)
)

// Filter by own data only (TO IMPLEMENT)
const movementPerm = user.permissions.find(p => p.tabName === 'movements')
if (movementPerm?.ownDataOnly) {
  filteredMovements = filteredMovements.filter(m => 
    m.createdBy === user.id
  )
}
```

#### Manual Entries Page
```typescript
// Filter by company (already implemented)
let filteredEntries = manualEntries.filter(e => 
  selectedCompanies.includes(e.companyId)
)

// Filter by own data only (TO IMPLEMENT)
const entryPerm = user.permissions.find(p => p.tabName === 'manual-entries')
if (entryPerm?.ownDataOnly) {
  filteredEntries = filteredEntries.filter(e => 
    e.createdBy === user.id
  )
}
```

## Modify Permission Includes "Exclude from Analytics"

### For Movements Tab

Users with **Modify** permission can:
1. ✅ Create new movements
2. ✅ Edit existing movements
3. ✅ Delete movements
4. ✅ **Exclude movements from analytics** (discard button)

The "exclude from analytics" action is considered a modification of the movement's `excludeFromAnalytics` field.

**Implementation Note:** The existing `updateMovementsOptimistic` function in `dataStore.ts` already handles this. Users with `canModify=true` can use the exclude toggle.

## Testing Scenarios

### Scenario 1: View Only - All Data
```
User: viewer@company.com
Permissions:
  - Movements: canView=true, canModify=false, ownDataOnly=false
  
Expected:
  ✅ Can see all movements from assigned companies
  ❌ Cannot edit movements
  ❌ Cannot exclude from analytics
```

### Scenario 2: View Only - Own Data
```
User: limited@company.com
Permissions:
  - Movements: canView=true, canModify=false, ownDataOnly=true
  
Expected:
  ✅ Can see only movements they created
  ❌ Cannot see movements created by others
  ❌ Cannot edit movements
```

### Scenario 3: Modify All Data
```
User: manager@company.com
Permissions:
  - Movements: canView=true, canModify=true, ownDataOnly=false
  
Expected:
  ✅ Can see all movements from assigned companies
  ✅ Can edit all movements
  ✅ Can exclude any movement from analytics
```

### Scenario 4: Modify Only Own Data
```
User: contributor@company.com
Permissions:
  - Movements: canView=true, canModify=true, ownDataOnly=true
  
Expected:
  ✅ Can see only movements they created
  ✅ Can edit only their own movements
  ✅ Can exclude only their own movements from analytics
  ❌ Cannot see/edit movements created by others
```

## Next Steps (Frontend Implementation Required)

The database and API are ready. The following needs to be implemented in the frontend:

### 1. Movements Page (`pages/Movements.tsx`)
```typescript
// Add filtering logic based on ownDataOnly
const movementPerm = user?.permissions.find(p => p.tabName === 'movements')
if (movementPerm?.ownDataOnly) {
  companyFilteredMovements = companyFilteredMovements.filter(m => 
    m.createdBy === user.id
  )
}

// Disable edit/exclude buttons for movements not created by user
const canModifyMovement = (movement: FinancialMovement) => {
  if (!movementPerm?.canModify) return false
  if (movementPerm.ownDataOnly && movement.createdBy !== user.id) return false
  return true
}
```

### 2. Manual Entries Page (`pages/ManualEntries.tsx`)
```typescript
// Add filtering logic based on ownDataOnly
const entryPerm = user?.permissions.find(p => p.tabName === 'manual-entries')
if (entryPerm?.ownDataOnly) {
  filteredManualEntries = filteredManualEntries.filter(e => 
    e.createdBy === user.id
  )
}

// Disable edit/delete buttons for entries not created by user
const canModifyEntry = (entry: ManualEntry) => {
  if (!entryPerm?.canModify) return false
  if (entryPerm.ownDataOnly && entry.createdBy !== user.id) return false
  return true
}
```

### 3. Update Movement/Entry Types
Ensure `createdBy` field exists in types:
```typescript
export interface FinancialMovement {
  // ... existing fields ...
  createdBy?: string  // User ID who created the movement
}

export interface ManualEntry {
  // ... existing fields ...
  createdBy?: string  // User ID who created the entry
}
```

## UI Screenshots Description

### User Dialog - Permissions Tab

```
┌─────────────────────────────────────────────────────┐
│ Permissions des onglets                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Mouvements            [✓] Voir  [✓] Modifier   │ │
│ │ ├─────────────────────────────────────────────┤ │ │
│ │ └ [✓] Uniquement ses propres données          │ │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Entrées manuelles     [✓] Voir  [ ] Modifier   │ │
│ │ ├─────────────────────────────────────────────┤ │ │
│ │ └ [✓] Uniquement ses propres données          │ │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Migration Applied

```bash
# Migration already applied automatically
docker-compose exec postgres psql -U postgres -d appdb \
  -f /docker-entrypoint-initdb.d/21-add-own-data-only.sql

# Result: 
# ✅ own_data_only column added to user_tab_permissions
# ✅ Default value: false
# ✅ Backend restarted and ready
```

## Summary

✅ **Permission count fixed** - Shows correct number of accessible tabs  
✅ **"Own Data Only" checkbox added** - For Movements and Manual Entries  
✅ **Database schema updated** - Column `own_data_only` added  
✅ **Backend API updated** - All endpoints include ownDataOnly field  
✅ **Frontend UI updated** - Checkbox appears in User Dialog  
✅ **Migration applied** - Database updated successfully  

⏳ **Next:** Implement filtering logic in Movements and Manual Entries pages

## Files Modified

### Frontend
- `front2/src/types/index.ts` - Added ownDataOnly to TabPermission
- `front2/src/components/users/UserDialog.tsx` - Added checkbox UI
- `front2/src/pages/UserManagement.tsx` - Fixed permission count

### Backend
- `backend/app/models.py` - Added own_data_only column
- `backend/app/schemas.py` - Added ownDataOnly to schemas
- `backend/app/routers/users.py` - Include ownDataOnly in responses
- `backend/app/routers/auth.py` - Include ownDataOnly in login

### Database
- `init/postgres/21-add-own-data-only.sql` - Migration script

---

**Last Updated:** 2025-10-26  
**Status:** ✅ Backend Complete | ⏳ Frontend Filtering Logic Pending
