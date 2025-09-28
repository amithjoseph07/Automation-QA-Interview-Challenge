import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class StudentListPage extends BasePage {
  // Selectors
  private searchInput = '#studentSearch';
  private studentRows = '.student-row';
  private studentNameCell = '.student-name';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate to student list page
   */
  async navigateToList(): Promise<void> {
    await this.navigate('/Teacher/v2/en/students');
  }

  /**
   * Search for a student by name or email
   */
  async searchStudent(query: string): Promise<void> {
    await this.fillInput(this.searchInput, query);
    await this.page.keyboard.press('Enter');
  }

  /**
   * Check if a student exists in the list
   */
  async isStudentPresent(name: string): Promise<boolean> {
    const student = this.page.locator(`${this.studentRows} >> text=${name}`);
    return await student.isVisible();
  }

  /**
   * Click a student to view details
   */
  async openStudentDetails(name: string): Promise<void> {
    const student = this.page.locator(`${this.studentRows} >> text=${name}`);
    await student.click();
  }
}
