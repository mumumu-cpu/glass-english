import { defineConfig, devices } from '@playwright/test'

const PORT = 8788
import { SESSION_SECRET } from './tests/constants'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'iPhone 14', use: { ...devices['iPhone 14'] } }],
  webServer: {
    command:
      `npm run build && npx wrangler pages dev dist --port ${PORT} --ip 127.0.0.1 ` +
      `--binding GOOGLE_CLIENT_ID=e2e-client.apps.googleusercontent.com GOOGLE_CLIENT_SECRET=e2e-secret SESSION_SECRET=${SESSION_SECRET}`,
    url: `http://127.0.0.1:${PORT}/api/tasks`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
