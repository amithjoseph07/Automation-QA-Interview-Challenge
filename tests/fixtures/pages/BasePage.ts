import { Page } from '@playwright/test';

/**
 * Base Page class with common functionality
 * Extend this class for specific page objects
 */
export class BasePage {
  constructor(protected page: Page) {}

  /**
   * Navigate to a specific path
   */
  async navigate(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Wait for an element and return its text
   */
  async getElementText(selector: string): Promise<string> {
    const element = this.page.locator(selector);
    await element.waitFor();
    return await element.textContent() || '';
  }

  /**
   * Check if an element is visible
   */
  async isElementVisible(selector: string): Promise<boolean> {
    return await this.page.locator(selector).isVisible();
  }

  // TODO: Add more common methods as needed
}