# Company Filtering Fix - Summary

## Issues Found and Fixed

### Issue 1: No Company Selection Validation ✅ FIXED
**Problem:** Users could be created/updated without any company assigned.

**Fix Applied:**
- Added validation in `UserDialog.tsx` requiring at least one company to be selected
- Shows error message: "Au moins une société doit être sélectionnée"

### Issue 2: Company Dropdown Shows All Companies ✅ FIXED
**Problem:** The company selector in the header showed all companies in the database, not just the ones assigned to the user.

**Fix Applied in `Header.tsx`:**
1. Filter companies based on `user.companies`
2. Auto-select first allowed company on login
3. Only show allowed companies in dropdown

**Code changes:**
```typescript
// Filter companies based on user's allowed companies
const allowedCompanies = user 
  ? companies.filter(c => user.companies.includes(c.id))
  : companies

// Auto-initialize with first allowed company
useEffect(() => {
  if (user && companies.length > 0 && selectedCompanies.length === 0) {
    const allowedCompanies = companies.filter(c => user.companies.includes(c.id))
    if (allowedCompanies.length > 0) {
      setSelectedCompanies([allowedCompanies[0].id])
    }
  }
}, [user, companies, selectedCompanies.length])
```

## How Company Filtering Works

### 1. User Assignment
- When creating/editing a user, admin selects which companies the user can access
- This is stored in the `user_company` database table
- At least one company is now required

### 2. Company Dropdown (Header)
- Shows only companies assigned to the logged-in user
- Auto-selects the first allowed company on login
- User can switch between their allowed companies

### 3. Data Filtering
All pages already filter data by selected company:

**Analytics:** Fetches data for `selectedCompany`
```typescript
const selectedCompany = selectedCompanies[0] || ''
```

**Movements:** Filters movements by company
```typescript
const companyFilteredMovements = selectedCompanies.length > 0
  ? movements.filter(m => selectedCompanies.includes(m.companyId))
  : []
```

**Manual Entries:** Filters entries by company
```typescript
const filteredManualEntries = selectedCompanies.length > 0
  ? manualEntries.filter(entry => selectedCompanies.includes(entry.companyId))
  : []
```

**Exceptions:** Filters exceptions by company
```typescript
const companyFilteredExceptions = selectedCompanies.length > 0
  ? exceptions.filter(e => selectedCompanies.includes(e.companyId))
  : []
```

## Database Verification

To check a user's assigned companies:
```sql
SELECT 
  u.user_id, 
  u.display_name, 
  u.email, 
  ARRAY_AGG(c.name) as companies 
FROM "User" u 
LEFT JOIN user_company uc ON u.user_id = uc.user_id 
LEFT JOIN company c ON uc.company_id = c.company_id 
WHERE u.email = 'user@example.com'
GROUP BY u.user_id, u.display_name, u.email;
```

## Testing the Fix

### For the user `fattoumitaycir@gmail.com`:

1. **Verify company assignment:**
   - User is assigned to: UNIVERSAL (company_id: 1)
   - Should NOT see: Palliser SA (company_id: 18)

2. **Test the fix:**
   - Logout and login as this user
   - Check header dropdown - should ONLY show "UNIVERSAL"
   - Go to Analytics - should ONLY see UNIVERSAL data
   - Cannot switch to Palliser SA (not in dropdown)

3. **If user still sees multiple companies:**
   - Clear browser cache and localStorage
   - Logout completely
   - Login again
   - The Header component will auto-select UNIVERSAL

## What Happens Now

### On Login:
1. User logs in and receives JWT token
2. User object includes `companies: ["1"]` (UNIVERSAL only)
3. Header component filters company list to only show UNIVERSAL
4. Auto-selects UNIVERSAL as the active company
5. All pages filter data by company_id = 1

### When Viewing Data:
- **Movements page:** Only shows movements where `companyId === "1"`
- **Analytics page:** Only fetches data for company_id = 1
- **Manual Entries:** Only shows entries where `companyId === "1"`
- **Exceptions:** Only shows exceptions where `companyId === "1"`

## Creating/Editing Users (Admins)

### Required Steps:
1. Enter user details (name, email, password, role)
2. **SELECT AT LEAST ONE COMPANY** ⚠️ (now validated)
3. Set tab permissions
4. Save

### What Gets Saved:
- User basic info in `User` table
- Company assignments in `user_company` table
- Tab permissions in `user_tab_permissions` table

## Troubleshooting

### User still sees all companies?
1. Check browser console for errors
2. Verify user companies in database (SQL above)
3. Clear browser localStorage: `localStorage.clear()`
4. Logout and login again

### No companies showing in dropdown?
1. User might have no companies assigned
2. Edit the user and assign at least one company
3. Logout and login again

### Cannot create user without company?
This is now the expected behavior! At least one company is required.

## Files Modified

1. **front2/src/components/users/UserDialog.tsx**
   - Added company selection validation
   - Improved user creation to include companies and permissions

2. **front2/src/components/layout/Header.tsx**
   - Filter companies dropdown by user's allowed companies
   - Auto-select first allowed company on login

## Summary

✅ **Company validation:** Required on user creation/edit  
✅ **Company dropdown:** Only shows allowed companies  
✅ **Auto-selection:** First allowed company selected on login  
✅ **Data filtering:** Already working correctly in all pages  

The issue was that the company dropdown was showing all companies instead of just the user's assigned ones. Now fixed!
