// tests/fixtures/pages/StudentFormPage.ts
import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class StudentFormPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Locators
  private firstNameInput = this.page.locator('#FirstName');
  private lastNameInput = this.page.locator('#LastName');
  private emailInput = this.page.locator('#Email');
  private phoneInput = this.page.locator('#Phone');
  private studentTypeDropdown = this.page.locator('#StudentType'); // Adult/Child
  private parentNameInput = this.page.locator('#ParentName');
  private saveButton = this.page.locator('button:has-text("Save")');
  private successAlert = this.page.locator('.alert-success');

  /**
   * Fill details for an adult student
   */
  async addAdultStudent(fullName: string, email: string, phone = '1234567890') {
    const [firstName, lastName] = fullName.split(' ');

    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.emailInput.fill(email);
    await this.phoneInput.fill(phone);
    await this.studentTypeDropdown.selectOption('Adult');

    await this.saveButton.click();
  }

  /**
   * Fill details for a child student with parent info
   */
  async addChildStudent(fullName: string, email: string, parentName: string) {
    const [firstName, lastName] = fullName.split(' ');

    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
    await this.emailInput.fill(email);
    await this.studentTypeDropdown.selectOption('Child');

    await this.parentNameInput.fill(parentName);

    await this.saveButton.click();
  }

  /**
   * Get success message after adding student
   */
  async getSuccessMessage(): Promise<string> {
    await this.successAlert.waitFor();
    return (await this.successAlert.textContent())?.trim() || '';
  }
}
