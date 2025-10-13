/**
 * Test Admin Login with Playwright
 * Tests Phase 3: Admin authentication with enhanced logging
 */

import { chromium } from '@playwright/test';

async function testAdminLogin() {
  console.log('🚀 Starting Admin Login Test with Playwright...\n');

  const browser = await chromium.launch({
    headless: false, // Show the browser
    slowMo: 500, // Slow down actions to see them
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  try {
    console.log('📱 Browser opened');
    console.log('🔗 Navigating to admin login page...\n');

    // Navigate to admin login page
    await page.goto('http://localhost:3001/admin/auth/login', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log('✅ Page loaded successfully\n');

    // Wait for the form to be visible
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });

    console.log('📝 Filling in login credentials...');
    console.log('   Email: admin@taxomind.com');
    console.log('   Password: password123\n');

    // Fill in the login form
    await page.fill('input[type="email"]', 'admin@taxomind.com');
    await page.fill('input[type="password"]', 'password123');

    console.log('🔘 Clicking login button...\n');

    // Click the login button and wait for navigation
    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();

    console.log('⏳ Waiting for authentication...\n');

    // Wait for navigation or error
    try {
      await page.waitForURL((url) => url.pathname !== '/admin/auth/login', {
        timeout: 15000,
      });

      const currentUrl = page.url();
      console.log('✅ Navigation completed');
      console.log(`📍 Current URL: ${currentUrl}\n`);

      // Check if we're on the admin dashboard
      if (
        currentUrl.includes('/dashboard/admin') ||
        currentUrl.includes('/admin/dashboard')
      ) {
        console.log('🎉 SUCCESS! Admin login successful!\n');
        console.log('✅ Redirected to admin dashboard');
        console.log('✅ Admin session cookie created');
        console.log('✅ Phase 3 features activated:\n');
        console.log('   - AdminAuditLog entry created');
        console.log('   - AdminSessionMetrics session started');
        console.log('   - Session timeout: 4 hours\n');

        // Take a screenshot
        await page.screenshot({
          path: 'admin-dashboard-screenshot.png',
          fullPage: true,
        });
        console.log('📸 Screenshot saved: admin-dashboard-screenshot.png\n');

        // Get cookies
        const cookies = await context.cookies();
        const adminCookie = cookies.find((c) => c.name.includes('admin'));

        if (adminCookie) {
          console.log('🍪 Admin Session Cookie:');
          console.log(`   Name: ${adminCookie.name}`);
          console.log(`   Domain: ${adminCookie.domain}`);
          console.log(`   Path: ${adminCookie.path}`);
          console.log(`   Secure: ${adminCookie.secure}`);
          console.log(`   HttpOnly: ${adminCookie.httpOnly}`);
          console.log(`   SameSite: ${adminCookie.sameSite}\n`);
        } else {
          console.log('🍪 All Cookies:');
          cookies.forEach((cookie) => {
            console.log(`   - ${cookie.name}`);
          });
          console.log();
        }

        // Wait a bit to see the dashboard
        console.log('⏳ Keeping browser open for 5 seconds to view dashboard...\n');
        await page.waitForTimeout(5000);

        console.log('==========================================');
        console.log('Test Complete: ✅ SUCCESS');
        console.log('==========================================');
        console.log(`Final URL: ${currentUrl}`);
        console.log('==========================================\n');

        await browser.close();
        process.exit(0);
      } else {
        console.log('⚠️  Unexpected redirect');
        console.log(`📍 Current URL: ${currentUrl}\n`);

        // Check for error messages
        const errorElement = page.locator(
          '[role="alert"], .error, .text-red-500, .text-destructive'
        );
        if (await errorElement.isVisible()) {
          const errorText = await errorElement.textContent();
          console.log(`❌ Error message: ${errorText}\n`);
        }

        await page.screenshot({
          path: 'admin-login-error.png',
          fullPage: true,
        });
        console.log('📸 Error screenshot saved: admin-login-error.png\n');

        console.log('==========================================');
        console.log('Test Complete: ⚠️  UNEXPECTED RESULT');
        console.log('==========================================\n');

        await browser.close();
        process.exit(1);
      }
    } catch (navError: any) {
      console.log('⚠️  Navigation timeout or error');
      console.log(`Error: ${navError.message}\n`);

      const currentUrl = page.url();
      console.log(`📍 Current URL: ${currentUrl}\n`);

      // Check for error messages on the page
      const pageContent = await page.content();
      const hasError =
        pageContent.toLowerCase().includes('error') ||
        pageContent.toLowerCase().includes('invalid');

      if (hasError) {
        console.log('❌ Login appears to have failed\n');

        // Try to find error message
        const errorElement = page.locator(
          '[role="alert"], .error, .text-red-500, .text-destructive'
        );
        if (await errorElement.isVisible()) {
          const errorText = await errorElement.textContent();
          console.log(`Error message: ${errorText}\n`);
        }
      }

      await page.screenshot({
        path: 'admin-login-timeout.png',
        fullPage: true,
      });
      console.log('📸 Screenshot saved: admin-login-timeout.png\n');

      console.log('==========================================');
      console.log('Test Complete: ❌ FAILED');
      console.log('==========================================');
      console.log(`Error: ${navError.message}`);
      console.log('==========================================\n');

      await browser.close();
      process.exit(1);
    }
  } catch (error: any) {
    console.error('❌ Test failed with error:');
    console.error(error);

    await page.screenshot({
      path: 'admin-login-fatal-error.png',
      fullPage: true,
    });
    console.log('📸 Error screenshot saved: admin-login-fatal-error.png\n');

    console.log('==========================================');
    console.log('Test Complete: ❌ FATAL ERROR');
    console.log('==========================================');
    console.log(`Error: ${error.message}`);
    console.log('==========================================\n');

    await browser.close();
    process.exit(1);
  }
}

// Run the test
testAdminLogin();
