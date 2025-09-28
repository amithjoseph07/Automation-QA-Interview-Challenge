import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  // ✅ Example selectors (change according to your app UI)
  private welcomeMessage = 'h1'; // e.g., <h1>Welcome, User</h1>
  private logoutButton = '#logout-button';
  private userMenu = '#user-menu'; // optional dropdown for profile/logout

  constructor(page: Page) {
    super(page);
  }

  /**
   * Get the welcome message text from dashboard
   */
  async getWelcomeMessage(): Promise<string> {
    return await this.getElementText(this.welcomeMessage);
  }

  /**
   * Check if dashboard is visible (basic validation after login)
   */
  async isDashboardVisible(): Promise<boolean> {
    return await this.isElementVisible(this.welcomeMessage);
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    if (await this.isElementVisible(this.userMenu)) {
      await this.clickElement(this.userMenu); // open dropdown if exists
    }
    await this.clickElement(this.logoutButton);
  }
}
