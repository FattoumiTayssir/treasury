# Frontend Tests - Treasury Application

## Overview
End-to-end (E2E) tests for the Treasury frontend using Playwright, organized by application tabs.

## Test Structure
```
tests/
├── entrees_manuelles/     # Manual Entries tab E2E tests
│   └── manual-entries.spec.ts
├── mouvements/            # Movements tab tests (to be added)
├── exceptions/            # Exceptions tab tests (to be added)
├── analyse/               # Analytics tab tests (to be added)
├── simulation/            # Simulation tab tests (to be added)
├── parametres/            # Settings tab tests (to be added)
└── utilisateurs/          # User Management tests (to be added)
```

## Installation

1. Install Playwright:
```bash
cd /home/mss_ds/treasury/front2
npm install -D @playwright/test @types/node
npx playwright install chromium
```

2. Ensure the application is running:
```bash
# From project root
docker-compose up -d
```

## Running Tests

### Run all tests:
```bash
cd /home/mss_ds/treasury/front2
npx playwright test
```

### Run with UI mode (interactive):
```bash
npx playwright test --ui
```

### Run in headed mode (see browser):
```bash
npx playwright test --headed
```

### Run specific test file:
```bash
npx playwright test tests/entrees_manuelles/manual-entries.spec.ts
```

### Run specific test:
```bash
npx playwright test -g "should create a new manual entry"
```

### Debug mode:
```bash
npx playwright test --debug
```

## Test Coverage

### Manual Entries (Entrées manuelles) ✅
- ✅ Create single occurrence entry
- ✅ Create monthly frequency entry
- ✅ Create with custom dates
- ✅ Edit existing entry
- ✅ Delete single entry
- ✅ Delete multiple entries (batch)
- ✅ Form validation
- ✅ Search/filter entries
- ✅ Verify entries appear in Movements tab

### To be implemented:
- [ ] Movements (Mouvements) - Filter by type, exclusion from analytics
- [ ] Exceptions - State updates, batch operations
- [ ] Analytics (Analyse) - Charts, metrics, forecasts
- [ ] Simulation - Scenario creation, comparison
- [ ] Settings (Paramètres) - Company management, treasury baseline
- [ ] User Management (Utilisateurs) - CRUD operations, permissions

## Test Requirements

### Prerequisites:
1. Backend must be running on `http://localhost:8000`
2. Frontend must be running on `http://localhost:3000`
3. Test user must exist:
   - Email: `test@example.com`
   - Password: `password`
   - Role: Admin

### Test Data:
- Tests create their own data during execution
- Tests clean up after themselves (delete created entries)
- Some tests may leave data for debugging (can be cleaned manually)

## Screenshots and Videos

Failed tests automatically capture:
- Screenshots (stored in `test-results/`)
- Videos (if configured)
- Traces for debugging

View test results:
```bash
npx playwright show-report
```

## CI/CD Integration

Add to your CI pipeline:
```yaml
- name: Run Playwright tests
  run: |
    cd front2
    npm install
    npx playwright install --with-deps
    npx playwright test
```

## Troubleshooting

### Application not accessible:
```bash
# Check if services are running
docker-compose ps

# Check logs
docker-compose logs frontend
docker-compose logs backend
```

### Test user doesn't exist:
Create the test user in the database or through the UI before running tests.

### Timeout errors:
Increase timeout in `playwright.config.ts`:
```typescript
use: {
  timeout: 30000,  // 30 seconds
}
```

### Browser not found:
```bash
npx playwright install chromium
```

## Best Practices

1. **Use data-testid attributes**: Add `data-testid` to important elements for stable selectors
2. **Wait for elements**: Use `await expect(element).toBeVisible()` instead of arbitrary waits
3. **Clean up**: Delete test data after tests complete
4. **Isolate tests**: Each test should be independent
5. **Use fixtures**: Reuse common setup logic

## Notes

- Playwright tests require the full application stack to be running
- Tests run in Chromium by default (can add Firefox, Safari)
- Lint errors about missing '@playwright/test' will resolve after installation
- Frontend must be accessible at http://localhost:3000 for tests to run
