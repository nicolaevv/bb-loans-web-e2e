import { Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { Step } from '../utils/step.decorator';

/**
 * Shared base for the Radix dialogs of the loan flows.
 *
 * The app can have up to three dialog portals mounted at once — the flow dialog, a sign-method
 * picker on top of it and an alert dialog — so a bare `getByRole('dialog')` is never unique.
 * Every dialog page object narrows to its own root through the helpers here instead.
 */
export abstract class BaseDialog extends BasePage {
  protected abstract get root(): Locator;

  /** The dialog carrying the given text. Portals are siblings in `body`, so this never matches an ancestor. */
  protected dialogWith(text: string | RegExp): Locator {
    return this.page.getByRole('dialog').filter({ hasText: text });
  }

  /** The flow dialog — mounted first, so it comes first in DOM order among the portals. */
  protected get flowDialog(): Locator {
    return this.page.getByRole('dialog').first();
  }

  /** The topmost portal — the last one mounted, e.g. the sign-method picker. */
  protected get topDialog(): Locator {
    return this.page.getByRole('dialog').last();
  }

  isOpen(): Promise<boolean> {
    return this.root.isVisible();
  }

  /** These dialogs ignore clicks outside — Escape is the only way out. */
  @Step('Close the dialog with Escape')
  async dismiss(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }
}
