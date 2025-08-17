import { test, expect, testUsers } from '../fixtures/test-fixtures';
import {
  measureCoreWebVitals,
  runLighthouseAudit,
  simulateNetworkCondition,
  waitForNetworkIdle,
  waitForImagesLoaded,
} from '../utils/test-helpers';

test.describe('Performance Optimization Tests', () => {
  test.use({ 
    testUser: testUsers.student,
    // Use performance profile for these tests
    launchOptions: {
      args: ['--enable-gpu-rasterization',
        '--enable-zero-copy',
        '--enable-accelerated-2d-canvas',
      ],
    },
  });

  test('should meet Core Web Vitals targets on homepage', async ({ page }) => {
    await page.goto('/');
    await waitForNetworkIdle(page);
    await waitForImagesLoaded(page);

    const metrics = await measureCoreWebVitals(page);

    // Google's recommended thresholds
    expect(metrics.lcp).toBeLessThan(2500); // LCP < 2.5s (Good)
    expect(metrics.fid || 0).toBeLessThan(100); // FID < 100ms (Good)
    expect(metrics.cls).toBeLessThan(0.1); // CLS < 0.1 (Good)
    expect(metrics.fcp).toBeLessThan(1800); // FCP < 1.8s (Good)
    expect(metrics.tti).toBeLessThan(3800); // TTI < 3.8s (Good)

    console.log('Homepage Core Web Vitals: ', metrics);
  });

  test('should optimize virtual scrolling for large lists', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    
    // Navigate to a page with large list (e.g., all courses)
    await page.goto('/courses?view=all');
    await waitForNetworkIdle(page);

    // Measure initial render performance
    const startTime = Date.now();
    
    // Count visible items
    const visibleItems = await page.locator('[data-testid="course-card"]:visible').count();
    
    // Should use virtual scrolling - only render visible items plus buffer
    expect(visibleItems).toBeLessThanOrEqual(20); // Assuming viewport fits ~20 items

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500); // Wait for virtual scroll to update

    // Check that new items are rendered
    const newVisibleItems = await page.locator('[data-testid="course-card"]:visible').count();
    expect(newVisibleItems).toBeGreaterThan(0);

    // Measure scroll performance
    const scrollPerformance = await page.evaluate(() => {
      return new Promise((resolve) => {
        let frames = 0;
        let startTime = performance.now();
        
        const measureFrames = () => {
          frames++;
          if (performance.now() - startTime < 1000) {
            requestAnimationFrame(measureFrames);
          } else {
            resolve(frames);
          }
        };
        
        // Trigger smooth scroll
        window.scrollTo({ top: 0, behavior: 'smooth' });
        measureFrames();
      });
    });

    // Should maintain 60fps (60 frames per second)
    expect(Number(scrollPerformance)).toBeGreaterThan(50); // Allow some variance
  });

  test('should lazy load images efficiently', async ({ page }) => {
    await page.goto('/courses');

    // Get all images
    const images = page.locator('img');
    const imageCount = await images.count();

    // Check that images have loading="lazy" attribute
    for (let i = 0; i < Math.min(imageCount, 10); i++) {
      const image = images.nth(i);
      const loading = await image.getAttribute('loading');
      
      // Images below fold should be lazy loaded
      const isAboveFold = await page.evaluate((img) => {
        const rect = img.getBoundingClientRect();
        return rect.top < window.innerHeight;
      }, await image.elementHandle());

      if (!isAboveFold) {
        expect(loading).toBe('lazy');
      }
    }

    // Measure network activity
    const requests: string[] = [];
    page.on('request', request => {
      if (request.resourceType() === 'image') {
        requests.push(request.url());
      }
    });

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(1000);

    // More images should load as we scroll
    const laterRequests = requests.length;
    
    await page.evaluate(() => window.scrollTo(0, 2000));
    await page.waitForTimeout(1000);

    expect(requests.length).toBeGreaterThan(laterRequests);
  });

  test('should implement efficient code splitting', async ({ page }) => {
    // Monitor JavaScript bundle loading
    const jsRequests: Array<{ url: string; size: number }> = [];
    
    page.on('response', async response => {
      if (response.url().includes('.js') && response.ok()) {
        const buffer = await response.body();
        jsRequests.push({
          url: response.url(),
          size: buffer.length,
        });
      }
    });

    // Load homepage
    await page.goto('/');
    await waitForNetworkIdle(page);

    const initialBundles = [...jsRequests];
    
    // Navigate to dashboard (should load additional chunks)
    await page.goto('/dashboard');
    await waitForNetworkIdle(page);

    const dashboardBundles = jsRequests.filter(
      req => !initialBundles.find(initial => initial.url === req.url)
    );

    // Should have loaded additional chunks for dashboard
    expect(dashboardBundles.length).toBeGreaterThan(0);

    // Check bundle sizes are reasonable (< 200KB per chunk)
    dashboardBundles.forEach(bundle => {
      expect(bundle.size).toBeLessThan(200 * 1024); // 200KB
    });

    // Total initial JS should be < 500KB
    const totalInitialSize = initialBundles.reduce((sum, b) => sum + b.size, 0);
    expect(totalInitialSize).toBeLessThan(500 * 1024); // 500KB
  });

  test('should optimize API response times', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    const apiTimes: Array<{ url: string; duration: number }> = [];

    // Monitor API calls
    page.on('response', async response => {
      if (response.url().includes('/api/')) {
        const timing = response.timing();
        if (timing) {
          apiTimes.push({
            url: response.url(),
            duration: timing.responseEnd - timing.requestStart,
          });
        }
      }
    });

    // Navigate through the app
    await page.goto('/dashboard');
    await waitForNetworkIdle(page);

    await page.goto('/courses');
    await waitForNetworkIdle(page);

    await page.goto('/dashboard/analytics');
    await waitForNetworkIdle(page);

    // Check API response times
    apiTimes.forEach(api => {
      // API responses should be fast
      expect(api.duration).toBeLessThan(1000); // < 1 second
      
      // Critical APIs should be even faster
      if (api.url.includes('/api/auth/') || api.url.includes('/api/user/')) {
        expect(api.duration).toBeLessThan(500); // < 500ms
      }
    });

    // Average API time should be good
    const avgTime = apiTimes.reduce((sum, api) => sum + api.duration, 0) / apiTimes.length;
    expect(avgTime).toBeLessThan(600); // < 600ms average
  });

  test('should handle slow network gracefully', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Simulate slow 3G
    await simulateNetworkCondition(page, 'slow-3g');

    // Navigate to courses
    const startTime = Date.now();
    await page.goto('/courses');
    
    // Should show loading indicator quickly
    const loadingIndicator = page.locator('[data-testid="loading-indicator"]');
    await expect(loadingIndicator).toBeVisible({ timeout: 1000 });

    // Wait for content
    await waitForNetworkIdle(page, 30000); // Increased timeout for slow network
    const loadTime = Date.now() - startTime;

    // Content should eventually load
    await expect(page.locator('[data-testid="course-grid"]')).toBeVisible();

    // Should implement progressive enhancement
    const essentialContent = await page.locator('[data-testid="course-card"]').count();
    expect(essentialContent).toBeGreaterThan(0);

    console.log(`Slow 3G load time: ${loadTime}ms`);
  });

  test('should optimize bundle size with tree shaking', async ({ page }) => {
    const bundleSizes: Map<string, number> = new Map();

    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/_next/static/chunks/') && response.ok()) {
        const buffer = await response.body();
        const filename = url.split('/').pop() || '';
        bundleSizes.set(filename, buffer.length);
      }
    });

    await page.goto('/');
    await waitForNetworkIdle(page);

    // Check main bundle size
    const mainBundle = Array.from(bundleSizes.entries()).find(([name]) => name.includes('main'));
    if (mainBundle) {
      expect(mainBundle[1]).toBeLessThan(100 * 1024); // Main bundle < 100KB
    }

    // Check framework bundle
    const frameworkBundle = Array.from(bundleSizes.entries()).find(([name]) => name.includes('framework'));
    if (frameworkBundle) {
      expect(frameworkBundle[1]).toBeLessThan(150 * 1024); // Framework < 150KB
    }

    // Total bundle size for initial load
    const totalSize = Array.from(bundleSizes.values()).reduce((sum, size) => sum + size, 0);
    expect(totalSize).toBeLessThan(600 * 1024); // Total < 600KB
  });

  test('should implement effective caching strategies', async ({ page }) => {
    // First visit
    await page.goto('/');
    await waitForNetworkIdle(page);

    // Collect cached resources
    const cachedResources: string[] = [];
    
    page.on('response', response => {
      const cacheControl = response.headers()['cache-control'];
      if (cacheControl && cacheControl.includes('max-age')) {
        cachedResources.push(response.url());
      }
    });

    // Second visit (should use cache)
    await page.reload();
    
    // Monitor network requests
    const networkRequests: string[] = [];
    page.on('request', request => {
      networkRequests.push(request.url());
    });

    await waitForNetworkIdle(page);

    // Static assets should be cached
    const staticAssets = networkRequests.filter(url => 
      url.includes('/_next/static/') || 
      url.includes('/images/') ||
      url.includes('.css') ||
      url.includes('.js')
    );

    // Many static assets should come from cache (not all will be in network requests)
    expect(staticAssets.length).toBeLessThan(cachedResources.length);
  });

  test('should optimize database queries with pagination', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Monitor API response sizes
    const apiSizes: Array<{ url: string; size: number }> = [];
    
    page.on('response', async response => {
      if (response.url().includes('/api/') && response.ok()) {
        const buffer = await response.body();
        apiSizes.push({
          url: response.url(),
          size: buffer.length,
        });
      }
    });

    // Navigate to page with pagination
    await page.goto('/courses');
    await waitForNetworkIdle(page);

    // Check initial load is paginated
    const initialApiCall = apiSizes.find(api => api.url.includes('/api/courses'));
    if (initialApiCall) {
      // Response should be reasonable size (paginated)
      expect(initialApiCall.size).toBeLessThan(50 * 1024); // < 50KB per page
    }

    // Load more items
    const loadMoreButton = page.locator('[data-testid="load-more"]');
    if (await loadMoreButton.isVisible()) {
      await loadMoreButton.click();
      await waitForNetworkIdle(page);

      // Check subsequent load is also paginated
      const subsequentApiCall = apiSizes[apiSizes.length - 1];
      expect(subsequentApiCall.size).toBeLessThan(50 * 1024);
    }
  });

  test('should run Lighthouse performance audit', async ({ page }) => {
    await page.goto('/');
    await waitForNetworkIdle(page);

    // Run Lighthouse audit
    const results = await runLighthouseAudit(page, page.url());

    if (results && results.categories) {
      // Performance score should be good
      expect(results.categories.performance.score).toBeGreaterThan(0.8); // > 80%

      // Accessibility score should be excellent
      expect(results.categories.accessibility.score).toBeGreaterThan(0.9); // > 90%

      // Best practices score should be good
      expect(results.categories['best-practices'].score).toBeGreaterThan(0.8); // > 80%

      // SEO score should be excellent
      expect(results.categories.seo.score).toBeGreaterThan(0.9); // > 90%

      console.log('Lighthouse Scores: ', {
        performance: results.categories.performance.score * 100,
        accessibility: results.categories.accessibility.score * 100,
        bestPractices: results.categories['best-practices'].score * 100,
        seo: results.categories.seo.score * 100,
      });
    }
  });

  test('should handle memory efficiently', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // Get initial memory usage
    const getMemoryUsage = async () => {
      return await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return null;
      });
    };

    const initialMemory = await getMemoryUsage();
    
    // Navigate through multiple pages
    for (let i = 0; i < 10; i++) {
      await page.goto('/courses');
      await waitForNetworkIdle(page);
      await page.goto('/dashboard');
      await waitForNetworkIdle(page);
    }

    // Check memory after navigation
    const finalMemory = await getMemoryUsage();

    if (initialMemory && finalMemory) {
      // Memory growth should be reasonable (< 50MB)
      const memoryGrowth = (finalMemory - initialMemory) / (1024 * 1024);
      expect(memoryGrowth).toBeLessThan(50);
      
      console.log(`Memory growth after navigation: ${memoryGrowth.toFixed(2)}MB`);
    }

    // Force garbage collection if available
    await page.evaluate(() => {
      if (typeof (global as any).gc === 'function') {
        (global as any).gc();
      }
    });
  });

  test('should optimize font loading', async ({ page }) => {
    const fontRequests: string[] = [];
    
    page.on('request', request => {
      if (request.url().includes('.woff') || request.url().includes('.woff2')) {
        fontRequests.push(request.url());
      }
    });

    await page.goto('/');

    // Check font-display strategy
    const fontDisplay = await page.evaluate(() => {
      const styles = Array.from(document.styleSheets);
      for (const sheet of styles) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          const fontFaceRules = rules.filter(rule => rule instanceof CSSFontFaceRule);
          if (fontFaceRules.length > 0) {
            return (fontFaceRules[0] as any).style.fontDisplay;
          }
        } catch (e) {
          // Cross-origin stylesheets will throw
          continue;
        }
      }
      return null;
    });

    // Should use font-display: swap or optional
    if (fontDisplay) {
      expect(['swap', 'optional']).toContain(fontDisplay);
    }

    // Fonts should be preloaded
    const preloadedFonts = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('link[rel="preload"]'));
      return links.filter(link => {
        const href = link.getAttribute('href') || '';
        return href.includes('.woff') || href.includes('.woff2');
      }).length;
    });

    expect(preloadedFonts).toBeGreaterThan(0);
  });

  test('should implement service worker for offline support', async ({ page }) => {
    await page.goto('/');
    await waitForNetworkIdle(page);

    // Check if service worker is registered
    const hasServiceWorker = await page.evaluate(() => {
      return 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null;
    });

    if (hasServiceWorker) {
      // Test offline functionality
      await page.context().setOffline(true);
      
      // Should still be able to navigate to cached pages
      await page.reload();
      
      // Check if offline page or cached content is shown
      const title = await page.title();
      expect(title).toBeTruthy(); // Page should still have a title
      
      // Go back online
      await page.context().setOffline(false);
    }
  });

  test('should optimize third-party scripts', async ({ page }) => {
    const thirdPartyScripts: Array<{ url: string; loadTime: number }> = [];
    
    page.on('response', async response => {
      const url = response.url();
      if (!url.includes(page.url()) && url.includes('.js')) {
        const timing = response.timing();
        if (timing) {
          thirdPartyScripts.push({
            url,
            loadTime: timing.responseEnd,
          });
        }
      }
    });

    await page.goto('/');
    await waitForNetworkIdle(page);

    // Third-party scripts should be loaded async or defer
    const scriptLoadingAttributes = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      return scripts.map(script => ({
        src: script.src,
        async: script.async,
        defer: script.defer,
      }));
    });

    // External scripts should use async or defer
    scriptLoadingAttributes.forEach(script => {
      if (!script.src.includes(window.location.origin)) {
        expect(script.async || script.defer).toBeTruthy();
      }
    });
  });
});