/**
 * Blog Accessibility Tests
 * Tests WCAG 2.1 AA compliance using axe-core
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Blog Page Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to blog page before each test
    await page.goto('http://localhost:3000/blog');
    await page.waitForLoadState('networkidle');
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have skip to main content link', async ({ page }) => {
    // Focus the skip link
    await page.keyboard.press('Tab');

    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeVisible();
    await expect(skipLink).toHaveText('Skip to main content');
  });

  test('should have proper ARIA labels on search input', async ({ page }) => {
    const searchInput = page.locator('input[role="searchbox"]');

    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('aria-label');
    await expect(searchInput).toHaveAttribute('aria-describedby');
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Check that h1 exists and is unique
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);

    // Check heading levels don't skip
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    const levels = await Promise.all(
      headings.map(async (h) => {
        const tagName = await h.evaluate((el) => el.tagName);
        return parseInt(tagName.replace('H', ''));
      })
    );

    // Verify no skipped levels
    for (let i = 1; i < levels.length; i++) {
      const diff = levels[i] - levels[i - 1];
      expect(diff).toBeLessThanOrEqual(1);
    }
  });

  test('should have keyboard navigable search and filters', async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press('Tab'); // Skip link
    await page.keyboard.press('Tab'); // Search input

    const searchInput = page.locator('input[role="searchbox"]');
    await expect(searchInput).toBeFocused();

    // Continue tabbing to sort dropdown
    await page.keyboard.press('Tab');
    const sortButton = page.locator('[aria-label="Sort articles"]').first();
    await expect(sortButton).toBeFocused();
  });

  test('should have sufficient color contrast', async ({ page }) => {
    const colorContrastResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('body')
      .analyze();

    const colorContrastViolations = colorContrastResults.violations.filter(
      (v) => v.id === 'color-contrast'
    );

    expect(colorContrastViolations).toHaveLength(0);
  });

  test('should have alt text for all images', async ({ page }) => {
    const images = await page.locator('img').all();

    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
      expect(alt).not.toBe('');
    }
  });

  test('should have proper button labels', async ({ page }) => {
    const buttons = await page.locator('button').all();

    for (const button of buttons) {
      const hasText = await button.textContent();
      const hasAriaLabel = await button.getAttribute('aria-label');
      const hasAriaLabelledBy = await button.getAttribute('aria-labelledby');

      // Button should have either text content or aria-label
      expect(
        hasText || hasAriaLabel || hasAriaLabelledBy
      ).toBeTruthy();
    }
  });

  test('should support keyboard navigation for view mode toggle', async ({ page }) => {
    const gridButton = page.locator('[aria-label="Grid view"]');
    const listButton = page.locator('[aria-label="List view"]');

    // Navigate to grid button
    await gridButton.focus();
    await expect(gridButton).toBeFocused();

    // Press Enter to activate
    await page.keyboard.press('Enter');

    // Navigate to list button
    await listButton.focus();
    await expect(listButton).toBeFocused();
  });

  test('should have proper form labels', async ({ page }) => {
    const inputs = await page.locator('input').all();

    for (const input of inputs) {
      const type = await input.getAttribute('type');

      // Skip hidden inputs
      if (type === 'hidden') continue;

      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      // Input should have either associated label or aria-label
      let hasLabel = false;

      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count();
        hasLabel = label > 0;
      }

      expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
    }
  });

  test('should not have duplicate IDs', async ({ page }) => {
    const duplicateIdResults = await new AxeBuilder({ page })
      .withRules(['duplicate-id'])
      .analyze();

    expect(duplicateIdResults.violations).toHaveLength(0);
  });

  test('should have proper landmark regions', async ({ page }) => {
    const main = page.locator('main, [role="main"]');
    await expect(main).toHaveCount(1);

    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav).toHaveCount(1);
  });

  test('should announce search results to screen readers', async ({ page }) => {
    const searchInput = page.locator('input[role="searchbox"]');

    await searchInput.fill('test');
    await page.waitForTimeout(500); // Wait for filtering

    // Check that results count is visible
    const resultsCount = page.locator('text=/\\d+ articles found/');
    await expect(resultsCount).toBeVisible();
  });
});

test.describe('Blog Page Dark Mode Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/blog');

    // Enable dark mode (if theme toggle exists)
    const themeToggle = page.locator('[aria-label*="theme"], [aria-label*="Theme"]');
    if (await themeToggle.count() > 0) {
      await themeToggle.click();
    } else {
      // Fallback: manually set dark mode class
      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
      });
    }

    await page.waitForLoadState('networkidle');
  });

  test('should have sufficient contrast in dark mode', async ({ page }) => {
    const colorContrastResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('body')
      .analyze();

    const colorContrastViolations = colorContrastResults.violations.filter(
      (v) => v.id === 'color-contrast'
    );

    expect(colorContrastViolations).toHaveLength(0);
  });
});

test.describe('Blog Post Card Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/blog');
    await page.waitForLoadState('networkidle');
  });

  test('should have accessible card links', async ({ page }) => {
    const postCards = await page.locator('[href^="/blog/"]').all();

    for (const card of postCards.slice(0, 5)) {
      // Cards should have accessible names
      const accessibleName = await card.getAttribute('aria-label') ||
        await card.textContent();

      expect(accessibleName).toBeTruthy();
      expect(accessibleName?.trim()).not.toBe('');
    }
  });

  test('should have proper focus indicators', async ({ page }) => {
    const firstCard = page.locator('[href^="/blog/"]').first();

    await firstCard.focus();

    // Check that focus is visible (this is a simple check)
    const isFocused = await firstCard.evaluate((el) => {
      return el === document.activeElement;
    });

    expect(isFocused).toBe(true);
  });
});
