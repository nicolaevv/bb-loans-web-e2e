import { test, expect } from "../../src/fixtures/page.fixture";

test.describe("Loans module", () => {
  test("shows the loans dashboard to an authenticated user", async ({
    page,
    loansPage,
  }) => {
    await loansPage.open();

    await test.step("Product family switcher defaults to Credite", async () => {
      await expect(page).toHaveURL(/\/loans\/?$/);
      await expect(loansPage.productFamily("Credite")).toBeChecked();
      await expect(loansPage.productFamily("Garanții")).toBeVisible();
      await expect(loansPage.productFamily("Factoring")).toBeVisible();
    });

    await test.step("Loans tabs are available", async () => {
      await expect(loansPage.tab("Produse")).toBeChecked();
      await expect(loansPage.tab("Linii")).toBeVisible();
      await expect(loansPage.tab("Cereri")).toBeVisible();
    });
  });

  test("switches to the guarantees product family", async ({ loansPage }) => {
    await loansPage.open();
    await loansPage.selectProductFamily("Garanții");

    await test.step("Garanții becomes the active family", async () => {
      await expect(loansPage.productFamily("Garanții")).toBeChecked();
      await expect(loansPage.productFamily("Credite")).not.toBeChecked();
    });
  });
});
