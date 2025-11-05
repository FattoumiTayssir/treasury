/**
 * Comprehensive E2E tests for Manual Entries (Entrées manuelles)
 * Tests: Create, Read, Update, Delete operations in the UI
 */
import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'password';

test.describe('Manual Entries CRUD Operations', () => {
  // Setup: Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Login
    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for navigation to complete
    await page.waitForURL(BASE_URL + '/analyse', { timeout: 10000 });
    
    // Navigate to Manual Entries tab
    await page.click('text=Entrées manuelles');
    await page.waitForURL(BASE_URL + '/manual-entries');
  });

  test('should create a new manual entry with single occurrence', async ({ page }) => {
    // Click "Nouvelle entrée" button
    await page.click('button:has-text("Nouvelle entrée")');
    
    // Wait for dialog to open
    await expect(page.locator('text=Nouvelle entrée manuelle')).toBeVisible();
    
    // Fill in the form
    await page.selectOption('select:near(:text("Catégorie"))', 'RH');
    await page.selectOption('select:near(:text("Type"))', 'Salaire');
    await page.fill('input[type="number"]:near(:text("Montant"))', '5000');
    await page.selectOption('select:near(:text("Signe"))', 'Sortie');
    await page.selectOption('select:near(:text("Fréquence"))', 'Une seule fois');
    
    // Set future date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    await page.fill('input[type="date"]', dateStr);
    
    // Optional fields
    await page.fill('input[placeholder="Optionnel"]:near(:text("Référence"))', 'TEST-001');
    await page.fill('textarea[placeholder*="Description"]:near(:text("Note"))', 'Test manual entry');
    
    // Submit
    await page.click('button:has-text("Créer")');
    
    // Wait for success toast
    await expect(page.locator('text=Entrée créée')).toBeVisible({ timeout: 5000 });
    
    // Verify entry appears in the table
    await expect(page.locator('text=TEST-001')).toBeVisible();
    await expect(page.locator('text=5000')).toBeVisible();
  });

  test('should create a manual entry with monthly frequency', async ({ page }) => {
    await page.click('button:has-text("Nouvelle entrée")');
    await expect(page.locator('text=Nouvelle entrée manuelle')).toBeVisible();
    
    // Fill in the form
    await page.selectOption('select:near(:text("Catégorie"))', 'Achat');
    await page.selectOption('select:near(:text("Type"))', 'Achats locaux avec échéance');
    await page.fill('input[type="number"]:near(:text("Montant"))', '1000');
    await page.selectOption('select:near(:text("Signe"))', 'Sortie');
    await page.selectOption('select:near(:text("Fréquence"))', 'Mensuel');
    
    // Set start and end dates
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 90);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    await page.fill('input[type="date"]:near(:text("Date de début"))', startDateStr);
    await page.fill('input[type="date"]:near(:text("Date de fin"))', endDateStr);
    
    await page.fill('input[placeholder="Optionnel"]:near(:text("Référence"))', 'MONTHLY-001');
    
    // Submit
    await page.click('button:has-text("Créer")');
    
    // Wait for success
    await expect(page.locator('text=Entrée créée')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=MONTHLY-001')).toBeVisible();
    await expect(page.locator('text=Mensuel')).toBeVisible();
  });

  test('should create a manual entry with custom dates', async ({ page }) => {
    await page.click('button:has-text("Nouvelle entrée")');
    await expect(page.locator('text=Nouvelle entrée manuelle')).toBeVisible();
    
    // Fill basic fields
    await page.selectOption('select:near(:text("Catégorie"))', 'Vente');
    await page.selectOption('select:near(:text("Type"))', 'Ventes locales');
    await page.fill('input[type="number"]:near(:text("Montant"))', '2500');
    await page.selectOption('select:near(:text("Signe"))', 'Entrée');
    await page.selectOption('select:near(:text("Fréquence"))', 'Dates personnalisées');
    
    // Add custom dates
    const date1 = new Date();
    date1.setDate(date1.getDate() + 5);
    const date2 = new Date();
    date2.setDate(date2.getDate() + 15);
    const date3 = new Date();
    date3.setDate(date3.getDate() + 25);
    
    // Add first date
    await page.fill('input[type="date"]:near(:text("Dates personnalisées"))', date1.toISOString().split('T')[0]);
    await page.click('button:has-text("Ajouter")');
    
    // Add second date
    await page.fill('input[type="date"]:near(:text("Dates personnalisées"))', date2.toISOString().split('T')[0]);
    await page.click('button:has-text("Ajouter")');
    
    // Add third date
    await page.fill('input[type="date"]:near(:text("Dates personnalisées"))', date3.toISOString().split('T')[0]);
    await page.click('button:has-text("Ajouter")');
    
    // Verify dates are added
    await expect(page.locator('text=' + date1.toISOString().split('T')[0])).toBeVisible();
    await expect(page.locator('text=' + date2.toISOString().split('T')[0])).toBeVisible();
    await expect(page.locator('text=' + date3.toISOString().split('T')[0])).toBeVisible();
    
    await page.fill('input[placeholder="Optionnel"]:near(:text("Référence"))', 'CUSTOM-001');
    
    // Submit
    await page.click('button:has-text("Créer")');
    
    // Wait for success
    await expect(page.locator('text=Entrée créée')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=CUSTOM-001')).toBeVisible();
  });

  test('should edit an existing manual entry', async ({ page }) => {
    // First, create an entry
    await page.click('button:has-text("Nouvelle entrée")');
    await page.selectOption('select:near(:text("Catégorie"))', 'RH');
    await page.selectOption('select:near(:text("Type"))', 'Salaire');
    await page.fill('input[type="number"]:near(:text("Montant"))', '3000');
    await page.selectOption('select:near(:text("Signe"))', 'Sortie');
    await page.selectOption('select:near(:text("Fréquence"))', 'Une seule fois');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.fill('input[type="date"]', tomorrow.toISOString().split('T')[0]);
    await page.fill('input[placeholder="Optionnel"]:near(:text("Référence"))', 'EDIT-TEST');
    
    await page.click('button:has-text("Créer")');
    await expect(page.locator('text=Entrée créée')).toBeVisible({ timeout: 5000 });
    
    // Now edit it
    // Find the row with EDIT-TEST and click edit button
    const row = page.locator('tr:has-text("EDIT-TEST")');
    await row.locator('button[title*="Modifier"]').click();
    
    // Wait for dialog
    await expect(page.locator('text=Modifier l\'entrée manuelle')).toBeVisible();
    
    // Modify amount
    await page.fill('input[type="number"]:near(:text("Montant"))', '3500');
    await page.fill('textarea[placeholder*="Description"]:near(:text("Note"))', 'Updated note');
    
    // Submit
    await page.click('button:has-text("Modifier")');
    
    // Wait for confirmation dialog
    await expect(page.locator('text=Confirmer la modification')).toBeVisible();
    await page.click('button:has-text("Oui, modifier")');
    
    // Wait for success
    await expect(page.locator('text=Entrée modifiée')).toBeVisible({ timeout: 5000 });
    
    // Verify the change
    await expect(page.locator('text=3500')).toBeVisible();
  });

  test('should delete a single manual entry', async ({ page }) => {
    // Create an entry first
    await page.click('button:has-text("Nouvelle entrée")');
    await page.selectOption('select:near(:text("Catégorie"))', 'Autre');
    await page.selectOption('select:near(:text("Type"))', 'Autre');
    await page.fill('input[type="number"]:near(:text("Montant"))', '500');
    await page.selectOption('select:near(:text("Signe"))', 'Sortie');
    await page.selectOption('select:near(:text("Fréquence"))', 'Une seule fois');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.fill('input[type="date"]', tomorrow.toISOString().split('T')[0]);
    await page.fill('input[placeholder="Optionnel"]:near(:text("Référence"))', 'DELETE-TEST');
    
    await page.click('button:has-text("Créer")');
    await expect(page.locator('text=Entrée créée')).toBeVisible({ timeout: 5000 });
    
    // Delete it
    const row = page.locator('tr:has-text("DELETE-TEST")');
    await row.locator('input[type="checkbox"]').check();
    
    // Click delete button
    await page.click('button:has-text("Supprimer")');
    
    // Confirm deletion
    await expect(page.locator('text=Confirmer la suppression')).toBeVisible();
    await page.click('button:has-text("Oui, supprimer")');
    
    // Wait for success
    await expect(page.locator('text=supprimées')).toBeVisible({ timeout: 5000 });
    
    // Verify entry is gone
    await expect(page.locator('text=DELETE-TEST')).not.toBeVisible();
  });

  test('should delete multiple manual entries', async ({ page }) => {
    // Create multiple entries
    for (let i = 1; i <= 3; i++) {
      await page.click('button:has-text("Nouvelle entrée")');
      await page.selectOption('select:near(:text("Catégorie"))', 'RH');
      await page.selectOption('select:near(:text("Type"))', 'Charges sociales');
      await page.fill('input[type="number"]:near(:text("Montant"))', '1000');
      await page.selectOption('select:near(:text("Signe"))', 'Sortie');
      await page.selectOption('select:near(:text("Fréquence"))', 'Une seule fois');
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await page.fill('input[type="date"]', tomorrow.toISOString().split('T')[0]);
      await page.fill('input[placeholder="Optionnel"]:near(:text("Référence"))', `BATCH-${i}`);
      
      await page.click('button:has-text("Créer")');
      await expect(page.locator('text=Entrée créée')).toBeVisible({ timeout: 5000 });
      
      // Close dialog if it's still open
      const dialog = page.locator('[role="dialog"]');
      if (await dialog.isVisible()) {
        await page.click('button[aria-label="Close"]');
      }
    }
    
    // Select all three entries
    await page.locator('tr:has-text("BATCH-1") input[type="checkbox"]').check();
    await page.locator('tr:has-text("BATCH-2") input[type="checkbox"]').check();
    await page.locator('tr:has-text("BATCH-3") input[type="checkbox"]').check();
    
    // Delete them
    await page.click('button:has-text("Supprimer")');
    await expect(page.locator('text=Confirmer la suppression')).toBeVisible();
    await page.click('button:has-text("Oui, supprimer")');
    
    // Wait for success
    await expect(page.locator('text=supprimées')).toBeVisible({ timeout: 5000 });
    
    // Verify all entries are gone
    await expect(page.locator('text=BATCH-1')).not.toBeVisible();
    await expect(page.locator('text=BATCH-2')).not.toBeVisible();
    await expect(page.locator('text=BATCH-3')).not.toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.click('button:has-text("Nouvelle entrée")');
    await expect(page.locator('text=Nouvelle entrée manuelle')).toBeVisible();
    
    // Try to submit without filling required fields
    await page.click('button:has-text("Créer")');
    
    // Should show validation errors
    await expect(page.locator('text=Champ requis').or(page.locator('text=obligatoire'))).toBeVisible();
  });

  test('should filter manual entries by search', async ({ page }) => {
    // Create test entries
    await page.click('button:has-text("Nouvelle entrée")');
    await page.selectOption('select:near(:text("Catégorie"))', 'RH');
    await page.selectOption('select:near(:text("Type"))', 'Salaire');
    await page.fill('input[type="number"]:near(:text("Montant"))', '5000');
    await page.selectOption('select:near(:text("Signe"))', 'Sortie');
    await page.selectOption('select:near(:text("Fréquence"))', 'Une seule fois');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.fill('input[type="date"]', tomorrow.toISOString().split('T')[0]);
    await page.fill('input[placeholder="Optionnel"]:near(:text("Référence"))', 'SEARCH-TEST');
    
    await page.click('button:has-text("Créer")');
    await expect(page.locator('text=Entrée créée')).toBeVisible({ timeout: 5000 });
    
    // Use search/filter
    const searchInput = page.locator('input[placeholder*="Rechercher"]').or(page.locator('input[type="search"]')).first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('SEARCH-TEST');
      await expect(page.locator('text=SEARCH-TEST')).toBeVisible();
    }
  });

  test('should display created manual entries in movements tab', async ({ page }) => {
    // Create a manual entry
    await page.click('button:has-text("Nouvelle entrée")');
    await page.selectOption('select:near(:text("Catégorie"))', 'RH');
    await page.selectOption('select:near(:text("Type"))', 'Salaire');
    await page.fill('input[type="number"]:near(:text("Montant"))', '6000');
    await page.selectOption('select:near(:text("Signe"))', 'Sortie');
    await page.selectOption('select:near(:text("Fréquence"))', 'Une seule fois');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.fill('input[type="date"]', tomorrow.toISOString().split('T')[0]);
    await page.fill('input[placeholder="Optionnel"]:near(:text("Référence"))', 'MOVEMENT-CHECK');
    
    await page.click('button:has-text("Créer")');
    await expect(page.locator('text=Entrée créée')).toBeVisible({ timeout: 5000 });
    
    // Navigate to Movements tab
    await page.click('text=Mouvements');
    await page.waitForURL(BASE_URL + '/movements');
    
    // Verify the movement appears
    await expect(page.locator('text=MOVEMENT-CHECK')).toBeVisible();
    await expect(page.locator('text=6000').or(page.locator('text=6,000'))).toBeVisible();
    await expect(page.locator('text=Entrée manuelle')).toBeVisible();
  });
});
