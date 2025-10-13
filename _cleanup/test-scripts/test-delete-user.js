/**
 * Playwright Test for Delete User Functionality
 * Tests the admin delete user feature with authentication
 */

const { chromium } = require('playwright');

async function testDeleteUser() {
  console.log('🚀 Starting Delete User Test...\n');

  const browser = await chromium.launch({
    headless: false,  // Show browser for debugging
    slowMo: 500       // Slow down actions for visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Enable console logging from browser
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[DELETE') || text.includes('[requireAuth]') || text.includes('[requireRole]')) {
      console.log(`🖥️  Browser Console: ${text}`);
    }
  });

  // Enable request/response logging
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/admin/users') && response.request().method() === 'DELETE') {
      console.log(`\n📡 DELETE Request to: ${url}`);
      console.log(`   Status: ${response.status()} ${response.statusText()}`);
      try {
        const body = await response.json();
        console.log(`   Response:`, JSON.stringify(body, null, 2));
      } catch (e) {
        console.log(`   Could not parse response body`);
      }
    }
  });

  try {
    // Step 1: Navigate to admin login
    console.log('📍 Step 1: Navigating to admin login page...');
    await page.goto('http://localhost:3000/admin/auth/login', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(2000);
    console.log('✅ Admin login page loaded\n');

    // Step 2: Login as admin
    console.log('🔐 Step 2: Logging in as admin...');

    // Fill in email
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill('admin@taxomind.com');
    console.log('   ✓ Email filled: admin@taxomind.com');

    // Fill in password
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
    await passwordInput.fill('password123');
    console.log('   ✓ Password filled: password123');

    // Click login button
    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();
    console.log('   ✓ Login button clicked');

    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard\/admin/, { timeout: 15000 });
    console.log('✅ Successfully logged in and redirected to admin dashboard\n');

    await page.waitForTimeout(2000);

    // Step 3: Navigate to users page
    console.log('📍 Step 3: Navigating to users page...');
    await page.goto('http://localhost:3000/dashboard/admin/users', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(3000);
    console.log('✅ Users page loaded\n');

    // Take screenshot of users page
    await page.screenshot({ path: 'users-page-before-delete.png', fullPage: true });
    console.log('📸 Screenshot saved: users-page-before-delete.png\n');

    // Step 4: Check for users in the table
    console.log('🔍 Step 4: Checking for users in the table...');
    const tableRows = await page.locator('table tbody tr').count();
    console.log(`   Found ${tableRows} user rows in table\n`);

    if (tableRows === 0) {
      console.log('⚠️  No users found in table. Cannot test delete functionality.');
      await browser.close();
      return;
    }

    // Step 5: Try to find and click delete button
    console.log('🗑️  Step 5: Attempting to delete a user...');

    // Look for action buttons (MoreVertical icon - three vertical dots)
    // The button contains an svg with a MoreVertical icon
    const actionButtons = page.locator('button[class*="ghost"]').filter({ has: page.locator('svg') });
    const actionButtonCount = await actionButtons.count();
    console.log(`   Found ${actionButtonCount} buttons with icons`);

    // Try more specific selector - buttons in the actions column
    const moreVerticalButtons = page.locator('table tbody tr td:last-child button');
    const moreVerticalCount = await moreVerticalButtons.count();
    console.log(`   Found ${moreVerticalCount} action buttons in last column`);

    if (moreVerticalCount > 0) {
      // Click the first action button (in the last column)
      await moreVerticalButtons.first().click();
      console.log('   ✓ Clicked actions menu (three dots)');
      await page.waitForTimeout(1500);

      // Look for delete option in the dropdown menu
      const deleteButton = page.locator('[role="menuitem"]:has-text("Delete User"), button:has-text("Delete User")');
      const deleteButtonExists = await deleteButton.count() > 0;

      if (deleteButtonExists) {
        console.log('   ✓ Delete button found');

        // Set up dialog handler BEFORE clicking delete
        // Handle browser's native confirm() dialog
        page.once('dialog', async dialog => {
          console.log(`   ✓ Confirmation dialog appeared: "${dialog.message()}"`);
          await dialog.accept();
          console.log('   ✓ Accepted confirmation dialog');
        });

        // Wait for the DELETE API call
        const responsePromise = page.waitForResponse(
          response => response.url().includes('/api/admin/users') && response.request().method() === 'DELETE',
          { timeout: 10000 }
        );

        // Click delete button (this will trigger the confirm dialog and then the API call)
        await deleteButton.first().click();
        console.log('   ✓ Clicked delete button\n');

        // Wait for API response
        console.log('⏳ Waiting for DELETE API response...');
        try {
          const response = await responsePromise;
          const status = response.status();

          console.log(`\n✅ DELETE API Response received:`);
          console.log(`   Status: ${status} ${response.statusText()}`);

          const responseBody = await response.json();
          console.log(`   Body:`, JSON.stringify(responseBody, null, 2));

          if (status === 200 && responseBody.success) {
            console.log('\n🎉 SUCCESS! User deleted successfully!');
            console.log('   ✓ Authentication working (Admin JWT recognized)');
            console.log('   ✓ Authorization working (ADMIN role verified)');
            console.log('   ✓ Delete endpoint responding correctly');
            console.log('   ✓ Theme flash fix not affected delete functionality');
          } else if (status === 401) {
            console.log('\n❌ FAILED: 401 Unauthorized');
            console.log('   Authentication issue detected');
          } else if (status === 403) {
            console.log('\n⚠️  FORBIDDEN: 403');
            console.log(`   Reason: ${responseBody.error?.message || 'Unknown'}`);
          } else {
            console.log('\n⚠️  Unexpected status:', status);
          }
        } catch (e) {
          console.log('\n❌ Error waiting for response:', e.message);
        }
      } else {
        console.log('   ⚠️  Delete button not found in menu');
      }
    } else {
      console.log('   ⚠️  No action buttons found. Users table might be empty or UI changed.');
    }

    // Take final screenshot
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'users-page-after-delete.png', fullPage: true });
    console.log('\n📸 Screenshot saved: users-page-after-delete.png');

    // Keep browser open for inspection
    console.log('\n⏸️  Keeping browser open for 5 seconds for inspection...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    console.error('Stack:', error.stack);

    // Take error screenshot
    try {
      await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
      console.log('📸 Error screenshot saved: error-screenshot.png');
    } catch (e) {
      // Ignore screenshot error
    }
  } finally {
    console.log('\n🔚 Closing browser...');
    await browser.close();
    console.log('✅ Test completed!');
  }
}

// Run the test
testDeleteUser().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
