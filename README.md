# bb-loans-web-e2e

End-to-end tests for the maib Business Banking **loans** web module, built with [Playwright](https://playwright.dev/).

The application under test is Romanian-language, so locators target Romanian accessible names (`Credite`, `Garanții`, `Cereri`, `Conectează-te`).

---

## Requirements

| Tool | Version |
| --- | --- |
| Node.js | 20+ (CI uses `lts/*`) |
| pnpm | 11+ (declared in `devEngines`, auto-downloaded on mismatch) |

Network access to the maib test environment (VPN) is required — both for running tests and for regenerating the API client.

## Getting started

```bash
pnpm install
pnpm exec playwright install --with-deps   # browsers, first time only
cp .env.example .env                       # then fill in the values
pnpm test
```

### Environment variables

All configuration lives in `.env`. `.env.example` lists the variables and what they are for:

| Group | Variables |
| --- | --- |
| UI credentials | `UI_USERNAME`, `UI_PASSWORD` |
| BNPL UI credentials | `BNPL_UI_USERNAME`, `BNPL_UI_PASSWORD` |
| API credentials | `API_CLIENT_ID`, `API_CLIENT_SECRET`, `API_TOKEN_URL` |
| URLs | `BASE_URL`, `PRODUCTS_URL`, `LOAN_APPLICATION_URL`, `LOAN_ORIGINATION_API_URL`, `SHELL_BFF_URL` |
| Test companies | `TRANCHE_COMPANY_ID`, `LOAN_COMPANY_ID`, `ORDYNARY_GUARANTY_COMPANY_ID`, `LINE_GUARANTY_COMPANY_ID` |

`BASE_URL` is what relative `page.goto()` paths resolve against. Each product flow uses its own company so that parallel flows don't clean up each other's data.

Variables are read lazily, so a missing one fails at the moment it is first used, with a message naming the variable.

> **Note:** `.env` is currently tracked in git (it was committed before the ignore rule was added). Run `git rm --cached .env` before putting real secrets in it.

## Running tests

```bash
pnpm test                                            # full suite
pnpm test:headed                                     # watch it in a browser
pnpm test:ui                                         # Playwright UI mode
pnpm test:debug                                      # Playwright Inspector

pnpm test tests/loans/loans.smoke.spec.ts            # one file
pnpm test tests/loans/loans.smoke.spec.ts:12         # one test, by line
pnpm test -g "switches to the guarantees"            # one test, by title

pnpm report                                          # open the last HTML report
pnpm codegen                                         # record locators
pnpm typecheck                                       # tsc --noEmit
```

### Authentication and caching

Two setup projects run before any test:

1. **`setup:api`** — requests a client-credentials bearer token and caches it in `playwright/.auth/api-token.json`.
2. **`setup:ui`** — signs in through the UI, picks the first company, opens the loans module, and saves the browser session to `playwright/.auth/user.json`.

On subsequent local runs both are reused if still valid — the token until shortly before it expires, the session after being validated against the shell BFF. This keeps repeat runs fast and avoids hammering the login page.

Reuse is disabled automatically when `CI` is set. To force a fresh login locally:

```bash
pnpm test:auth:force     # re-authenticate only
FORCE_AUTH=1 pnpm test   # re-authenticate, then run the suite
```

The `playwright/.auth/` directory is git-ignored.

## Project layout

```
tests/
  setup/          auth.api.setup.ts, auth.ui.setup.ts — run before every suite
  loans/          the specs
src/
  pages/          page objects (BasePage + one class per screen)
  fixtures/       Playwright fixtures the specs import test/expect from
  api/
    clients/      hand-written API clients (auth, session)
    models/       hand-written types
    generated/    orval output — do not edit
  utils/          logger, @Step decorator, cached auth state, test-data cleanup
  config/         env variable names and the typed ENV object
orval/            OpenAPI transformer that turns prose enums into real enums
```

## Writing a test

Import `test`/`expect` from a fixture, not from `@playwright/test` directly:

```ts
import { test, expect } from '../../src/fixtures/page.fixture';

test.describe('Credit line application', () => {
  test.beforeEach(async ({ cleanApplications }) => {
    await cleanApplications('TRANCHE');   // cancel leftovers from previous runs
  });

  test('opens the applications tab', async ({ loansPage }) => {
    await loansPage.open();
    await loansPage.openTab('Cereri');

    await expect(loansPage.tab('Cereri')).toBeChecked();
  });
});
```

- **`page.fixture`** — the default. Each test gets a fresh page. Provides `loansPage` and `cleanApplications`.
- **`flow.fixture`** — use when several tests in one file must continue on the *same* page, in order; it swaps in a worker-scoped shared page.

### Page objects

Locators go in the page object as getters, actions as methods decorated with `@Step` so they show up as named steps in the report:

```ts
@Step('Select the {0} product family')
async selectProductFamily(name: ProductFamily): Promise<void> {
  await this.clickElement(this.productFamily(name));
}
```

Use `BasePage.typeText()` rather than `locator.fill()` for text input — the app's fields drop characters, and `typeText` types with a delay and verifies the result.

### Test data cleanup

`cleanApplications(companyKey)` cancels every non-terminal loan application for that company over the API, so a rerun always starts from a known state. Applications that are `BACK_OFFICE_PROCESSING`, `DISBURSED` or `WITHDRAWN` are left alone.

## API client generation

The typed client in `src/api/generated/api.ts` is generated from the BB-Loans-BFF OpenAPI spec hosted on Nexus:

```bash
pnpm gen:api
```

The BFF spec declares statuses and currency codes as plain strings, listing the allowed values only in the description text (`Can be one of: …`). A transformer in `orval/` parses those descriptions and injects real enums, which is why `LoanApplicationWorkflowStatus` and `CurrencyCode` are usable as typed constants in tests.

Never edit `src/api/generated/api.ts` by hand — regenerate it.

## Continuous integration

`.github/workflows/playwright.yml` runs the suite on pushes and pull requests against `main`/`master`, and uploads the HTML report as an artifact (retained 30 days). Because `CI` is set, every CI run authenticates from scratch.
