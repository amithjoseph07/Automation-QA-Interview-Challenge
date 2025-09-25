import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  protected page: Page;
  protected baseURL: string;

  constructor(page: Page) {
    this.page = page;
    this.baseURL = process.env.BASE_URL || 'http://localhost:3000';
  }

  async navigate(path: string = ''): Promise<void> {
    await this.page.goto(`${this.baseURL}${path}`);
  }

  async waitForLoadComplete(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `reports/screenshots/${name}.png`, fullPage: true });
  }

  async waitForElement(selector: string, timeout: number = 30000): Promise<void> {
    await this.page.waitForSelector(selector, { timeout });
  }

  async clickElement(selector: string): Promise<void> {
    await this.page.click(selector);
  }

  async fillInput(selector: string, value: string): Promise<void> {
    await this.page.fill(selector, value);
  }

  async selectOption(selector: string, value: string): Promise<void> {
    await this.page.selectOption(selector, value);
  }

  async getText(selector: string): Promise<string> {
    return await this.page.textContent(selector) || '';
  }

  async isVisible(selector: string): Promise<boolean> {
    return await this.page.isVisible(selector);
  }

  async isEnabled(selector: string): Promise<boolean> {
    return await this.page.isEnabled(selector);
  }

  async waitForNavigation(): Promise<void> {
    await this.page.waitForURL('**/*');
  }

  async getErrorMessage(): Promise<string> {
    const errorElement = this.page.locator('[data-testid="error-message"], .error, .alert-danger');
    if (await errorElement.isVisible()) {
      return await errorElement.textContent() || '';
    }
    return '';
  }

  async waitForToast(type: 'success' | 'error' | 'info' = 'success'): Promise<string> {
    const toast = this.page.locator(`[data-testid="toast-${type}"], .toast.${type}`);
    await toast.waitFor({ state: 'visible' });
    return await toast.textContent() || '';
  }

  async dismissToast(): Promise<void> {
    const closeButton = this.page.locator('[data-testid="toast-close"], .toast-close');
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  }

  async scrollToElement(selector: string): Promise<void> {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  async waitForApiResponse(url: string, timeout: number = 30000): Promise<any> {
    const response = await this.page.waitForResponse(
      response => response.url().includes(url),
      { timeout }
    );
    return await response.json();
  }

  async interceptRequest(url: string, handler: (route: any) => void): Promise<void> {
    await this.page.route(url, handler);
  }

  async mockApiResponse(endpoint: string, data: any, status: number = 200): Promise<void> {
    await this.page.route(`**/${endpoint}`, route => {
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(data),
      });
    });
  }

  async getLocalStorageItem(key: string): Promise<string | null> {
    return await this.page.evaluate(key => localStorage.getItem(key), key);
  }

  async setLocalStorageItem(key: string, value: string): Promise<void> {
    await this.page.evaluate(([key, value]) => localStorage.setItem(key, value), [key, value]);
  }

  async clearLocalStorage(): Promise<void> {
    await this.page.evaluate(() => localStorage.clear());
  }

  async getCookies(): Promise<any[]> {
    return await this.page.context().cookies();
  }

  async setCookie(name: string, value: string): Promise<void> {
    await this.page.context().addCookies([{
      name,
      value,
      domain: new URL(this.baseURL).hostname,
      path: '/',
    }]);
  }

  async clearCookies(): Promise<void> {
    await this.page.context().clearCookies();
  }
}