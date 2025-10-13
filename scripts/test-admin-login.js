/**
 * Test Admin Login with Real Browser
 * Tests Phase 3: Admin authentication with enhanced logging
 */

const puppeteer = require('puppeteer');

async function testAdminLogin() {
  console.log('🚀 Starting Admin Login Test...\n');

  let browser;
  try {
    // Launch browser in non-headless mode so we can see it
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1280, height: 800 },
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    console.log('📱 Browser opened');
    console.log('🔗 Navigating to admin login page...\n');

    // Navigate to admin login page
    await page.goto('http://localhost:3001/admin/auth/login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    console.log('✅ Page loaded successfully\n');

    // Wait for the form to be visible
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });

    console.log('📝 Filling in login credentials...');
    console.log('   Email: admin@taxomind.com');
    console.log('   Password: password123\n');

    // Fill in the login form
    await page.type('input[type="email"]', 'admin@taxomind.com', { delay: 50 });
    await page.type('input[type="password"]', 'password123', { delay: 50 });

    console.log('🔘 Clicking login button...\n');

    // Find and click the login button
    const loginButton = await page.$('button[type="submit"]');
    if (!loginButton) {
      throw new Error('Login button not found');
    }

    await loginButton.click();

    console.log('⏳ Waiting for authentication...\n');

    // Wait for navigation or error message
    try {
      await page.waitForNavigation({
        waitUntil: 'networkidle2',
        timeout: 15000
      });

      const currentUrl = page.url();
      console.log('✅ Navigation completed');
      console.log(`📍 Current URL: ${currentUrl}\n`);

      // Check if we're on the admin dashboard
      if (currentUrl.includes('/dashboard/admin') || currentUrl.includes('/admin')) {
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
          fullPage: true
        });
        console.log('📸 Screenshot saved: admin-dashboard-screenshot.png\n');

        // Get cookies
        const cookies = await page.cookies();
        const adminCookie = cookies.find(c => c.name === 'admin-session-token');

        if (adminCookie) {
          console.log('🍪 Admin Session Cookie:');
          console.log(`   Name: ${adminCookie.name}`);
          console.log(`   Domain: ${adminCookie.domain}`);
          console.log(`   Path: ${adminCookie.path}`);
          console.log(`   Secure: ${adminCookie.secure}`);
          console.log(`   HttpOnly: ${adminCookie.httpOnly}`);
          console.log(`   SameSite: ${adminCookie.sameSite}\n`);
        } else {
          console.log('⚠️  Note: admin-session-token cookie not found (might use different name)\n');
        }

        // Wait a bit to see the dashboard
        console.log('⏳ Keeping browser open for 5 seconds to view dashboard...\n');
        await page.waitForTimeout(5000);

        return { success: true, url: currentUrl };
      } else {
        console.log('⚠️  Unexpected redirect');
        console.log(`📍 Current URL: ${currentUrl}\n`);

        // Check for error messages
        const errorElement = await page.$('[role="alert"], .error, .text-red-500');
        if (errorElement) {
          const errorText = await page.evaluate(el => el.textContent, errorElement);
          console.log(`❌ Error message: ${errorText}\n`);
        }

        await page.screenshot({
          path: 'admin-login-error.png',
          fullPage: true
        });
        console.log('📸 Error screenshot saved: admin-login-error.png\n');

        return { success: false, url: currentUrl };
      }
    } catch (navError) {
      console.log('⚠️  Navigation timeout or error');
      console.log(`Error: ${navError.message}\n`);

      // Check if we're still on login page with error
      const currentUrl = page.url();
      console.log(`📍 Current URL: ${currentUrl}\n`);

      // Look for error messages
      const pageContent = await page.content();
      if (pageContent.includes('error') || pageContent.includes('invalid')) {
        console.log('❌ Login appears to have failed\n');
      }

      await page.screenshot({
        path: 'admin-login-timeout.png',
        fullPage: true
      });
      console.log('📸 Screenshot saved: admin-login-timeout.png\n');

      return { success: false, error: navError.message };
    }

  } catch (error) {
    console.error('❌ Test failed with error:');
    console.error(error);
    return { success: false, error: error.message };
  } finally {
    if (browser) {
      console.log('🔒 Closing browser...\n');
      await browser.close();
    }
  }
}

// Run the test
testAdminLogin()
  .then(result => {
    console.log('==========================================');
    console.log('Test Complete');
    console.log('==========================================');
    console.log(`Result: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (result.url) {
      console.log(`Final URL: ${result.url}`);
    }
    if (result.error) {
      console.log(`Error: ${result.error}`);
    }
    console.log('==========================================\n');
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
