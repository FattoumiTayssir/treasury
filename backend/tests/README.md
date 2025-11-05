# Backend Tests - Treasury Application

## Overview
Comprehensive test suite for the Treasury backend API, organized by application tabs/features.

## Test Structure
```
tests/
├── entrees_manuelles/     # Manual Entries tab tests
│   └── test_manual_entries_crud.py
├── mouvements/            # Movements tab tests (to be added)
├── exceptions/            # Exceptions tab tests (to be added)
├── analyse/               # Analytics tab tests (to be added)
├── simulation/            # Simulation tab tests (to be added)
├── parametres/            # Settings tab tests (to be added)
└── utilisateurs/          # User Management tests (to be added)
```

## Installation

1. Install pytest and dependencies using Poetry:
```bash
cd /home/mss_ds/treasury
poetry add --group dev pytest pytest-cov httpx email-validator
```

2. Set up test database (optional, uses SQLite by default):
```bash
export TEST_DB_URL="sqlite:///./test.db"
```

## Running Tests

### Run all tests:
```bash
cd /home/mss_ds/treasury
PYTHONPATH=/home/mss_ds/treasury/backend:$PYTHONPATH poetry run pytest backend/tests/ -v
```

### Run specific test module:
```bash
# Manual Entries tests
PYTHONPATH=/home/mss_ds/treasury/backend:$PYTHONPATH poetry run pytest backend/tests/entrees_manuelles/ -v

# With coverage
PYTHONPATH=/home/mss_ds/treasury/backend:$PYTHONPATH poetry run pytest backend/tests/ -v --cov=backend/app --cov-report=html
```

### Run specific test:
```bash
PYTHONPATH=/home/mss_ds/treasury/backend:$PYTHONPATH poetry run pytest backend/tests/entrees_manuelles/test_manual_entries_crud.py::TestManualEntriesCRUD::test_create_manual_entry_single_occurrence -v
```

## Test Coverage

### Manual Entries (Entrées manuelles) ✅
- ✅ Create single occurrence entry
- ✅ Create monthly frequency entry
- ✅ Create with custom dates
- ✅ Read all entries
- ✅ Read single entry by ID
- ✅ Delete single entry
- ✅ Delete multiple entries (batch)
- ✅ Validation (missing fields)
- ✅ Authentication required
- ✅ Past date handling

### To be implemented:
- [ ] Movements (Mouvements)
- [ ] Exceptions
- [ ] Analytics (Analyse)
- [ ] Simulation
- [ ] Settings (Paramètres)
- [ ] User Management (Utilisateurs)

## Test Data

Tests use fixtures to create:
- Test user with authentication token
- Test company
- Test manual entries with various configurations

Each test runs in isolation with a fresh database.

## CI/CD Integration

To run in Docker:
```bash
docker-compose run backend pytest tests/ -v
```

## Troubleshooting

### Database locked error:
Use a unique test database for each test run or clean up between tests.

### Authentication errors:
Ensure the test user fixture is properly created before running tests that require authentication.

### Import errors:
Make sure you're running from the backend directory or adjust PYTHONPATH:
```bash
export PYTHONPATH=/home/mss_ds/treasury/backend:$PYTHONPATH
```
