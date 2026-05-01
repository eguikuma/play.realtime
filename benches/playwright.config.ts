import { defineConfig, devices } from "@playwright/test";

const frontendUrl = process.env.BENCH_FRONTEND_URL ?? "http://localhost:3000";

/**
 * Playwright 構成、benches 専用
 * frontend / backend / Redis はローカルで `make dev` 起動済みを前提とし、本構成側ではサーバを立ち上げない
 * シナリオは時間圧縮で重い処理が連続するため、各テストの `timeout` は通常より長めに 5 分を確保する
 */
export default defineConfig({
  testDir: ".",
  testMatch: ["scenarios/**/*.spec.ts"],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 5 * 60 * 1000,
  expect: { timeout: 10 * 1000 },
  reporter: [["list"], ["json", { outputFile: "report/playwright.json" }]],
  use: {
    baseURL: frontendUrl,
    headless: true,
    trace: "off",
    screenshot: "off",
    video: "off",
    actionTimeout: 10 * 1000,
    navigationTimeout: 15 * 1000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
