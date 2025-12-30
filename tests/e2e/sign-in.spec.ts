import { test, expect } from '@playwright/test';
import { userDataFactory } from '@local/test-shared';
import { createUser } from './_models/user';
import { AgentsPage, SignInPage } from './_pages';
import { clearFirebase } from './_utils/firebase';

test.describe('Sign in', () => {
  test.afterEach(async () => {
    await clearFirebase();
  });

  test.describe('Registered user', () => {
    test.beforeEach(async () => {
      await createUser({
        uid: 'user-id',
        password: 'password',
        ...userDataFactory.build({ email: 'user@example.com', role: 'user' }),
      });
    });

    test('navigates to agents list after sign in', async ({ page }) => {
      const signInPage = new SignInPage(page);
      await signInPage.goto();
      await signInPage.emailInput.fill('user@example.com');
      await signInPage.passwordInput.fill('password');
      await signInPage.signInButton.click();
      await expect(page.getByText('Signed in successfully')).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`^${AgentsPage.url()}`));
    });

    test('cannot sign in with wrong password', async ({ page }) => {
      const signInPage = new SignInPage(page);
      await signInPage.goto();
      await signInPage.emailInput.fill('user@example.com');
      await signInPage.passwordInput.fill('wrong-password');
      await signInPage.signInButton.click();
      await expect(page.getByText('Sign in failed')).toBeVisible();
    });
  });
});
