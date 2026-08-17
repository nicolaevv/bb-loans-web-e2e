import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import { requireEnv } from './src/config/env.config';
import { SessionStorage } from './src/utils/session.storage';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 *
 * requireEnv() reads process.env lazily, at call time, so it is safe to import
 * it above this line.
 */
dotenv.config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['list'], ['html', { open: 'never' }]],
  /* Per-test budget; individual assertions get their own timeout below. */
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: requireEnv('BASE_URL'),

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: true,
    viewport: null,
    launchOptions: {
      args: ['--start-maximized'],
    },
  },

  projects: [
    /* Obtains an API bearer token and stores it in playwright/.auth/api-token.json */
    {
      name: 'setup:api',
      testMatch: /.*\.api\.setup\.ts/,
    },

    /* Logs in through the UI and stores the browser session in playwright/.auth/user.json */
    {
      name: 'setup:ui',
      testMatch: /.*\.ui\.setup\.ts/,
    },

    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: SessionStorage.FILE,
      },
      dependencies: ['setup:api', 'setup:ui'],
    },

    /*
     * firefox and webkit are intentionally absent: without `dependencies` and
     * `storageState` they cannot pass a single authenticated scenario. Add them
     * back mirroring the chromium project once cross-browser coverage is needed.
     */

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
