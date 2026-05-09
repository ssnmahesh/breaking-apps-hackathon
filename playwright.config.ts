import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { configure } from 'passmark';

// Load .env before anything else
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Tell Passmark to use OpenRouter as the AI gateway
configure({
  ai: {
    gateway: "openrouter"
  }
});

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['line']],
  timeout: 120000,

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'on',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});