import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import { ENV } from "./src/config/env.config";
import { SessionStorage } from "./src/utils/session.storage";

dotenv.config();

export default defineConfig({
  testDir: "./tests",
  // fullyParallel: true,
  // forbidOnly: !!process.env.CI,
  // retries: process.env.CI ? 2 : 0,
  // workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  // timeout: 60_000,
  expect: {
    // timeout: 10_000,
  },
  use: {
    baseURL: ENV.urls.base,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    // video: "retain-on-failure",
    ignoreHTTPSErrors: true,
    // viewport: null,
    // launchOptions: {
    //   args: ["--start-maximized"],
    // },
  },

  projects: [
    {
      name: "setup:api",
      testMatch: /.*\.api\.setup\.ts/,
    },
    {
      name: "setup:ui",
      testMatch: /.*\.ui\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: SessionStorage.file,
      },
      dependencies: ["setup:api", "setup:ui"],
    },
  ],
});
