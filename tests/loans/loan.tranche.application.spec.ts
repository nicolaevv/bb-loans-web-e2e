import { test, expect } from '../../src/fixtures/page.fixture';

test.describe('Credit line application', () => {
  // API cleanup, so each test starts from a company with no pending applications.
  test.beforeEach(async ({ cleanApplications }) => {
    await cleanApplications('TRANCHE');
  });

  test('opens the credit line application form', async ({ page, loansPage }) => {
    await loansPage.open();
    await loansPage.openTab('Cereri');

    await test.step('Applications tab is active', async () => {
      await expect(loansPage.tab('Cereri')).toBeChecked();
      await expect(page).toHaveURL(/\/loans/);
    });

    // TODO: fill in and submit the tranche form once tranche.page.ts has the
    // locators for it — see src/page-objects/components/tranche.page.ts.
  });
});
