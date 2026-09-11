# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Playwright end-to-end suite for the maib Business Banking **loans** web module. The app under test is Romanian-language, so locators are written against Romanian accessible names (`Credite`, `Garanții`, `Cereri`, `Conectează-te`, `Utilizator`, `Parola`).

Package manager is **pnpm** (declared via `devEngines`). ESM-only (`"type": "module"`), TypeScript with `noEmit` — Playwright transpiles specs itself.

## Commands

```bash
pnpm test                      # run everything (setup projects run first)
pnpm test:headed               # headed browser
pnpm test:ui                   # Playwright UI mode
pnpm test:debug                # inspector
pnpm test tests/loans/loans.smoke.spec.ts            # single file
pnpm test tests/loans/loans.smoke.spec.ts:12         # single test by line
pnpm test -g "switches to the guarantees"            # single test by title
pnpm test:auth                 # run only the two auth setup projects
pnpm test:auth:force           # same, but ignore cached session/token (FORCE_AUTH=1)
pnpm test:tranche              # the tranche disbursement flow — headed, mSign, needs a token (see below)
pnpm report                    # open the last HTML report
pnpm codegen                   # Playwright codegen
pnpm gen:api                   # regenerate src/api/generated/api.ts from the remote OpenAPI spec
pnpm typecheck                 # tsc --noEmit over all .ts (incl. orval/ and configs)
```

There is no linter or formatter configured. `pnpm typecheck` is the only static check.

## Setup

Copy `.env.example` to `.env` and fill it in. Note that `.env` is **tracked in git** (it was committed before the ignore rule was added), so `.gitignore`'s `.env` entry has no effect on it — don't add real secrets there without `git rm --cached .env` first.

`.env.example` is incomplete relative to `src/config/env.keys.ts`: `PRODUCTS_URL` and `LOAN_APPLICATION_URL` are declared as required URL keys but missing from the example. Because env vars are read through lazy getters, a missing one only throws when something actually reads it.

## Architecture

### Project graph (`playwright.config.ts`)

Three projects, run in dependency order:

1. `setup:api` (`*.api.setup.ts`) — obtains a client-credentials bearer token, writes `playwright/.auth/api-token.json`.
2. `setup:ui` (`*.ui.setup.ts`) — logs in through the UI, selects the first company, opens the loans module, writes `playwright/.auth/user.json` as Playwright storage state.
3. `chromium` — actual specs; consumes `SessionStorage.file` as `storageState`. Depends on both setups.

A fourth project, `chromium:msign`, exists **only when `MSIGN` is set**, which `pnpm test:tranche` does. It is headed, single-worker, no retries, with a 20-minute test timeout, and it runs exactly the specs tagged `@msign`. `chromium` carries `grepInvert: /@msign/` so those specs never join a normal pass — but that alone is not enough, since a bare `playwright test` runs every project, hence the conditional.

`.vscode/settings.json` sets `playwright.env: { MSIGN: "1" }` so the VS Code Playwright extension sees that project and lists the signing specs in the Test Explorer. It only affects runs launched from the extension; the terminal still needs the script (or an explicit `MSIGN=1`).

### `@msign` specs

Signing goes through **mSign/MoldSign**: the app calls a client running on the tester's own machine (`PUBLIC_MOLD_SIGN_API_URL`, `https://localhost.cts.md:18443`) and the PIN is typed into that desktop window, outside the browser. So these specs need a physical eSignature token plugged in and cannot run in CI — they also carry `test.skip(ENV.flags.isCi, …)` as a second guard.

The global `use.ignoreHTTPSErrors: true` is load-bearing here: without it the page's calls to the self-signed MoldSign certificate are dropped.

Note that these specs create **real** applications. `cleanApplications` only cancels non-terminal ones, so a `DISBURSED` tranche permanently consumes part of the credit line's limit.

### Auth state reuse

`src/utils/auth.file.ts` defines `AuthFile`, the shared read/write/exists base for both cached credentials. Two singletons extend it:

- `TokenStorage` (`token.storage.ts`) — valid while `expiresAt` is more than a 2-minute margin away.
- `SessionStorage` (`session.storage.ts`) — reads the `__Host-bbapp-exp` cookie for a cheap expiry check; `SessionClient.isStoredSessionAlive()` then confirms against the shell BFF `/api/v1/auth/userinfo` and refreshes the stored cookies on success.

`reuseAllowed()` is false when `CI` or `FORCE_AUTH` is set, so CI always authenticates fresh. The setup specs annotate each run (`reused` vs `fresh`) so the report shows which path was taken.

### Env config (`src/config/`)

`env.keys.ts` holds the raw variable names; `env.config.ts` builds the `ENV` object from them. `EnvConfig` defines a getter per key, so `ENV.ui.password` reads `process.env.UI_PASSWORD` at access time and `RequiredEnv` throws a pointed error if it's empty. `FlagEnv` returns booleans (`ENV.flags.isCi`).

The `prefix` argument is how one key map serves two credential sets: `ENV.bnplUi` reuses `UI_CREDENTIAL_ENV_KEYS` with the `BNPL_` prefix.

**To add an env var:** add the name to the relevant map in `env.keys.ts`, add it to `.env.example`, and it appears on `ENV` automatically — no change to `env.config.ts`.

### Page objects (`src/pages/`)

`BasePage` holds the `Page` and the shared primitives. `typeText` retries up to 3 times with `pressSequentially` and a 30 ms delay and verifies the value afterwards — the app's inputs drop characters, so prefer it over raw `fill`. `LoginPage.enterCredentials` layers a second retry loop on top, re-entering both fields until the submit button is actually clickable (trial click).

Page classes expose locators as getters and actions as `@Step`-decorated methods. Paths live as `static readonly PATH`.

### `@Step` decorator (`src/utils/step.decorator.ts`)

A TC39 (stage-3) method decorator — no `experimentalDecorators` in tsconfig, don't add it. Wraps the call in `test.step`. `{0}`, `{1}`… in the label are substituted with the stringified arguments; with no label it falls back to `ClassName.method(args)`. It's used on API clients too, not just page objects.

### Fixtures (`src/fixtures/`)

- `page.fixture.ts` — the default import for specs. Provides `loansPage` and `cleanApplications(companyKey)`.
- `flow.fixture.ts` — extends `page.fixture` with a **worker-scoped** `sharedPage` and overrides `page` to return it, so a sequence of tests in one file can operate on a single continuously-navigated page. Currently unused; import from here when writing a multi-step flow spec instead of an independent-test spec.

### API layer (`src/api/`)

- `clients/` — hand-written singletons (`AuthClient`, `SessionClient`) built on `playwrightRequest.newContext`, all with `ignoreHTTPSErrors: true` (test environments use self-signed certs).
- `models/auth.types.ts` — hand-written token shapes.
- `generated/api.ts` — orval output, **do not edit**; regenerate with `pnpm gen:api`.

`src/utils/loans/response.tracker.ts` is the base for the passive response trackers (`ApplicationStatusTracker`, `ApplicationDocumentsTracker`). They listen to page responses and never block, building a timeline the spec asserts on *afterwards* — the only way to check something that happens inside a minutes-long wait without racing it. Each entry is stamped with the request's start time, not the response's arrival, so a call already in flight is never mistaken for the app's reaction to a status change.

`src/utils/loans/loan.application.cleanup.ts` is the test-data reset path: it lists applications for a company and DELETEs everything except `BACK_OFFICE_PROCESSING`, `DISBURSED` and `WITHDRAWN`. It authenticates with the cached bearer token plus an `x-company-id` header, and each product flow gets its own company id (`TRANCHE`, `LOAN`, `ORDINARY_GUARANTY`, `LINE_GUARANTY` in `COMPANY_ID_ENV_KEYS`). Call it from a spec via the `cleanApplications` fixture in `beforeEach`.

### orval codegen (`orval.config.ts`, `orval/`)

The spec is fetched live from Nexus (`bb-loans-bff.yml`), so `pnpm gen:api` needs network and VPN access.

The BFF spec declares status/currency fields as plain strings and only lists the allowed values in prose. `descriptionEnumsTransformer` walks every schema (recursively, through `properties`/`items`/`additionalProperties`/`allOf`/`anyOf`/`oneOf`) and, for any string schema whose description contains `Can be one of: …`, injects a real `enum`. That is why `LoanApplicationWorkflowStatus` and `CurrencyCode` come out as typed const objects usable in test code.
