import { BasePage } from './base.page';

/**
 * Sign in page (/sign-in)
 */
export class SignInPage extends BasePage {
  private static pathFor(): string {
    return '/sign-in';
  }

  get path(): string {
    return SignInPage.pathFor();
  }

  static url(): string {
    return BasePage.urlFor(SignInPage.pathFor());
  }

  get emailInput() {
    return this.page.getByLabel('Email');
  }

  get passwordInput() {
    return this.page.getByLabel('Password');
  }

  get signInButton() {
    return this.page.getByRole('button', { name: 'Sign In' });
  }
}
