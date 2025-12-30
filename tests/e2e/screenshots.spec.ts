import { test, expect } from '@playwright/test';
import { driveSourceFactory, userDataFactory } from '@local/test-shared';
import { createAgent } from './_models/agent';
import { createUser } from './_models/user';
import { AgentsPage, ChatPage, AdminPage, AdminUsersPage } from './_pages';
import { clearFirebase } from './_utils/firebase';

const DESKTOP_VIEWPORT = { width: 1600, height: 1000 };

const getScreenshotDir = (projectName: string) => {
  const isMobile = projectName === 'Mobile Safari';
  return `docs/screenshots/${isMobile ? 'mobile' : 'desktop'}`;
};

const isMobileProject = (projectName: string) => projectName === 'Mobile Safari';

const agentId = 'screenshot-agent';
const agentName = 'Knowledge Agent';

const adminUserId = 'admin-user';
const adminEmail = 'admin@example.com';
const userUserId = 'general-user';
const userEmail = 'user@example.com';

test.describe('Screenshot capture', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    if (!isMobileProject(testInfo.project.name)) {
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
    test('Sign in page', async ({ page }, testInfo) => {
      const screenshotDir = getScreenshotDir(testInfo.project.name);
      // Show Google auth button by adding ?auth=google parameter
      await page.goto('/sign-in?auth=google');
      await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
      await page.screenshot({ path: `${screenshotDir}/sign-in.png`, fullPage: true });
    });
  });

  test.describe('User pages', () => {
    test.beforeEach(async ({ page }) => {
      const agentsPage = new AgentsPage(page);
      await agentsPage.signIn(adminEmail, 'password');
    });

    test('Agents list', async ({ page }, testInfo) => {
      const screenshotDir = getScreenshotDir(testInfo.project.name);
      const agentsPage = new AgentsPage(page);
      await agentsPage.goto();
      await expect(agentsPage.pageTitle).toBeVisible();
      await expect(agentsPage.agentCard(agentName)).toBeVisible();
      await page.screenshot({ path: `${screenshotDir}/agents.png`, fullPage: true });
    });

    test('Create agent dialog (My Drive)', async ({ page }, testInfo) => {
      const screenshotDir = getScreenshotDir(testInfo.project.name);
      // Expand viewport to fit the entire dialog (desktop only)
      if (!isMobileProject(testInfo.project.name)) {
        await page.setViewportSize({ width: 1600, height: 1200 });
      }
      const agentsPage = new AgentsPage(page);
      await agentsPage.goto();
      await agentsPage.createAgentButton.click();
      await expect(agentsPage.agentFormDialog).toBeVisible();
      // Screenshot only the modal dialog element
      await agentsPage.agentFormDialog.screenshot({ path: `${screenshotDir}/agent-create-dialog-mydrive.png` });
    });

    test('Create agent dialog (Shared Drive)', async ({ page }, testInfo) => {
      const screenshotDir = getScreenshotDir(testInfo.project.name);
      // Expand viewport to fit the entire dialog (desktop only, higher for Shared Drive ID field)
      if (!isMobileProject(testInfo.project.name)) {
        await page.setViewportSize({ width: 1600, height: 1300 });
      }
      const agentsPage = new AgentsPage(page);
      await agentsPage.goto();
      await agentsPage.createAgentButton.click();
      await expect(agentsPage.agentFormDialog).toBeVisible();
      await agentsPage.setSelectOption(agentsPage.googleDriveTypeSelect, 'Shared Drive');
      await expect(agentsPage.googleDriveIdInput).toBeVisible();
      // Screenshot only the modal dialog element
      await agentsPage.agentFormDialog.screenshot({ path: `${screenshotDir}/agent-create-dialog-shareddrive.png` });
    });

    test('Chat page', async ({ page }, testInfo) => {
      const screenshotDir = getScreenshotDir(testInfo.project.name);
      const chatPage = new ChatPage(page, agentId);
      await chatPage.goto();
      await expect(chatPage.pageTitle).toBeVisible();
      await expect(chatPage.messageInput).toBeVisible();
      await page.screenshot({ path: `${screenshotDir}/agent-chat.png`, fullPage: true });
    });

    test('Nav menu (mobile only)', async ({ page }, testInfo) => {
      test.skip(!isMobileProject(testInfo.project.name), 'Mobile only test');
      const screenshotDir = getScreenshotDir(testInfo.project.name);
      const agentsPage = new AgentsPage(page);
      await agentsPage.goto();
      await expect(agentsPage.pageTitle).toBeVisible();
      await agentsPage.openMobileMenu();
      await expect(agentsPage.navMenu).toBeVisible();
      await page.screenshot({ path: `${screenshotDir}/nav-menu.png`, fullPage: true });
    });
  });

  test.describe('Admin pages', () => {
    test.beforeEach(async ({ page }) => {
      const adminPage = new AdminPage(page);
      await adminPage.signIn(adminEmail, 'password');
    });

    test('Admin home', async ({ page }, testInfo) => {
      const screenshotDir = getScreenshotDir(testInfo.project.name);
      const adminPage = new AdminPage(page);
      await adminPage.goto();
      await expect(adminPage.pageTitle).toBeVisible();
      await page.screenshot({ path: `${screenshotDir}/admin-home.png`, fullPage: true });
    });

    test('Admin users', async ({ page }, testInfo) => {
      const screenshotDir = getScreenshotDir(testInfo.project.name);
      const usersPage = new AdminUsersPage(page);
      await usersPage.goto();
      await expect(usersPage.pageTitle).toBeVisible();
      await expect(usersPage.userTable).toBeVisible();
      await page.screenshot({ path: `${screenshotDir}/admin-users.png`, fullPage: true });
    });

    test('Admin nav menu (mobile only)', async ({ page }, testInfo) => {
      test.skip(!isMobileProject(testInfo.project.name), 'Mobile only test');
      const screenshotDir = getScreenshotDir(testInfo.project.name);
      const adminPage = new AdminPage(page);
      await adminPage.goto();
      await expect(adminPage.pageTitle).toBeVisible();
      await adminPage.openMobileMenu();
      await expect(adminPage.navMenu).toBeVisible();
      await page.screenshot({ path: `${screenshotDir}/admin-nav-menu.png`, fullPage: true });
    });
  });
});
