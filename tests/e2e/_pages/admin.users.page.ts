import { BasePage } from './base.page';

/**
 * User management page (/admin/users)
 */
export class AdminUsersPage extends BasePage {
  get path(): string {
    return '/admin/users';
  }

  async goto() {
    await super.goto();
    await this.pageTitle.waitFor({ state: 'visible' });
  }

  get pageTitle() {
    return this.mainContent.getByRole('heading', { name: 'Users' });
  }

  get addUserButton() {
    return this.mainContent.getByLabel('Add user');
  }

  get searchInput() {
    return this.mainContent.getByLabel('Search by email');
  }

  get emptyMessage() {
    return this.mainContent.getByText('No users registered yet.');
  }

  get noResultMessage() {
    return this.mainContent.getByText('No users found matching your search.');
  }

  // Modal
  get modal() {
    return this.page.getByRole('dialog');
  }

  get modalTitle() {
    return this.modal.getByRole('heading');
  }

  get emailInput() {
    return this.modal.getByLabel('Email');
  }

  get roleSelect() {
    return this.modal.getByRole('textbox', { name: 'Role' });
  }

  get createSubmitButton() {
    return this.modal.getByRole('button', { name: 'Create' });
  }

  get updateSubmitButton() {
    return this.modal.getByRole('button', { name: 'Update' });
  }

  // User table
  get userTable() {
    return this.mainContent.getByRole('table');
  }

  userRow(email: string) {
    return this.userTable.locator('tr').filter({ hasText: email });
  }

  userDeleteButton(email: string) {
    return this.userRow(email).getByLabel('Delete');
  }

  userEditRoleButton(email: string) {
    return this.userRow(email).getByLabel('Edit role');
  }

  roleOption(role: string) {
    return this.page.locator('.mantine-Select-options').getByText(role, { exact: true });
  }
}
