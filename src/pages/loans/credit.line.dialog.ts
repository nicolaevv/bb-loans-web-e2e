import { Locator } from '@playwright/test';
import { BaseDialog } from '../base.dialog';
import { Step } from '../../utils/step.decorator';

const LINES_TIMEOUT_MS = 20_000;

/**
 * First step of the tranche flow: the dialog listing the credit lines a tranche can be drawn from.
 * Rows are clickable as a whole — there is no button inside them.
 */
export class CreditLineDialog extends BaseDialog {
  /** Rendered as plain text, not as a dialog title, so it is not a heading. */
  static readonly TITLE = 'Selectează linia de credit';

  static readonly EMPTY = 'Nu aveți linii de credit disponibile pentru eliberarea unei tranșe';

  static readonly BUSY_ALERT = 'Cerere deja în proces';

  protected get root(): Locator {
    return this.dialogWith(CreditLineDialog.TITLE);
  }

  get loader(): Locator {
    return this.root.getByText('Generare date');
  }

  get emptyState(): Locator {
    return this.root.getByText(CreditLineDialog.EMPTY);
  }

  /** Shown instead of the form when the line already has an application in progress. */
  get busyAlert(): Locator {
    return this.page.getByRole('alertdialog').filter({ hasText: CreditLineDialog.BUSY_ALERT });
  }

  get lines(): Locator {
    return this.root.getByRole('row').filter({ hasNot: this.page.getByRole('columnheader') });
  }

  line(name: string | RegExp): Locator {
    return this.lines.filter({ hasText: name });
  }

  /** Settles on either outcome, so an empty list fails in the spec rather than timing out on a row. */
  @Step('Wait for the credit lines to load')
  async waitForLines(timeout = LINES_TIMEOUT_MS): Promise<void> {
    await this.lines
      .first()
      .or(this.emptyState)
      .first()
      .waitFor({ state: 'visible', timeout });
  }

  @Step('Select the first available credit line')
  async selectFirstLine(): Promise<void> {
    await this.clickElement(this.lines.first());
  }

  @Step('Select the credit line {0}')
  async selectLine(name: string | RegExp): Promise<void> {
    await this.clickElement(this.line(name).first());
  }
}
