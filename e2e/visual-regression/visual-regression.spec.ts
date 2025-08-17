import { test, expect, testUsers } from '../fixtures/test-fixtures';
import { percySnapshot } from '@percy/playwright';
import {
  waitForNetworkIdle,
  waitForImagesLoaded,
  waitForAnimation,
} from '../utils/test-helpers';

/**
 * Visual Regression Testing Suite
 * Tests visual consistency across different pages and states
 */

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set consistent viewport for visual tests
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Disable animations for consistent screenshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `,
    });
  });

  test.describe('Homepage Visual Tests', () => {
    test('should capture homepage in different states', async ({ page }) => {
      await page.goto('/');
      await waitForNetworkIdle(page);
      await waitForImagesLoaded(page);

      // Default state
      await percySnapshot(page, 'Homepage - Default');

      // Hover state on CTA button
      await page.hover('[data-testid="cta-button"]');
      await percySnapshot(page, 'Homepage - CTA Hover');

      // Mobile view
      await page.setViewportSize({ width: 375, height: 667 });
      await percySnapshot(page, 'Homepage - Mobile');

      // Tablet view
      await page.setViewportSize({ width: 768, height: 1024 });
      await percySnapshot(page, 'Homepage - Tablet');

      // Dark mode if available
      const darkModeToggle = page.locator('[data-testid="dark-mode-toggle"]');
      if (await darkModeToggle.isVisible()) {
        await darkModeToggle.click();
        await waitForAnimation(page, 'body');
        await percySnapshot(page, 'Homepage - Dark Mode');
      }
    });

    test('should capture navigation menu states', async ({ page }) => {
      await page.goto('/');
      await waitForNetworkIdle(page);

      // Closed state
      await percySnapshot(page, 'Navigation - Closed');

      // Open dropdown
      const dropdown = page.locator('[data-testid="nav-dropdown"]');
      if (await dropdown.isVisible()) {
        await dropdown.click();
        await percySnapshot(page, 'Navigation - Dropdown Open');
      }

      // Mobile menu
      await page.setViewportSize({ width: 375, height: 667 });
      const mobileMenu = page.locator('[data-testid="mobile-menu-button"]');
      if (await mobileMenu.isVisible()) {
        await mobileMenu.click();
        await percySnapshot(page, 'Navigation - Mobile Menu Open');
      }
    });
  });

  test.describe('Authentication Pages Visual Tests', () => {
    test('should capture login page states', async ({ page }) => {
      await page.goto('/auth/login');
      await waitForNetworkIdle(page);

      // Default state
      await percySnapshot(page, 'Login - Default');

      // Focus state
      await page.focus('input[name="email"]');
      await percySnapshot(page, 'Login - Input Focus');

      // Error state
      await page.click('button[type="submit"]');
      await page.waitForSelector('.error-message');
      await percySnapshot(page, 'Login - Validation Errors');

      // Filled state
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');
      await percySnapshot(page, 'Login - Filled Form');
    });

    test('should capture registration page', async ({ page }) => {
      await page.goto('/auth/register');
      await waitForNetworkIdle(page);

      await percySnapshot(page, 'Registration - Default');

      // With validation errors
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
      await percySnapshot(page, 'Registration - Validation Errors');
    });

    test('should capture password reset page', async ({ page }) => {
      await page.goto('/auth/reset-password');
      await waitForNetworkIdle(page);

      await percySnapshot(page, 'Password Reset - Default');
    });
  });

  test.describe('Dashboard Visual Tests', () => {
    test.use({ testUser: testUsers.student });

    test('should capture student dashboard', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      await page.goto('/dashboard');
      await waitForNetworkIdle(page);
      await waitForImagesLoaded(page);

      // Full dashboard
      await percySnapshot(page, 'Dashboard - Student Overview');

      // Sidebar states
      const sidebarToggle = page.locator('[data-testid="sidebar-toggle"]');
      if (await sidebarToggle.isVisible()) {
        await sidebarToggle.click();
        await waitForAnimation(page, '[data-testid="sidebar"]');
        await percySnapshot(page, 'Dashboard - Sidebar Collapsed');
      }

      // Cards and widgets
      await page.goto('/dashboard/analytics');
      await waitForNetworkIdle(page);
      await percySnapshot(page, 'Dashboard - Analytics View');
    });

    test('should capture teacher dashboard', async ({ browser }) => {
      const context = await browser.newContext({
        storageState: 'e2e/auth/teacher-auth.json',
      });
      const page = await context.newPage();

      await page.goto('/dashboard');
      await waitForNetworkIdle(page);

      await percySnapshot(page, 'Dashboard - Teacher Overview');

      // Course creation modal
      const createButton = page.locator('[data-testid="create-course-button"]');
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForSelector('[data-testid="course-creation-modal"]');
        await percySnapshot(page, 'Dashboard - Course Creation Modal');
      }

      await context.close();
    });

    test('should capture admin dashboard', async ({ browser }) => {
      const context = await browser.newContext({
        storageState: 'e2e/auth/admin-auth.json',
      });
      const page = await context.newPage();

      await page.goto('/dashboard/admin');
      await waitForNetworkIdle(page);

      await percySnapshot(page, 'Dashboard - Admin Overview');

      // Admin panels
      await page.goto('/dashboard/admin/users');
      await waitForNetworkIdle(page);
      await percySnapshot(page, 'Dashboard - Admin User Management');

      await context.close();
    });
  });

  test.describe('Course Pages Visual Tests', () => {
    test.use({ testUser: testUsers.student });

    test('should capture course catalog', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      await page.goto('/courses');
      await waitForNetworkIdle(page);
      await waitForImagesLoaded(page);

      // Grid view
      await percySnapshot(page, 'Courses - Grid View');

      // List view
      const viewToggle = page.locator('[data-testid="view-toggle-list"]');
      if (await viewToggle.isVisible()) {
        await viewToggle.click();
        await waitForAnimation(page, '[data-testid="course-list"]');
        await percySnapshot(page, 'Courses - List View');
      }

      // With filters applied
      await page.click('[data-testid="category-filter"]');
      await page.click('text=Programming');
      await waitForNetworkIdle(page);
      await percySnapshot(page, 'Courses - Filtered');
    });

    test('should capture course details page', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      await page.goto('/courses');
      await page.click('[data-testid="course-card"]:first-child');
      await waitForNetworkIdle(page);
      await waitForImagesLoaded(page);

      // Course overview
      await percySnapshot(page, 'Course - Details Overview');

      // Curriculum expanded
      const chapterToggle = page.locator('[data-testid="chapter-toggle"]:first-child');
      if (await chapterToggle.isVisible()) {
        await chapterToggle.click();
        await waitForAnimation(page, '[data-testid="chapter-content"]');
        await percySnapshot(page, 'Course - Curriculum Expanded');
      }

      // Reviews section
      const reviewsTab = page.locator('[data-testid="reviews-tab"]');
      if (await reviewsTab.isVisible()) {
        await reviewsTab.click();
        await waitForNetworkIdle(page);
        await percySnapshot(page, 'Course - Reviews Section');
      }
    });

    test('should capture course learning interface', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      await page.goto('/dashboard/my-courses');
      
      const enrolledCourse = page.locator('[data-testid="enrolled-course"]:first-child');
      if (await enrolledCourse.isVisible()) {
        await enrolledCourse.click();
        await waitForNetworkIdle(page);
        await waitForImagesLoaded(page);

        // Learning interface
        await percySnapshot(page, 'Learning - Course Player');

        // Video player
        const videoPlayer = page.locator('[data-testid="video-player"]');
        if (await videoPlayer.isVisible()) {
          await percySnapshot(page, 'Learning - Video Player');
        }

        // Quiz interface
        const quizSection = page.locator('[data-testid="quiz-section"]');
        if (await quizSection.isVisible()) {
          await percySnapshot(page, 'Learning - Quiz Interface');
        }

        // Progress indicators
        await percySnapshot(page, 'Learning - Progress Tracking');
      }
    });
  });

  test.describe('Responsive Design Visual Tests', () => {
    const viewports = [
      { name: 'iPhone SE', width: 375, height: 667 },
      { name: 'iPhone 12 Pro', width: 390, height: 844 },
      { name: 'iPad', width: 768, height: 1024 },
      { name: 'iPad Pro', width: 1024, height: 1366 },
      { name: 'Desktop HD', width: 1920, height: 1080 },
      { name: 'Desktop 4K', width: 3840, height: 2160 },
    ];

    test('should capture homepage across viewports', async ({ page }) => {
      await page.goto('/');
      await waitForNetworkIdle(page);
      await waitForImagesLoaded(page);

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(500); // Allow layout to settle
        await percySnapshot(page, `Homepage - ${viewport.name}`);
      }
    });

    test('should capture dashboard across viewports', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      await page.goto('/dashboard');
      await waitForNetworkIdle(page);

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(500);
        await percySnapshot(page, `Dashboard - ${viewport.name}`);
      }
    });
  });

  test.describe('Component States Visual Tests', () => {
    test('should capture form components', async ({ page }) => {
      await page.goto('/style-guide/forms');
      await waitForNetworkIdle(page);

      // Input states
      await percySnapshot(page, 'Forms - Input States');

      // Select dropdowns
      const select = page.locator('select:first-child');
      if (await select.isVisible()) {
        await select.click();
        await percySnapshot(page, 'Forms - Select Open');
      }

      // Checkboxes and radios
      await percySnapshot(page, 'Forms - Checkboxes and Radios');

      // File upload
      await percySnapshot(page, 'Forms - File Upload');
    });

    test('should capture button states', async ({ page }) => {
      await page.goto('/style-guide/buttons');
      await waitForNetworkIdle(page);

      await percySnapshot(page, 'Buttons - All States');

      // Loading state
      const loadingButton = page.locator('[data-testid="loading-button"]');
      if (await loadingButton.isVisible()) {
        await loadingButton.click();
        await percySnapshot(page, 'Buttons - Loading State');
      }
    });

    test('should capture modal dialogs', async ({ page }) => {
      await page.goto('/style-guide/modals');
      await waitForNetworkIdle(page);

      // Open modal
      await page.click('[data-testid="open-modal"]');
      await page.waitForSelector('[data-testid="modal"]');
      await percySnapshot(page, 'Modal - Open');

      // Modal with content
      await page.click('[data-testid="open-content-modal"]');
      await page.waitForSelector('[data-testid="content-modal"]');
      await percySnapshot(page, 'Modal - With Content');
    });

    test('should capture notifications', async ({ page }) => {
      await page.goto('/style-guide/notifications');
      await waitForNetworkIdle(page);

      // Trigger notifications
      await page.click('[data-testid="show-success"]');
      await percySnapshot(page, 'Notification - Success');

      await page.click('[data-testid="show-error"]');
      await percySnapshot(page, 'Notification - Error');

      await page.click('[data-testid="show-warning"]');
      await percySnapshot(page, 'Notification - Warning');

      await page.click('[data-testid="show-info"]');
      await percySnapshot(page, 'Notification - Info');
    });
  });

  test.describe('Theme and Accessibility Visual Tests', () => {
    test('should capture high contrast mode', async ({ page }) => {
      await page.goto('/');
      
      // Enable high contrast
      await page.emulateMedia({ forcedColors: 'active' });
      await waitForNetworkIdle(page);
      
      await percySnapshot(page, 'Homepage - High Contrast');

      await page.goto('/dashboard');
      await percySnapshot(page, 'Dashboard - High Contrast');
    });

    test('should capture reduced motion mode', async ({ page }) => {
      await page.goto('/');
      
      // Enable reduced motion
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await waitForNetworkIdle(page);
      
      await percySnapshot(page, 'Homepage - Reduced Motion');
    });

    test('should capture focus indicators', async ({ page }) => {
      await page.goto('/');
      await waitForNetworkIdle(page);

      // Tab through elements to show focus
      await page.keyboard.press('Tab');
      await percySnapshot(page, 'Homepage - First Tab Focus');

      await page.keyboard.press('Tab');
      await percySnapshot(page, 'Homepage - Second Tab Focus');

      await page.keyboard.press('Tab');
      await percySnapshot(page, 'Homepage - Third Tab Focus');
    });
  });

  test.describe('Error States Visual Tests', () => {
    test('should capture 404 page', async ({ page }) => {
      await page.goto('/non-existent-page');
      await waitForNetworkIdle(page);
      
      await percySnapshot(page, 'Error - 404 Page');
    });

    test('should capture error boundaries', async ({ page }) => {
      // Trigger an error boundary if available
      await page.goto('/test/error-boundary');
      await waitForNetworkIdle(page);
      
      if (await page.locator('[data-testid="error-boundary"]').isVisible()) {
        await percySnapshot(page, 'Error - Error Boundary');
      }
    });

    test('should capture loading states', async ({ page }) => {
      await page.goto('/courses?slow=true');
      
      // Capture loading skeleton
      const skeleton = page.locator('[data-testid="loading-skeleton"]');
      if (await skeleton.isVisible()) {
        await percySnapshot(page, 'Loading - Skeleton Screen');
      }

      // Capture spinner
      const spinner = page.locator('[data-testid="loading-spinner"]');
      if (await spinner.isVisible()) {
        await percySnapshot(page, 'Loading - Spinner');
      }
    });

    test('should capture empty states', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      
      // Empty course list
      await page.goto('/dashboard/my-courses?empty=true');
      await waitForNetworkIdle(page);
      await percySnapshot(page, 'Empty State - No Courses');

      // Empty notifications
      await page.goto('/dashboard/notifications?empty=true');
      await waitForNetworkIdle(page);
      await percySnapshot(page, 'Empty State - No Notifications');
    });
  });
});