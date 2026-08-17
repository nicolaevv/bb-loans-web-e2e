import { test as base } from '@playwright/test';
import { LoginPage } from '../page-objects/components/login.page';
import {GuaranteesProductsTabPage} from '../page-objects/components/guarantees.products.tab.page';
import { CompanyIdKey, getCompanyId } from '../config/companyId.config';

type PageFixtures = {
  loginPage: LoginPage;
  guaranteesProductsTabPage: GuaranteesProductsTabPage;
};

type CompanyFixtures = {
  companyId: string; // Основной ID, используемый по умолчанию (например, LOAN)
  getCompany: (key: CompanyIdKey) => string;
};

type CustomFixtures = PageFixtures & CompanyFixtures;

export const test = base.extend<CustomFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
  guaranteesProductsTabPage: async ({page}, use) => {
    const guaranteesProductsTabPage = new GuaranteesProductsTabPage(page);
    await use(guaranteesProductsTabPage);
  },

  // Используем вашу готовую функцию getCompanyId
  companyId: async ({}, use) => {
    await use(getCompanyId('LOAN_COMPANY_ID'));
  },

  // Прокидываем вашу функцию getCompanyId напрямую
  getCompany: async ({}, use) => {
    await use((key: CompanyIdKey) => getCompanyId(key));
  },
});

export { expect } from '@playwright/test';