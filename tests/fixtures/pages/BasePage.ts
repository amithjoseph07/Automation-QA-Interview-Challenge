import { Page, Locator } from '@playwright/test';

/**
 * Base Page class with common functionality.
 * All specific page objects should extend this class.
 */
export class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific path or URL.
   * Example: await this.navigate('/login');
   */
  async navigate(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Wait for an element and return its text content.
   */
  async getElementText(selector: string): Promise<string> {
    const element = this.page.locator(selector);
    await element.waitFor();
    return (await element.textContent())?.trim() || '';
  }

  /**
   * Check if an element is visible on the page.
   */
  async isElementVisible(selector: string): Promise<boolean> {
    return await this.page.locator(selector).isVisible();
  }

  /**
   * Click an element.
   */
  async clickElement(selector: string): Promise<void> {
    await this.page.locator(selector).click();
  }

  /**
   * Fill input field with given text.
   */
  async fillInput(selector: string, text: string): Promise<void> {
    await this.page.locator(selector).fill(text);
  }

  /**
   * Get a Locator for custom actions.
   */
  getLocator(selector: string): Locator {
    return this.page.locator(selector);
  }

  /**
   * Wait until a selector is attached in the DOM.
   */
  async waitForSelector(selector: string): Promise<void> {
    await this.page.waitForSelector(selector);
  }

  /**
   * Take a screenshot (useful for debugging).
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }
}
