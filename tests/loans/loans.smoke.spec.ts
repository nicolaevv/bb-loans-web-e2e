import { test, expect } from '../../src/fixtures/page.fixture';

/**
 * Reference spec — the shape every test in this repo should follow.
 *
 * What to copy from it:
 *  - `test` / `expect` come from src/fixtures/page.fixture, never from
 *    '@playwright/test' directly; that is what injects the page objects;
 *  - page objects supply locators and actions, assertions stay in the spec, so
 *    a failure names the expectation that broke;
 *  - actions name themselves in the report through `@Step` on the page-object
 *    method; `test.step` stays here only to group assertions;
 *  - every wait is an assertion — no waitForTimeout, no manual isVisible();
 *  - no hardcoded ids or credentials: they come from .env via src/config.
 */
test.describe('Loans module', () => {
  test('shows the loans dashboard to an authenticated user', async ({ page, loansPage }) => {
    await loansPage.open();

    await test.step('Product family switcher defaults to Credite', async () => {
      await expect(page).toHaveURL(/\/loans\/?$/);
      await expect(loansPage.productFamily('Credite')).toBeChecked();
      await expect(loansPage.productFamily('Garanții')).toBeVisible();
      await expect(loansPage.productFamily('Factoring')).toBeVisible();
    });

    await test.step('Loans tabs are available', async () => {
      await expect(loansPage.tab('Produse')).toBeChecked();
      await expect(loansPage.tab('Linii')).toBeVisible();
      await expect(loansPage.tab('Cereri')).toBeVisible();
    });
  });

  test('switches to the guarantees product family', async ({ loansPage }) => {
    await loansPage.open();
    await loansPage.selectProductFamily('Garanții');

    await test.step('Garanții becomes the active family', async () => {
      await expect(loansPage.productFamily('Garanții')).toBeChecked();
      await expect(loansPage.productFamily('Credite')).not.toBeChecked();
    });
  });
});
