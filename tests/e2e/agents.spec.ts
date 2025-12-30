import { test, expect } from '@playwright/test';
import { driveSourceFactory, userDataFactory } from '@local/test-shared';
import { createAgent } from './_models/agent';
import { createUser } from './_models/user';
import { AgentsPage, SignInPage } from './_pages';
import { clearFirebase } from './_utils/firebase';
import { scrollBottomInfinite, waitFor } from './_utils/playwright';

const testAgentName = 'Test Agent';
const testAgentId = 'test-agent-id';

// Infinite scroll page size (must match the implementation)
const AGENTS_PAGE_SIZE = 12;
const BULK_AGENTS_COUNT = 25;

test.describe('Agents', () => {
  test.afterEach(async () => {
    await clearFirebase();
  });

  test.describe('When not signed in', () => {
    test('redirects to sign in page when accessing agents list page', async ({ page }) => {
      await page.goto('/agents');
      await expect(page).toHaveURL(new RegExp(`^${SignInPage.url()}`));
    });
  });

  test.describe('Regular user', () => {
    const userId = 'user-id';

    test.beforeEach(async () => {
      await createUser({
        uid: userId,
        password: 'password',
        ...userDataFactory.build({ email: 'user@example.com', role: 'user' }),
      });
    });

    test.beforeEach(async ({ page }) => {
      const agentsPage = new AgentsPage(page);
      await agentsPage.signIn('user@example.com', 'password');
    });

    test.describe('When no agents exist', () => {
      test('agents list page is displayed', async ({ page }) => {
        const agentsPage = new AgentsPage(page);
        await agentsPage.goto();
        await expect(agentsPage.pageTitle).toBeVisible();
        await expect(agentsPage.createAgentButton).toBeVisible();
        await expect(agentsPage.emptyState).toBeVisible();
      });

      test('can create an agent', async ({ page }) => {
        const agentsPage = new AgentsPage(page);
        await agentsPage.goto();
        await agentsPage.createAgentButton.click();
        await expect(agentsPage.agentFormDialog).toBeVisible();
        await agentsPage.agentNameInput.fill('New Agent');
        await agentsPage.slugInput.fill('new-agent');
        await agentsPage.agentDescriptionInput.fill('Test description');
        await agentsPage.googleDriveFolderIdInput.fill('1234567890');
        await agentsPage.submitButton.click();
        await expect(agentsPage.notificationMessage).toHaveText('Agent created');
        await agentsPage.closeNotification();
        await expect(agentsPage.agentCard('New Agent')).toBeVisible();
        await expect(agentsPage.emptyState).not.toBeVisible();
      });
    });

    test.describe('When agents exist', () => {
      test.beforeEach(async () => {
        await createAgent({
          id: testAgentId,
          createdBy: userId,
          name: testAgentName,
          description: 'Description for E2E testing',
          driveSources: {
            'folder-id-123': driveSourceFactory.build({ syncStatus: 'pending' }),
          },
        });
      });

      test('agents are displayed in agents list', async ({ page }) => {
        const agentsPage = new AgentsPage(page);
        await agentsPage.goto();
        await expect(agentsPage.agentCard(testAgentName)).toBeVisible();
        await expect(agentsPage.emptyState).not.toBeVisible();
      });

      test('can edit an agent', async ({ page }) => {
        const agentsPage = new AgentsPage(page);
        await agentsPage.goto();
        await agentsPage.agentEditButton(testAgentName).click();
        await expect(agentsPage.agentFormDialog).toBeVisible();
        await agentsPage.agentNameInput.fill('Updated Agent');
        await agentsPage.updateButton.click();
        await expect(agentsPage.notificationMessage).toHaveText('Agent updated');
        await agentsPage.closeNotification();
        await expect(agentsPage.agentCard('Updated Agent')).toBeVisible();
        await expect(agentsPage.agentCard(testAgentName)).not.toBeVisible();
      });

      test('can delete an agent', async ({ page }) => {
        const agentsPage = new AgentsPage(page);
        await agentsPage.goto();
        await agentsPage.agentDeleteButton(testAgentName).click();
        await agentsPage.confirmDialogButton('OK').click();
        await expect(agentsPage.notificationMessage).toHaveText('Agent deleted successfully');
        await agentsPage.closeNotification();
        await expect(agentsPage.agentCard(testAgentName)).not.toBeVisible();
      });
    });
  });

  test.describe('When many agents exist', () => {
    const userId = 'user-id';

    test.beforeEach(async () => {
      await createUser({
        uid: userId,
        password: 'password',
        ...userDataFactory.build({ email: 'user@example.com', role: 'user' }),
      });
      await Promise.all(
        Array.from({ length: BULK_AGENTS_COUNT }, (_, i) =>
          createAgent({
            id: `bulk-agent-id-${i}`,
            createdBy: userId,
            name: `Test Agent-${i}`,
            driveSources: {
              [`folder-id-${i}`]: driveSourceFactory.build({ syncStatus: 'pending' }),
            },
          }),
        ),
      );
    });

    test.beforeEach(async ({ page }) => {
      const agentsPage = new AgentsPage(page);
      await agentsPage.signIn('user@example.com', 'password');
      await agentsPage.goto();
    });

    test('additional agents are loaded on scroll', async ({ page }) => {
      const agentsPage = new AgentsPage(page);
      const agentCardsCount = () => agentsPage.mainContent.locator('.mantine-Card-root').count();
      // Only PAGE_SIZE items are displayed on initial page load
      const initialLoaded = await waitFor(async () => (await agentCardsCount()) === AGENTS_PAGE_SIZE);
      expect(initialLoaded).toBe(true);
      // Scroll to load additional data
      await scrollBottomInfinite(agentsPage.mainContent, page, agentCardsCount);
      // All items are loaded
      const allLoaded = await waitFor(async () => (await agentCardsCount()) === BULK_AGENTS_COUNT);
      expect(allLoaded).toBe(true);
    });
  });
});
