import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class StudentDetailsPage extends BasePage {
  // Selectors
  private nameField = '#studentName';
  private emailField = '#studentEmail';
  private phoneField = '#studentPhone';
  private typeField = '#studentType';
  private parentField = '#parentName';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Get student details
   */
  async getStudentDetails(): Promise<Record<string, string>> {
    const name = await this.getElementText(this.nameField);
    const email = await this.getElementText(this.emailField);
    const phone = await this.getElementText(this.phoneField);
    const type = await this.getElementText(this.typeField);
    let parent = '';
    if (type === 'Child') {
      parent = await this.getElementText(this.parentField);
    }
    return { name, email, phone, type, parent };
  }
}
