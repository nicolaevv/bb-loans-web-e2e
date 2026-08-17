import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

/**
 * Debugging config: run the whole suite in ONE browser window instead of
 * opening a fresh one per test. Used by `pnpm test:headed`.
 *
 * Three settings are required together — dropping any one of them brings the
 * per-test window back:
 *  - `reuseContext` keeps the same browser context across tests;
 *  - `video: 'off'` — Playwright silently ignores reuseContext while video
 *    recording is on, because each recording needs its own context;
 *  - `workers: 1` — every worker launches its own browser, so more than one
 *    worker means more than one window.
 *
 * Trade-off: reusing a context weakens test isolation, which is exactly what
 * the normal config buys you. This is a local debugging aid — never CI, and
 * never the place to diagnose an order-dependent failure.
 */
export default defineConfig({
  ...baseConfig,
  workers: 1,
  fullyParallel: false,
  // A headed login runs ~2.5x slower than a headless one (~30s vs ~12s here)
  // and intermittently blew the inherited 60s budget.
  timeout: 150_000,
  use: {
    ...baseConfig.use,
    headless: false,
    video: 'off',
    reuseContext: true,
  },
});
