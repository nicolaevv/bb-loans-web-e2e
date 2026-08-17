import { Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';
import { UI_CREDENTIALS } from '../../config/env.config';

export class LoginPage extends BasePage {
  static readonly PATH = '/login';

  readonly connectButton: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly companyList: Locator;
  readonly productsMenuButton: Locator;
  readonly loansMenuItem: Locator;

  constructor(page: Page) {
    super(page);
    this.connectButton = page.getByRole('button', { name: 'Conectează-te cu' });
    this.usernameInput = page.getByRole('textbox', { name: 'Utilizator' });
    this.passwordInput = page.getByRole('textbox', { name: 'Parola' });
    this.submitButton = page.getByRole('button', { name: 'Conectează-te', exact: true });
    // Company chooser: <nav aria-label="Main"> with one <li> per company.
    this.companyList = page.getByRole('navigation', { name: 'Main' }).getByRole('listitem');
    this.productsMenuButton = page.getByRole('button', { name: 'Produse' });
    // The Produse dropdown comes from two different shells: the legacy IBMAIB
    // dashboard (Oracle JET) and the new SPA. Exactly one of them is mounted at
    // a time.
    //
    // On the legacy side the item must be clicked by its title element, not by
    // the surrounding role=button <li> — the <li> boxes overlap while the menu
    // animates and the neighbouring "Produse" item swallows the click.
    this.loansMenuItem = page
      .getByRole('toolbar', { name: 'Menu' })
      .getByText('Credite', { exact: true })
      .or(page.getByRole('link', { name: 'Credite', exact: true }));
  }

  async open(): Promise<void> {
    await this.navigateTo(LoginPage.PATH);
  }

  /**
   * Sign in with the credentials from .env and land on the company chooser.
   *
   * The landing page sometimes shows an SSO hand-off button and sometimes the
   * form directly, so the button is clicked only when present.
   */
  async login(): Promise<void> {
    // Wait for whichever of the two renders first — isVisible() does not wait,
    // so checking it straight away would race the page load.
    await this.connectButton.or(this.usernameInput).first().waitFor({ state: 'visible' });

    if (await this.connectButton.isVisible()) {
      await this.clickElement(this.connectButton);
    }

    await this.usernameInput.waitFor({ state: 'visible' });
    await this.enterCredentials();
    await this.clickElement(this.submitButton);
  }

  /**
   * Fill both fields and only return once the form agrees they are filled.
   *
   * Verifying the typed value is not enough: the form re-renders while it
   * hydrates and can wipe the inputs *after* they were checked, leaving submit
   * disabled. The submit button becoming clickable is the real signal, so that
   * is what we wait for — and if it never does, we type it all again.
   */
  private async enterCredentials(attempts = 3): Promise<void> {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      await this.typeText(this.usernameInput, UI_CREDENTIALS.username);
      await this.typeText(this.passwordInput, UI_CREDENTIALS.password);

      if (await this.isSubmitReady()) {
        return;
      }
    }

    throw new Error(
      `The login form kept clearing itself — submit stayed disabled after ${attempts} attempts.`
    );
  }

  /** Actionability check via a trial click: waits, but never actually clicks. */
  private async isSubmitReady(timeout = 5000): Promise<boolean> {
    try {
      await this.submitButton.click({ trial: true, timeout });
      return true;
    } catch {
      return false;
    }
  }

  /** Pick a company by its display name; falls back to the first one. */
  companyByName(name: string): Locator {
    return this.companyList.filter({ has: this.page.getByRole('heading', { name }) });
  }

  async selectFirstCompany(): Promise<void> {
    await this.clickElement(this.companyList.first());
  }

  async selectCompanyByName(name: string): Promise<void> {
    await this.clickElement(this.companyByName(name));
  }

  /** Navigate from the dashboard into the loans module via the top menu. */
  async openLoanModule(): Promise<void> {
    await this.clickElement(this.productsMenuButton);
    await this.clickElement(this.loansMenuItem);
  }
}
