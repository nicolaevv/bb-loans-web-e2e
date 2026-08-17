import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  readonly connectButton: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly firstCompany: Locator;
  readonly produceButton: Locator;
  readonly creditButton: Locator;


  constructor(page: Page) {
    super(page);
    this.connectButton = page.locator('button:has-text("Conectează-te cu")');
    this.usernameInput = page.getByRole('textbox', { name: 'Utilizator' });
    this.passwordInput = page.getByRole('textbox', { name: 'Parola' });
    this.submitButton = page.getByRole('button', { name: 'Conectează-te' });
    this.firstCompany = page.locator('ul[data-orientation="horizontal"] > li').first();
    this.produceButton = page.getByRole('button', { name: 'Produse' });
    this.creditButton = page.locator('.menu-title-icon-container', { hasText: 'Credite' });

  }

async loginAndRedirectToLoanModule(): Promise<void> {
    try {
      await Promise.race([
        this.connectButton.waitFor({ state: 'visible', timeout: 5000 }),
        this.usernameInput.waitFor({ state: 'visible', timeout: 5000 })
      ]);
    } catch (e) {
      // Ignore timeout
    }

    if (await this.connectButton.isVisible()) {
      await this.clickElement(this.connectButton);
    }

    await this.usernameInput.waitFor({ state: 'visible' });
    
    await this.clickElement(this.usernameInput);
    await this.usernameInput.fill('');
    await this.page.waitForTimeout(400);
    await this.usernameInput.pressSequentially(process.env.UI_USERNAME || 'alexandr.gorodetki', { delay: 30 });

    await this.clickElement(this.passwordInput);
    await this.passwordInput.pressSequentially(process.env.UI_PASSWORD || 'BBLO.Alex2', { delay: 30 });

    await this.clickElement(this.submitButton);
    await this.clickElement(this.firstCompany);
    await this.clickElement(this.produceButton);
    await this.clickElement(this.creditButton);
  }
}