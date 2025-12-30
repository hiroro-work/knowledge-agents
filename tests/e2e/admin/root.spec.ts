import { test, expect } from '@playwright/test';
import { userDataFactory } from '@local/test-shared';
import { createUser } from '../_models/user';
import { AdminPage, SignInPage, AgentsPage } from '../_pages';
import { clearFirebase } from '../_utils/firebase';

test.describe('Admin root page', () => {
  test.beforeEach(async () => {
    await Promise.all([
      createUser({
        uid: 'test-user-id',
        password: 'password',
        ...userDataFactory.build({ email: 'test-user@example.com', role: 'user' }),
      }),
      createUser({
        uid: 'test-admin-id',
        password: 'password',
        ...userDataFactory.build({ email: 'test-admin@example.com', role: 'admin' }),
      }),
    ]);
  });

  test.afterEach(async () => {
    await clearFirebase();
  });

  test.describe('When not signed in', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin');
    });

    test('redirects to sign in page', async ({ page }) => {
      await expect(page).toHaveURL(new RegExp(`^${SignInPage.url()}`));
    });
  });

  test.describe('When signed in', () => {
    test.describe('Admin user', () => {
      test.beforeEach(async ({ page }) => {
        // NOTE: Using password auth instead of Google auth in tests for efficiency
        const adminPage = new AdminPage(page);
        await adminPage.signIn('test-admin@example.com', 'password');
        await adminPage.goto();
      });

      test('root page is displayed', async ({ page }) => {
        const adminPage = new AdminPage(page);
        await expect(adminPage.pageTitle).toBeVisible();
      });

      test.describe('Menu', () => {
        test.beforeEach(async ({ page, isMobile }) => {
          const adminPage = new AdminPage(page);
          await adminPage.openNavMenuIfMobile(isMobile);
        });

        test('shows email of signed in user', async ({ page }) => {
          const adminPage = new AdminPage(page);
          await expect(adminPage.accountMenu.getByText('test-admin@example.com', { exact: true })).toBeVisible();
        });

        test('can sign out', async ({ page }) => {
          const adminPage = new AdminPage(page);
          await adminPage.accountMenu.getByText('test-admin@example.com', { exact: true }).click();
          await expect(adminPage.accountMenu.getByText('Sign Out', { exact: true })).toBeVisible();
          await adminPage.accountMenu.getByText('Sign Out', { exact: true }).click();
          await expect(
            adminPage.confirmDialog.getByText('Are you sure you want to sign out?', { exact: true }),
          ).toBeVisible();
          await adminPage.confirmDialogButton('OK').click();
          await expect(page.getByText('Signed out successfully', { exact: true })).toBeVisible();
          await expect(page).toHaveURL(new RegExp(`^${SignInPage.url()}`));
        });
      });
    });

    test.describe('Regular user', () => {
      test.beforeEach(async ({ page }) => {
        const adminPage = new AdminPage(page);
        await adminPage.signIn('test-user@example.com', 'password');
        await page.goto('/admin');
      });

      test('redirects to regular user root page', async ({ page }) => {
        await expect(page).toHaveURL(new RegExp(`^${AgentsPage.url()}`));
      });
    });
  });
});
