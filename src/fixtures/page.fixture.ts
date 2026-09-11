import { test as base } from '@playwright/test';
import { LoansPage } from '../pages/loans.page';
import { CompanyIdKey, ENV } from '../config/env.config';
import { LoanApplicationCleanup } from '../utils/loans/loan.application.cleanup';

type PageFixtures = {
  loansPage: LoansPage;
  cleanApplications: (key: CompanyIdKey) => Promise<void>;
};

export const test = base.extend<PageFixtures>({
  loansPage: async ({ page }, use) => {
    await use(new LoansPage(page));
  },

  cleanApplications: async ({}, use) => {
    await use((key: CompanyIdKey) => LoanApplicationCleanup.cancelAll(ENV.companies.get(key)));
  },
});

export { expect } from '@playwright/test';
