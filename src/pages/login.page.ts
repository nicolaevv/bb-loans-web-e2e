import { Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { ENV } from '../config/env.config';
import { Step } from '../utils/step.decorator';

const SUBMIT_READY_TIMEOUT_MS = 5000;

const CREDENTIAL_ATTEMPTS = 3;

export class LoginPage extends BasePage {
  static readonly PATH = '/login';

  get connectButton(): Locator {
    return this.page.getByRole('button', { name: 'Conectează-te cu' });
  }

  get usernameInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Utilizator' });
  }

  get passwordInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Parola' });
  }

  get submitButton(): Locator {
    return this.page.getByRole('button', { name: 'Conectează-te', exact: true });
  }

  get companyList(): Locator {
    return this.page.getByRole('navigation', { name: 'Main' }).getByRole('listitem');
  }

  get productsMenuButton(): Locator {
    return this.page.getByRole('button', { name: 'Produse' });
  }

  get loansMenuItem(): Locator {
    return this.page
      .getByRole('toolbar', { name: 'Menu' })
      .getByText('Credite', { exact: true })
      .or(this.page.getByRole('link', { name: 'Credite', exact: true }));
  }

  companyByName(name: string): Locator {
    return this.companyList.filter({ has: this.page.getByRole('heading', { name }) });
  }

  @Step('Open the login page')
  async open(): Promise<void> {
    await this.navigateTo(LoginPage.PATH);
  }

  @Step('Sign in')
  async login(): Promise<void> {
    await this.connectButton.or(this.usernameInput).first().waitFor({ state: 'visible' });

    if (await this.connectButton.isVisible()) {
      await this.clickElement(this.connectButton);
    }

    await this.usernameInput.waitFor({ state: 'visible' });
    await this.enterCredentials();
    await this.clickElement(this.submitButton);
  }

  @Step('Select the first company')
  async selectFirstCompany(): Promise<void> {
    await this.clickElement(this.companyList.first());
  }

  @Step('Select company {0}')
  async selectCompanyByName(name: string): Promise<void> {
    await this.clickElement(this.companyByName(name));
  }

  @Step('Open the loans module from the top menu')
  async openLoanModule(): Promise<void> {
    await this.clickElement(this.productsMenuButton);
    await this.clickElement(this.loansMenuItem);
  }

  private async enterCredentials(attempts = CREDENTIAL_ATTEMPTS): Promise<void> {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      await this.typeText(this.usernameInput, ENV.ui.username);
      await this.typeText(this.passwordInput, ENV.ui.password);

      if (await this.isSubmitReady()) {
        return;
      }
    }

    throw new Error(
      `The login form kept clearing itself — submit stayed disabled after ${attempts} attempts.`
    );
  }

  private async isSubmitReady(timeout = SUBMIT_READY_TIMEOUT_MS): Promise<boolean> {
    try {
      await this.submitButton.click({ trial: true, timeout });
      return true;
    } catch {
      return false;
    }
  }
}
