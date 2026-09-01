import { request as playwrightRequest } from '@playwright/test';
import { TokenStorage } from '../utils/token.storage';
import { Logger } from '../utils/logger';
import { ENV } from '../config/env.config';
import { LoanApplication } from '../api/models/application.types';

/** Statuses that must not be touched — the application is already past the point of no return. */
const EXCLUDED_STATUSES = ['BACK_OFFICE_PROCESSING', 'DISBURSED', 'WITHDRAWN'];

/**
 * Cancels every cancellable loan application of a company so a test starts from
 * a known state. Preparing data over the API is both faster and far less
 * brittle than clicking through the UI to do the same.
 */
export async function cleanupClientApplications(companyId: string): Promise<void> {
  const apiContext = await playwrightRequest.newContext({
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: {
      Authorization: TokenStorage.getBearerToken(),
      'x-company-id': companyId,
      'Content-Type': 'application/json',
    },
  });

  try {
    const response = await apiContext.get(`${ENV.urls.loanOriginationApi}/api/v1/loans/applications`);

    if (!response.ok()) {
      Logger.error(`Could not list applications for company ${companyId}: ${response.status()}`);
      return;
    }

    const body = await response.json();
    const applications: LoanApplication[] = Array.isArray(body) ? body : body.loanApplications ?? [];

    const applicationsToCancel = applications.filter(
      (application) => !EXCLUDED_STATUSES.includes(application.applicationStatus)
    );

    if (applicationsToCancel.length === 0) {
      Logger.info(`Nothing to clean up for company ${companyId}`);
      return;
    }

    Logger.info(`Cancelling ${applicationsToCancel.length} application(s) for company ${companyId}`);

    for (const application of applicationsToCancel) {
      const deleteResponse = await apiContext.delete(
        `${ENV.urls.loanOriginationApi}/api/v1/loans/applications/${application.applicationId}`
      );

      if (!deleteResponse.ok()) {
        Logger.error(
          `Failed to cancel application ${application.applicationId} (status ${application.applicationStatus}): ${deleteResponse.status()}`
        );
      }
    }
  } finally {
    await apiContext.dispose();
  }
}
