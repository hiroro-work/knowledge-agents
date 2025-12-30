import { BasePage } from './base.page';

/**
 * Admin root page (/admin)
 */
export class AdminPage extends BasePage {
  private static pathFor(): string {
    return '/admin';
  }

  get path(): string {
    return AdminPage.pathFor();
  }

  static url(): string {
    return BasePage.urlFor(AdminPage.pathFor());
  }

  get pageTitle() {
    return this.mainContent.getByRole('heading', { name: 'Admin', level: 2 });
  }
}
