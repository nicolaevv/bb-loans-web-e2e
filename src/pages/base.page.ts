import { Locator, Page } from '@playwright/test';

const TYPING_DELAY_MS = 30;

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  protected async navigateTo(path: string): Promise<void> {
    await this.page.goto(path);
  }

  protected async openAndWait(path: string, anchor: Locator): Promise<void> {
    await this.navigateTo(path);
    await anchor.waitFor({ state: 'visible' });
  }

  protected async clickElement(locator: Locator): Promise<void> {
    await locator.click();
  }

  protected async typeText(locator: Locator, text: string, attempts = 3): Promise<void> {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      await locator.click();
      await locator.fill('');
      await locator.pressSequentially(text, { delay: TYPING_DELAY_MS });

      if ((await locator.inputValue()) === text) {
        return;
      }
    }

    throw new Error(
      `Failed to type the expected value into ${locator} after ${attempts} attempts — the field keeps dropping characters.`
    );
  }
}
