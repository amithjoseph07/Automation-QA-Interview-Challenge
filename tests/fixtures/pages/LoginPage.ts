import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  // ✅ Selectors (adjust these based on your actual app’s HTML)
  private emailInput = '#email';
  private passwordInput = '#password';
  private loginButton = '#login-button';
  private errorMessage = '.error-message'; // Example for failed login

  constructor(page: Page) {
    super(page); // Call BasePage constructor
  }

  /**
   * Perform login with email and password
   */
  async login(email: string, password: string): Promise<void> {
    await this.fillInput(this.emailInput, email);
    await this.fillInput(this.passwordInput, password);
    await this.clickElement(this.loginButton);
  }

  /**
   * Get login error message text (if any)
   */
  async getErrorMessage(): Promise<string> {
    return await this.getElementText(this.errorMessage);
  }

  /**
   * Check if login button is visible
   */
  async isLoginButtonVisible(): Promise<boolean> {
    return await this.isElementVisible(this.loginButton);
  }
}
