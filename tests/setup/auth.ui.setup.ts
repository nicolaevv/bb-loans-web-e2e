import { test as setup, expect } from '../../src/fixtures/page.fixture';

const authFile = 'playwright/.auth/user.json';

setup('Authorization on maib banking and redirection to credit module', async ({ page, loginPage }) => {
  // 1. Используем относительный путь (или process.env.BASE_URL + '/login')
  await page.goto('/login');

  // 2. Логин и переход в модуль
  await loginPage.loginAndRedirectToLoanModule();

  // 3. Проверка редиректа и сохранение сессии
  await expect(page).toHaveURL(/.*\/loans\/?(\?.*)?$/, { timeout: 10000 });
  await page.context().storageState({ path: authFile });
  
});