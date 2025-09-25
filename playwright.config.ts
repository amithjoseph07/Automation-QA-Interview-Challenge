import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'reports/test-results.json' }],
    ['junit', { outputFile: 'reports/junit.xml' }],
    ['allure-playwright', { outputFolder: 'allure-results' }],
    ['list'],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        ...devices['Desktop Chrome'],
        extraHTTPHeaders: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.API_TOKEN || 'test-token'}`,
        },
      },
    },

    {
      name: 'chromium',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Safari'] },
    },

    {
      name: 'mobile',
      testDir: './tests/e2e',
      use: { ...devices['iPhone 13'] },
    },

    {
      name: 'integration',
      testDir: './tests/integration',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],

  webServer: process.env.CI
    ? undefined
    : {
        command: 'docker-compose up',
        url: 'http://localhost:3000/health',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },
});