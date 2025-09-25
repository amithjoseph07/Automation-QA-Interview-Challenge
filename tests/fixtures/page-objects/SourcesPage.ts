import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class SourcesPage extends BasePage {
  readonly addSourceButton: Locator;
  readonly sourcesList: Locator;
  readonly searchInput: Locator;
  readonly filterDropdown: Locator;
  readonly sourceNameInput: Locator;
  readonly sourceTypeSelect: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly validationStatus: Locator;
  readonly extractButton: Locator;
  readonly progressBar: Locator;

  constructor(page: Page) {
    super(page);
    this.addSourceButton = page.locator('[data-testid="add-source-btn"]');
    this.sourcesList = page.locator('[data-testid="sources-list"]');
    this.searchInput = page.locator('[data-testid="search-sources"]');
    this.filterDropdown = page.locator('[data-testid="filter-sources"]');
    this.sourceNameInput = page.locator('[name="sourceName"]');
    this.sourceTypeSelect = page.locator('[name="sourceType"]');
    this.submitButton = page.locator('[data-testid="submit-source-btn"]');
    this.cancelButton = page.locator('[data-testid="cancel-btn"]');
    this.validationStatus = page.locator('[data-testid="validation-status"]');
    this.extractButton = page.locator('[data-testid="extract-btn"]');
    this.progressBar = page.locator('[role="progressbar"]');
  }

  async goto(): Promise<void> {
    await this.navigate('/sources');
    await this.waitForLoadComplete();
  }

  async clickAddSource(): Promise<void> {
    await this.addSourceButton.click();
    await this.page.waitForSelector('[data-testid="source-form"]');
  }

  async fillSourceForm(data: {
    name: string;
    type: string;
    notebook?: string;
    section?: string;
    repository?: string;
  }): Promise<void> {
    await this.sourceNameInput.fill(data.name);
    await this.sourceTypeSelect.selectOption(data.type);

    if (data.type === 'ONENOTE' && data.notebook) {
      await this.page.fill('[name="notebook"]', data.notebook);
      if (data.section) {
        await this.page.fill('[name="section"]', data.section);
      }
    }

    if (data.type === 'GITHUB' && data.repository) {
      await this.page.fill('[name="repository"]', data.repository);
    }
  }

  async submitSourceForm(): Promise<void> {
    await this.submitButton.click();
    await this.page.waitForResponse(response =>
      response.url().includes('/api/sources') && response.status() === 201
    );
  }

  async cancelSourceForm(): Promise<void> {
    await this.cancelButton.click();
  }

  async waitForValidation(): Promise<string> {
    await this.validationStatus.waitFor({ state: 'visible' });
    return await this.validationStatus.textContent() || '';
  }

  async searchSources(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(500); // Debounce
  }

  async filterByType(type: string): Promise<void> {
    await this.filterDropdown.selectOption(type);
    await this.page.waitForTimeout(500);
  }

  async getSourceCount(): Promise<number> {
    const sources = await this.page.locator('[data-testid^="source-item-"]').count();
    return sources;
  }

  async getSourceByName(name: string): Promise<Locator> {
    return this.page.locator(`[data-testid="source-item"]:has-text("${name}")`);
  }

  async clickExtractForSource(sourceName: string): Promise<void> {
    const sourceRow = await this.getSourceByName(sourceName);
    await sourceRow.locator('[data-testid="extract-btn"]').click();
  }

  async waitForExtractionComplete(timeout: number = 60000): Promise<void> {
    await this.page.waitForSelector('[data-testid="extraction-status"]:has-text("Completed")', {
      timeout,
    });
  }

  async getExtractionProgress(): Promise<number> {
    const progressText = await this.progressBar.getAttribute('aria-valuenow');
    return parseInt(progressText || '0');
  }

  async deleteSource(sourceName: string): Promise<void> {
    const sourceRow = await this.getSourceByName(sourceName);
    await sourceRow.locator('[data-testid="delete-btn"]').click();

    // Confirm deletion
    const confirmButton = this.page.locator('[data-testid="confirm-delete"]');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    await this.page.waitForResponse(response =>
      response.url().includes('/api/sources') && response.status() === 204
    );
  }

  async editSource(sourceName: string): Promise<void> {
    const sourceRow = await this.getSourceByName(sourceName);
    await sourceRow.locator('[data-testid="edit-btn"]').click();
    await this.page.waitForSelector('[data-testid="source-form"]');
  }

  async validateSource(sourceName: string): Promise<boolean> {
    const sourceRow = await this.getSourceByName(sourceName);
    await sourceRow.locator('[data-testid="validate-btn"]').click();

    const response = await this.page.waitForResponse(response =>
      response.url().includes('/validate')
    );

    const validation = await response.json();
    return validation.isValid;
  }

  async getSourceStatus(sourceName: string): Promise<string> {
    const sourceRow = await this.getSourceByName(sourceName);
    const status = await sourceRow.locator('[data-testid="source-status"]').textContent();
    return status || '';
  }

  async getDocumentCount(sourceName: string): Promise<number> {
    const sourceRow = await this.getSourceByName(sourceName);
    const count = await sourceRow.locator('[data-testid="doc-count"]').textContent();
    return parseInt(count || '0');
  }

  async sortBy(column: 'name' | 'type' | 'status' | 'updated'): Promise<void> {
    await this.page.click(`[data-testid="sort-${column}"]`);
    await this.page.waitForTimeout(500);
  }

  async waitForEmptyState(): Promise<boolean> {
    const emptyState = this.page.locator('[data-testid="empty-state"]');
    return await emptyState.isVisible();
  }

  async bulkSelect(sourceNames: string[]): Promise<void> {
    for (const name of sourceNames) {
      const sourceRow = await this.getSourceByName(name);
      await sourceRow.locator('[type="checkbox"]').check();
    }
  }

  async bulkDelete(): Promise<void> {
    await this.page.click('[data-testid="bulk-delete"]');
    await this.page.click('[data-testid="confirm-bulk-delete"]');
  }
}