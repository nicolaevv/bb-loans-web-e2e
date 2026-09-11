import { test as base } from '@playwright/test';
import { LoansPage } from '../pages/loans.page';
import { CreditLineDialog } from '../pages/loans/credit.line.dialog';
import { TrancheFormDialog } from '../pages/loans/tranche.form.dialog';
import { ApplicationProcessingDialog } from '../pages/loans/application.processing.dialog';
import { ApplicationResultDialog } from '../pages/loans/application.result.dialog';
import { CompanyIdKey, ENV } from '../config/env.config';
import { LoanApplicationCleanup } from '../utils/loans/loan.application.cleanup';

type PageFixtures = {
  loansPage: LoansPage;
  creditLineDialog: CreditLineDialog;
  trancheFormDialog: TrancheFormDialog;
  processingDialog: ApplicationProcessingDialog;
  resultDialog: ApplicationResultDialog;
  cleanApplications: (key: CompanyIdKey) => Promise<void>;
};

export const test = base.extend<PageFixtures>({
  loansPage: async ({ page }, use) => {
    await use(new LoansPage(page));
  },

  creditLineDialog: async ({ page }, use) => {
    await use(new CreditLineDialog(page));
  },

  trancheFormDialog: async ({ page }, use) => {
    await use(new TrancheFormDialog(page));
  },

  processingDialog: async ({ page }, use) => {
    await use(new ApplicationProcessingDialog(page));
  },

  resultDialog: async ({ page }, use) => {
    await use(new ApplicationResultDialog(page));
  },

  cleanApplications: async ({}, use) => {
    await use((key: CompanyIdKey) => LoanApplicationCleanup.cancelAll(ENV.companies.get(key)));
  },
});

export { expect } from '@playwright/test';
