const { chromium } = require('playwright');
const fs = require('fs');

async function testAdminLogin() {
  console.log('🚀 Starting comprehensive admin login test...');

  const browser = await chromium.launch({
    headless: false, // Show browser for debugging
    slowMo: 500, // Slow down actions to see what's happening
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  // Listen for console messages
  page.on('console', msg => console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`));

  // Listen for page errors
  page.on('pageerror', error => console.log(`[PAGE ERROR] ${error.message}`));

  try {
    console.log('📍 Step 1: Navigating to admin login page...');
    await page.goto('http://localhost:3000/admin/auth/login', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Take screenshot of login page
    await page.screenshot({ path: 'step1-login-page.png', fullPage: true });
    console.log('📸 Screenshot saved: step1-login-page.png');

    console.log('⏳ Step 2: Waiting for form elements...');
    await page.waitForSelector('input[name="email"]', { timeout: 10000 });
    await page.waitForSelector('input[name="password"]', { timeout: 10000 });
    await page.waitForSelector('button[type="submit"]', { timeout: 10000 });

    console.log('✅ Form elements found!');

    console.log('📝 Step 3: Filling in credentials...');
    await page.fill('input[name="email"]', 'admin@taxomind.com');
    await page.screenshot({ path: 'step2-email-filled.png', fullPage: true });
    console.log('   - Email filled: admin@taxomind.com');

    await page.fill('input[name="password"]', 'password123');
    await page.screenshot({ path: 'step3-password-filled.png', fullPage: true });
    console.log('   - Password filled: password123');

    console.log('🖱️  Step 4: Clicking submit button...');

    // Wait for navigation or error message
    const submitButton = await page.locator('button[type="submit"]');

    // Click and wait for either navigation or error
    const [response] = await Promise.all([
      page.waitForResponse(response =>
        response.url().includes('/admin/auth/login') && response.request().method() === 'POST',
        { timeout: 10000 }
      ).catch(() => null),
      submitButton.click(),
    ]);

    console.log('⏳ Waiting for response...');
    await page.waitForTimeout(3000);

    // Take screenshot after submit
    await page.screenshot({ path: 'step4-after-submit.png', fullPage: true });
    console.log('📸 Screenshot saved: step4-after-submit.png');

    // Check current URL
    const currentUrl = page.url();
    console.log(`🔗 Current URL: ${currentUrl}`);

    // Check for error messages
    const errorElement = await page.locator('[role="alert"], .text-red-500, .text-red-400').first();
    const errorVisible = await errorElement.isVisible().catch(() => false);

    if (errorVisible) {
      const errorText = await errorElement.textContent();
      console.log(`❌ Error message displayed: ${errorText}`);
    }

    // Check for success message
    const successElement = await page.locator('.text-green-500, .text-green-400').first();
    const successVisible = await successElement.isVisible().catch(() => false);

    if (successVisible) {
      const successText = await successElement.textContent();
      console.log(`✅ Success message: ${successText}`);
    }

    // Wait a bit more to see if redirect happens
    console.log('⏳ Waiting for potential redirect...');
    await page.waitForTimeout(3000);

    const finalUrl = page.url();
    console.log(`🔗 Final URL: ${finalUrl}`);

    // Take final screenshot
    await page.screenshot({ path: 'step5-final-state.png', fullPage: true });
    console.log('📸 Final screenshot saved: step5-final-state.png');

    // Check if we're on the admin dashboard
    if (finalUrl.includes('/dashboard/admin')) {
      console.log('✅ ✅ ✅ LOGIN SUCCESSFUL! Redirected to admin dashboard!');
    } else if (finalUrl.includes('/admin/auth/login')) {
      console.log('❌ LOGIN FAILED - Still on login page');

      // Try to get more info about the failure
      const pageContent = await page.content();
      fs.writeFileSync('page-content-after-login.html', pageContent);
      console.log('📄 Page content saved to: page-content-after-login.html');
    } else {
      console.log(`⚠️  Unexpected redirect to: ${finalUrl}`);
    }

    // Get network logs if available
    console.log('\n📊 Network Activity:');
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('admin')) {
        requests.push({
          url: request.url(),
          method: request.method()
        });
      }
    });

    console.log('\n🏁 Test completed! Check the screenshots for details.');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
    console.log('📸 Error screenshot saved');
    throw error;
  } finally {
    await page.waitForTimeout(2000); // Keep browser open for a bit
    await browser.close();
  }
}

testAdminLogin().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
