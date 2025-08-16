import { test as setup, expect } from '@playwright/test';
import path from 'path';

/**
 * Authentication setup for E2E tests
 * Creates and saves authentication states for different user roles
 */

const adminAuthFile = 'e2e/auth/admin-auth.json';
const teacherAuthFile = 'e2e/auth/teacher-auth.json';
const studentAuthFile = 'e2e/auth/student-auth.json';

setup.describe('Authentication Setup', () => {
  setup('authenticate as admin', async ({ page }) => {
    console.log('🔐 Setting up admin authentication...');
    
    // Navigate to login page
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the login page
    await expect(page.locator('h1, h2')).toContainText(['Sign In', 'Login', 'Log In']);
    
    // Fill login form with admin credentials
    await page.fill('input[name="email"], input[type="email"]', 'admin@test.com');
    await page.fill('input[name="password"], input[type="password"]', 'admin123');
    
    // Submit the form
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
    await submitButton.click();
    
    // Wait for successful login (should redirect to dashboard)
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    
    // Verify we're logged in by checking for admin-specific elements
    await expect(page.locator('body')).toContainText(['Dashboard', 'Welcome', 'Admin']);
    
    // Save authenticated state
    await page.context().storageState({ path: adminAuthFile });
    
    console.log('✅ Admin authentication setup complete');
  });

  setup('authenticate as teacher', async ({ page }) => {
    console.log('🔐 Setting up teacher authentication...');
    
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Verify login page
    await expect(page.locator('h1, h2')).toContainText(['Sign In', 'Login', 'Log In']);
    
    // Fill teacher credentials
    await page.fill('input[name="email"], input[type="email"]', 'teacher@test.com');
    await page.fill('input[name="password"], input[type="password"]', 'teacher123');
    
    // Submit form
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
    await submitButton.click();
    
    // Wait for successful login
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    
    // Verify teacher dashboard
    await expect(page.locator('body')).toContainText(['Dashboard', 'My Courses', 'Create Course']);
    
    // Save authenticated state
    await page.context().storageState({ path: teacherAuthFile });
    
    console.log('✅ Teacher authentication setup complete');
  });

  setup('authenticate as student', async ({ page }) => {
    console.log('🔐 Setting up student authentication...');
    
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Verify login page
    await expect(page.locator('h1, h2')).toContainText(['Sign In', 'Login', 'Log In']);
    
    // Fill student credentials
    await page.fill('input[name="email"], input[type="email"]', 'student@test.com');
    await page.fill('input[name="password"], input[type="password"]', 'student123');
    
    // Submit form
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")').first();
    await submitButton.click();
    
    // Wait for successful login
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
    
    // Verify student dashboard
    await expect(page.locator('body')).toContainText(['Dashboard', 'My Learning', 'Browse Courses']);
    
    // Save authenticated state
    await page.context().storageState({ path: studentAuthFile });
    
    console.log('✅ Student authentication setup complete');
  });

  setup('verify authentication files created', async ({ page }) => {
    console.log('🔍 Verifying authentication files...');
    
    const fs = await import('fs/promises');
    
    // Check if all auth files were created
    const files = [adminAuthFile, teacherAuthFile, studentAuthFile];
    
    for (const file of files) {
      try {
        const stats = await fs.stat(file);
        expect(stats.isFile()).toBe(true);
        console.log(`✅ Authentication file exists: ${file}`);
        
        // Verify file has content
        const content = await fs.readFile(file, 'utf-8');
        const authData = JSON.parse(content);
        expect(authData).toHaveProperty('cookies');
        expect(authData).toHaveProperty('origins');
        
      } catch (error: any) {
        console.error(`❌ Authentication file missing or invalid: ${file}`, error);
        throw error;
      }
    }
    
    console.log('✅ All authentication files verified');
  });
});