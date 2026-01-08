import { test, expect } from '@playwright/test';
import { driveSourceFactory, userDataFactory } from '@local/test-shared';
import { createAgent } from './_models/agent';
import { createUser } from './_models/user';
import { AgentsPage, ChatPage, AdminPage, AdminUsersPage } from './_pages';
import { clearFirebase } from './_utils/firebase';
import { getScreenshotFontCss } from './_utils/fonts';
import type { Page } from '@playwright/test';

const DESKTOP_VIEWPORT = { width: 1600, height: 1000 };

const fontCss = getScreenshotFontCss();
const stabilizePage = async (page: Page): Promise<void> => {
  await page.waitForLoadState('load');
  await page.addStyleTag({ content: fontCss });
  await page.evaluate(() => document.fonts.ready);
};

const agentId = 'screenshot-agent';
const agentName = 'Knowledge Agent';

const adminUserId = 'admin-user';
const adminEmail = 'admin@example.com';
const userUserId = 'general-user';
const userEmail = 'user@example.com';

test.describe('Screenshot capture', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    if (testInfo.project.name !== 'mobile') {
      await page.setViewportSize(DESKTOP_VIEWPORT);
    }
  });

  test.afterAll(async () => {
    await clearFirebase();
  });

  test.beforeAll(async () => {
    // Create admin user
    await createUser({
      uid: adminUserId,
      password: 'password',
      ...userDataFactory.build({
        email: adminEmail,
        role: 'admin',
      }),
    });

    // Create general user
    await createUser({
      uid: userUserId,
      password: 'password',
      ...userDataFactory.build({
        email: userEmail,
        role: 'user',
      }),
    });

    // Create agent (with sync completed state)
    await createAgent({
      id: agentId,
      createdBy: userUserId,
      name: agentName,
      description: 'An agent that answers questions about internal documents',
      driveSources: {
        'folder-id-123': driveSourceFactory.build({
          syncStatus: 'synced',
        }),
      },
      geminiFileSearchStoreId: 'store-id-123',
    });
  });

  test.describe('Sign in pages', () => {
    test('Sign in page', async ({ page }) => {
      // Show Google auth button by adding ?auth=google parameter
      await page.goto('/sign-in?auth=google');
      await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
      await stabilizePage(page);
      await expect(page).toHaveScreenshot('sign-in.png', { fullPage: true });
    });
  });

  test.describe('User pages', () => {
    test.beforeEach(async ({ page }) => {
      const agentsPage = new AgentsPage(page);
      await agentsPage.signIn(adminEmail, 'password');
    });

    test('Agents list', async ({ page }) => {
      const agentsPage = new AgentsPage(page);
      await agentsPage.goto();
      await expect(agentsPage.pageTitle).toBeVisible();
      await expect(agentsPage.agentCard(agentName)).toBeVisible();
      await stabilizePage(page);
      await expect(page).toHaveScreenshot('agents.png', { fullPage: true });
    });

    test('Create agent dialog (My Drive)', async ({ page }, testInfo) => {
      // Expand viewport to fit the entire dialog (desktop only)
      if (testInfo.project.name !== 'mobile') {
        await page.setViewportSize({ width: 1600, height: 1200 });
      }
      const agentsPage = new AgentsPage(page);
      await agentsPage.goto();
      await agentsPage.createAgentButton.click();
      await expect(agentsPage.agentFormDialog).toBeVisible();
      await stabilizePage(page);
      // Screenshot only the modal dialog element
      await expect(agentsPage.agentFormDialog).toHaveScreenshot('agent-create-dialog-mydrive.png');
    });

    test('Create agent dialog (Shared Drive)', async ({ page }, testInfo) => {
      // Expand viewport to fit the entire dialog (desktop only, higher for Shared Drive ID field)
      if (testInfo.project.name !== 'mobile') {
        await page.setViewportSize({ width: 1600, height: 1300 });
      }
      const agentsPage = new AgentsPage(page);
      await agentsPage.goto();
      await agentsPage.createAgentButton.click();
      await expect(agentsPage.agentFormDialog).toBeVisible();
      await agentsPage.setSelectOption(agentsPage.googleDriveTypeSelect, 'Shared Drive');
      await expect(agentsPage.googleDriveIdInput).toBeVisible();
      await stabilizePage(page);
      // Screenshot only the modal dialog element
      await expect(agentsPage.agentFormDialog).toHaveScreenshot('agent-create-dialog-shareddrive.png');
    });

    test('Chat page', async ({ page }) => {
      const chatPage = new ChatPage(page, agentId);
      await chatPage.goto();
      await expect(chatPage.pageTitle).toBeVisible();
      await expect(chatPage.messageInput).toBeVisible();
      await stabilizePage(page);
      await expect(page).toHaveScreenshot('agent-chat.png', { fullPage: true });
    });

    test('Nav menu (mobile only)', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'mobile', 'Mobile only test');
      const agentsPage = new AgentsPage(page);
      await agentsPage.goto();
      await expect(agentsPage.pageTitle).toBeVisible();
      await agentsPage.openMobileMenu();
      await expect(agentsPage.navMenu).toBeVisible();
      await stabilizePage(page);
      await expect(page).toHaveScreenshot('nav-menu.png', { fullPage: true });
    });
  });

  test.describe('Admin pages', () => {
    test.beforeEach(async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.signIn(adminEmail, 'password');
    });

    test('Admin home', async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.goto();
      await expect(adminPage.pageTitle).toBeVisible();
      await stabilizePage(page);
      await expect(page).toHaveScreenshot('admin-home.png', { fullPage: true });
    });

    test('Admin users', async ({ page }) => {
      const usersPage = new AdminUsersPage(page);
      await usersPage.goto();
      await expect(usersPage.pageTitle).toBeVisible();
      await expect(usersPage.userTable).toBeVisible();
      await stabilizePage(page);
      await expect(page).toHaveScreenshot('admin-users.png', { fullPage: true });
    });

    test('Admin nav menu (mobile only)', async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'mobile', 'Mobile only test');
      const adminPage = new AdminPage(page);
      await adminPage.goto();
      await expect(adminPage.pageTitle).toBeVisible();
      await adminPage.openMobileMenu();
      await expect(adminPage.navMenu).toBeVisible();
      await stabilizePage(page);
      await expect(page).toHaveScreenshot('admin-nav-menu.png', { fullPage: true });
    });
  });
});
