import { Locator, Page } from '@playwright/test';
import { BasePage } from '../base.page';
import { Step } from '../../utils/step.decorator';

/** Top-level product family switcher shown above the module content. */
export type ProductFamily = 'Credite' | 'Garanții' | 'Factoring';

/** Tabs inside the selected product family. */
export type LoansTab = 'Produse' | 'Linii' | 'Cereri';

/**
 * The loans module landing page (/loans).
 *
 * Both switchers are rendered as radio groups rather than tabs, so `role=radio`
 * is what identifies them. The app exposes no data-testid attributes anywhere,
 * hence the role + accessible name approach throughout.
 */
export class LoansPage extends BasePage {
  static readonly PATH = '/loans';

  constructor(page: Page) {
    super(page);
  }

  @Step('Open the loans module')
  async open(): Promise<void> {
    await this.openAndWait(LoansPage.PATH, this.productFamily('Credite'));
  }

  productFamily(name: ProductFamily): Locator {
    return this.page.getByRole('radio', { name, exact: true });
  }

  tab(name: LoansTab): Locator {
    return this.page.getByRole('radio', { name, exact: true });
  }

  @Step('Select the {0} product family')
  async selectProductFamily(name: ProductFamily): Promise<void> {
    await this.clickElement(this.productFamily(name));
  }

  @Step('Open the {0} tab')
  async openTab(name: LoansTab): Promise<void> {
    await this.clickElement(this.tab(name));
  }
}
