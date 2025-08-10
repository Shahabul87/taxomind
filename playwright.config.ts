import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Taxomind LMS E2E Testing
 * 
 * Features:
 * - Cross-browser testing (Chrome, Firefox, Safari, Edge)
 * - Mobile device emulation
 * - Visual regression testing
 * - Performance monitoring
 * - Accessibility testing
 * - Parallel execution
 * - Test reporting with screenshots and videos
 */

export default defineConfig({
  testDir: './e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['github'], // GitHub Actions integration
  ],
  
  /* Shared settings for all projects */
  use: {
    /* Base URL for tests */
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Take screenshots on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Global timeout for each test */
    actionTimeout: 30 * 1000, // 30 seconds
    
    /* Timeout for navigation actions */
    navigationTimeout: 60 * 1000, // 60 seconds
    
    /* Ignore HTTPS errors */
    ignoreHTTPSErrors: true,
    
    /* User agent override */
    userAgent: 'Playwright E2E Tests',
    
    /* Viewport settings */
    viewport: { width: 1280, height: 720 },
    
    /* Extra HTTP headers */
    extraHTTPHeaders: {
      'Accept-Language': 'en-US',
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'setup',
      testMatch: '**/setup/*.setup.ts',
    },
    
    /* Desktop browsers */
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },
    {
      name: 'edge',
      use: { ...devices['Desktop Edge'] },
      dependencies: ['setup'],
    },

    /* Mobile devices */
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
      dependencies: ['setup'],
    },

    /* Tablet devices */
    {
      name: 'tablet-chrome',
      use: { ...devices['iPad Pro'] },
      dependencies: ['setup'],
    },

    /* High DPI displays */
    {
      name: 'high-dpi',
      use: {
        ...devices['Desktop Chrome'],
        deviceScaleFactor: 2,
        viewport: { width: 1920, height: 1080 },
      },
      dependencies: ['setup'],
    },

    /* Accessibility testing */
    {
      name: 'accessibility',
      use: {
        ...devices['Desktop Chrome'],
        // Enable accessibility tree snapshots
        // This can be used with axe-playwright for accessibility testing
      },
      dependencies: ['setup'],
      testMatch: '**/accessibility/**/*.spec.ts',
    },

    /* Performance testing */
    {
      name: 'performance',
      use: {
        ...devices['Desktop Chrome'],
        // Enable performance tracing
        trace: 'on',
      },
      dependencies: ['setup'],
      testMatch: '**/performance/**/*.spec.ts',
    },

    /* Visual regression testing */
    {
      name: 'visual-regression',
      use: {
        ...devices['Desktop Chrome'],
        // Consistent viewport for visual comparisons
        viewport: { width: 1280, height: 720 },
      },
      dependencies: ['setup'],
      testMatch: '**/visual/**/*.spec.ts',
    },
  ],

  /* Global setup and teardown */
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',

  /* Test timeout */
  timeout: 60 * 1000, // 60 seconds

  /* Expect timeout */
  expect: {
    timeout: 10 * 1000, // 10 seconds
    
    /* Visual comparison threshold */
    toHaveScreenshot: {
      threshold: 0.2,
      mode: 'pixel',
    },
    toMatchSnapshot: {
      threshold: 0.2,
    },
  },

  /* Output directory for test results */
  outputDir: 'test-results/',

  /* Web server configuration for development */
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes
    env: {
      NODE_ENV: 'test',
      NEXTAUTH_URL: 'http://localhost:3000',
      NEXTAUTH_SECRET: 'test-secret',
      DATABASE_URL: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    },
  },

  /* Test file patterns */
  testMatch: [
    '**/e2e/**/*.spec.ts',
    '**/e2e/**/*.test.ts',
  ],

  /* Test ignore patterns */
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/*.d.ts',
  ],

  /* Metadata for test reports */
  metadata: {
    project: 'Taxomind LMS',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'test',
    branch: process.env.GITHUB_REF_NAME || 'local',
    commit: process.env.GITHUB_SHA || 'local',
  },
});