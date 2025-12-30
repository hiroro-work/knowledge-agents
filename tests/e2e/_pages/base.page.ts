import { expect } from '@playwright/test';
import config from 'playwright.config';
import type { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  abstract get path(): string;

  get url(): string {
    return `${config.use?.baseURL}${this.path}`;
  }

  protected static urlFor(path: string): string {
    return `${config.use?.baseURL}${path}`;
  }

  async goto() {
    await this.page.goto(this.path, { waitUntil: 'load' });
  }

  get mainContent() {
    return this.page.getByRole('main');
  }

  get header() {
    return this.page.getByRole('banner');
  }

  get navMenu() {
    return this.page.getByLabel('Navigation Menu', { exact: true });
  }

  get accountMenu() {
    return this.page.getByLabel('Account Menu', { exact: true });
  }

  get confirmDialog() {
    return this.page.getByRole('dialog');
  }

  confirmDialogButton(buttonName: string) {
    return this.confirmDialog.getByRole('button', { name: buttonName });
  }

  get notificationMessage() {
    return this.page.locator('.mantine-Notification-root').last().locator('.mantine-Notification-description');
  }

  async closeNotification() {
    await this.page.locator('.mantine-Notification-root').last().locator('.mantine-Notification-closeButton').click();
  }

  async openMobileMenu() {
    const menuButton = this.header.getByRole('button', { name: 'Menu Button' });
    await menuButton.click();
  }

  async openNavMenuIfMobile(isMobile: boolean) {
    if (isMobile) {
      await this.openMobileMenu();
    }
  }

  // Select box utility methods
  selectOption(selectBox: Locator, label: string) {
    return selectBox.getByText(label, { exact: true }).locator('..');
  }

  selectOptionCloseButton(selectOption: Locator) {
    return selectOption.getByRole('button', { includeHidden: true });
  }

  async deleteSelectOption(selectBox: Locator, label: string) {
    const option = this.selectOption(selectBox, label);
    const closeButton = this.selectOptionCloseButton(option);
    await closeButton.click();
  }

  async addSelectOption(selectBox: Locator, label: string) {
    const input = selectBox.getByRole('textbox');
    await input.click();
    await this.page.locator('.mantine-MultiSelect-options').getByText(label, { exact: true }).click();
    await this.page.keyboard.press('Escape');
  }

  async setSelectOption(selectBox: Locator, label: string) {
    await selectBox.click();
    await this.page.locator('.mantine-Select-options').getByText(label, { exact: true }).click();
  }

  // Sign in utility
  async signIn(email: string, password: string) {
    await this.page.goto('/sign-in');
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Sign In' }).click();
    await expect(this.page.getByText('Signed in successfully')).toBeVisible();
    await this.closeNotification();
  }
}
