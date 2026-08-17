# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Playwright E2E suite for the **maib business banking lending module** (loans, credit lines/tranches, guarantees), targeting the `*.maib.test` / `*.tstback.maib.md` test environments. The UI under test is in **Romanian** — locators match Romanian strings (`"Conectează-te"`, `"Produse"`, `"Credite"`).

## Commands

The package pins pnpm via `devEngines`, so `npx`/`npm run` fail with `EBADDEVENGINES`. Always use `pnpm`.

```bash
pnpm install
pnpm exec playwright install --with-deps

pnpm test                                                    # full run
pnpm test:ui                                                 # UI mode: one browser, stays open, re-run on click
pnpm test:headed                                             # whole suite in ONE window (playwright.headed.config.ts)
pnpm test:debug                                              # Playwright Inspector, pauses on each step
pnpm test:auth                                               # re-run the two auth setup projects only
pnpm typecheck                                               # tsc --noEmit
pnpm report                                                  # last HTML report

pnpm exec playwright test tests/loans/loans.smoke.spec.ts    # single file
pnpm exec playwright test -g "guarantees product family"     # single test by title
pnpm exec playwright test --repeat-each=3                    # flakiness check
```

There is no lint setup.

## Auth architecture (the part that isn't obvious)

Authentication is split across two Playwright *setup projects*, each producing a file under `playwright/.auth/` (gitignored) that the real test projects consume:

| Project | `testMatch` | Produces | Consumed by |
|---|---|---|---|
| `setup:api` | `*.api.setup.ts` | `playwright/.auth/api-token.json` — Keycloak `client_credentials` bearer token, written by `TokenStorage` | `TokenStorage.getBearerToken()`, called from API helpers at runtime |
| `setup:ui` | `*.ui.setup.ts` | `playwright/.auth/user.json` — browser `storageState` after a real UI login | `chromium` project's `use.storageState` |

Consequences to keep in mind:

**Both setup projects reuse what a previous run left behind** instead of authenticating every time — a warm `pnpm test` is ~10s against ~26s cold.

- The app keeps a **sliding 2h session window**: cookie `__Host-bbapp-exp` sits ~2h past `__Host-bbapp-la` (last activity). `localStorage` also carries `companyId`, so a restored session skips the company chooser too.
- `auth.ui.setup.ts` never trusts that timestamp to conclude a session is *alive*. It asks the app, over HTTP: `SessionApiClient.isStoredSessionAlive()` GETs `${SHELL_BFF_URL}/api/v1/auth/userinfo` with the stored cookies — 200 means alive, 401 means not. The timestamp is used only for the cheap negative ("definitely expired, skip the call"), and `SessionStorage.isDefinitelyExpired()` documents that asymmetry.
- That check is HTTP rather than a browser probe on purpose: it runs before every suite, and opening a window just to check would break the single-window run described below. `/loans` itself is useless for this — it returns 200 signed in or not, because the redirect to the login screen is client-side.
- After a successful check the refreshed cookies are written back via `SessionStorage.refreshCookies()`, which replaces `cookies` but keeps `origins` — an `APIRequestContext` has no localStorage, so overwriting the whole file would drop `companyId` and send the next run back to the company chooser.
- A rejected session falls through to a full login in the same run; nothing fails. Each path is tagged in the HTML report (`reused` / `fresh login`).
- Reuse is off when `CI` is set, and `FORCE_AUTH=1` (or `pnpm test:auth:force`) forces a clean login locally.
- `TokenStorage` stores the API token's `expiresAt` (derived from `expires_in`) and refreshes 2 minutes before it lapses.

- **`chromium` is the only test project**, and it declares `dependencies: ['setup:api', 'setup:ui']`. `firefox`/`webkit` were removed because without those dependencies and `storageState` they cannot pass an authenticated scenario; add them back mirroring `chromium` when cross-browser coverage is actually needed.
- API helpers read the token off disk *lazily*, not through a fixture. Running an API-touching test standalone without the `setup:api` project having run leaves `getBearerToken()` returning `''`.
- The UI login walks the real form (`LoginPage.login()` → `selectFirstCompany()` → `openLoanModule()`); `auth.ui.setup.ts` asserts the URL matches `/loans` before saving state.
- **Picking a company lands on the legacy IBMAIB dashboard** (`/IBMAIB/?dashboard`, Oracle JET), not on the new SPA. The two shells render the same menu differently — "Credite" is a title `<span>` inside `toolbar "Menu"` on the legacy side and a `link` on the SPA side — which is why `LoginPage.loansMenuItem` matches both with `.or()`.

[playwright.headed.config.ts](playwright.headed.config.ts) exists because a plain `--headed` run opens a new window per test: Playwright gives every test its own browser context by design. Reusing one window needs `reuseContext` **plus** `video: 'off'` (reuse is silently skipped while video recording is on) **plus** `workers: 1`. It is a debugging aid only — context reuse weakens the isolation the main config provides.

A warm `pnpm test:headed` opens **one** window for the whole run: `setup:api` and `setup:ui` do their work over HTTP, and a browser with no pages shows nothing (Playwright launches Chromium with `--no-startup-window`), so the only window is the reused one the `chromium` project opens. A cold run adds one more, opened and closed by the login. If you change `auth.ui.setup.ts`, keep the reuse path free of `page`/page-object fixtures — requesting them opens a window even when it is not needed.

## Writing a test

[tests/loans/loans.smoke.spec.ts](tests/loans/loans.smoke.spec.ts) is the reference spec — copy its shape. The conventions it encodes:

1. **Import `test`/`expect` from [src/fixtures/page.fixture.ts](src/fixtures/page.fixture.ts)**, never from `@playwright/test`. That import is what injects the page objects; adding a page object means wiring it into that file.
2. **Locator priority:** `getByRole` → `getByLabel`/`getByPlaceholder` → text → CSS. The app ships **no `data-testid` attributes at all** (verified against the live stand), so roles and Romanian accessible names are what you have. Both switchers on `/loans` are `role=radio`, not tabs.
3. **Web-first assertions only** — `await expect(locator).toBeVisible()`, never `waitFor` + `isVisible()`. Assertions retry; the manual pair does not.
4. **No `waitForTimeout`.** If something needs settling, express it as an assertion.
5. **Assertions live in specs, page objects only expose locators and actions** — so a failure names the broken expectation instead of pointing inside a helper.
6. **Prepare data over the API, verify through the UI** (see the `cleanApplications` fixture), and keep each test independent of run order.
7. **No hardcoded ids, URLs or credentials** — they come from `.env` through `src/config`.
8. Wrap phases in `test.step` so the HTML report reads as a scenario.

## Layout

- `tests/` — specs (`testDir`), named `*.spec.ts`. `*.setup.ts` files are picked up solely by the setup projects.
- `src/page-objects/pages/` — whole pages (`login.page.ts`, `loans.page.ts`); `src/page-objects/components/` — embedded components; `src/page-objects/base.page.ts` — shared `BasePage`.
- `src/fixtures/page.fixture.ts` — the extended `test`: page-object fixtures plus `companyId`, `getCompany(key)` and `cleanApplications(key)`.
- `src/api/clients/` — thin clients extending `ApiClient`. The pattern: use the injected `APIRequestContext` if present, otherwise create a local one with `ignoreHTTPSErrors` and dispose it in `finally` (see `AuthApiClient.getBearerToken`).
- `src/api/models/` — response/DTO interfaces only.
- `src/helpers/` — test-data routines, e.g. `cleanupClientApplications(companyId)`, which cancels every application not in `EXCLUDED_STATUSES` (`BACK_OFFICE_PROCESSING`, `DISBURSED`, `WITHDRAWN`).
- `src/config/` — `env.config.ts` (`requireEnv`, `URLS`, `UI_CREDENTIALS`, `API_CREDENTIALS`) and `companyId.config.ts` (`getCompanyId('LOAN' | 'TRANCHE' | 'ORDINARY_GUARANTY' | 'LINE_GUARANTY')`).

## Environment

`dotenv.config()` runs in `playwright.config.ts`; everything else goes through `requireEnv()`, which **throws** on a missing variable rather than falling back — a broken `.env` should fail as a config error, not as a puzzling API 4xx. Keys are listed in [.env.example](.env.example). Never reintroduce `process.env.X || '<real value>'`.

## Style

Test titles, `test.step` names and code comments are in **English**. `src/utils/logger.ts` (`Logger.info/step/error`) is the convention for console output — not bare `console.log`.

`src/utils/step.decorator.ts` provides `@Step()`, a standard (ES2022) decorator that wraps a page-object method in `test.step`, with `{0}`/`{1}` argument interpolation. Playwright's transpiler handles it without `experimentalDecorators` — do not enable that flag.

## Non-obvious app behaviour

The auth form is unusually picky, and both workarounds live in `BasePage.typeText()`:

- `fill()` alone leaves the submit button **disabled** — the form only reacts to real key events. Verified on the stand: `fill`, `fill` + blur, and `fill` + trailing keystroke all keep it disabled. `pressSequentially` is required.
- The field re-renders right after being cleared and **swallows the first keystrokes** (`alexandr.gorodetki` arrives as `exandr.gorodetki`). `typeText()` verifies the resulting value and retypes, which is why the old `waitForTimeout(400)` is gone.
- The form can also wipe both inputs *after* they were verified, while it finishes hydrating — leaving a correctly-typed-then-emptied form and a disabled submit. So `LoginPage.enterCredentials()` treats **submit becoming clickable** as the real signal (a `{ trial: true }` click, which waits for actionability without clicking) and retypes everything if it never does.

The `/loans` list content does not render on the test stand — the backend answers 500 and the panel stays on `Se încarcă...`. The module chrome (product family switcher, tabs) does render, which is what the smoke test asserts. Don't write assertions against loan rows until that backend is fixed.

## Known rough edges

- `src/api/clients/enrichment.client.ts` exports a class also named `AuthApiClient` (copy-paste from `auth.client.ts`) with an empty `getGuaranteeProducts()`. Rename it before building on it.
- `src/page-objects/components/tranche.page.ts` is empty and `guarantees.products.tab.page.ts` is a stub; the tranche spec stops at opening the "Cereri" tab for that reason.
- [.github/workflows/playwright.yml](.github/workflows/playwright.yml) defines no env/secrets, so CI cannot authenticate; it also triggers only on `main`/`master`.
- `tsconfig.json` uses `moduleResolution: "bundler"` deliberately: relative imports are extensionless throughout, and Playwright's own transpiler resolves them. Switching to `nodenext` would require adding `.js` extensions to every relative import.
