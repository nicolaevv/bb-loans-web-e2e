import { Locator } from '@playwright/test';
import { Step } from '../../utils/step.decorator';

const CONTROL = '.select__control';

const SINGLE_VALUE = '.select__single-value';

const MENU = '.select__menu';

/**
 * A react-select dropdown. The app renders every select through the design system with
 * `classNamePrefix="select"`, and they are not searchable — the `combobox` element is a 1px
 * transparent dummy input, so the control has to be clicked instead.
 *
 * Scoped by a `Locator` rather than a `Page`, which is why this composes into a page object
 * instead of extending `BasePage`.
 */
export class SelectComponent {
  constructor(
    private readonly scope: Locator,
    private readonly index = 0
  ) {}

  get control(): Locator {
    return this.scope.locator(CONTROL).nth(this.index);
  }

  get value(): Locator {
    return this.control.locator(SINGLE_VALUE);
  }

  /** Looked up from the page, not the scope, so it survives react-select being given a menu portal. */
  get menu(): Locator {
    return this.scope.page().locator(MENU);
  }

  get options(): Locator {
    return this.menu.getByRole('option');
  }

  option(name: string | RegExp): Locator {
    return this.options.filter({ hasText: name });
  }

  hasValue(): Promise<boolean> {
    return this.value.isVisible();
  }

  selectedText(): Promise<string> {
    return this.value.innerText();
  }

  @Step('Open the select')
  async open(): Promise<void> {
    await this.control.click();
    await this.menu.waitFor({ state: 'visible' });
  }

  @Step('Choose the option {0}')
  async choose(name: string | RegExp): Promise<void> {
    await this.open();
    await this.option(name).first().click();
    await this.menu.waitFor({ state: 'hidden' });
  }

  @Step('Choose the first option')
  async chooseFirst(): Promise<string> {
    await this.open();
    await this.options.first().click();
    await this.menu.waitFor({ state: 'hidden' });

    return this.selectedText();
  }
}
