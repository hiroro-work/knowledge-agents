import { test, expect } from '@playwright/test';
import { userDataFactory } from '@local/test-shared';
import { createUser } from '../_models/user';
import { AdminUsersPage, AgentsPage } from '../_pages';
import { clearFirebase } from '../_utils/firebase';

const existingUserEmail = 'existing@example.com';
const existingUserId = 'existing-user-id';
const newUserEmail = 'newuser@example.com';

test.describe('User management', () => {
  test.beforeEach(async () => {
    await createUser({
      uid: 'admin-user-id',
      password: 'password',
      ...userDataFactory.build({ email: 'admin@example.com', role: 'admin' }),
    });
    await createUser({
      uid: existingUserId,
      password: 'password',
      ...userDataFactory.build({
        email: existingUserEmail,
        role: 'user',
      }),
    });
  });

  test.afterEach(async () => {
    await clearFirebase();
  });

  test.describe('Admin user', () => {
    test.beforeEach(async ({ page }) => {
      const usersPage = new AdminUsersPage(page);
      await usersPage.signIn('admin@example.com', 'password');
      await usersPage.goto();
    });

    test('user management page is displayed', async ({ page }) => {
      const usersPage = new AdminUsersPage(page);
      await expect(usersPage.pageTitle).toBeVisible();
      await expect(usersPage.addUserButton).toBeVisible();
      await expect(usersPage.searchInput).toBeVisible();
      await expect(usersPage.userRow(existingUserEmail)).toBeVisible();
    });

    test('can create a user', async ({ page }) => {
      const usersPage = new AdminUsersPage(page);
      await usersPage.addUserButton.click();
      await usersPage.emailInput.fill(newUserEmail);
      await usersPage.createSubmitButton.click();
      await expect(usersPage.notificationMessage).toHaveText('User created successfully');
      await usersPage.closeNotification();
      await expect(usersPage.userRow(newUserEmail)).toBeVisible();
    });

    test('can create a user with admin role', async ({ page }) => {
      const usersPage = new AdminUsersPage(page);
      await usersPage.addUserButton.click();
      await usersPage.emailInput.fill(newUserEmail);
      await usersPage.roleSelect.click();
      await usersPage.roleOption('Admin').click();
      await usersPage.createSubmitButton.click();
      await expect(usersPage.notificationMessage).toHaveText('User created successfully');
      await usersPage.closeNotification();
      await expect(usersPage.userRow(newUserEmail)).toBeVisible();
      const adminBadge = usersPage.userRow(newUserEmail).getByText('Admin');
      await adminBadge.scrollIntoViewIfNeeded();
      await expect(adminBadge).toBeVisible();
    });

    test('can update user role', async ({ page }) => {
      const usersPage = new AdminUsersPage(page);
      await usersPage.userEditRoleButton(existingUserEmail).click();
      await usersPage.roleSelect.click();
      await usersPage.roleOption('Admin').click();
      await usersPage.updateSubmitButton.click();
      await expect(usersPage.notificationMessage).toHaveText('Role updated successfully');
      await usersPage.closeNotification();
      const adminBadge = usersPage.userRow(existingUserEmail).getByText('Admin');
      await adminBadge.scrollIntoViewIfNeeded();
      await expect(adminBadge).toBeVisible();
    });

    test('can delete a user', async ({ page }) => {
      const usersPage = new AdminUsersPage(page);
      await expect(usersPage.userRow(existingUserEmail)).toBeVisible();
      await usersPage.userDeleteButton(existingUserEmail).click();
      await usersPage.confirmDialogButton('OK').click();
      await expect(usersPage.notificationMessage).toHaveText('User deleted successfully');
      await usersPage.closeNotification();
      await expect(usersPage.userRow(existingUserEmail)).not.toBeVisible();
    });

    test('can search by email', async ({ page }) => {
      const usersPage = new AdminUsersPage(page);
      await usersPage.searchInput.fill('existing');
      // Wait for loading to complete after debounce
      await expect(usersPage.userRow(existingUserEmail)).toBeVisible();
    });

    test('shows message when no search results', async ({ page }) => {
      const usersPage = new AdminUsersPage(page);
      await usersPage.searchInput.fill('notfound@example.com');
      // Wait for loading to complete after debounce
      await expect(usersPage.noResultMessage).toBeVisible();
    });
  });

  test.describe('Regular user', () => {
    test('cannot access user management page', async ({ page }) => {
      const usersPage = new AdminUsersPage(page);
      await usersPage.signIn(existingUserEmail, 'password');
      // Not using goto() because regular users are redirected when accessing admin pages
      await page.goto('/admin/users');
      // Non-admin users are redirected
      await expect(page).toHaveURL(new RegExp(`^${AgentsPage.url()}`));
    });
  });
});
