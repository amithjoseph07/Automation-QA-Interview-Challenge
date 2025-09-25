import { test, expect } from '@playwright/test';

/**
 * Example test file - DELETE THIS and create your own student-onboarding.spec.ts
 * This shows the basic structure expected
 */

test.describe('Example Test Structure', () => {

  test('example of a test case', async ({ page }) => {
    // Arrange - Set up test data and navigate
    await page.goto('https://example.com');

    // Act - Perform the action being tested
    await page.click('button');

    // Assert - Verify the expected outcome
    await expect(page.locator('.success')).toBeVisible();
  });

  test.skip('this test is skipped', async ({ page }) => {
    // Use .skip for tests you're not ready to implement
  });

});

// TODO: Delete this file and create your own implementation