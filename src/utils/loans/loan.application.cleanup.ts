import { APIRequestContext, request as playwrightRequest } from '@playwright/test';
import { LoanApplicationWorkflowStatus } from '../../api/generated/api';
import type { LoanApplication, LoanApplicationsResponse } from '../../api/generated/api';
import { ENV } from '../../config/env.config';
import { Logger } from '../logger';
import { Step } from '../step.decorator';
import { TokenStorage } from '../token.storage';

const APPLICATIONS_PATH = '/api/v1/loans/applications';

const EXCLUDED_STATUSES = new Set<LoanApplicationWorkflowStatus>([
  LoanApplicationWorkflowStatus.BACK_OFFICE_PROCESSING,
  LoanApplicationWorkflowStatus.DISBURSED,
  LoanApplicationWorkflowStatus.WITHDRAWN,
]);

class LoanApplications {
  @Step('Cancel pending loan applications of company {0}')
  async cancelAll(companyId: string): Promise<void> {
    const context = await this.openContext(companyId);

    try {
      const cancellable = await this.listCancellable(context, companyId);

      if (!cancellable) {
        return;
      }

      if (cancellable.length === 0) {
        Logger.info(`Nothing to clean up for company ${companyId}`);
        return;
      }

      Logger.info(`Cancelling ${cancellable.length} application(s) for company ${companyId}`);

      for (const application of cancellable) {
        await this.cancel(context, application);
      }
    } finally {
      await context.dispose();
    }
  }

  private openContext(companyId: string): Promise<APIRequestContext> {
    return playwrightRequest.newContext({
      ignoreHTTPSErrors: true,
      extraHTTPHeaders: {
        Authorization: TokenStorage.getBearerToken(),
        'x-company-id': companyId,
        'Content-Type': 'application/json',
      },
    });
  }

  private async listCancellable(
    context: APIRequestContext,
    companyId: string
  ): Promise<LoanApplication[] | null> {
    const response = await context.get(this.url());

    if (!response.ok()) {
      Logger.error(`Could not list applications for company ${companyId}: ${response.status()}`);
      return null;
    }

    const body = (await response.json()) as LoanApplicationsResponse | LoanApplication[];
    const applications = Array.isArray(body) ? body : body.loanApplications ?? [];

    return applications.filter(
      (application) => !EXCLUDED_STATUSES.has(application.applicationStatus)
    );
  }

  private async cancel(context: APIRequestContext, application: LoanApplication): Promise<void> {
    const response = await context.delete(this.url(application.applicationId));

    if (!response.ok()) {
      Logger.error(
        `Failed to cancel application ${application.applicationId} (status ${application.applicationStatus}): ${response.status()}`
      );
    }
  }

  private url(applicationId?: string): string {
    const base = `${ENV.urls.loanOriginationApi}${APPLICATIONS_PATH}`;
    return applicationId ? `${base}/${applicationId}` : base;
  }
}

export const LoanApplicationCleanup = new LoanApplications();
