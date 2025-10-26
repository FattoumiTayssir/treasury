# Company Dropdown & Auto-Selection Fix

## ✅ Issues Fixed

### Issue 1: Admin Cannot See Companies in Dropdown
**Problem:** Admin user has no companies in dropdown  
**Root Cause:** Admin had no companies assigned in `user_company` table, and Header was filtering companies based on `user.companies`

### Issue 2: Users Must Manually Select Company
**Problem:** Users must manually select a company even when they only have one  
**Root Cause:** No auto-selection logic on login

### Issue 3: Company Not Auto-Selected for Multi-Company Users
**Problem:** Users with multiple companies must manually select, should default to first one

## 🔧 Changes Made

### File: `front2/src/components/layout/Header.tsx`

#### Change 1: Show All Companies for Admin
```typescript
// BEFORE
const allowedCompanies = user 
  ? companies.filter(c => user.companies.includes(c.id))
  : companies

// AFTER
const allowedCompanies = user 
  ? (user.role === 'Admin' ? companies : companies.filter(c => user.companies.includes(c.id)))
  : companies
```

**Result:** Admin users now see ALL companies in dropdown ✅

#### Change 2: Auto-Select First Company on Login
```typescript
// Auto-select first company on login
useEffect(() => {
  if (user && companies.length > 0 && selectedCompanies.length === 0 && allowedCompanies.length > 0) {
    setSelectedCompanies([allowedCompanies[0].id])
  }
}, [user, companies, selectedCompanies.length, allowedCompanies, setSelectedCompanies])
```

**Result:** First company automatically selected on login ✅

#### Change 3: Clear Selection on Logout
```typescript
const handleLogout = () => {
  // Clear selected companies on logout
  setSelectedCompanies([])
  logout()
  navigate('/login')
}
```

**Result:** Clean state on logout, ready for next login ✅

## 📊 How It Works Now

### Scenario 1: Admin Login
```
1. Admin logs in
2. allowedCompanies = ALL companies (role check)
3. First company auto-selected
4. Dropdown shows ALL companies ✅
```

### Scenario 2: User with 1 Company
```
1. User logs in (e.g., hello@gg.com)
2. allowedCompanies = [Company 18] (filtered by user.companies)
3. Company 18 auto-selected ✅
4. Dropdown shows only Company 18
```

### Scenario 3: User with Multiple Companies
```
1. User logs in
2. allowedCompanies = [Company A, Company B, Company C]
3. Company A (first one) auto-selected ✅
4. Dropdown shows all assigned companies
5. User can change selection if needed
```

### Scenario 4: Logout & Re-login
```
1. User clicks logout
2. selectedCompanies cleared to []
3. User logs in again
4. First company auto-selected again ✅
5. Fresh state, no old selection
```

## 🧪 Test Cases

### Test 1: Admin User ✅
```
User: admin@treasury.local
Expected:
- ✅ See all companies in dropdown
- ✅ First company auto-selected
- ✅ Can switch between all companies
```

### Test 2: Single Company User ✅
```
User: hello@gg.com (has only Company 18)
Expected:
- ✅ Company 18 auto-selected immediately
- ✅ Dropdown shows only Company 18
- ✅ No manual selection needed
```

### Test 3: Multi-Company User ✅
```
User: manager@company.com (has Company A, B, C)
Expected:
- ✅ Company A auto-selected (first one)
- ✅ Dropdown shows all 3 companies
- ✅ Can switch between companies
```

### Test 4: Logout Flow ✅
```
1. User selects Company B
2. User logs out
3. User logs in again
Expected:
- ✅ Company A auto-selected (first one, not B)
- ✅ Clean state, no old selection persisted
```

## 📝 Database Check

### Admin User Companies:
```sql
SELECT u.user_id, u.email, u.role, array_agg(uc.company_id) as companies
FROM "User" u
LEFT JOIN user_company uc ON u.user_id = uc.user_id
WHERE u.email = 'admin@treasury.local'
GROUP BY u.user_id, u.email, u.role;

Result:
user_id | email                | role  | companies
--------|----------------------|-------|----------
2       | admin@treasury.local | Admin | {NULL}
```

**Note:** Admin has no companies in `user_company` table, which is fine because Admin role has access to ALL companies by logic.

### Other Users:
```sql
SELECT u.user_id, u.email, u.role, array_agg(uc.company_id) as companies
FROM "User" u
LEFT JOIN user_company uc ON u.user_id = uc.user_id
WHERE u.role != 'Admin'
GROUP BY u.user_id, u.email, u.role;

Expected:
- Regular users have assigned companies in user_company table
- These companies are used to filter dropdown
```

## 🎯 Logic Flow

### Company Filtering Decision Tree:

```
Is user logged in?
├─ NO → Show no companies
└─ YES → Is user Admin?
    ├─ YES → allowedCompanies = ALL companies
    └─ NO → allowedCompanies = companies where id IN user.companies

Are allowedCompanies loaded and no selection exists?
├─ YES → Auto-select allowedCompanies[0]
└─ NO → Keep current selection
```

### Auto-Selection Trigger:
```
Triggers when ALL conditions are true:
✅ user exists
✅ companies.length > 0
✅ selectedCompanies.length === 0
✅ allowedCompanies.length > 0

Action: setSelectedCompanies([allowedCompanies[0].id])
```

## ✅ Summary

| Issue | Before | After | Status |
|-------|--------|-------|--------|
| Admin dropdown | Empty | All companies | ✅ Fixed |
| Auto-select single company | Manual | Automatic | ✅ Fixed |
| Auto-select multi-company | Manual | First company | ✅ Fixed |
| Logout cleanup | Persisted | Cleared | ✅ Fixed |

## 🚀 What to Test

1. **Refresh browser** at http://localhost:3000
2. **Test Admin:**
   - Login as `admin@treasury.local` / `admin123`
   - ✅ Check: Dropdown shows all companies
   - ✅ Check: First company is auto-selected
3. **Test Single Company User:**
   - Login as `hello@gg.com` / `0000`
   - ✅ Check: Company 18 is auto-selected
   - ✅ Check: No manual selection needed
4. **Test Logout:**
   - Select a different company
   - Logout
   - Login again
   - ✅ Check: First company selected again (clean state)

## 📌 Important Notes

### Admin Role Privileges:
- Admin can see ALL companies (not filtered by `user.companies`)
- Admin can switch between any company
- Admin permissions work across all companies

### Regular Users:
- See only assigned companies (`user.companies`)
- First assigned company auto-selected
- Can only view/modify data from assigned companies

### State Management:
- `selectedCompanies` is NOT persisted (in-memory only)
- Cleared on logout for clean state
- Auto-populated on login

---

**Fix Date:** 2025-10-26 20:52 UTC+01:00  
**Status:** ✅ Complete and Ready to Test  
**Impact:** All users (Admin and regular users)
