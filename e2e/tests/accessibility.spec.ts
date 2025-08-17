import { test, expect } from '../fixtures/test-fixtures';
import AxeBuilder from '@axe-core/playwright';
import {
  waitForNetworkIdle,
  testKeyboardNavigation,
} from '../utils/test-helpers';

/**
 * Comprehensive Accessibility Testing Suite
 * Tests WCAG 2.1 AA compliance across all pages
 */

test.describe('Accessibility Tests @accessibility', () => {
  test.describe('WCAG 2.1 Compliance - Public Pages', () => {
    test('Homepage should be accessible', async ({ page, axeBuilder }) => {
      await page.goto('/');
      await waitForNetworkIdle(page);

      const results = await axeBuilder
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      // Log violations for debugging
      if (results.violations.length > 0) {
        console.log('Homepage accessibility violations: ', 
          results.violations.map(v => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            nodes: v.nodes.length,
          }))
        );
      }

      expect(results.violations).toHaveLength(0);
    });

    test('Login page should be accessible', async ({ page, axeBuilder }) => {
      await page.goto('/auth/login');
      await waitForNetworkIdle(page);

      const results = await axeBuilder
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('[data-testid="recaptcha"]') // Exclude third-party widgets
        .analyze();

      expect(results.violations).toHaveLength(0);
    });

    test('Registration page should be accessible', async ({ page, axeBuilder }) => {
      await page.goto('/auth/register');
      await waitForNetworkIdle(page);

      const results = await axeBuilder
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(results.violations).toHaveLength(0);
    });

    test('Course catalog should be accessible', async ({ page, axeBuilder }) => {
      await page.goto('/courses');
      await waitForNetworkIdle(page);

      const results = await axeBuilder
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(results.violations).toHaveLength(0);
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('Homepage should be navigable with keyboard', async ({ page }) => {
      await page.goto('/');
      await waitForNetworkIdle(page);

      // Test tab order for main navigation
      const navigationOrder = ['a[href="/"]', // Logo/Home
        'a[href="/courses"]',
        'a[href="/about"]',
        'a[href="/contact"]',
        'a[href="/auth/login"]',
        'button[data-testid="cta-button"]',
      ];

      const results = await testKeyboardNavigation(page, navigationOrder);
      
      results.forEach((result, index) => {
        expect(result.isFocused).toBeTruthy();
      });

      // Test skip link
      await page.keyboard.press('Tab');
      const skipLink = await page.evaluate(() => {
        const activeElement = document.activeElement;
        return activeElement?.textContent?.includes('Skip to main content');
      });
      expect(skipLink).toBeTruthy();
    });

    test('Forms should be keyboard accessible', async ({ page }) => {
      await page.goto('/auth/login');
      await waitForNetworkIdle(page);

      // Start from the top
      await page.focus('body');
      
      // Tab to email field
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab'); // Skip any skip links
      
      // Should focus email input
      const emailFocused = await page.evaluate(() => {
        return document.activeElement?.getAttribute('name') === 'email';
      });
      expect(emailFocused).toBeTruthy();

      // Tab to password field
      await page.keyboard.press('Tab');
      const passwordFocused = await page.evaluate(() => {
        return document.activeElement?.getAttribute('name') === 'password';
      });
      expect(passwordFocused).toBeTruthy();

      // Tab to submit button
      await page.keyboard.press('Tab'); // Remember me checkbox
      await page.keyboard.press('Tab'); // Forgot password link
      await page.keyboard.press('Tab'); // Submit button
      
      const submitFocused = await page.evaluate(() => {
        return document.activeElement?.getAttribute('type') === 'submit';
      });
      expect(submitFocused).toBeTruthy();

      // Test Enter key submission
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password');
      await page.keyboard.press('Enter');
      
      // Should attempt to submit (will show validation or login)
      await page.waitForTimeout(1000);
    });

    test('Modal dialogs should trap focus', async ({ page }) => {
      await page.goto('/');
      
      // Open a modal if available
      const modalTrigger = page.locator('[data-testid="open-modal"]');
      if (await modalTrigger.isVisible()) {
        await modalTrigger.click();
        await page.waitForSelector('[role="dialog"]');

        // Focus should be trapped within modal
        let focusedElement = '';
        for (let i = 0; i < 10; i++) {
          await page.keyboard.press('Tab');
          focusedElement = await page.evaluate(() => {
            const el = document.activeElement;
            return el?.tagName + '.' + el?.className;
          });
          
          // Check if focus is within modal
          const isInModal = await page.evaluate(() => {
            const modal = document.querySelector('[role="dialog"]');
            return modal?.contains(document.activeElement);
          });
          expect(isInModal).toBeTruthy();
        }

        // ESC should close modal
        await page.keyboard.press('Escape');
        const modalClosed = await page.locator('[role="dialog"]').isHidden();
        expect(modalClosed).toBeTruthy();
      }
    });
  });

  test.describe('Screen Reader Support', () => {
    test('Images should have alt text', async ({ page }) => {
      await page.goto('/');
      await waitForNetworkIdle(page);

      const images = await page.$$eval('img', imgs => 
        imgs.map(img => ({
          src: img.src,
          alt: img.alt,
          decorative: img.getAttribute('role') === 'presentation' || img.alt === '',
        }))
      );

      images.forEach(img => {
        if (!img.decorative) {
          expect(img.alt).toBeTruthy();
          expect(img.alt.length).toBeGreaterThan(0);
        }
      });
    });

    test('Page should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/');
      await waitForNetworkIdle(page);

      const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements =>
        elements.map(el => ({
          level: parseInt(el.tagName[1]),
          text: el.textContent,
        }))
      );

      // Should have exactly one h1
      const h1Count = headings.filter(h => h.level === 1).length;
      expect(h1Count).toBe(1);

      // Check heading hierarchy (no skipping levels)
      let previousLevel = 0;
      headings.forEach(heading => {
        if (previousLevel > 0) {
          expect(heading.level).toBeLessThanOrEqual(previousLevel + 1);
        }
        previousLevel = heading.level;
      });
    });

    test('Forms should have proper labels', async ({ page }) => {
      await page.goto('/auth/login');
      await waitForNetworkIdle(page);

      const inputs = await page.$$eval('input, select, textarea', elements =>
        elements.map(el => ({
          type: el.type,
          name: el.name || el.id,
          hasLabel: !!el.labels?.length || !!el.getAttribute('aria-label') || !!el.getAttribute('aria-labelledby'),
          placeholder: el.placeholder,
        }))
      );

      inputs.forEach(input => {
        // All inputs should have labels (except hidden inputs)
        if (input.type !== 'hidden' && input.type !== 'submit' && input.type !== 'button') {
          expect(input.hasLabel).toBeTruthy();
        }
      });
    });

    test('ARIA attributes should be valid', async ({ page, axeBuilder }) => {
      await page.goto('/');
      await waitForNetworkIdle(page);

      const results = await axeBuilder
        .withRules(['aria-allowed-attr',
          'aria-required-attr',
          'aria-required-children',
          'aria-required-parent',
          'aria-roles',
          'aria-valid-attr-value',
          'aria-valid-attr',
        ])
        .analyze();

      expect(results.violations).toHaveLength(0);
    });

    test('Landmarks should be properly defined', async ({ page }) => {
      await page.goto('/');
      await waitForNetworkIdle(page);

      const landmarks = await page.$$eval('[role]', elements =>
        elements.map(el => el.getAttribute('role'))
      );

      // Should have main landmark
      expect(landmarks).toContain('main');
      
      // Should have navigation landmark
      expect(landmarks).toContain('navigation');

      // Check for proper banner (header) and contentinfo (footer)
      const header = await page.$('header, [role="banner"]');
      expect(header).toBeTruthy();

      const footer = await page.$('footer, [role="contentinfo"]');
      expect(footer).toBeTruthy();
    });
  });

  test.describe('Color and Contrast', () => {
    test('Text should have sufficient color contrast', async ({ page, axeBuilder }) => {
      await page.goto('/');
      await waitForNetworkIdle(page);

      const results = await axeBuilder
        .withRules(['color-contrast'])
        .analyze();

      expect(results.violations).toHaveLength(0);
    });

    test('Focus indicators should be visible', async ({ page }) => {
      await page.goto('/');
      await waitForNetworkIdle(page);

      // Tab to first interactive element
      await page.keyboard.press('Tab');
      
      // Check if focus is visible
      const focusVisible = await page.evaluate(() => {
        const activeElement = document.activeElement;
        if (!activeElement) return false;
        
        const styles = window.getComputedStyle(activeElement);
        const outline = styles.outline;
        const boxShadow = styles.boxShadow;
        const border = styles.border;
        
        // Check if any visual indicator is present
        return outline !== 'none' || boxShadow !== 'none' || border !== 'none';
      });

      expect(focusVisible).toBeTruthy();
    });

    test('Should not rely on color alone', async ({ page }) => {
      await page.goto('/courses');
      await waitForNetworkIdle(page);

      // Check error messages have icons or text, not just color
      const errorElements = await page.$$eval('.error, [role="alert"]', elements =>
        elements.map(el => ({
          hasText: el.textContent?.length > 0,
          hasIcon: el.querySelector('svg, i, .icon') !== null,
        }))
      );

      errorElements.forEach(error => {
        expect(error.hasText || error.hasIcon).toBeTruthy();
      });
    });
  });

  test.describe('Responsive and Zoom', () => {
    test('Page should be usable at 200% zoom', async ({ page }) => {
      await page.goto('/');
      await waitForNetworkIdle(page);

      // Set zoom to 200%
      await page.evaluate(() => {
        document.body.style.zoom = '2';
      });

      // Check for horizontal scrolling
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      // Should not require horizontal scrolling at 200% zoom
      expect(hasHorizontalScroll).toBeFalsy();

      // Check that content is still accessible
      const mainContent = await page.locator('main').isVisible();
      expect(mainContent).toBeTruthy();
    });

    test('Touch targets should be large enough', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // Mobile viewport
      await page.goto('/');
      await waitForNetworkIdle(page);

      const touchTargets = await page.$$eval('button, a, input, select', elements =>
        elements.map(el => {
          const rect = el.getBoundingClientRect();
          return {
            tag: el.tagName,
            width: rect.width,
            height: rect.height,
            text: el.textContent?.substring(0, 20),
          };
        })
      );

      touchTargets.forEach(target => {
        // Touch targets should be at least 44x44 pixels (WCAG 2.1 AAA)
        // Using 40x40 for AA compliance
        if (target.width > 0 && target.height > 0) {
          expect(target.width).toBeGreaterThanOrEqual(40);
          expect(target.height).toBeGreaterThanOrEqual(40);
        }
      });
    });
  });

  test.describe('Media and Animation', () => {
    test('Videos should have captions', async ({ page }) => {
      await page.goto('/');
      
      const videos = await page.$$eval('video', videos =>
        videos.map(video => ({
          src: video.src,
          hasTrack: video.querySelector('track[kind="captions"]') !== null,
          hasControls: video.hasAttribute('controls'),
        }))
      );

      videos.forEach(video => {
        expect(video.hasTrack || video.hasControls).toBeTruthy();
      });
    });

    test('Auto-playing content should be pausable', async ({ page }) => {
      await page.goto('/');
      
      const autoplayElements = await page.$$eval('[autoplay], video[autoplay], audio[autoplay]', elements =>
        elements.map(el => ({
          tag: el.tagName,
          hasControls: el.hasAttribute('controls') || 
                      !!el.parentElement?.querySelector('button[aria-label*="pause"], button[aria-label*="stop"]'),
        }))
      );

      autoplayElements.forEach(element => {
        expect(element.hasControls).toBeTruthy();
      });
    });

    test('Animations should respect prefers-reduced-motion', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/');
      await waitForNetworkIdle(page);

      // Check that animations are disabled
      const animationDurations = await page.$$eval('*', elements =>
        elements.map(el => {
          const styles = window.getComputedStyle(el);
          return {
            animationDuration: styles.animationDuration,
            transitionDuration: styles.transitionDuration,
          };
        }).filter(s => s.animationDuration !== '0s' || s.transitionDuration !== '0s')
      );

      // Most animations should be disabled (allowing some essential ones)
      expect(animationDurations.length).toBeLessThan(5);
    });
  });

  test.describe('Error Handling and Feedback', () => {
    test('Error messages should be accessible', async ({ page }) => {
      await page.goto('/auth/login');
      
      // Submit empty form to trigger errors
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);

      // Check error messages have proper ARIA attributes
      const errors = await page.$$eval('[role="alert"], .error-message', elements =>
        elements.map(el => ({
          hasRole: el.hasAttribute('role'),
          hasAriaLive: el.hasAttribute('aria-live'),
          text: el.textContent,
        }))
      );

      errors.forEach(error => {
        expect(error.hasRole || error.hasAriaLive).toBeTruthy();
        expect(error.text).toBeTruthy();
      });
    });

    test('Success messages should be announced', async ({ page }) => {
      await page.goto('/auth/reset-password');
      
      // Submit form
      await page.fill('input[name="email"]', 'test@example.com');
      await page.click('button[type="submit"]');
      
      // Wait for success message
      await page.waitForSelector('[role="status"], .success-message', { timeout: 5000 }).catch(() => {});

      const successMessages = await page.$$eval('[role="status"], .success-message', elements =>
        elements.map(el => ({
          hasRole: el.getAttribute('role') === 'status',
          hasAriaLive: el.getAttribute('aria-live') === 'polite',
        }))
      );

      successMessages.forEach(message => {
        expect(message.hasRole || message.hasAriaLive).toBeTruthy();
      });
    });
  });

  test.describe('Language and Internationalization', () => {
    test('Page should have language attribute', async ({ page }) => {
      await page.goto('/');
      
      const lang = await page.getAttribute('html', 'lang');
      expect(lang).toBeTruthy();
      expect(lang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/); // e.g., 'en' or 'en-US'
    });

    test('Language changes should be marked', async ({ page }) => {
      await page.goto('/');
      
      // Check for any content in different languages
      const langElements = await page.$$eval('[lang]', elements =>
        elements.map(el => ({
          lang: el.getAttribute('lang'),
          hasContent: el.textContent?.length > 0,
        }))
      );

      langElements.forEach(element => {
        expect(element.lang).toBeTruthy();
        expect(element.hasContent).toBeTruthy();
      });
    });
  });

  test.describe('Tables and Data', () => {
    test('Tables should have proper structure', async ({ page }) => {
      await page.goto('/dashboard/analytics');
      await waitForNetworkIdle(page);

      const tables = await page.$$eval('table', tables =>
        tables.map(table => ({
          hasCaption: !!table.querySelector('caption'),
          hasHeaders: table.querySelectorAll('th').length > 0,
          hasSummary: !!table.getAttribute('summary') || !!table.getAttribute('aria-label'),
        }))
      );

      tables.forEach(table => {
        expect(table.hasHeaders).toBeTruthy();
        expect(table.hasCaption || table.hasSummary).toBeTruthy();
      });
    });
  });
});