import { Locator, Page } from '@playwright/test';

const TYPING_DELAY_MS = 30;

const MASK_SEPARATORS = /[\s  ]/g;

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  protected async navigateTo(path: string): Promise<void> {
    await this.page.goto(path);
  }

  protected async openAndWait(path: string, anchor: Locator): Promise<void> {
    await this.navigateTo(path);
    await anchor.waitFor({ state: 'visible' });
  }

  protected async clickElement(locator: Locator, options?: { timeout?: number }): Promise<void> {
    await locator.click(options);
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

  /**
   * Types into a Maskito-masked field. The mask rewrites the value as you type — it groups
   * thousands with spaces — so `fill` leaves mask artefacts behind and a plain equality check
   * on the result never matches. Select-all + Backspace clears it reliably, and the readback is
   * compared with the separators stripped.
   */
  protected async typeMaskedText(locator: Locator, text: string, attempts = 3): Promise<void> {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      await locator.click();
      await locator.press('ControlOrMeta+a');
      await locator.press('Backspace');
      await locator.pressSequentially(text, { delay: TYPING_DELAY_MS });

      if ((await locator.inputValue()).replace(MASK_SEPARATORS, '') === text) {
        return;
      }
    }

    throw new Error(
      `Failed to type "${text}" into ${locator} after ${attempts} attempts — the mask keeps rewriting it.`
    );
  }
}
