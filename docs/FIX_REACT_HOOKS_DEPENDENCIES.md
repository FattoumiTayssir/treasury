# Fix: React Hooks Dependencies Issue

## Problem
Treasury amounts not updating when changing companies in:
- Paramètres (Settings page)
- Analyse (Analytics page)

## Root Cause
**React hooks dependency violation**: Functions used in `useEffect` were not included in dependency arrays, causing stale closures.

### What was wrong:
```typescript
// ❌ WRONG
const loadCurrentBalance = async () => {
  // ... uses selectedCompany
}

useEffect(() => {
  loadCurrentBalance()
}, [selectedCompany])  // Missing loadCurrentBalance in dependencies!
```

**Result:** React would warn about missing dependencies, and the component wouldn't re-render properly when the company changed.

## Solution
Wrapped data-loading functions in `useCallback` and added them to dependency arrays:

```typescript
// ✅ CORRECT
const loadCurrentBalance = useCallback(async () => {
  // ... uses selectedCompany
}, [selectedCompany])  // Dependencies of the callback

useEffect(() => {
  loadCurrentBalance()
}, [selectedCompany, loadCurrentBalance])  // Include the function!
```

## Files Fixed

### 1. TreasurySettings.tsx
**Changes:**
- Imported `useCallback` from React
- Wrapped `loadCurrentBalance` in `useCallback` with `[selectedCompany, toast]` dependencies
- Added `loadCurrentBalance` to the `useEffect` dependency array
- Reordered code so functions are defined before useEffect calls

### 2. Analytics.tsx
**Changes:**
- Imported `useCallback` from React
- Wrapped `loadTreasuryBalance` in `useCallback` with `[selectedCompany]` dependencies
- Wrapped `loadAnalytics` in `useCallback` with `[selectedCompany, treasuryBalance, dateRange, selectedCategories]` dependencies
- Updated all useEffect dependency arrays to include the callback functions
- Reordered code properly

## Why useCallback?

`useCallback` memoizes the function so it only changes when its dependencies change:

```typescript
const loadBalance = useCallback(async () => {
  // This function is recreated only when selectedCompany changes
}, [selectedCompany])
```

Without `useCallback`:
- Function is recreated on every render
- useEffect sees a "new" function every time
- Would trigger infinite loops or miss updates

## Testing

### Test Scenario 1: Settings Page
1. Navigate to Paramètres
2. Select Company A → Should load its balance
3. Change to Company B → Should load new balance immediately
4. Values should update in form fields

**Expected:** Balance updates when company changes ✅

### Test Scenario 2: Analytics Page  
1. Navigate to Analyse
2. Select Company A → Should load its baseline and analytics
3. Change to Company B → Should reload with new baseline
4. Charts should reflect the new company's data

**Expected:** Charts update when company changes ✅

### Test Scenario 3: Filter Changes
1. On Analytics page
2. Change date range → Should reload analytics
3. Change categories → Should reload analytics
4. All with the same company and baseline

**Expected:** Analytics reload on filter changes ✅

## React Best Practices Applied

### 1. Exhaustive Dependencies
All variables and functions used inside useEffect are included in its dependency array:
```typescript
useEffect(() => {
  if (selectedCompany) {
    loadBalance()  // Function used here
  }
}, [selectedCompany, loadBalance])  // Both included ✅
```

### 2. Memoization
Functions that don't need to change on every render are memoized with `useCallback`:
```typescript
const expensiveFunction = useCallback(() => {
  // Only recreates when deps change
}, [dep1, dep2])
```

### 3. Proper Ordering
Functions are defined before they're used:
```typescript
// ✅ Define first
const myFunction = useCallback(() => {}, [])

// ✅ Then use
useEffect(() => {
  myFunction()
}, [myFunction])
```

## Common Patterns

### Pattern 1: Data Fetching
```typescript
const fetchData = useCallback(async () => {
  const response = await api.getData(id)
  setData(response.data)
}, [id])  // Deps: what fetchData uses

useEffect(() => {
  fetchData()
}, [fetchData])  // Dep: the function itself
```

### Pattern 2: Dependent Fetches
```typescript
const fetchA = useCallback(async () => {
  const a = await api.getA(companyId)
  setA(a)
}, [companyId])

const fetchB = useCallback(async () => {
  if (!dataA) return
  const b = await api.getB(companyId, dataA.id)
  setB(b)
}, [companyId, dataA])

useEffect(() => { fetchA() }, [fetchA])
useEffect(() => { fetchB() }, [fetchB])
```

### Pattern 3: Conditional Execution
```typescript
const loadData = useCallback(async () => {
  if (!id) return  // Guard clause
  const data = await api.get(id)
  setData(data)
}, [id])

useEffect(() => {
  loadData()
}, [loadData])
```

## Benefits

### ✅ Correct Behavior
- Components update when they should
- No stale data
- Proper re-renders

### ✅ No Infinite Loops
- Functions don't cause unnecessary re-renders
- Dependencies are stable

### ✅ Better Performance
- Only re-fetch when needed
- Memoized functions reduce renders

### ✅ Lint Compliance
- No more ESLint warnings
- Follows React hooks rules

## Debugging Tips

### If data still doesn't update:

1. **Check console for errors**
   ```bash
   # Open browser console (F12)
   # Look for API errors, React warnings
   ```

2. **Verify API calls**
   ```bash
   # Check network tab
   # Ensure API returns correct data
   curl http://localhost:8000/treasury/balance/18
   ```

3. **Add debug logs**
   ```typescript
   useEffect(() => {
     console.log('Company changed to:', selectedCompany)
     loadBalance()
   }, [selectedCompany, loadBalance])
   ```

4. **Check dependencies**
   ```typescript
   // All values used inside should be in deps
   useEffect(() => {
     doSomething(a, b, c)
   }, [a, b, c, doSomething])  // All of them!
   ```

## Status: ✅ FIXED

Both Settings and Analytics pages now:
- ✅ Update when company changes
- ✅ Have correct React hooks dependencies
- ✅ No stale closures
- ✅ No infinite loops
- ✅ Proper memoization

**Date:** October 19, 2025
**Issue:** Data not updating on company change
**Cause:** Missing useEffect dependencies
**Fix:** useCallback + exhaustive dependencies
