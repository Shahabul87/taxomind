/**
 * Web Vitals Performance Monitoring
 * Tracks Core Web Vitals metrics for real user monitoring
 */

import { getCLS, getFCP, getFID, getLCP, getTTFB, Metric } from 'web-vitals';
import { logger } from '@/lib/logger';

// ============================================
// WEB VITALS THRESHOLDS
// ============================================

export const WEB_VITALS_THRESHOLDS = {
  // Largest Contentful Paint (LCP)
  LCP: {
    good: 2500,      // < 2.5s
    needsImprovement: 4000,  // 2.5s - 4s
    poor: Infinity   // > 4s
  },
  // First Input Delay (FID)
  FID: {
    good: 100,       // < 100ms
    needsImprovement: 300,   // 100ms - 300ms
    poor: Infinity   // > 300ms
  },
  // Cumulative Layout Shift (CLS)
  CLS: {
    good: 0.1,       // < 0.1
    needsImprovement: 0.25,  // 0.1 - 0.25
    poor: Infinity   // > 0.25
  },
  // First Contentful Paint (FCP)
  FCP: {
    good: 1800,      // < 1.8s
    needsImprovement: 3000,  // 1.8s - 3s
    poor: Infinity   // > 3s
  },
  // Time to First Byte (TTFB)
  TTFB: {
    good: 800,       // < 0.8s
    needsImprovement: 1800,  // 0.8s - 1.8s
    poor: Infinity   // > 1.8s
  },
};

// ============================================
// RATING CALCULATION
// ============================================

export type Rating = 'good' | 'needs-improvement' | 'poor';

function getRating(metric: string, value: number): Rating {
  const thresholds = WEB_VITALS_THRESHOLDS[metric as keyof typeof WEB_VITALS_THRESHOLDS];
  
  if (!thresholds) return 'needs-improvement';
  
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
}

// ============================================
// METRIC REPORTING
// ============================================

export interface WebVitalsReport {
  metric: string;
  value: number;
  rating: Rating;
  id: string;
  navigationType: string;
  delta?: number;
  entries?: any[];
  timestamp: number;
  url: string;
  userAgent: string;
}

/**
 * Send metrics to analytics endpoint
 */
async function sendToAnalytics(report: WebVitalsReport) {
  try {
    // Only send in production
    if (process.env.NODE_ENV !== 'production') {
      logger.debug('Web Vitals (dev):', report);
      return;
    }

    // Send to your analytics endpoint
    const endpoint = '/api/analytics/web-vitals';
    
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(report),
    });
  } catch (error: any) {
    logger.error('Failed to send Web Vitals:', error);
  }
}

/**
 * Report Web Vitals metric
 */
function reportWebVital(metric: Metric) {
  const report: WebVitalsReport = {
    metric: metric.name,
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    rating: getRating(metric.name, metric.value),
    id: metric.id,
    navigationType: metric.navigationType || 'navigate',
    delta: metric.delta,
    entries: metric.entries,
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    const emoji = report.rating === 'good' ? '✅' : report.rating === 'poor' ? '🔴' : '🟡';
    logger.debug(`${emoji} ${metric.name}: ${report.value}ms (${report.rating})`);
  }

  // Send to analytics
  sendToAnalytics(report);

  // Send to Google Analytics if available
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
      metric_rating: report.rating,
    });
  }
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize Web Vitals monitoring
 */
export function initWebVitals() {
  if (typeof window === 'undefined') return;

  // Core Web Vitals
  getCLS(reportWebVital);   // Cumulative Layout Shift
  getFID(reportWebVital);   // First Input Delay
  getLCP(reportWebVital);   // Largest Contentful Paint

  // Additional metrics
  getFCP(reportWebVital);   // First Contentful Paint
  getTTFB(reportWebVital);  // Time to First Byte
}

// ============================================
// CUSTOM METRICS
// ============================================

/**
 * Track custom performance metric
 */
export function trackCustomMetric(name: string, value: number, unit: string = 'ms') {
  const report = {
    metric: `custom_${name}`,
    value,
    unit,
    timestamp: Date.now(),
    url: window.location.href,
  };

  if (process.env.NODE_ENV === 'development') {
    logger.debug(`Custom Metric - ${name}: ${value}${unit}`);
  }

  // Send to analytics
  sendToAnalytics(report as any);
}

/**
 * Measure performance of an async operation
 */
export async function measurePerformance<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await operation();
    const duration = performance.now() - startTime;
    
    trackCustomMetric(name, duration);
    
    return result;
  } catch (error: any) {
    const duration = performance.now() - startTime;
    trackCustomMetric(`${name}_error`, duration);
    throw error;
  }
}

// ============================================
// PERFORMANCE OBSERVER
// ============================================

/**
 * Observe long tasks (blocking main thread)
 */
export function observeLongTasks() {
  if (typeof window === 'undefined' || !window.PerformanceObserver) return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {  // Tasks longer than 50ms
          logger.warn('Long task detected:', {
            duration: entry.duration,
            startTime: entry.startTime,
            name: entry.name,
          });

          // Track as custom metric
          trackCustomMetric('long_task', entry.duration);
        }
      }
    });

    observer.observe({ entryTypes: ['longtask'] });
  } catch (error: any) {
    logger.error('Failed to setup long task observer:', error);
  }
}

// ============================================
// RESOURCE TIMING
// ============================================

/**
 * Get resource loading metrics
 */
export function getResourceMetrics() {
  if (typeof window === 'undefined' || !window.performance) return [];

  const resources = window.performance.getEntriesByType('resource');
  
  return resources.map(resource => ({
    name: resource.name,
    type: (resource as any).initiatorType,
    duration: resource.duration,
    size: (resource as any).transferSize || 0,
    cached: (resource as any).transferSize === 0,
  }));
}

/**
 * Track slow resources
 */
export function trackSlowResources(threshold: number = 1000) {
  const resources = getResourceMetrics();
  
  resources.forEach(resource => {
    if (resource.duration > threshold) {
      logger.warn('Slow resource:', resource);
      trackCustomMetric(`slow_resource_${resource.type}`, resource.duration);
    }
  });
}

// ============================================
// PAGE LOAD METRICS
// ============================================

/**
 * Get page load metrics
 */
export function getPageLoadMetrics() {
  if (typeof window === 'undefined' || !window.performance?.timing) return null;

  const timing = window.performance.timing;
  const now = Date.now();

  return {
    // DNS lookup
    dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
    
    // TCP connection
    tcpConnection: timing.connectEnd - timing.connectStart,
    
    // Request to response
    serverResponse: timing.responseStart - timing.requestStart,
    
    // Download time
    downloadTime: timing.responseEnd - timing.responseStart,
    
    // DOM processing
    domProcessing: timing.domComplete - timing.domLoading,
    
    // Page load complete
    pageLoadTime: timing.loadEventEnd - timing.navigationStart,
    
    // Time to interactive (approximate)
    timeToInteractive: timing.domInteractive - timing.navigationStart,
  };
}

// ============================================
// EXPORTS
// ============================================

const WebVitalsUtils = {
  initWebVitals,
  trackCustomMetric,
  measurePerformance,
  observeLongTasks,
  getResourceMetrics,
  trackSlowResources,
  getPageLoadMetrics,
  WEB_VITALS_THRESHOLDS,
};

export default WebVitalsUtils;

// Type definitions for global
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}