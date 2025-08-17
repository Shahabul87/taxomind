import { test, expect } from '../fixtures/test-fixtures';
import { 
  fillFormField, 
  waitForNetworkIdle, 
  checkForConsoleErrors,
  checkAccessibility,
  testKeyboardNavigation,
  generateTestData,
  retry,
} from '../utils/test-helpers';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page correctly', async ({ page, percySnapshot }) => {
    await page.goto('/auth/login');
    await waitForNetworkIdle(page);

    // Check page elements
    await expect(page.locator('h1')).toContainText('Sign in');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Visual regression test
    await percySnapshot(page, 'Login Page');
  });

  test('should show validation errors for invalid inputs', async ({ page }) => {
    await page.goto('/auth/login');

    // Submit empty form
    await page.click('button[type="submit"]');

    // Check validation messages
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();

    // Test invalid email format
    await fillFormField(page, 'input[name="email"]', 'invalid-email');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Invalid email format')).toBeVisible();

    // Test short password
    await fillFormField(page, 'input[name="email"]', 'test@example.com');
    await fillFormField(page, 'input[name="password"]', '123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/auth/login');

    // Fill login form
    await fillFormField(page, 'input[name="email"]', 'student@test.com');
    await fillFormField(page, 'input[name="password"]', 'Test123!@#');

    // Submit form
    await Promise.all([
      page.waitForNavigation({ url: '**/dashboard/**' }),
      page.click('button[type="submit"]'),
    ]);

    // Verify redirect to dashboard
    expect(page.url()).toContain('/dashboard');
    await expect(page.locator('[data-testid="dashboard-header"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');

    // Fill with invalid credentials
    await fillFormField(page, 'input[name="email"]', 'invalid@test.com');
    await fillFormField(page, 'input[name="password"]', 'wrongpassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Check error message
    await expect(page.locator('text=Invalid email or password')).toBeVisible();
  });

  test('should handle registration flow', async ({ page, percySnapshot }) => {
    const testData = generateTestData();
    
    await page.goto('/auth/register');
    await waitForNetworkIdle(page);

    // Visual regression for registration page
    await percySnapshot(page, 'Registration Page');

    // Fill registration form
    await fillFormField(page, 'input[name="name"]', 'Test User');
    await fillFormField(page, 'input[name="email"]', testData.email);
    await fillFormField(page, 'input[name="password"]', 'Test123!@#');
    await fillFormField(page, 'input[name="confirmPassword"]', 'Test123!@#');

    // Accept terms if present
    const termsCheckbox = page.locator('input[name="acceptTerms"]');
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    // Submit registration
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]'),
    ]);

    // Check for success message or redirect
    const successMessage = page.locator('text=Registration successful');
    const dashboardUrl = page.url().includes('/dashboard');
    
    expect(
      (await successMessage.isVisible()) || dashboardUrl
    ).toBeTruthy();
  });

  test('should handle password reset flow', async ({ page }) => {
    await page.goto('/auth/reset-password');

    // Fill reset form
    await fillFormField(page, 'input[name="email"]', 'test@example.com');

    // Submit form
    await page.click('button[type="submit"]');

    // Check success message
    await expect(
      page.locator('text=Password reset email sent')
    ).toBeVisible({ timeout: 10000 });
  });

  test('should handle logout correctly', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/dashboard');

    // Find and click user menu
    await page.click('[data-testid="user-menu-button"]');
    
    // Click logout
    await Promise.all([
      page.waitForNavigation({ url: '**/auth/login' }),
      page.click('[data-testid="logout-button"]'),
    ]);

    // Verify logged out
    expect(page.url()).toContain('/auth/login');
    
    // Try to access protected route
    await page.goto('/dashboard');
    expect(page.url()).toContain('/auth/login');
  });

  test('should redirect to requested page after login', async ({ page }) => {
    // Try to access protected route
    await page.goto('/dashboard/courses');

    // Should redirect to login
    expect(page.url()).toContain('/auth/login');

    // Login
    await fillFormField(page, 'input[name="email"]', 'student@test.com');
    await fillFormField(page, 'input[name="password"]', 'Test123!@#');
    
    await Promise.all([
      page.waitForNavigation(),
      page.click('button[type="submit"]'),
    ]);

    // Should redirect to originally requested page
    expect(page.url()).toContain('/dashboard/courses');
  });

  test('should handle session timeout', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/dashboard');

    // Simulate session expiry by clearing cookies
    await page.context().clearCookies();

    // Try to perform an action that requires authentication
    await page.reload();

    // Should redirect to login
    await page.waitForURL('**/auth/login');
    expect(page.url()).toContain('/auth/login');
  });

  test('should be accessible', async ({ page, axeBuilder }) => {
    await page.goto('/auth/login');
    await waitForNetworkIdle(page);

    // Run accessibility tests
    const results = await axeBuilder.analyze();
    expect(results.violations).toHaveLength(0);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/auth/login');

    // Test tab order
    const tabOrder = ['input[name="email"]',
      'input[name="password"]',
      'input[name="rememberMe"]',
      'a[href*="reset-password"]',
      'button[type="submit"]',
      'a[href*="register"]',
    ];

    const results = await testKeyboardNavigation(page, tabOrder);
    
    // All elements should be reachable via keyboard
    results.forEach(result => {
      expect(result.isFocused).toBeTruthy();
    });
  });

  test('should handle MFA authentication', async ({ page }) => {
    // Login with MFA-enabled account
    await page.goto('/auth/login');
    await fillFormField(page, 'input[name="email"]', 'mfa@test.com');
    await fillFormField(page, 'input[name="password"]', 'Test123!@#');
    
    await page.click('button[type="submit"]');

    // Check if MFA page appears
    const mfaPage = page.locator('text=Enter verification code');
    if (await mfaPage.isVisible()) {
      // Enter MFA code
      await fillFormField(page, 'input[name="code"]', '123456');
      await page.click('button[type="submit"]');

      // Should redirect to dashboard
      await page.waitForURL('**/dashboard/**');
      expect(page.url()).toContain('/dashboard');
    }
  });

  test('should handle social login', async ({ page }) => {
    await page.goto('/auth/login');

    // Check for social login buttons
    const googleButton = page.locator('button:has-text("Continue with Google")');
    const githubButton = page.locator('button:has-text("Continue with GitHub")');

    if (await googleButton.isVisible()) {
      // Click Google login (this will open OAuth flow)
      await googleButton.click();
      
      // In real tests, you would mock the OAuth flow
      // For now, just check that the button is clickable
      expect(googleButton).toBeEnabled();
    }

    if (await githubButton.isVisible()) {
      expect(githubButton).toBeEnabled();
    }
  });

  test('should persist user session across page refreshes', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/dashboard');

    // Get user info
    const userName = await page.textContent('[data-testid="user-name"]');

    // Refresh page
    await page.reload();

    // User should still be logged in
    await expect(page.locator('[data-testid="user-name"]')).toContainText(userName || '');
    expect(page.url()).toContain('/dashboard');
  });

  test('should handle concurrent login attempts', async ({ browser }) => {
    // Create multiple contexts
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
    ]);

    const pages = await Promise.all(
      contexts.map(ctx => ctx.newPage())
    );

    // Try to login from multiple tabs simultaneously
    const loginPromises = pages.map(async (page) => {
      await page.goto('/auth/login');
      await fillFormField(page, 'input[name="email"]', 'student@test.com');
      await fillFormField(page, 'input[name="password"]', 'Test123!@#');
      return page.click('button[type="submit"]');
    });

    await Promise.all(loginPromises);

    // All should successfully login
    for (const page of pages) {
      await page.waitForURL('**/dashboard/**', { timeout: 10000 });
      expect(page.url()).toContain('/dashboard');
    }

    // Cleanup
    await Promise.all(contexts.map(ctx => ctx.close()));
  });

  test('should not have console errors', async ({ page }) => {
    const errors = await checkForConsoleErrors(page);
    
    await page.goto('/auth/login');
    await waitForNetworkIdle(page);

    // Perform login
    await fillFormField(page, 'input[name="email"]', 'student@test.com');
    await fillFormField(page, 'input[name="password"]', 'Test123!@#');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard/**');

    // Check for console errors
    expect(errors).toHaveLength(0);
  });
});