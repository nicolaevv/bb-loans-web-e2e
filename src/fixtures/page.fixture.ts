import { test as base } from '@playwright/test';
import { LoginPage } from '../page-objects/pages/login.page';
import { LoansPage } from '../page-objects/pages/loans.page';
import { GuaranteesProductsTabPage } from '../page-objects/components/guarantees.products.tab.page';
import { CompanyIdKey, getCompanyId } from '../config/companyId.config';
import { cleanupClientApplications } from '../helpers/loan.application.delete.helper';

type PageFixtures = {
  loginPage: LoginPage;
  loansPage: LoansPage;
  guaranteesProductsTabPage: GuaranteesProductsTabPage;
};

type DataFixtures = {
  /** Company used by default when a test does not care which one it is. */
  companyId: string;
  getCompany: (key: CompanyIdKey) => string;
  /** Cancels every cancellable application of a company, via the API. */
  cleanApplications: (key: CompanyIdKey) => Promise<void>;
};

type CustomFixtures = PageFixtures & DataFixtures;

/**
 * Import `test` and `expect` from this file rather than from '@playwright/test'
 * — that is what makes the page objects and test data available to a spec.
 */
export const test = base.extend<CustomFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  loansPage: async ({ page }, use) => {
    await use(new LoansPage(page));
  },

  guaranteesProductsTabPage: async ({ page }, use) => {
    await use(new GuaranteesProductsTabPage(page));
  },

  companyId: async ({}, use) => {
    await use(getCompanyId('LOAN'));
  },

  getCompany: async ({}, use) => {
    await use((key: CompanyIdKey) => getCompanyId(key));
  },

  cleanApplications: async ({}, use) => {
    await use(async (key: CompanyIdKey) => {
      await cleanupClientApplications(getCompanyId(key));
    });
  },
});

export { expect } from '@playwright/test';
