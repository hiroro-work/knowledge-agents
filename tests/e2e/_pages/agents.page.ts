import { BasePage } from './base.page';

/**
 * Agents list page (/agents)
 */
export class AgentsPage extends BasePage {
  private static pathFor(): string {
    return '/agents';
  }

  get path(): string {
    return AgentsPage.pathFor();
  }

  static url(): string {
    return BasePage.urlFor(AgentsPage.pathFor());
  }

  get pageTitle() {
    return this.mainContent.getByRole('heading', { name: /Agents/ });
  }

  get createAgentButton() {
    return this.mainContent
      .locator('button')
      .filter({ has: this.page.locator('.tabler-icon-plus') })
      .first();
  }

  get agentFormDialog() {
    return this.page.getByRole('dialog');
  }

  get agentNameInput() {
    return this.agentFormDialog.getByLabel('Agent Name');
  }

  get slugInput() {
    return this.agentFormDialog.getByLabel('Slug', { exact: true });
  }

  get agentDescriptionInput() {
    return this.agentFormDialog.getByLabel('Description');
  }

  get googleDriveTypeSelect() {
    return this.agentFormDialog.getByLabel('Google Drive Type');
  }

  get googleDriveIdInput() {
    return this.agentFormDialog.getByLabel('Shared Drive ID');
  }

  get googleDriveFolderIdInput() {
    return this.agentFormDialog.getByLabel('Google Drive Folder ID');
  }

  get geminiModelSelect() {
    return this.agentFormDialog.getByLabel('Gemini Model');
  }

  get submitButton() {
    return this.agentFormDialog.getByRole('button', { name: 'Create' });
  }

  get updateButton() {
    return this.agentFormDialog.getByRole('button', { name: 'Update' });
  }

  agentCard(agentName: string) {
    return this.mainContent.locator('.mantine-Card-root').filter({ hasText: agentName }).first();
  }

  agentCardByTestId(testId: string) {
    return this.mainContent.locator(`[data-testid="${testId}"]`);
  }

  agentEditButton(agentName: string) {
    return this.agentCard(agentName).getByLabel('Edit Agent');
  }

  agentDeleteButton(agentName: string) {
    return this.agentCard(agentName)
      .locator('button')
      .filter({ has: this.page.locator('.tabler-icon-trash') })
      .first();
  }

  get emptyState() {
    return this.mainContent.getByText('No agents have been created yet.');
  }
}
