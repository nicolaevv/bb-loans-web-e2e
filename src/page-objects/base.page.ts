import { Page, Locator } from '@playwright/test';

/** Delay between keystrokes; the auth form drops input typed faster than this. */
const TYPING_DELAY_MS = 30;

/**
 * Shared behaviour for every page object.
 *
 * Page objects expose locators and actions only — assertions belong in the
 * tests, so that a failure points at the expectation that was not met rather
 * than at some line buried inside a helper.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async navigateTo(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Navigate and wait until the page's anchor element is attached, so callers
   * get a page that is actually ready instead of a bare URL change.
   */
  async openAndWait(path: string, anchor: Locator): Promise<void> {
    await this.navigateTo(path);
    await anchor.waitFor({ state: 'visible' });
  }

  /**
   * Click helper. No manual visibility wait: `click()` already waits for the
   * element to be visible, stable and enabled, and doing it by hand only
   * replaces Playwright's detailed error with a vaguer one.
   */
  protected async clickElement(locator: Locator): Promise<void> {
    await locator.click();
  }

  /**
   * Type into a field character by character, then verify what actually landed
   * in it and retype if characters were lost.
   *
   * Both halves are needed on this app's auth forms:
   *  - `fill()` alone leaves the submit button disabled — the form only reacts
   *    to real key events (verified against the live stand: fill, fill+blur and
   *    fill+trailing-keystroke all keep the button disabled);
   *  - the field re-renders right after being cleared and swallows the first
   *    keystrokes, which is what the old `waitForTimeout(400)` was papering
   *    over. Verifying the value is deterministic where a fixed sleep is a bet.
   */
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
