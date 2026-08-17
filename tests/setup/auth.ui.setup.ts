import { expect, test as setup } from '../../src/fixtures/page.fixture';
import { SessionApiClient } from '../../src/api/clients/session.client';
import { SessionStorage } from '../../src/utils/session.storage';
import { LoginPage } from '../../src/page-objects/pages/login.page';
import { Logger } from '../../src/utils/logger';

/**
 * Provides playwright/.auth/user.json for the test projects.
 *
 * Carries on with the session a previous run left behind whenever the app still
 * accepts it, and signs in from scratch when it does not.
 *
 * The reuse path deliberately opens no page: it is an HTTP call, so a warm run
 * spends no browser window here and the whole suite stays in the single window
 * opened by the test project. Page objects are built by hand rather than taken
 * from the fixtures for the same reason — the `page` fixture would open a
 * window even on the path that does not need one.
 */
setup('Reuse the stored UI session, or sign in and create one', async ({ browser }) => {
  if (SessionStorage.shouldTryReuse() && !SessionStorage.isDefinitelyExpired()) {
    if (await new SessionApiClient().isStoredSessionAlive()) {
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
    await setup.step('Sign in', async () => {
      await loginPage.open();
      await loginPage.login();
    });

    await setup.step('Pick a company and open the loans module', async () => {
      await loginPage.selectFirstCompany();
      await loginPage.openLoanModule();
    });

    await setup.step('Store the session for the test projects', async () => {
      await expect(page).toHaveURL(/\/loans\/?(\?.*)?$/, { timeout: 15000 });
      await context.storageState({ path: SessionStorage.FILE });
    });
  } finally {
    await context.close();
  }
});
