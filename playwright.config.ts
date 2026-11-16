import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}`;

/** Stores the reader's theme choice before any page loads, as Mordoc's theme switch does. */
function withTheme(theme: 'light' | 'dark') {
  return {
    cookies: [],
    origins: [{ origin: BASE_URL, localStorage: [{ name: 'mordoc-theme', value: theme }] }],
  };
}

export default defineConfig({
  testDir: 'test/e2e',
  testMatch: '**/*.spec.ts',
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: BASE_URL,
    permissions: ['clipboard-read', 'clipboard-write'],
  },
  projects: [
    { name: 'light', use: { storageState: withTheme('light') } },
    { name: 'dark', use: { storageState: withTheme('dark') } },
  ],
  webServer: {
    // Builds the components example site with the Mordoc in this repository
    // and serves the result as a static host would.
    command: `npm --prefix examples/components run build && node test/e2e/serve.ts examples/components/dist ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
