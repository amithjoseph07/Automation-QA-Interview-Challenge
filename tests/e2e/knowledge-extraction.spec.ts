import { test, expect } from '@playwright/test';
import { SourcesPage } from '../fixtures/page-objects/SourcesPage';
import { generateRandomSource } from '../fixtures/test-data';

test.describe('Knowledge Extraction E2E Tests', () => {
  let sourcesPage: SourcesPage;
  let createdSources: string[] = [];

  test.beforeEach(async ({ page }) => {
    sourcesPage = new SourcesPage(page);
    await sourcesPage.goto();
  });

  test.afterEach(async ({ page }) => {
    // Cleanup created sources
    for (const sourceName of createdSources) {
      try {
        await sourcesPage.goto();
        await sourcesPage.deleteSource(sourceName);
      } catch (error) {
        // Source might already be deleted
      }
    }
    createdSources = [];
  });

  test('should complete full extraction workflow', async ({ page }) => {
    const sourceData = generateRandomSource();
    createdSources.push(sourceData.name);

    // Step 1: Navigate to sources page
    await expect(page).toHaveURL(/\/sources/);
    await expect(page.locator('[data-testid="page-title"]')).toContainText('Knowledge Sources');

    // Step 2: Add new source
    await sourcesPage.clickAddSource();
    await expect(page.locator('[data-testid="modal-title"]')).toContainText('Add Knowledge Source');

    // Step 3: Fill source form
    await sourcesPage.fillSourceForm({
      name: sourceData.name,
      type: 'ONENOTE',
      notebook: 'Test Notebook',
      section: 'Test Section',
    });

    // Step 4: Submit form
    await sourcesPage.submitSourceForm();
    await expect(sourcesPage.validationStatus).toContainText('Validating');

    // Step 5: Wait for validation
    const validationStatus = await sourcesPage.waitForValidation();
    expect(['Validated', 'Validation Failed']).toContain(validationStatus);

    // Step 6: Verify source appears in list
    const sourceCount = await sourcesPage.getSourceCount();
    expect(sourceCount).toBeGreaterThan(0);

    const sourceElement = await sourcesPage.getSourceByName(sourceData.name);
    await expect(sourceElement).toBeVisible();

    // Step 7: Trigger extraction
    await sourcesPage.clickExtractForSource(sourceData.name);
    await expect(sourcesPage.progressBar).toBeVisible();

    // Step 8: Monitor progress
    let progress = 0;
    let attempts = 0;
    while (progress < 100 && attempts < 30) {
      progress = await sourcesPage.getExtractionProgress();
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(100);
      await page.waitForTimeout(2000);
      attempts++;
    }

    // Step 9: Verify completion
    await sourcesPage.waitForExtractionComplete();
    const status = await sourcesPage.getSourceStatus(sourceData.name);
    expect(status).toBe('Active');

    // Step 10: Verify document count
    const docCount = await sourcesPage.getDocumentCount(sourceData.name);
    expect(docCount).toBeGreaterThan(0);
  });

  test('should handle multiple concurrent extractions', async ({ page }) => {
    const sources = Array(3).fill(null).map(() => generateRandomSource());
    sources.forEach(s => createdSources.push(s.name));

    // Create multiple sources
    for (const source of sources) {
      await sourcesPage.clickAddSource();
      await sourcesPage.fillSourceForm({
        name: source.name,
        type: 'GITHUB',
        repository: 'test-org/test-repo',
      });
      await sourcesPage.submitSourceForm();
      await page.waitForTimeout(500);
    }

    // Trigger extraction for all sources
    const extractionPromises = sources.map(source =>
      sourcesPage.clickExtractForSource(source.name)
    );
    await Promise.all(extractionPromises);

    // Verify all progress bars are visible
    const progressBars = await page.locator('[role="progressbar"]').count();
    expect(progressBars).toBe(3);

    // Wait for at least one to complete
    await page.waitForSelector('[data-testid="extraction-status"]:has-text("Completed")', {
      timeout: 60000,
    });

    // Verify no errors occurred
    const errorMessages = await page.locator('[data-testid="error-message"]').count();
    expect(errorMessages).toBe(0);
  });

  test('should handle extraction failure gracefully', async ({ page }) => {
    const sourceData = generateRandomSource();
    createdSources.push(sourceData.name);

    // Mock API to return error
    await page.route('**/api/extract/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Extraction service unavailable' }),
      });
    });

    // Create source
    await sourcesPage.clickAddSource();
    await sourcesPage.fillSourceForm({
      name: sourceData.name,
      type: 'ONENOTE',
      notebook: 'Test',
    });
    await sourcesPage.submitSourceForm();

    // Try to extract
    await sourcesPage.clickExtractForSource(sourceData.name);

    // Verify error handling
    const errorToast = await sourcesPage.waitForToast('error');
    expect(errorToast).toContain('Extraction failed');

    // Verify source status
    const status = await sourcesPage.getSourceStatus(sourceData.name);
    expect(status).toBe('Error');

    // Verify retry button appears
    const retryButton = page.locator('[data-testid="retry-extraction"]');
    await expect(retryButton).toBeVisible();
  });

  test('should validate form inputs', async ({ page }) => {
    await sourcesPage.clickAddSource();

    // Try to submit empty form
    await sourcesPage.submitButton.click();

    // Check validation messages
    const nameError = page.locator('[data-testid="error-sourceName"]');
    await expect(nameError).toContainText('Name is required');

    const typeError = page.locator('[data-testid="error-sourceType"]');
    await expect(typeError).toContainText('Type is required');

    // Fill invalid data
    await sourcesPage.sourceNameInput.fill('a'); // Too short
    await sourcesPage.sourceTypeSelect.selectOption('ONENOTE');

    // Check character limit
    const longName = 'a'.repeat(256);
    await sourcesPage.sourceNameInput.fill(longName);
    await expect(nameError).toContainText('Name must be less than 255 characters');

    // Fill valid data
    await sourcesPage.sourceNameInput.fill('Valid Source Name');
    await page.fill('[name="notebook"]', 'Test Notebook');

    // Verify errors are cleared
    await expect(nameError).not.toBeVisible();
  });

  test('should support search and filtering', async ({ page }) => {
    // Create sources with different types
    const sources = [
      { ...generateRandomSource(), type: 'ONENOTE' },
      { ...generateRandomSource(), type: 'GITHUB' },
      { ...generateRandomSource(), type: 'EMAIL' },
    ];

    for (const source of sources) {
      createdSources.push(source.name);
      await sourcesPage.clickAddSource();
      await sourcesPage.fillSourceForm({
        name: source.name,
        type: source.type,
        notebook: source.type === 'ONENOTE' ? 'Test' : undefined,
        repository: source.type === 'GITHUB' ? 'test/repo' : undefined,
      });
      await sourcesPage.submitSourceForm();
      await page.waitForTimeout(500);
    }

    // Test search
    await sourcesPage.searchSources(sources[0].name);
    let count = await sourcesPage.getSourceCount();
    expect(count).toBe(1);

    // Clear search
    await sourcesPage.searchInput.clear();
    await page.keyboard.press('Enter');

    // Test filtering
    await sourcesPage.filterByType('GITHUB');
    count = await sourcesPage.getSourceCount();
    expect(count).toBe(1);

    // Verify filtered source
    const visibleSource = await page.locator('[data-testid^="source-item-"]').first();
    await expect(visibleSource).toContainText('GITHUB');
  });

  test('should handle pagination', async ({ page }) => {
    // This test assumes there are many existing sources
    // or we need to create many for testing

    // Check if pagination controls exist
    const pagination = page.locator('[data-testid="pagination"]');

    if (await pagination.isVisible()) {
      // Test next page
      const nextButton = page.locator('[data-testid="next-page"]');
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        await page.waitForTimeout(500);

        // Verify page changed
        const currentPage = page.locator('[data-testid="current-page"]');
        await expect(currentPage).toContainText('2');
      }

      // Test previous page
      const prevButton = page.locator('[data-testid="prev-page"]');
      if (await prevButton.isEnabled()) {
        await prevButton.click();
        await page.waitForTimeout(500);

        // Verify page changed back
        const currentPage = page.locator('[data-testid="current-page"]');
        await expect(currentPage).toContainText('1');
      }
    }
  });

  test('should support bulk operations', async ({ page }) => {
    // Create multiple sources
    const sources = Array(3).fill(null).map(() => generateRandomSource());
    sources.forEach(s => createdSources.push(s.name));

    for (const source of sources) {
      await sourcesPage.clickAddSource();
      await sourcesPage.fillSourceForm({
        name: source.name,
        type: 'ONENOTE',
        notebook: 'Test',
      });
      await sourcesPage.submitSourceForm();
      await page.waitForTimeout(500);
    }

    // Select multiple sources
    await sourcesPage.bulkSelect(sources.slice(0, 2).map(s => s.name));

    // Verify bulk actions appear
    const bulkActions = page.locator('[data-testid="bulk-actions"]');
    await expect(bulkActions).toBeVisible();

    // Perform bulk delete
    await sourcesPage.bulkDelete();

    // Verify sources are deleted
    await page.waitForTimeout(1000);
    const remainingCount = await sourcesPage.getSourceCount();
    expect(remainingCount).toBe(1);

    // Clean up tracking
    createdSources = [sources[2].name];
  });
});