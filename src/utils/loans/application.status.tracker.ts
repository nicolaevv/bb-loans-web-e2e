import type { Page, Response } from '@playwright/test';
import type { LoanApplicationStatus, LoanApplicationWorkflowStatus } from '../../api/generated/api';
import { Logger } from '../logger';
import { ResponseTracker } from './response.tracker';

type StatusChange = {
  status: LoanApplicationWorkflowStatus;
  at: number;
};

/**
 * Logs every workflow status the app polls while a flow runs.
 *
 * The tranche flow spends minutes inside a handful of waits; without this, a timeout says only
 * that an element never appeared. Timestamps make the timeline assertable: the app reacts to a
 * status change, so "did X happen after the application reached Y" needs to know when Y arrived.
 */
export class ApplicationStatusTracker extends ResponseTracker {
  private readonly changes: StatusChange[] = [];

  private constructor(page: Page) {
    super(page);
  }

  static attach(page: Page): ApplicationStatusTracker {
    return new ApplicationStatusTracker(page);
  }

  protected get url(): RegExp {
    return /\/loans\/applications\/[^/]+\/status$/;
  }

  get last(): LoanApplicationWorkflowStatus | undefined {
    return this.changes.at(-1)?.status;
  }

  get history(): readonly LoanApplicationWorkflowStatus[] {
    return this.changes.map(({ status }) => status);
  }

  /** When the poll that first reported the given status went out; undefined if the flow never reached it. */
  changedAt(status: LoanApplicationWorkflowStatus): number | undefined {
    return this.changes.find((change) => change.status === status)?.at;
  }

  protected async record(response: Response, at: number): Promise<void> {
    const { status } = (await response.json()) as LoanApplicationStatus;

    if (!status || status === this.last) {
      return;
    }

    Logger.info(`Application status: ${this.last ?? 'none'} → ${status}`);
    this.changes.push({ status, at });
  }
}
