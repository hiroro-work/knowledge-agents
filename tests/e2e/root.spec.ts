import { test, expect } from '@playwright/test';
import { userDataFactory } from '@local/test-shared';
import { createUser } from './_models/user';
import { AgentsPage, SignInPage } from './_pages';
import { clearFirebase } from './_utils/firebase';

test.describe('Root page', () => {
  test.afterEach(async () => {
    await clearFirebase();
  });

  test.describe('When not signed in', () => {
    test.beforeEach(async () => {
      await createUser({
        uid: 'user-id',
        password: 'password',
        ...userDataFactory.build({ email: 'user@example.com', role: 'user' }),
      });
    });

    test.beforeEach(async ({ page }) => {
      await page.goto('/', { waitUntil: 'load' });
    });

    test('redirects to sign in page', async ({ page }) => {
      await expect(page).toHaveURL(new RegExp(`^${SignInPage.url()}`));
    });
  });

  test.describe('When signed in', () => {
    test.beforeEach(async () => {
      await createUser({
        uid: 'user-id',
        password: 'password',
        ...userDataFactory.build({ email: 'user@example.com', role: 'user' }),
      });
    });

    test.beforeEach(async ({ page }) => {
      const agentsPage = new AgentsPage(page);
      await agentsPage.signIn('user@example.com', 'password');
      await page.goto('/', { waitUntil: 'load' });
    });

    test('redirects to agents list page', async ({ page }) => {
      await expect(page).toHaveURL(new RegExp(`^${AgentsPage.url()}`));
    });

    test.describe('Menu', () => {
      test.beforeEach(async ({ page, isMobile }) => {
        const agentsPage = new AgentsPage(page);
        await agentsPage.openNavMenuIfMobile(isMobile);
      });

      test('shows email of signed in user', async ({ page }) => {
        const agentsPage = new AgentsPage(page);
        await expect(agentsPage.accountMenu.getByText('user@example.com', { exact: true })).toBeVisible();
      });

      test('can sign out', async ({ page }) => {
        const agentsPage = new AgentsPage(page);
        await agentsPage.accountMenu.getByText('user@example.com', { exact: true }).click();
        await expect(agentsPage.accountMenu.getByText('Sign Out', { exact: true })).toBeVisible();
        await agentsPage.accountMenu.getByText('Sign Out', { exact: true }).click();
        await expect(
          agentsPage.confirmDialog.getByText('Are you sure you want to sign out?', { exact: true }),
        ).toBeVisible();
        await agentsPage.confirmDialogButton('OK').click();
        await expect(page.getByText('Signed out successfully', { exact: true })).toBeVisible();
        await expect(page).toHaveURL(new RegExp(`^${SignInPage.url()}`));
      });
    });
  });
});
