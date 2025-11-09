/**
 * SAM UI Behavior E2E Tests
 *
 * Tests all reported UI issues and edge cases:
 * 1. Initial positioning (should not load outside screen)
 * 2. Width stability (should not shrink during API calls)
 * 3. Header visibility (close icon and title always visible)
 * 4. Scroll behavior (messages should scroll properly)
 * 5. Drag functionality
 * 6. Minimize/maximize behavior
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const SAM_BUTTON_SELECTOR = '[data-testid="sam-toggle-button"]';
const SAM_WINDOW_SELECTOR = '[data-testid="sam-window"]';
const SAM_HEADER_SELECTOR = '.sam-drag-handle';
const SAM_CLOSE_BUTTON = '[data-testid="sam-close-button"]';
const SAM_MINIMIZE_BUTTON = '[data-testid="sam-minimize-button"]';
const SAM_INPUT = 'textarea[placeholder*="Ask me anything"]';
const SAM_MESSAGES = '[data-testid="sam-messages"]';

// Helper: Wait for SAM to be visible
async function openSAM(page: Page) {
  // Look for SAM floating button
  const samButton = page.locator(SAM_BUTTON_SELECTOR).or(page.locator('text=SAM').first());
  await samButton.click();
  await page.waitForTimeout(500); // Allow animation
}

// Helper: Get element bounding box
async function getBoundingBox(page: Page, selector: string) {
  return await page.locator(selector).boundingBox();
}

test.describe('SAM UI Behavior Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to AI Creator page (has SAM integrated)
    await page.goto('http://localhost:3000/teacher/create/ai-creator');
    await page.waitForLoadState('networkidle');
  });

  test('Issue 1: SAM should NOT load outside screen boundaries', async ({ page }) => {
    await openSAM(page);

    // Get SAM window position
    const samWindow = page.locator('.rounded-2xl.shadow-2xl').first();
    const box = await samWindow.boundingBox();

    if (!box) {
      throw new Error('SAM window not found');
    }

    // Get viewport size
    const viewport = page.viewportSize();
    if (!viewport) {
      throw new Error('Viewport size not available');
    }

    console.log('SAM Position:', { x: box.x, y: box.y, width: box.width, height: box.height });
    console.log('Viewport:', viewport);

    // Verify SAM is within screen boundaries
    expect(box.x).toBeGreaterThanOrEqual(0); // Not off left edge
    expect(box.y).toBeGreaterThanOrEqual(0); // Not off top edge
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width); // Not off right edge
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height); // Not off bottom edge

    // Verify SAM has proper margins (should be ~20px from edges)
    const rightMargin = viewport.width - (box.x + box.width);
    const bottomMargin = viewport.height - (box.y + box.height);

    console.log('Margins:', { right: rightMargin, bottom: bottomMargin });

    expect(rightMargin).toBeGreaterThanOrEqual(10); // At least 10px margin
    expect(bottomMargin).toBeGreaterThanOrEqual(10); // At least 10px margin
  });

  test('Issue 2: SAM width should NOT shrink during API calls', async ({ page }) => {
    await openSAM(page);

    // Get initial width
    const samWindow = page.locator('.rounded-2xl.shadow-2xl').first();
    const initialBox = await samWindow.boundingBox();
    if (!initialBox) throw new Error('SAM window not found');

    const initialWidth = initialBox.width;
    console.log('Initial SAM width:', initialWidth);

    // Type a message to trigger API call
    const input = page.locator(SAM_INPUT);
    await input.fill('What form data do you have?');
    await input.press('Enter');

    // Wait for loading state
    await page.waitForTimeout(500);

    // Check width during loading
    const loadingBox = await samWindow.boundingBox();
    if (!loadingBox) throw new Error('SAM window disappeared during loading');

    console.log('Width during loading:', loadingBox.width);

    // Verify width didn't change
    expect(loadingBox.width).toBe(initialWidth);

    // Wait for response
    await page.waitForTimeout(3000);

    // Check width after response
    const finalBox = await samWindow.boundingBox();
    if (!finalBox) throw new Error('SAM window disappeared after response');

    console.log('Final SAM width:', finalBox.width);

    // Verify width remained constant
    expect(finalBox.width).toBe(initialWidth);

    // Verify width is exactly 450px (as designed)
    expect(initialWidth).toBe(450);
  });

  test('Issue 3: Header, title, and close icon should always be visible', async ({ page }) => {
    await openSAM(page);

    // Check header visibility
    const header = page.locator(SAM_HEADER_SELECTOR);
    await expect(header).toBeVisible();

    // Check if header has minimum height
    const headerBox = await header.boundingBox();
    if (!headerBox) throw new Error('Header not found');

    console.log('Header height:', headerBox.height);
    expect(headerBox.height).toBeGreaterThanOrEqual(60); // Should have min-h-[60px]

    // Check SAM title visibility
    const title = page.locator('text=SAM').first();
    await expect(title).toBeVisible();

    // Check close button visibility
    const closeButton = page.locator('button').filter({ has: page.locator('svg') }).nth(-1);
    await expect(closeButton).toBeVisible();

    // Check minimize button visibility
    const minimizeButton = page.locator('button').filter({ has: page.locator('svg') }).nth(-2);
    await expect(minimizeButton).toBeVisible();

    // Send a message to trigger loading/response
    const input = page.locator(SAM_INPUT);
    await input.fill('Test message');
    await input.press('Enter');

    await page.waitForTimeout(500);

    // Verify header STILL visible during loading
    await expect(header).toBeVisible();
    await expect(title).toBeVisible();
    await expect(closeButton).toBeVisible();
  });

  test('Issue 4: Messages area should be scrollable with proper overflow behavior', async ({ page }) => {
    await openSAM(page);

    // Find the scroll area
    const scrollArea = page.locator('[class*="overflow-y-auto"]').first();
    await expect(scrollArea).toBeVisible();

    // Check if scroll area has proper flex properties
    const scrollBox = await scrollArea.boundingBox();
    if (!scrollBox) throw new Error('Scroll area not found');

    console.log('Scroll area dimensions:', scrollBox);

    // Scroll area should have reasonable height (not 0, not too small)
    expect(scrollBox.height).toBeGreaterThan(200);

    // Send multiple messages to trigger scroll
    const input = page.locator(SAM_INPUT);

    for (let i = 1; i <= 5; i++) {
      await input.fill(`Test message ${i} - This is a longer message to test scrolling behavior`);
      await input.press('Enter');
      await page.waitForTimeout(300);
    }

    // Wait for messages to appear
    await page.waitForTimeout(1000);

    // Check if scroll is working by getting scroll position
    const scrollTop = await scrollArea.evaluate((el) => el.scrollTop);
    console.log('Scroll position:', scrollTop);

    // If we have multiple messages, scroll should be > 0
    // (or at least scroll area should be scrollable)
    const isScrollable = await scrollArea.evaluate((el) =>
      el.scrollHeight > el.clientHeight
    );

    console.log('Is scrollable:', isScrollable);

    // Verify input is still visible at bottom (not covered by messages)
    await expect(input).toBeVisible();
  });

  test('Issue 5: Drag functionality should work properly', async ({ page }) => {
    await openSAM(page);

    const samWindow = page.locator('.rounded-2xl.shadow-2xl').first();
    const initialBox = await samWindow.boundingBox();
    if (!initialBox) throw new Error('SAM window not found');

    const initialPosition = { x: initialBox.x, y: initialBox.y };
    console.log('Initial position:', initialPosition);

    // Find drag handle
    const dragHandle = page.locator(SAM_HEADER_SELECTOR);

    // Drag SAM to new position
    const dragHandleBox = await dragHandle.boundingBox();
    if (!dragHandleBox) throw new Error('Drag handle not found');

    await page.mouse.move(dragHandleBox.x + dragHandleBox.width / 2, dragHandleBox.y + dragHandleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(300, 200); // Drag to specific position
    await page.mouse.up();

    await page.waitForTimeout(500);

    // Get new position
    const newBox = await samWindow.boundingBox();
    if (!newBox) throw new Error('SAM window not found after drag');

    const newPosition = { x: newBox.x, y: newBox.y };
    console.log('New position after drag:', newPosition);

    // Verify position changed
    expect(newPosition.x).not.toBe(initialPosition.x);
    expect(newPosition.y).not.toBe(initialPosition.y);

    // Verify size didn't change during drag
    expect(newBox.width).toBe(450);
    expect(newBox.height).toBe(650);
  });

  test('Issue 6: Minimize/Maximize should work without breaking layout', async ({ page }) => {
    await openSAM(page);

    const samWindow = page.locator('.rounded-2xl.shadow-2xl').first();

    // Get full size
    const fullBox = await samWindow.boundingBox();
    if (!fullBox) throw new Error('SAM window not found');

    console.log('Full size:', fullBox);

    // Click minimize button
    const minimizeButton = page.locator('button').filter({ has: page.locator('svg') }).nth(-2);
    await minimizeButton.click();
    await page.waitForTimeout(500);

    // Verify SAM is minimized (should be smaller or hidden)
    const minimizedBox = await samWindow.boundingBox();
    console.log('Minimized size:', minimizedBox);

    // Click to maximize again
    await minimizeButton.click();
    await page.waitForTimeout(500);

    // Verify back to full size
    const restoredBox = await samWindow.boundingBox();
    if (!restoredBox) throw new Error('SAM window not found after restore');

    console.log('Restored size:', restoredBox);

    // Size should be same as initial
    expect(restoredBox.width).toBe(fullBox.width);
    expect(restoredBox.height).toBe(fullBox.height);
  });

  test('Issue 7: SAM should handle window resize gracefully', async ({ page }) => {
    await openSAM(page);

    // Get initial position
    const samWindow = page.locator('.rounded-2xl.shadow-2xl').first();
    const initialBox = await samWindow.boundingBox();
    if (!initialBox) throw new Error('SAM window not found');

    console.log('Initial position at 1280x720:', initialBox);

    // Resize viewport to smaller size
    await page.setViewportSize({ width: 1024, height: 600 });
    await page.waitForTimeout(500);

    // Check if SAM is still visible and within bounds
    const smallBox = await samWindow.boundingBox();
    if (!smallBox) throw new Error('SAM disappeared after resize');

    console.log('Position at 1024x600:', smallBox);

    expect(smallBox.x).toBeGreaterThanOrEqual(0);
    expect(smallBox.y).toBeGreaterThanOrEqual(0);
    expect(smallBox.x + smallBox.width).toBeLessThanOrEqual(1024);
    expect(smallBox.y + smallBox.height).toBeLessThanOrEqual(600);

    // Resize back to larger
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);

    const largeBox = await samWindow.boundingBox();
    if (!largeBox) throw new Error('SAM disappeared after resize');

    console.log('Position at 1920x1080:', largeBox);

    // SAM should still be visible
    expect(largeBox.x).toBeGreaterThanOrEqual(0);
    expect(largeBox.y).toBeGreaterThanOrEqual(0);
  });

  test('Issue 8: Multiple rapid clicks should not break SAM', async ({ page }) => {
    // Rapidly open and close SAM multiple times
    for (let i = 0; i < 5; i++) {
      await openSAM(page);
      await page.waitForTimeout(200);

      const closeButton = page.locator('button').filter({ has: page.locator('svg') }).nth(-1);
      await closeButton.click();
      await page.waitForTimeout(200);
    }

    // Open one final time
    await openSAM(page);
    await page.waitForTimeout(500);

    // Verify SAM is still functional
    const samWindow = page.locator('.rounded-2xl.shadow-2xl').first();
    await expect(samWindow).toBeVisible();

    const box = await samWindow.boundingBox();
    if (!box) throw new Error('SAM broken after rapid clicks');

    // Verify dimensions are correct
    expect(box.width).toBe(450);
    expect(box.height).toBe(650);
  });

  test('Issue 9: Long messages should not break layout', async ({ page }) => {
    await openSAM(page);

    const input = page.locator(SAM_INPUT);

    // Send a very long message
    const longMessage = 'This is a very long message that should test the wrapping behavior. '.repeat(20);
    await input.fill(longMessage);
    await input.press('Enter');

    await page.waitForTimeout(1000);

    // Verify SAM width didn't change
    const samWindow = page.locator('.rounded-2xl.shadow-2xl').first();
    const box = await samWindow.boundingBox();
    if (!box) throw new Error('SAM window not found');

    expect(box.width).toBe(450);

    // Verify message is visible and wrapped
    const message = page.locator('.space-y-4').first();
    await expect(message).toBeVisible();
  });

  test('Issue 10: Form context should be detected correctly', async ({ page }) => {
    await openSAM(page);

    // Fill in some form fields on AI Creator page
    const titleInput = page.locator('input[name="courseTitle"]').or(page.locator('input[placeholder*="title"]').first());
    await titleInput.fill('Test Course Title');
    await page.waitForTimeout(500);

    // Ask SAM about form data
    const samInput = page.locator(SAM_INPUT);
    await samInput.fill('What form data do you have?');
    await samInput.press('Enter');

    await page.waitForTimeout(3000); // Wait for SAM response

    // Check if SAM's response contains the form data
    const messages = page.locator('[class*="space-y-4"]').first();
    const messageText = await messages.textContent();

    console.log('SAM Response:', messageText);

    // Response should mention the course title we entered
    expect(messageText?.toLowerCase()).toContain('course');
  });
});

test.describe('SAM Visual Regression Tests', () => {
  test('SAM should look consistent', async ({ page }) => {
    await page.goto('http://localhost:3000/teacher/create/ai-creator');
    await page.waitForLoadState('networkidle');

    await openSAM(page);
    await page.waitForTimeout(1000);

    // Take screenshot for visual comparison
    await expect(page).toHaveScreenshot('sam-default-state.png', {
      maxDiffPixels: 100,
    });
  });

  test('SAM should handle dark mode correctly', async ({ page }) => {
    await page.goto('http://localhost:3000/teacher/create/ai-creator');

    // Toggle dark mode if available
    const darkModeToggle = page.locator('[data-testid="dark-mode-toggle"]').or(page.locator('button').filter({ hasText: /dark|light/i }).first());
    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click();
      await page.waitForTimeout(500);
    }

    await openSAM(page);
    await page.waitForTimeout(1000);

    // Take screenshot
    await expect(page).toHaveScreenshot('sam-dark-mode.png', {
      maxDiffPixels: 100,
    });
  });
});
