import { Page, Locator } from '@playwright/test';
import { Logger } from '../../utils/logger';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async navigateTo(path: string): Promise<void> {
    await this.page.goto(path);
  }

  protected async clickElement(locator: Locator): Promise<void> {
    await locator.waitFor({ state: 'visible' });
      const text = (await locator.textContent())?.trim();
      const elementDescription = text && text.length > 0 ? `"${text}"` : locator.toString();
      Logger.info(`Click on element: [${elementDescription}]`);
    await locator.click();
  }
}