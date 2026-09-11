import { expect, test as setup } from '../../src/fixtures/page.fixture';
import { SessionClient } from '../../src/api/clients/session.client';
import { SessionStorage } from '../../src/utils/session.storage';
import { LoginPage } from '../../src/pages/login.page';
import { Logger } from '../../src/utils/logger';

const LOANS_URL = /\/loans\/?(\?.*)?$/;

const LANDING_TIMEOUT_MS = 15_000;

setup('Reuse the stored UI session, or sign in and create one', async ({ browser }) => {
  if (SessionStorage.shouldTryReuse()) {
    if (await SessionClient.isStoredSessionAlive()) {
      Logger.info('Reused the stored browser session');
      setup.info().annotations.push({ type: 'session', description: 'reused' });
      return;
    }

    Logger.info('Stored session was rejected by the app — signing in again');
  }

  setup.info().annotations.push({ type: 'session', description: 'fresh login' });

  const context = await browser.newContext();
  const page = await context.newPage();
  const loginPage = new LoginPage(page);

  try {
    await loginPage.open();
    await loginPage.login();
    await loginPage.selectFirstCompany();
    await loginPage.openLoanModule();

    await setup.step('Store the session for the test projects', async () => {
      await expect(page).toHaveURL(LOANS_URL, { timeout: LANDING_TIMEOUT_MS });
      await context.storageState({ path: SessionStorage.file });
    });
  } finally {
    await context.close();
  }
});
