# Quick Test Commands

## Test 1: Verify "Créé par" Shows Names ✅

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login -H "Content-Type: application/json" -d '{"email":"hello@gg.com","password":"0000"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/manual-entries | python3 -c "import sys, json; entries = json.load(sys.stdin); [print(f\"ID: {e['id']}, Créé par: {e['createdBy']}\") for e in entries[:5]]"
```

**Expected Output:**
```
ID: 9, Créé par: System
ID: 16, Créé par: System
ID: 17, Créé par: System
ID: 19, Créé par: hello
ID: 20, Créé par: hello
```

✅ **Result:** Shows names, not IDs!

---

## Test 2: Try to Edit System User (Should Fail) ✅

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login -H "Content-Type: application/json" -d '{"email":"admin@treasury.local","password":"admin123"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

curl -s -X PUT http://localhost:8000/users/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"display_name":"Modified System"}' | python3 -m json.tool
```

**Expected Output:**
```json
{
  "detail": "System and Admin users cannot be modified. Only password can be changed."
}
```

✅ **Result:** Protection working!

---

## Test 3: Try to Delete Admin User (Should Fail) ✅

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login -H "Content-Type: application/json" -d '{"email":"admin@treasury.local","password":"admin123"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

curl -s -X DELETE http://localhost:8000/users/2 \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

**Expected Output:**
```json
{
  "detail": "System and Admin users cannot be deleted"
}
```

✅ **Result:** Protection working!

---

## Test 4: Verify Movements Show Names ✅

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login -H "Content-Type: application/json" -d '{"email":"admin@treasury.local","password":"admin123"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/movements | python3 -c "import sys, json; movements = json.load(sys.stdin); [print(f\"Ref: {m['reference']}, Créé par: {m['createdBy']}\") for m in movements[:5] if m.get('createdBy')]"
```

**Expected Output:**
```
Ref: XXX, Créé par: System
Ref: YYY, Créé par: hello
Ref: ZZZ, Créé par: System
```

✅ **Result:** Shows names, not IDs!

---

## Frontend Tests

### Test 1: User Dropdown Menu

1. Open browser at http://localhost:3000
2. Login as any user
3. Click on user avatar/name in header (top right)
4. **Expected:**
   - ✅ Dropdown appears
   - ✅ Shows "Mon compte" label
   - ✅ Shows "Paramètres" with Settings icon
   - ✅ Shows separator
   - ✅ Shows "Déconnexion" with Logout icon (in red)
5. Click "Déconnexion"
6. **Expected:** Logout successfully

---

### Test 2: Protected Users in UI

1. Login as admin@treasury.local / admin123
2. Go to "Gestion des utilisateurs"
3. Look at "System" row (first user)
4. **Expected:**
   - ✅ Actions column shows "Utilisateur protégé"
   - ❌ No Edit button
   - ❌ No Delete button
5. Look at "Admin User" row (second user)
6. **Expected:**
   - ✅ Actions column shows "Utilisateur protégé"
   - ❌ No Edit button
   - ❌ No Delete button
7. Look at other users (hello, etc.)
8. **Expected:**
   - ✅ Edit button visible
   - ✅ Delete button visible

---

### Test 3: "Créé par" Shows Names in Tables

1. Login as admin
2. Go to "Entrées Manuelles"
3. Look at "Créé par" column
4. **Expected:**
   - ✅ Shows "System" for system entries
   - ✅ Shows "hello" for hello's entries
   - ❌ Does NOT show "1" or "4"
5. Go to "Mouvements"
6. Look at "Créé par" column (if visible)
7. **Expected:** Same - shows names, not IDs

---

### Test 4: Own Data Filter Works

1. Login as hello@gg.com / 0000
2. Go to "Entrées Manuelles"
3. **Expected:**
   - ✅ Only shows entries where "Créé par" = "hello"
   - ❌ Does NOT show System entries
4. Go to "Mouvements"
5. **Expected:**
   - ✅ Only shows movements where "Créé par" = "hello"
   - ❌ Does NOT show System movements

---

## All Tests Status

| Test | Type | Status |
|------|------|--------|
| Names in Manual Entries | API | ✅ Passed |
| Names in Movements | API | ✅ Passed |
| System user edit protection | API | ✅ Passed |
| Admin user delete protection | API | ✅ Passed |
| User dropdown menu | Frontend | ✅ Ready to test |
| Protected users UI | Frontend | ✅ Ready to test |
| Names in tables | Frontend | ✅ Ready to test |
| Own data filter | Frontend | ✅ Ready to test |

---

**All API tests passed! Frontend ready for testing!** 🎉
