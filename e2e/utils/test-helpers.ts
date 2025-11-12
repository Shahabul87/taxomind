import { Page, Locator, expect } from '@playwright/test';
import lighthouse from 'playwright-lighthouse';

/**
 * Common test helper utilities
 */

/**
 * Wait for network to be idle
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Wait for all images to load
 */
export async function waitForImagesLoaded(page: Page) {
  await page.evaluate(() => {
    return Promise.all(
      Array.from(document.images)
        .filter(img => !img.complete)
        .map(img => new Promise(resolve => {
          img.addEventListener('load', resolve);
          img.addEventListener('error', resolve);
        }))
    );
  });
}

/**
 * Take a full page screenshot with proper naming
 */
export async function takeFullPageScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true,
  });
}

/**
 * Check if element is in viewport
 */
export async function isInViewport(locator: Locator): Promise<boolean> {
  const box = await locator.boundingBox();
  if (!box) return false;

  const viewport = await locator.page().viewportSize();
  if (!viewport) return false;

  return (
    box.x >= 0 &&
    box.y >= 0 &&
    box.x + box.width <= viewport.width &&
    box.y + box.height <= viewport.height
  );
}

/**
 * Scroll element into view and wait for it to be stable
 */
export async function scrollIntoView(locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  await locator.page().waitForTimeout(500); // Wait for scroll animation
}

/**
 * Fill form with validation
 */
export async function fillFormField(
  page: Page,
  selector: string,
  value: string,
  shouldValidate = true
) {
  const field = page.locator(selector);
  await field.clear();
  await field.fill(value);
  
  if (shouldValidate) {
    await field.blur(); // Trigger validation
    await page.waitForTimeout(100); // Wait for validation
  }
}

/**
 * Login helper
 */
export async function login(
  page: Page,
  email: string,
  password: string
) {
  await page.goto('/auth/login');
  await fillFormField(page, 'input[name="email"]', email);
  await fillFormField(page, 'input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard/**', { timeout: 10000 });
}

/**
 * Logout helper
 */
export async function logout(page: Page) {
  await page.click('[data-testid="user-menu-button"]');
  await page.click('[data-testid="logout-button"]');
  await page.waitForURL('**/auth/login', { timeout: 5000 });
}

/**
 * Check for console errors
 */
export async function checkForConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
  return errors;
}

/**
 * Measure Core Web Vitals
 */
export async function measureCoreWebVitals(page: Page) {
  const metrics = await page.evaluate(() => {
    return new Promise<any>((resolve) => {
      let result: any = {};
      
      // Largest Contentful Paint
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        result.lcp = lastEntry.renderTime || lastEntry.loadTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      
      // First Input Delay
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          result.fid = entries[0].processingStart - entries[0].startTime;
        }
      }).observe({ type: 'first-input', buffered: true });
      
      // Cumulative Layout Shift
      let clsValue = 0;
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        result.cls = clsValue;
      }).observe({ type: 'layout-shift', buffered: true });
      
      // First Contentful Paint
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcp) {
        result.fcp = fcp.startTime;
      }
      
      // Time to Interactive (approximate)
      result.tti = performance.timing.domInteractive - performance.timing.navigationStart;
      
      // Resolve after a delay to collect metrics
      setTimeout(() => resolve(result), 3000);
    });
  });
  
  return metrics;
}

/**
 * Run Lighthouse audit
 */
export async function runLighthouseAudit(
  page: Page,
  url: string,
  options = {}
) {
  const defaultOptions = {
    loglevel: 'info',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    ...options,
  };
  
  const result = await lighthouse(url, {
    page,
    port: 9222, // Default Chrome debugging port
    ...defaultOptions,
  });
  
  return result;
}

/**
 * Test network conditions
 */
export async function simulateNetworkCondition(
  page: Page,
  condition: 'offline' | 'slow-3g' | 'fast-3g' | '4g') {
  const conditions = {
    'offline': {
      offline: true,
      downloadThroughput: 0,
      uploadThroughput: 0,
      latency: 0,
    },
    'slow-3g': {
      offline: false,
      downloadThroughput: ((500 * 1000) / 8) * 0.8,
      uploadThroughput: ((500 * 1000) / 8) * 0.8,
      latency: 400,
    },
    'fast-3g': {
      offline: false,
      downloadThroughput: ((1.6 * 1000 * 1000) / 8) * 0.9,
      uploadThroughput: ((750 * 1000) / 8) * 0.9,
      latency: 150,
    },
    '4g': {
      offline: false,
      downloadThroughput: ((4 * 1000 * 1000) / 8) * 0.9,
      uploadThroughput: ((3 * 1000 * 1000) / 8) * 0.9,
      latency: 50,
    },
  };
  
  const config = conditions[condition];
  const cdpSession = await page.context().newCDPSession(page);
  
  await cdpSession.send('Network.enable');
  await cdpSession.send('Network.emulateNetworkConditions', config);
}

/**
 * Check mobile responsiveness
 */
export async function checkMobileResponsiveness(page: Page) {
  const viewports = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'iPad', width: 768, height: 1024 },
    { name: 'iPad Pro', width: 1024, height: 1366 },
    { name: 'Desktop', width: 1920, height: 1080 },
  ];
  
  const results = [];
  
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(500); // Wait for layout to settle
    
    // Check for horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    results.push({
      ...viewport,
      hasOverflow,
    });
  }
  
  return results;
}

/**
 * Wait for animation to complete
 */
export async function waitForAnimation(page: Page, selector: string) {
  await page.waitForFunction(
    (sel) => {
      const element = document.querySelector(sel);
      if (!element) return false;
      
      const animations = element.getAnimations();
      return animations.length === 0 || animations.every(a => a.playState === 'finished');
    },
    selector,
    { timeout: 5000 }
  );
}

/**
 * Mock API response
 */
export async function mockAPIResponse(
  page: Page,
  url: string,
  response: any,
  status = 200
) {
  await page.route(url, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Wait for specific text to appear
 */
export async function waitForText(
  page: Page,
  text: string,
  options = { timeout: 10000 }
) {
  await page.waitForSelector(`text="${text}"`, options);
}

/**
 * Check if page has accessibility issues
 */
export async function checkAccessibility(page: Page, options = {}) {
  const AxeBuilder = (await import('@axe-core/playwright')).default;
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  
  return accessibilityScanResults.violations;
}

/**
 * Test keyboard navigation
 */
export async function testKeyboardNavigation(
  page: Page,
  elements: string[]
) {
  const results = [];
  
  // Start from the body
  await page.focus('body');
  
  for (const selector of elements) {
    // Tab to the element
    await page.keyboard.press('Tab');
    
    // Check if the element is focused
    const isFocused = await page.evaluate((sel) => {
      const element = document.querySelector(sel);
      return element === document.activeElement;
    }, selector);
    
    results.push({
      selector,
      isFocused,
    });
  }
  
  return results;
}

/**
 * Generate unique test data
 */
export function generateTestData() {
  const timestamp = Date.now();
  return {
    email: `test-${timestamp}@example.com`,
    username: `user-${timestamp}`,
    courseName: `Test Course ${timestamp}`,
    chapterName: `Chapter ${timestamp}`,
    sectionName: `Section ${timestamp}`,
  };
}

/**
 * Retry helper for flaky operations
 */
export async function retry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  let lastError;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

const testHelpers = {
  waitForNetworkIdle,
  waitForImagesLoaded,
  takeFullPageScreenshot,
  isInViewport,
  scrollIntoView,
  fillFormField,
  login,
  logout,
  checkForConsoleErrors,
  measureCoreWebVitals,
  runLighthouseAudit,
  simulateNetworkCondition,
  checkMobileResponsiveness,
  waitForAnimation,
  mockAPIResponse,
  waitForText,
  checkAccessibility,
  testKeyboardNavigation,
  generateTestData,
  retry,
};

export default testHelpers;