import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // 1 reintento absorbe los falsos negativos por compile-en-frío del dev server
  // (Next compila rutas on-demand; el primer hit a una ruta puede pasarse del timeout).
  retries: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
