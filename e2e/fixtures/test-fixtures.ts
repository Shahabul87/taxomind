import { test as base, expect } from '@playwright/test';
import { percySnapshot } from '@percy/playwright';
import AxeBuilder from '@axe-core/playwright';
import path from 'path';

/**
 * Custom test fixtures extending Playwright's base test
 */

export type TestUser = {
  email: string;
  password: string;
  role: 'admin' | 'teacher' | 'student';
  authFile: string;
};

export type TestFixtures = {
  authenticatedPage: any;
  testUser: TestUser;
  axeBuilder: AxeBuilder;
  percySnapshot: typeof percySnapshot;
};

/**
 * Extend base test with custom fixtures
 */
export const test = base.extend<TestFixtures>({
  // Authenticated page fixture
  authenticatedPage: async ({ browser, testUser }, use) => {
    const authFile = path.join(__dirname, '..', 'auth', testUser.authFile);
    const context = await browser.newContext({
      storageState: authFile,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  // Test user fixture
  testUser: async ({}, use) => {
    // Default to student user, can be overridden in tests
    await use({
      email: 'student@test.com',
      password: 'Test123!@#',
      role: 'student',
      authFile: 'student-auth.json',
    });
  },

  // Accessibility testing fixture
  axeBuilder: async ({ page }, use) => {
    const axe = new AxeBuilder({ page });
    await use(axe);
  },

  // Visual regression testing fixture
  percySnapshot: async ({}, use) => {
    await use(percySnapshot);
  },
});

/**
 * Test user configurations
 */
export const testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'Test123!@#',
    role: 'admin' as const,
    authFile: 'admin-auth.json',
  },
  teacher: {
    email: 'teacher@test.com',
    password: 'Test123!@#',
    role: 'teacher' as const,
    authFile: 'teacher-auth.json',
  },
  student: {
    email: 'student@test.com',
    password: 'Test123!@#',
    role: 'student' as const,
    authFile: 'student-auth.json',
  },
};

/**
 * Custom expect matchers
 */
export { expect };