import { Locator } from '@playwright/test';
import type { LoanApplicationWorkflowStatus } from '../../api/generated/api';
import { BaseDialog } from '../base.dialog';
import { Step } from '../../utils/step.decorator';

/**
 * Titles of the alert dialog that ends the flow, keyed by the status behind them.
 *
 * Order matters: the outcome is resolved by the first title found in the dialog text, and
 * TIMED_OUT's "Eroare" is short enough to match inside a longer message, so it comes last.
 */
export const OUTCOME_TITLES = {
  DISBURSED: 'Tranșa a fost debursată',
  BACK_OFFICE_PROCESSING: 'Vă mulțumim pentru solicitare',
  BLOCKED: 'Cerere anulată',
  WITHDRAWN: 'Cerere retrasă',
  TIMED_OUT: 'Eroare',
} as const satisfies Partial<Record<LoanApplicationWorkflowStatus, string>>;

export type ApplicationOutcome = keyof typeof OUTCOME_TITLES;

const OUTCOME_TIMEOUT_MS = 300_000;

/**
 * Last step of the flow: the alert dialog reporting how the application ended. It never dismisses
 * itself — there is no timer on it.
 */
export class ApplicationResultDialog extends BaseDialog {
  /** "Cerere deja în proces" and the signature-rejection alert have no "Închide" button. */
  protected get root(): Locator {
    return this.page
      .getByRole('alertdialog')
      .filter({ has: this.page.getByRole('button', { name: 'Închide' }) })
      .last();
  }

  get closeButton(): Locator {
    return this.root.getByRole('button', { name: 'Închide' });
  }

  title(outcome: ApplicationOutcome): Locator {
    return this.root.getByText(OUTCOME_TITLES[outcome]);
  }

  @Step('Wait for the final application outcome')
  async waitForOutcome(timeout = OUTCOME_TIMEOUT_MS): Promise<ApplicationOutcome> {
    await this.root.waitFor({ state: 'visible', timeout });

    const text = await this.root.innerText();
    const matched = (Object.keys(OUTCOME_TITLES) as ApplicationOutcome[]).find((outcome) =>
      text.includes(OUTCOME_TITLES[outcome])
    );

    if (!matched) {
      throw new Error(`The flow ended on an alert dialog we do not recognise: ${text}`);
    }

    return matched;
  }

  @Step('Close the outcome dialog')
  async close(): Promise<void> {
    await this.clickElement(this.closeButton);
  }
}
