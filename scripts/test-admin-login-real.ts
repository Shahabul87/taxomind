import { chromium } from '@playwright/test';

async function testAdminLogin() {
  console.log('\n🚀 Starting REAL Admin Login Test with Playwright...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('📱 Browser opened');
    console.log('🔗 Navigating to: http://localhost:3001/admin/auth/login\n');

    await page.goto('http://localhost:3001/admin/auth/login', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log('✅ Page loaded\n');
    console.log('📸 Taking screenshot of login page...');
    await page.screenshot({ path: 'step1-login-page.png', fullPage: true });
    console.log('✅ Saved: step1-login-page.png\n');

    // Wait for the form to be ready
    console.log('⏳ Waiting for form to load...');
    await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 15000 });
    await page.waitForSelector('input[type="password"]', { state: 'visible', timeout: 15000 });
    await page.waitForSelector('button[type="submit"]', { state: 'visible', timeout: 15000 });
    console.log('✅ Form is ready\n');

    // Fill email
    console.log('📝 Filling email: admin@taxomind.com');
    await page.fill('input[type="email"]', 'admin@taxomind.com');
    await page.waitForTimeout(500);

    console.log('📸 Taking screenshot after email...');
    await page.screenshot({ path: 'step2-email-filled.png', fullPage: true });
    console.log('✅ Saved: step2-email-filled.png\n');

    // Fill password
    console.log('📝 Filling password: password123');
    await page.fill('input[type="password"]', 'password123');
    await page.waitForTimeout(500);

    console.log('📸 Taking screenshot after password...');
    await page.screenshot({ path: 'step3-password-filled.png', fullPage: true });
    console.log('✅ Saved: step3-password-filled.png\n');

    // Click login button
    console.log('🔘 Clicking "Admin Sign In" button...\n');
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    console.log('⏳ Waiting for authentication response...\n');

    // Wait for either navigation or error
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}\n`);

    // Take screenshot after login attempt
    console.log('📸 Taking screenshot after login...');
    await page.screenshot({ path: 'step4-after-login.png', fullPage: true });
    console.log('✅ Saved: step4-after-login.png\n');

    // Check if we successfully logged in
    if (currentUrl.includes('/dashboard/admin') || currentUrl.includes('/admin/dashboard')) {
      console.log('🎉 SUCCESS! Login successful!\n');
      console.log('✅ Redirected to admin dashboard');
      console.log('✅ URL:', currentUrl, '\n');

      // Get cookies
      const cookies = await context.cookies();
      console.log('🍪 Cookies after login:');
      cookies.forEach(cookie => {
        console.log(`   - ${cookie.name}: ${cookie.domain}${cookie.path}`);
      });
      console.log();

      const adminCookie = cookies.find(c => c.name.toLowerCase().includes('admin') || c.name.includes('session'));
      if (adminCookie) {
        console.log('✅ Admin session cookie found:');
        console.log(`   Name: ${adminCookie.name}`);
        console.log(`   Secure: ${adminCookie.secure}`);
        console.log(`   HttpOnly: ${adminCookie.httpOnly}`);
        console.log(`   SameSite: ${adminCookie.sameSite}\n`);
      }

      console.log('⏳ Keeping browser open for 10 seconds to view dashboard...\n');
      await page.waitForTimeout(10000);

      console.log('==========================================');
      console.log('✅ TEST PASSED');
      console.log('==========================================\n');
      await browser.close();
      process.exit(0);
    } else {
      // Check for error messages
      console.log('⚠️  Still on login page or unexpected location\n');

      const errorSelectors = [
        '[role="alert"]',
        '.text-red-400',
        '.text-red-500',
        '.text-destructive',
        '[class*="error"]'
      ];

      for (const selector of errorSelectors) {
        const errorElement = page.locator(selector).first();
        if (await errorElement.isVisible()) {
          const errorText = await errorElement.textContent();
          console.log(`❌ Error found: ${errorText}\n`);
        }
      }

      console.log('⏳ Keeping browser open for 10 seconds for inspection...\n');
      await page.waitForTimeout(10000);

      console.log('==========================================');
      console.log('❌ TEST FAILED - Not redirected to dashboard');
      console.log('==========================================\n');
      await browser.close();
      process.exit(1);
    }

  } catch (error: any) {
    console.error('\n❌ Test failed with error:');
    console.error(error.message);
    console.error();

    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
    console.log('📸 Error screenshot saved: error-screenshot.png\n');

    console.log('⏳ Keeping browser open for 10 seconds...\n');
    await page.waitForTimeout(10000);

    await browser.close();
    process.exit(1);
  }
}

testAdminLogin();
