import { Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { Step } from '../utils/step.decorator';

export type ProductFamily = 'Credite' | 'Garanții' | 'Factoring';

export type LoansTab = 'Produse' | 'Linii' | 'Cereri';

export class LoansPage extends BasePage {
  static readonly PATH = '/loans';

  productFamily(name: ProductFamily): Locator {
    return this.page.getByRole('radio', { name, exact: true });
  }

  tab(name: LoansTab): Locator {
    return this.page.getByRole('radio', { name, exact: true });
  }

  @Step('Open the loans module')
  async open(): Promise<void> {
    await this.openAndWait(LoansPage.PATH, this.productFamily('Credite'));
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
