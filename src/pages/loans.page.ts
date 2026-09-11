import { Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { Step } from '../utils/step.decorator';

export type ProductFamily = 'Credite' | 'Garanții' | 'Factoring';

export type LoansTab = 'Produse' | 'Linii' | 'Cereri';

/** The tranche button stays disabled until GET /loans/capabilities enables the feature flag. */
const CAPABILITIES_TIMEOUT_MS = 15_000;

export class LoansPage extends BasePage {
  static readonly PATH = '/loans';

  static pathFor(companyId: string): string {
    return `${LoansPage.PATH}?companyId=${companyId}`;
  }

  productFamily(name: ProductFamily): Locator {
    return this.page.getByRole('radio', { name, exact: true });
  }

  tab(name: LoansTab): Locator {
    return this.page.getByRole('radio', { name, exact: true });
  }

  get newTrancheButton(): Locator {
    return this.page.getByRole('button', { name: 'Tranșă nouă' });
  }

  @Step('Open the loans module')
  async open(): Promise<void> {
    await this.openAndWait(LoansPage.PATH, this.productFamily('Credite'));
  }

  @Step('Open the loans module for company {0}')
  async openForCompany(companyId: string): Promise<void> {
    await this.openAndWait(LoansPage.pathFor(companyId), this.productFamily('Credite'));
  }

  /** The entry point of the tranche flow — the button only exists on the "Linii" tab. */
  @Step('Start a new tranche')
  async startNewTranche(): Promise<void> {
    await this.openTab('Linii');
    await this.clickElement(this.newTrancheButton, { timeout: CAPABILITIES_TIMEOUT_MS });
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
