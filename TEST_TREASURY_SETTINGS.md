# Testing Treasury Settings Fix

## Quick Test Guide

### 1. Rebuild and Start Services

```bash
cd /home/mss_ds/treasury

# Stop everything
docker-compose down

# Rebuild with new database schema
docker-compose up -d --build

# Wait for services to be ready (30 seconds)
sleep 30

# Check logs
docker-compose logs -f backend
```

### 2. Verify Database Table

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U treasury_user -d treasury_db

# Check table exists
\dt treasury_balance

# View structure
\d treasury_balance

# Exit
\q
```

Expected output:
```
                                      Table "public.treasury_balance"
      Column          |           Type           | Collation | Nullable |      Default
----------------------+--------------------------+-----------+----------+-------------------
 treasury_balance_id  | integer                  |           | not null | nextval(...)
 company_id           | integer                  |           | not null |
 amount               | numeric(18,2)            |           | not null |
 reference_date       | date                     |           | not null |
 updated_at           | timestamp with time zone |           | not null | now()
 updated_by           | integer                  |           | not null |
 notes                | text                     |           |          |
```

### 3. Test Frontend

1. **Open Browser:** http://localhost:5173
2. **Login** (if needed)
3. **Navigate to:** Paramètres (Settings)

### 4. Test Scenarios

#### Scenario A: First Time Setup (No Balance)

**Steps:**
1. Select a company from dropdown
2. Should see empty form (no blue card)
3. Enter reference date: Today's date
4. Enter amount: 1000000
5. Enter notes: "Initial balance - BNP Account"
6. Click "Enregistrer"

**Expected:**
- ✅ Success toast: "Montant enregistré"
- ✅ Blue card appears showing €1,000,000.00
- ✅ Reference date displays
- ✅ "Mis à jour par" shows your user name

#### Scenario B: Update Existing Balance

**Steps:**
1. Keep same company selected
2. Change amount: 1250000
3. Change date: Tomorrow's date
4. Update notes: "Updated - BNP + Caisse"
5. Click "Enregistrer"

**Expected:**
- ✅ Success toast
- ✅ Blue card updates to €1,250,000.00
- ✅ New reference date shows
- ✅ Notes update displays

#### Scenario C: Switch Companies

**Steps:**
1. Select different company from dropdown
2. Observe form

**Expected:**
- ✅ Form fields clear OR show that company's balance
- ✅ Blue card updates or disappears
- ✅ Each company has independent balance

#### Scenario D: Validation Testing

**Test Invalid Amount:**
1. Enter amount: -1000
2. Click save

**Expected:**
- ✅ Error toast: "Veuillez saisir un montant valide"

**Test No Company:**
1. Manually clear company (shouldn't be possible normally)
2. Try to save

**Expected:**
- ✅ Error toast: "Veuillez sélectionner une entreprise"

#### Scenario E: Refresh Data

**Steps:**
1. Click "Actualiser" button

**Expected:**
- ✅ Form reloads with latest data
- ✅ Blue card refreshes

### 5. Backend API Testing

```bash
# Get balance for company 1
curl http://localhost:8000/api/treasury/balance/1

# Update balance
curl -X POST http://localhost:8000/api/treasury/balance \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "1",
    "amount": 1500000,
    "referenceDate": "2024-10-19",
    "notes": "Test balance"
  }'
```

### 6. Database Verification

```bash
# Connect to database
docker-compose exec postgres psql -U treasury_user -d treasury_db

# Check data
SELECT 
  tb.treasury_balance_id,
  c.name as company_name,
  tb.amount,
  tb.reference_date,
  u.display_name as updated_by,
  tb.updated_at,
  tb.notes
FROM treasury_balance tb
JOIN company c ON tb.company_id = c.company_id
JOIN "User" u ON tb.updated_by = u.user_id
ORDER BY tb.reference_date DESC;
```

Expected to see your test data with proper company associations.

### 7. Common Issues & Solutions

#### Issue: "Failed to load companies"
**Solution:** Ensure companies exist in database
```sql
-- Check companies
SELECT * FROM company;

-- If none, insert test companies
INSERT INTO company (name) VALUES ('Test Company 1');
INSERT INTO company (name) VALUES ('Test Company 2');
```

#### Issue: "No users found in system"
**Solution:** Create test user
```sql
INSERT INTO "User" (display_name, email, role) 
VALUES ('Test User', 'test@example.com', 'Admin');
```

#### Issue: Select dropdown not appearing
**Solution:** Check browser console for errors, ensure Select component exists

#### Issue: Database table not created
**Solution:** 
```bash
# Force rebuild
docker-compose down -v
docker-compose up -d --build
```

### 8. Verification Checklist

**Frontend:**
- [ ] Company dropdown shows all companies
- [ ] Selecting company loads its balance
- [ ] Blue card displays current balance correctly
- [ ] Amount field accepts decimals (0.01)
- [ ] Date picker works
- [ ] Notes field is optional
- [ ] Save button works
- [ ] Success/error toasts appear
- [ ] Refresh button reloads data
- [ ] Form clears when switching companies

**Backend:**
- [ ] GET endpoint returns correct balance
- [ ] POST endpoint creates new balance
- [ ] POST endpoint updates existing balance
- [ ] Validation works (company exists, amount ≥ 0)
- [ ] Most recent balance returned by reference_date
- [ ] User tracking works (updated_by field)

**Database:**
- [ ] Table created with correct schema
- [ ] Foreign keys enforced
- [ ] Unique constraint on (company_id, reference_date) works
- [ ] Data persists after restart

### 9. Performance Test

**Test with multiple companies:**
```bash
# Create 10 companies with balances
for i in {1..10}; do
  curl -X POST http://localhost:8000/api/treasury/balance \
    -H "Content-Type: application/json" \
    -d "{
      \"companyId\": \"${i}\",
      \"amount\": $((1000000 + i * 100000)),
      \"referenceDate\": \"2024-10-19\",
      \"notes\": \"Company ${i} balance\"
    }"
done

# Switch between companies in UI - should be fast
```

### 10. Integration Test

**Test with real workflow:**
1. Set treasury balance: €1,000,000 (Oct 1)
2. Go to Movements → Create movement: +€50,000 (Oct 5)
3. Go to Dashboard → Should show calculated balance: €1,050,000
4. Go to Analytics → Forecast should start from €1,000,000 baseline

### Success Criteria

✅ **PASS if:**
- All scenarios complete without errors
- Data persists across page refreshes
- Different companies have different balances
- Blue info card displays correctly
- Form validation works
- API calls succeed
- Database constraints enforced

❌ **FAIL if:**
- Cannot select company
- Balance not saved
- Data not company-specific
- Errors in console
- API returns 500 errors
- Database constraints violated

---

## Quick Commands

```bash
# Full restart
docker-compose down && docker-compose up -d --build

# View backend logs
docker-compose logs -f backend

# View frontend logs
docker-compose logs -f frontend

# Check database
docker-compose exec postgres psql -U treasury_user -d treasury_db

# Reset database (CAREFUL - deletes all data)
docker-compose down -v && docker-compose up -d
```

---

**Test Date:** October 19, 2024
**Expected Result:** All tests PASS ✅
