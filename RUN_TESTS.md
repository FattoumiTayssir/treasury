# Running Tests - Treasury Application

## ✅ Setup Complete

### Dependencies Installed:
- ✅ Poetry dev dependencies (pytest, pytest-cov, httpx, email-validator)
- ✅ Playwright (chromium browser installing...)
- ✅ Test structure created for all tabs

---

## 🧪 Running Tests

### **Option 1: Frontend Tests (E2E with Playwright)**

```bash
# Navigate to frontend
cd /home/mss_ds/treasury/front2

# Run all tests
npx playwright test

# Run with UI (interactive/debugging)
npx playwright test --ui

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific tab tests
npx playwright test tests/entrees_manuelles/manual-entries.spec.ts

# Run specific test
npx playwright test -g "should create a new manual entry"
```

**Prerequisites:**
- Application must be running: `docker-compose up -d`
- Test user must exist in database (email: test@example.com, password: password)

---

### **Option 2: Backend Tests (API Tests with Poetry)**

⚠️ **Important:** Backend tests require ALL backend dependencies. Best approach is to run inside Docker.

#### Method A: Inside Docker (Recommended)
```bash
cd /home/mss_ds/treasury

# Run tests in backend container
docker-compose exec backend pytest /app/tests/entrees_manuelles/ -v

# Or rebuild with test dependencies
docker-compose exec backend pip install pytest pytest-cov
docker-compose exec backend pytest /app/tests/ -v
```

#### Method B: With Poetry (Requires all dependencies)
```bash
cd /home/mss_ds/treasury

# Note: This requires installing ALL backend dependencies locally
# The app is designed to run in Docker, so this may have issues

PYTHONPATH=/home/mss_ds/treasury/backend:$PYTHONPATH poetry run pytest backend/tests/entrees_manuelles/ -v
```

---

## 📊 Test Coverage by Tab

### ✅ Entrées manuelles (Manual Entries)
- **Backend:** 10 API tests (CRUD operations)
- **Frontend:** 11 E2E tests (full user flow)
- **Status:** Complete and ready to run

### 📝 Other Tabs (To be implemented)
- Mouvements (Movements)
- Exceptions  
- Analyse (Analytics)
- Simulation
- Paramètres (Settings)
- Gestion des utilisateurs (User Management)

---

## 🎯 Quick Start

### Run Frontend Tests Now:
```bash
cd /home/mss_ds/treasury/front2
npx playwright test tests/entrees_manuelles/ --headed
```

This will:
1. Open a browser window
2. Login automatically
3. Navigate to Manual Entries tab
4. Test create, edit, delete operations
5. Show results in terminal

### View Test Results:
```bash
cd /home/mss_ds/treasury/front2
npx playwright show-report
```

---

## 📝 Test Structure

```
Treasury Application
├── backend/tests/          (API Unit/Integration Tests)
│   └── entrees_manuelles/  ✅ 10 tests ready
│       └── test_manual_entries_crud.py
│
└── front2/tests/           (E2E Browser Tests)
    └── entrees_manuelles/  ✅ 11 tests ready
        └── manual-entries.spec.ts
```

---

## 💡 Tips

### Frontend Tests:
- Tests run against `http://localhost:3000`
- Ensure Docker services are running first
- Screenshots saved in `test-results/` on failure
- Use `--debug` flag to step through tests

### Backend Tests:
- Run inside Docker container for best results
- Tests use SQLite in-memory database
- Each test runs in isolation
- Can run specific test classes or methods

---

## 🐛 Troubleshooting

### "Cannot connect to http://localhost:3000"
```bash
cd /home/mss_ds/treasury
docker-compose up -d
docker-compose logs frontend  # Check if running
```

### "Test user not found"
Create test user through the UI or database:
- Email: test@example.com
- Password: password
- Role: Admin

### Backend dependency errors
Run tests inside Docker instead of locally.

---

## 📚 Saved to Memory

All Poetry testing commands have been saved to your project memory and can be recalled with:
- **poetry run pytest** for backend tests
- **npx playwright test** for frontend tests

Check memory or this file for complete command reference.

---

**Next Steps:**
1. Wait for Playwright installation to complete
2. Run: `cd front2 && npx playwright test tests/entrees_manuelles/`
3. Watch tests run in browser!
