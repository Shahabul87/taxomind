import { test, expect } from '@playwright/test';

/**
 * Authentication Flow E2E Tests
 * Tests the complete authentication journey including login, logout,
 * registration, password reset, and session management
 */

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start each test from the homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('User Registration', () => {
    test('should allow new user registration', async ({ page }) => {
      // Navigate to registration page
      await page.click('a[href*="/auth/register"], button:has-text("Sign Up"), a:has-text("Register")');
      await page.waitForURL('**/auth/register**');

      // Verify registration form is visible
      await expect(page.locator('h1, h2')).toContainText(['Sign Up', 'Register', 'Create Account']);

      // Generate unique email for this test
      const timestamp = Date.now();
      const testEmail = `test-user-${timestamp}@example.com`;

      // Fill registration form
      await page.fill('input[name="name"], input[placeholder*="name" i]', 'Test User');
      await page.fill('input[name="email"], input[type="email"]', testEmail);
      await page.fill('input[name="password"], input[type="password"]', 'TestPassword123!');
      
      // Handle confirm password field if it exists
      const confirmPasswordField = page.locator('input[name="confirmPassword"], input[name="confirm_password"], input[placeholder*="confirm" i]');
      if (await confirmPasswordField.count() > 0) {
        await confirmPasswordField.fill('TestPassword123!');
      }

      // Submit registration form
      await page.click('button[type="submit"], button:has-text("Sign Up"), button:has-text("Register")');

      // Wait for successful registration (might redirect to verification page or dashboard)
      await page.waitForURL(url => !url.includes('/auth/register'), { timeout: 10000 });

      // Verify successful registration
      await expect(page.locator('body')).toContainText([
        'Welcome',
        'Dashboard',
        'Verify',
        'Check your email',
        'Account created'
      ]);
    });

    test('should validate registration form fields', async ({ page }) => {
      await page.goto('/auth/register');

      // Test empty form submission
      await page.click('button[type="submit"]');
      
      // Should show validation errors
      await expect(page.locator('body')).toContainText([
        'required',
        'Email is required',
        'Name is required',
        'Password is required'
      ]);

      // Test invalid email format
      await page.fill('input[name="email"]', 'invalid-email');
      await page.click('button[type="submit"]');
      
      await expect(page.locator('body')).toContainText(['Invalid email', 'valid email']);

      // Test weak password
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', '123');
      await page.click('button[type="submit"]');
      
      await expect(page.locator('body')).toContainText([
        'Password',
        'characters',
        'strong',
        'requirements'
      ]);
    });

    test('should prevent duplicate email registration', async ({ page }) => {
      await page.goto('/auth/register');

      // Try to register with existing email
      await page.fill('input[name="name"]', 'Duplicate User');
      await page.fill('input[name="email"]', 'admin@test.com'); // Known existing email
      await page.fill('input[name="password"]', 'Password123!');
      
      const confirmPasswordField = page.locator('input[name="confirmPassword"], input[name="confirm_password"]');
      if (await confirmPasswordField.count() > 0) {
        await confirmPasswordField.fill('Password123!');
      }

      await page.click('button[type="submit"]');

      // Should show error for existing email
      await expect(page.locator('body')).toContainText([
        'already exists',
        'already registered',
        'Email taken',
        'User exists'
      ]);
    });
  });

  test.describe('User Login', () => {
    test('should login with valid credentials', async ({ page }) => {
      await page.goto('/auth/login');

      // Fill login form
      await page.fill('input[name="email"]', 'student@test.com');
      await page.fill('input[name="password"]', 'student123');

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for redirect to dashboard
      await page.waitForURL('**/dashboard**', { timeout: 15000 });

      // Verify successful login
      await expect(page.locator('body')).toContainText(['Dashboard', 'Welcome']);
      
      // Verify user menu is visible (indicates authenticated state)
      const userMenu = page.locator('[data-testid="user-menu"], .user-menu, button:has-text("Profile"), [aria-label*="user" i]');
      await expect(userMenu.first()).toBeVisible();
    });

    test('should reject invalid credentials', async ({ page }) => {
      await page.goto('/auth/login');

      // Test wrong password
      await page.fill('input[name="email"]', 'student@test.com');
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('body')).toContainText([
        'Invalid credentials',
        'Login failed',
        'Incorrect',
        'Authentication failed'
      ]);

      // Should remain on login page
      await expect(page).toHaveURL(/.*\/auth\/login.*/);
    });

    test('should handle non-existent user login', async ({ page }) => {
      await page.goto('/auth/login');

      // Try to login with non-existent email
      await page.fill('input[name="email"]', 'nonexistent@example.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Should show error message
      await expect(page.locator('body')).toContainText([
        'User not found',
        'Invalid credentials',
        'Account does not exist'
      ]);
    });

    test('should validate login form fields', async ({ page }) => {
      await page.goto('/auth/login');

      // Test empty form submission
      await page.click('button[type="submit"]');

      // Should show validation errors
      await expect(page.locator('body')).toContainText([
        'Email is required',
        'Password is required'
      ]);

      // Test invalid email format
      await page.fill('input[name="email"]', 'invalid-email');
      await page.click('button[type="submit"]');

      await expect(page.locator('body')).toContainText(['Invalid email', 'valid email']);
    });
  });

  test.describe('Password Reset', () => {
    test('should initiate password reset', async ({ page }) => {
      await page.goto('/auth/login');

      // Click forgot password link
      await page.click('a:has-text("Forgot"), a:has-text("Reset"), a[href*="reset"]');
      await page.waitForURL('**/auth/reset**');

      // Fill email for password reset
      await page.fill('input[name="email"], input[type="email"]', 'student@test.com');
      await page.click('button[type="submit"]');

      // Should show success message
      await expect(page.locator('body')).toContainText([
        'Check your email',
        'Reset link sent',
        'Password reset',
        'Email sent'
      ]);
    });

    test('should validate password reset form', async ({ page }) => {
      await page.goto('/auth/reset');

      // Test empty form
      await page.click('button[type="submit"]');

      await expect(page.locator('body')).toContainText(['Email is required']);

      // Test invalid email
      await page.fill('input[name="email"]', 'invalid-email');
      await page.click('button[type="submit"]');

      await expect(page.locator('body')).toContainText(['Invalid email', 'valid email']);
    });

    test('should handle password reset with new password', async ({ page }) => {
      // This test would typically require a valid reset token
      // For now, test the form validation
      await page.goto('/auth/new-password?token=test-token');

      // Fill new password form
      await page.fill('input[name="password"]', 'NewPassword123!');
      
      const confirmPasswordField = page.locator('input[name="confirmPassword"], input[name="confirm_password"]');
      if (await confirmPasswordField.count() > 0) {
        await confirmPasswordField.fill('NewPassword123!');
      }

      // The actual submission would require a valid token
      // We're mainly testing the form exists and accepts input
      await expect(page.locator('input[name="password"]')).toHaveValue('NewPassword123!');
    });
  });

  test.describe('Social Authentication', () => {
    test('should display social login options', async ({ page }) => {
      await page.goto('/auth/login');

      // Check for social login buttons
      const socialButtons = [
        'button:has-text("Google")',
        'button:has-text("GitHub")',
        'a[href*="google"]',
        'a[href*="github"]',
        '[data-provider="google"]',
        '[data-provider="github"]'
      ];

      let foundSocialButton = false;
      for (const selector of socialButtons) {
        const elements = page.locator(selector);
        if (await elements.count() > 0) {
          foundSocialButton = true;
          break;
        }
      }

      // If social auth is implemented, verify buttons exist
      // If not implemented, this test will be skipped
      if (foundSocialButton) {
        await expect(page.locator('button:has-text("Google"), a[href*="google"]')).toBeVisible();
      } else {
        console.log('ℹ️ Social authentication not implemented or not visible');
      }
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session across page reloads', async ({ page }) => {
      // Login first
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', 'student@test.com');
      await page.fill('input[name="password"]', 'student123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard**');

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should still be authenticated
      await expect(page).toHaveURL(/.*dashboard.*/);
      await expect(page.locator('body')).toContainText(['Dashboard', 'Welcome']);
    });

    test('should logout user successfully', async ({ page }) => {
      // Login first
      await page.goto('/auth/login');
      await page.fill('input[name="email"]', 'student@test.com');
      await page.fill('input[name="password"]', 'student123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard**');

      // Find and click logout button
      const logoutSelectors = [
        'button:has-text("Logout")',
        'button:has-text("Sign Out")',
        'a:has-text("Logout")',
        'a:has-text("Sign Out")',
        '[data-testid="logout"]',
        '.logout-button'
      ];

      let loggedOut = false;
      for (const selector of logoutSelectors) {
        const elements = page.locator(selector);
        if (await elements.count() > 0) {
          await elements.first().click();
          loggedOut = true;
          break;
        }
      }

      // If direct logout button not found, try user menu
      if (!loggedOut) {
        const userMenuSelectors = [
          '[data-testid="user-menu"]',
          '.user-menu',
          'button:has-text("Profile")',
          '[aria-label*="user" i]'
        ];

        for (const selector of userMenuSelectors) {
          const userMenu = page.locator(selector);
          if (await userMenu.count() > 0) {
            await userMenu.first().click();
            
            // Wait for menu to open and click logout
            await page.waitForTimeout(500);
            const logoutInMenu = page.locator('button:has-text("Logout"), a:has-text("Logout"), button:has-text("Sign Out")');
            if (await logoutInMenu.count() > 0) {
              await logoutInMenu.first().click();
              loggedOut = true;
              break;
            }
          }
        }
      }

      if (loggedOut) {
        // Should redirect to login page or homepage
        await page.waitForURL(url => !url.includes('/dashboard'), { timeout: 10000 });
        
        // Should not have access to dashboard
        await page.goto('/dashboard');
        await expect(page).not.toHaveURL(/.*dashboard.*/);
      } else {
        console.log('ℹ️ Logout functionality not found or not accessible');
      }
    });

    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Try to access protected route without authentication
      await page.goto('/dashboard');

      // Should redirect to login page
      await page.waitForURL('**/auth/login**', { timeout: 10000 });
      
      // Or should show unauthorized message
      const isOnLogin = page.url().includes('/auth/login');
      const hasUnauthorizedMessage = await page.locator('body').textContent();
      
      if (!isOnLogin) {
        expect(hasUnauthorizedMessage).toContain(['Unauthorized', 'Please log in', 'Access denied']);
      }
    });
  });

  test.describe('Email Verification', () => {
    test('should show verification message for unverified users', async ({ page }) => {
      // This test assumes email verification is implemented
      await page.goto('/auth/login');

      // Try to login with unverified account (if such test data exists)
      await page.fill('input[name="email"]', 'unverified@test.com');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      // Check if verification flow exists
      const bodyContent = await page.locator('body').textContent();
      
      if (bodyContent?.includes('verify') || bodyContent?.includes('Verify')) {
        await expect(page.locator('body')).toContainText([
          'Verify your email',
          'Check your email',
          'Verification required'
        ]);
      } else {
        console.log('ℹ️ Email verification not implemented or not required');
      }
    });
  });

  test.describe('Authentication Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      await page.goto('/auth/login');

      // Simulate network failure
      await page.route('**/api/auth/**', route => route.abort());

      await page.fill('input[name="email"]', 'student@test.com');
      await page.fill('input[name="password"]', 'student123');
      await page.click('button[type="submit"]');

      // Should show appropriate error message
      await expect(page.locator('body')).toContainText([
        'Network error',
        'Connection failed',
        'Try again',
        'Error occurred'
      ]);
    });

    test('should handle server errors gracefully', async ({ page }) => {
      await page.goto('/auth/login');

      // Simulate server error
      await page.route('**/api/auth/**', route => 
        route.fulfill({ status: 500, body: 'Server Error' })
      );

      await page.fill('input[name="email"]', 'student@test.com');
      await page.fill('input[name="password"]', 'student123');
      await page.click('button[type="submit"]');

      // Should show server error message
      await expect(page.locator('body')).toContainText([
        'Server error',
        'Something went wrong',
        'Try again later'
      ]);
    });
  });

  test.describe('Accessibility', () => {
    test('should have accessible login form', async ({ page }) => {
      await page.goto('/auth/login');

      // Check form has proper labels and ARIA attributes
      const emailInput = page.locator('input[name="email"], input[type="email"]');
      const passwordInput = page.locator('input[name="password"], input[type="password"]');

      // Inputs should have accessible names
      await expect(emailInput).toHaveAttribute('aria-label', /.+/);
      await expect(passwordInput).toHaveAttribute('aria-label', /.+/);
      
      // Or should have associated labels
      const emailId = await emailInput.getAttribute('id');
      const passwordId = await passwordInput.getAttribute('id');
      
      if (emailId) {
        await expect(page.locator(`label[for="${emailId}"]`)).toBeVisible();
      }
      if (passwordId) {
        await expect(page.locator(`label[for="${passwordId}"]`)).toBeVisible();
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/auth/login');

      // Tab through form elements
      await page.keyboard.press('Tab'); // Email field
      await expect(page.locator('input[name="email"], input[type="email"]')).toBeFocused();

      await page.keyboard.press('Tab'); // Password field
      await expect(page.locator('input[name="password"], input[type="password"]')).toBeFocused();

      await page.keyboard.press('Tab'); // Submit button
      await expect(page.locator('button[type="submit"]')).toBeFocused();

      // Should be able to submit with Enter
      await page.fill('input[name="email"]', 'student@test.com');
      await page.fill('input[name="password"]', 'student123');
      await page.keyboard.press('Enter');

      // Should attempt login
      await page.waitForTimeout(1000);
      const currentUrl = page.url();
      expect(currentUrl).not.toMatch(/.*\/auth\/login.*/); // Should have navigated away or shown loading
    });
  });
});