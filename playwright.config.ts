import { defineConfig } from '@playwright/test';

// 인수(acceptance) 테스트 = BDD 바깥 루프. S#와 1:1 대응 파일은 acceptance/<spec-id>/S<n>.*.spec.ts
export default defineConfig({
  testDir: './acceptance',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'line',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
