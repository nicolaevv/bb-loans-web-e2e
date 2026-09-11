import { Locator } from '@playwright/test';
import type { CurrencyCode, LoanTrancheApplicationResponse } from '../../api/generated/api';
import { BaseDialog } from '../base.dialog';
import { SelectComponent } from '../components/select.component';
import { Step } from '../../utils/step.decorator';

export type TrancheFormData = {
  amount: string;
  purpose: string;
  /** Left out of the happy path — the form pre-fills it with the line's own currency. */
  currency?: CurrencyCode;
};

/** Both selects share `classNamePrefix="select"`, so they are told apart by their order in the form. */
const CURRENCY_SELECT_INDEX = 0;

const ACCOUNT_SELECT_INDEX = 1;

const OPTIONS_TIMEOUT_MS = 20_000;

const SUBMIT_READY_TIMEOUT_MS = 10_000;

const SUBMIT_TIMEOUT_MS = 30_000;

const APPLICATIONS_URL = /\/loans\/lines\/[^/]+\/applications$/;

/**
 * Second step of the tranche flow: the application form. It lives in the same dialog as the
 * processing screen that follows — the dialog swaps its content rather than navigating.
 */
export class TrancheFormDialog extends BaseDialog {
  static readonly TITLE = 'Tranșă nouă';

  protected get root(): Locator {
    return this.dialogWith(TrancheFormDialog.TITLE);
  }

  /** A real dialog title. It disappears once the flow moves on, which marks the transition. */
  get title(): Locator {
    return this.page.getByRole('heading', { name: TrancheFormDialog.TITLE });
  }

  get loader(): Locator {
    return this.root.getByText('Generare date');
  }

  get amountInput(): Locator {
    return this.root.getByLabel('Selectează suma');
  }

  get purposeInput(): Locator {
    return this.root.getByPlaceholder('Indicați scopul');
  }

  get termsCheckbox(): Locator {
    return this.root.getByRole('checkbox');
  }

  get submitButton(): Locator {
    return this.root.getByRole('button', { name: 'Continuă' });
  }

  get cancelButton(): Locator {
    return this.root.getByRole('button', { name: 'Anulează' });
  }

  get errorToast(): Locator {
    return this.page.getByRole('status').filter({ hasText: 'Eroare' });
  }

  get currencySelect(): SelectComponent {
    return new SelectComponent(this.root, CURRENCY_SELECT_INDEX);
  }

  get accountSelect(): SelectComponent {
    return new SelectComponent(this.root, ACCOUNT_SELECT_INDEX);
  }

  fieldError(text: string | RegExp): Locator {
    return this.root.getByText(text);
  }

  /**
   * The loader hides the fields while GET /loans/lines/{lineId}/options is in flight. Until it
   * answers, the schema's hidden fields (`loanLd`, `limits.maxAmount`) are empty and a submit
   * would fail validation with nothing visible to explain it.
   */
  @Step('Wait for the tranche form')
  async waitForForm(timeout = OPTIONS_TIMEOUT_MS): Promise<void> {
    await this.title.waitFor({ state: 'visible', timeout });
    await this.loader.waitFor({ state: 'hidden', timeout });
    await this.amountInput.waitFor({ state: 'visible', timeout });
  }

  @Step('Enter the amount {0}')
  async enterAmount(amount: string): Promise<void> {
    await this.typeMaskedText(this.amountInput, amount);
  }

  /** Changing the currency clears the disbursement account, so call this before picking one. */
  @Step('Select the currency {0}')
  async selectCurrency(code: CurrencyCode): Promise<void> {
    await this.currencySelect.choose(code);
  }

  /** A company with a single eligible account has it selected already. */
  @Step('Select the disbursement account')
  async selectDisbursementAccount(): Promise<string> {
    if (await this.accountSelect.hasValue()) {
      return this.accountSelect.selectedText();
    }

    return this.accountSelect.chooseFirst();
  }

  @Step('Enter the tranche purpose')
  async enterPurpose(purpose: string): Promise<void> {
    await this.typeText(this.purposeInput, purpose);
  }

  /** The label text wraps a Radix checkbox button, so clicking the text does not toggle it. */
  @Step('Accept the terms and conditions')
  async acceptTerms(): Promise<void> {
    await this.clickElement(this.termsCheckbox);
  }

  @Step('Submit the tranche application')
  async submit(): Promise<string> {
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (candidate) =>
          candidate.request().method() === 'POST' && APPLICATIONS_URL.test(candidate.url()),
        { timeout: SUBMIT_TIMEOUT_MS }
      ),
      this.clickElement(this.submitButton, { timeout: SUBMIT_READY_TIMEOUT_MS }),
    ]);

    const { loanApplication } = (await response.json()) as LoanTrancheApplicationResponse;

    return loanApplication.applicationId;
  }

  @Step('Fill in and submit the tranche form')
  async apply(data: TrancheFormData): Promise<string> {
    await this.enterAmount(data.amount);

    if (data.currency) {
      await this.selectCurrency(data.currency);
    }

    await this.selectDisbursementAccount();
    await this.enterPurpose(data.purpose);
    await this.acceptTerms();

    return this.submit();
  }
}
