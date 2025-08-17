/**
 * Performance Monitoring System
 * Phase 3.2: Comprehensive performance tracking and monitoring
 * Part of Enterprise Code Quality Plan Phase 3
 */

import { logger } from '@/lib/logger';

// Performance metric types
interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'render' | 'network' | 'memory' | 'user-interaction' | 'database' | 'cache';
  tags?: Record<string, string>;
  userId?: string;
  sessionId?: string;
}

interface CoreWebVitals {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
  INP?: number; // Interaction to Next Paint
}

interface ResourceTiming {
  name: string;
  duration: number;
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
  initiatorType: string;
}

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
}

interface NavigationTiming {
  domContentLoaded: number;
  loadComplete: number;
  firstPaint: number;
  firstContentfulPaint: number;
  startTime: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private observer: PerformanceObserver | null = null;
  private isEnabled: boolean = true;
  private sessionId: string = '';
  private userId?: string;
  private maxMetricsSize = 1000;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeObserver();
    this.startMemoryMonitoring();
    this.setupWebVitalsTracking();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Initialize performance observer
   */
  private initializeObserver(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          this.processPerformanceEntry(entry);
        });
      });

      // Observe different types of performance entries
      this.observer.observe({ 
        entryTypes: ['navigation', 'resource', 'measure', 'mark', 'paint', 'layout-shift', 'first-input'] 
      });

    } catch (error) {
      logger.error("Failed to initialize PerformanceObserver:", error as Error);
    }
  }

  /**
   * Process performance entries
   */
  private processPerformanceEntry(entry: PerformanceEntry): void {
    const timestamp = Date.now();

    switch (entry.entryType) {
      case 'navigation':
        this.handleNavigationEntry(entry as PerformanceNavigationTiming, timestamp);
        break;
      case 'resource':
        this.handleResourceEntry(entry as PerformanceResourceTiming, timestamp);
        break;
      case 'paint':
        this.handlePaintEntry(entry, timestamp);
        break;
      case 'layout-shift':
        this.handleLayoutShiftEntry(entry as any, timestamp);
        break;
      case 'first-input':
        this.handleFirstInputEntry(entry as any, timestamp);
        break;
      case 'measure':
      case 'mark':
        this.handleUserTimingEntry(entry, timestamp);
        break;
    }
  }

  /**
   * Handle navigation timing
   */
  private handleNavigationEntry(entry: PerformanceNavigationTiming, timestamp: number): void {
    const navigationMetrics = [
      { name: 'navigation.domContentLoaded', value: entry.domContentLoadedEventEnd - entry.startTime },
      { name: 'navigation.loadComplete', value: entry.loadEventEnd - entry.startTime },
      { name: 'navigation.firstByte', value: entry.responseStart - entry.startTime },
      { name: 'navigation.domInteractive', value: entry.domInteractive - entry.startTime },
      { name: 'navigation.domComplete', value: entry.domComplete - entry.startTime },
    ];

    navigationMetrics.forEach(metric => {
      this.recordMetric({
        name: metric.name,
        value: metric.value,
        timestamp,
        category: 'network',
        sessionId: this.sessionId,
        userId: this.userId,
      });
    });
  }

  /**
   * Handle resource timing
   */
  private handleResourceEntry(entry: PerformanceResourceTiming, timestamp: number): void {
    // Only track significant resources
    if (entry.duration < 10) return;

    this.recordMetric({
      name: 'resource.duration',
      value: entry.duration,
      timestamp,
      category: 'network',
      tags: {
        resourceType: entry.initiatorType,
        resourceName: entry.name.split('/').pop() || entry.name,
        transferSize: entry.transferSize.toString(),
      },
      sessionId: this.sessionId,
      userId: this.userId,
    });
  }

  /**
   * Handle paint timing
   */
  private handlePaintEntry(entry: PerformanceEntry, timestamp: number): void {
    this.recordMetric({
      name: `paint.${entry.name.replace('-', '_')}`,
      value: entry.startTime,
      timestamp,
      category: 'render',
      sessionId: this.sessionId,
      userId: this.userId,
    });
  }

  /**
   * Handle layout shift
   */
  private handleLayoutShiftEntry(entry: any, timestamp: number): void {
    this.recordMetric({
      name: 'layout.shift',
      value: entry.value,
      timestamp,
      category: 'render',
      tags: {
        hadRecentInput: entry.hadRecentInput?.toString(),
      },
      sessionId: this.sessionId,
      userId: this.userId,
    });
  }

  /**
   * Handle first input delay
   */
  private handleFirstInputEntry(entry: any, timestamp: number): void {
    this.recordMetric({
      name: 'interaction.firstInputDelay',
      value: entry.processingStart - entry.startTime,
      timestamp,
      category: 'user-interaction',
      sessionId: this.sessionId,
      userId: this.userId,
    });
  }

  /**
   * Handle user timing marks and measures
   */
  private handleUserTimingEntry(entry: PerformanceEntry, timestamp: number): void {
    this.recordMetric({
      name: `timing.${entry.name}`,
      value: entry.entryType === 'measure' ? entry.duration : entry.startTime,
      timestamp,
      category: 'user-interaction',
      sessionId: this.sessionId,
      userId: this.userId,
    });
  }

  /**
   * Setup Web Vitals tracking
   */
  private setupWebVitalsTracking(): void {
    if (typeof window === 'undefined') return;

    // Track Largest Contentful Paint
    this.trackLCP();
    
    // Track Cumulative Layout Shift
    this.trackCLS();

    // Track Interaction to Next Paint (if supported)
    this.trackINP();
  }

  /**
   * Track Largest Contentful Paint
   */
  private trackLCP(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.recordMetric({
          name: 'webVitals.LCP',
          value: lastEntry.startTime,
          timestamp: Date.now(),
          category: 'render',
          sessionId: this.sessionId,
          userId: this.userId,
        });
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      logger.error("Failed to track LCP:", error as Error);
    }
  }

  /**
   * Track Cumulative Layout Shift
   */
  private trackCLS(): void {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;
    let sessionValue = 0;
    let sessionEntries: any[] = [];

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            const firstSessionEntry = sessionEntries[0];
            const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

            if (sessionValue &&
                entry.startTime - lastSessionEntry.startTime < 1000 &&
                entry.startTime - firstSessionEntry.startTime < 5000) {
              sessionValue += (entry as any).value;
              sessionEntries.push(entry);
            } else {
              sessionValue = (entry as any).value;
              sessionEntries = [entry];
            }

            if (sessionValue > clsValue) {
              clsValue = sessionValue;
              
              this.recordMetric({
                name: 'webVitals.CLS',
                value: clsValue,
                timestamp: Date.now(),
                category: 'render',
                sessionId: this.sessionId,
                userId: this.userId,
              });
            }
          }
        }
      });

      observer.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      logger.error("Failed to track CLS:", error as Error);
    }
  }

  /**
   * Track Interaction to Next Paint
   */
  private trackINP(): void {
    // This is a newer metric, may not be supported in all browsers
    if (typeof window === 'undefined' || !('PerformanceEventTiming' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: 'webVitals.INP',
            value: (entry as any).processingStart - entry.startTime,
            timestamp: Date.now(),
            category: 'user-interaction',
            sessionId: this.sessionId,
            userId: this.userId,
          });
        }
      });

      observer.observe({ entryTypes: ['first-input', 'event'] });
    } catch (error) {
      logger.error("Failed to track INP:", error as Error);
    }
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    if (typeof window === 'undefined' || !(performance as any).memory) return;

    const collectMemoryInfo = () => {
      const memory = (performance as any).memory;
      
      this.recordMetric({
        name: 'memory.usedJSHeapSize',
        value: memory.usedJSHeapSize,
        timestamp: Date.now(),
        category: 'memory',
        sessionId: this.sessionId,
        userId: this.userId,
      });

      this.recordMetric({
        name: 'memory.totalJSHeapSize',
        value: memory.totalJSHeapSize,
        timestamp: Date.now(),
        category: 'memory',
        sessionId: this.sessionId,
        userId: this.userId,
      });
    };

    // Collect memory info every 30 seconds
    setInterval(collectMemoryInfo, 30000);
    
    // Collect initial reading
    collectMemoryInfo();
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: Omit<PerformanceMetric, 'timestamp' | 'sessionId'> & { timestamp?: number; sessionId?: string }): void {
    if (!this.isEnabled) return;

    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: metric.timestamp || Date.now(),
      sessionId: metric.sessionId || this.sessionId,
      userId: metric.userId || this.userId,
    };

    this.metrics.push(fullMetric);

    // Keep metrics array size manageable
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics = this.metrics.slice(-this.maxMetricsSize);
    }

    // Log significant performance issues
    this.checkPerformanceThresholds(fullMetric);
  }

  /**
   * Check performance thresholds and alert
   */
  private checkPerformanceThresholds(metric: PerformanceMetric): void {
    const thresholds = {
      'webVitals.LCP': 2500, // 2.5 seconds
      'webVitals.FID': 100,  // 100ms
      'webVitals.CLS': 0.1,  // 0.1
      'navigation.firstByte': 600, // 600ms
      'navigation.domContentLoaded': 1500, // 1.5 seconds
    };

    const threshold = thresholds[metric.name as keyof typeof thresholds];
    
    if (threshold && metric.value > threshold) {
      logger.warn(`[Performance] ${metric.name} exceeded threshold: ${metric.value} > ${threshold}`, {
        metric,
        userId: this.userId,
        sessionId: this.sessionId,
      });
    }
  }

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Create performance mark
   */
  mark(name: string): void {
    if (typeof window === 'undefined' || !performance.mark) return;
    
    try {
      performance.mark(name);
    } catch (error) {
      logger.error("Failed to create performance mark: ${name}", error as Error);
    }
  }

  /**
   * Create performance measure
   */
  measure(name: string, startMark?: string, endMark?: string): void {
    if (typeof window === 'undefined' || !performance.measure) return;
    
    try {
      performance.measure(name, startMark, endMark);
    } catch (error) {
      logger.error("Failed to create performance measure: ${name}", error as Error);
    }
  }

  /**
   * Time function execution
   */
  timeFunction<T>(name: string, fn: () => T): T {
    const startTime = performance.now();
    const result = fn();
    const duration = performance.now() - startTime;

    this.recordMetric({
      name: `function.${name}`,
      value: duration,
      category: 'user-interaction',
    });

    return result;
  }

  /**
   * Time async function execution
   */
  async timeAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    const result = await fn();
    const duration = performance.now() - startTime;

    this.recordMetric({
      name: `async.${name}`,
      value: duration,
      category: 'user-interaction',
    });

    return result;
  }

  /**
   * Get performance metrics
   */
  getMetrics(filter?: Partial<PerformanceMetric>): PerformanceMetric[] {
    if (!filter) return [...this.metrics];

    return this.metrics.filter(metric => {
      return Object.entries(filter).every(([key, value]) => {
        return metric[key as keyof PerformanceMetric] === value;
      });
    });
  }

  /**
   * Get Core Web Vitals
   */
  getCoreWebVitals(): CoreWebVitals {
    const vitals: CoreWebVitals = {};
    
    const lcpMetric = this.metrics.find(m => m.name === 'webVitals.LCP');
    if (lcpMetric) vitals.LCP = lcpMetric.value;

    const fidMetric = this.metrics.find(m => m.name === 'interaction.firstInputDelay');
    if (fidMetric) vitals.FID = fidMetric.value;

    const clsMetric = this.metrics.find(m => m.name === 'webVitals.CLS');
    if (clsMetric) vitals.CLS = clsMetric.value;

    const fcpMetric = this.metrics.find(m => m.name === 'paint.first_contentful_paint');
    if (fcpMetric) vitals.FCP = fcpMetric.value;

    const ttfbMetric = this.metrics.find(m => m.name === 'navigation.firstByte');
    if (ttfbMetric) vitals.TTFB = ttfbMetric.value;

    return vitals;
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    totalMetrics: number;
    categories: Record<string, number>;
    webVitals: CoreWebVitals;
    averageLoadTime: number;
    memoryUsage?: number;
  } {
    const categories: Record<string, number> = {};
    let totalLoadTime = 0;
    let loadTimeCount = 0;

    this.metrics.forEach(metric => {
      categories[metric.category] = (categories[metric.category] || 0) + 1;
      
      if (metric.name.includes('navigation.') || metric.name.includes('resource.')) {
        totalLoadTime += metric.value;
        loadTimeCount++;
      }
    });

    const memoryMetric = this.metrics.find(m => m.name === 'memory.usedJSHeapSize');

    return {
      totalMetrics: this.metrics.length,
      categories,
      webVitals: this.getCoreWebVitals(),
      averageLoadTime: loadTimeCount > 0 ? totalLoadTime / loadTimeCount : 0,
      memoryUsage: memoryMetric?.value,
    };
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Disconnect observer
   */
  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// Singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Utility functions
export const performanceUtils = {
  // Mark component render start
  markRenderStart: (componentName: string) => {
    performanceMonitor.mark(`${componentName}_render_start`);
  },

  // Mark component render end and measure
  markRenderEnd: (componentName: string) => {
    performanceMonitor.mark(`${componentName}_render_end`);
    performanceMonitor.measure(
      `${componentName}_render`,
      `${componentName}_render_start`,
      `${componentName}_render_end`
    );
  },

  // Track API call performance
  trackApiCall: async <T>(url: string, apiCall: () => Promise<T>): Promise<T> => {
    return performanceMonitor.timeAsyncFunction(`api_${url.replace(/[^a-zA-Z0-9]/g, '_')}`, apiCall);
  },

  // Track user interaction
  trackInteraction: <T>(action: string, handler: () => T): T => {
    return performanceMonitor.timeFunction(`interaction_${action}`, handler);
  },

  // Send metrics to analytics service
  sendMetrics: async (endpoint: string = '/api/analytics/performance') => {
    try {
      const metrics = performanceMonitor.exportMetrics();
      const summary = performanceMonitor.getSummary();

      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics,
          summary,
          timestamp: Date.now(),
        }),
      });

      // Clear metrics after successful send
      performanceMonitor.clearMetrics();
    } catch (error) {
      logger.error("Failed to send performance metrics:", error as Error);
    }
  },
};

export type {
  PerformanceMetric,
  CoreWebVitals,
  ResourceTiming,
  MemoryInfo,
  NavigationTiming,
};