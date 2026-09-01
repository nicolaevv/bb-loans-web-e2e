import type { Page } from '@playwright/test';
import { test as base } from './page.fixture';
import { SessionStorage } from '../utils/session.storage';

type FlowWorkerFixtures = {
  sharedPage: Page;
};

export const test = base.extend<object, FlowWorkerFixtures>({
  sharedPage: [
    async ({ browser }, use) => {
      const context = await browser.newContext({ storageState: SessionStorage.file });

      await use(await context.newPage());

      await context.close();
    },
    { scope: 'worker' },
  ],

  page: async ({ sharedPage }, use) => {
    await use(sharedPage);
  },
});

export { expect } from '@playwright/test';
