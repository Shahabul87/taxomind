import { logger } from '@/lib/logger';

// Performance budget monitoring and alerting system
"use client";

interface PerformanceBudget {
  name: string;
  limits: {
    bundleSize: number; // in bytes
    loadTime: number; // in milliseconds
    fcp: number; // First Contentful Paint in milliseconds
    lcp: number; // Largest Contentful Paint in milliseconds
    fid: number; // First Input Delay in milliseconds
    cls: number; // Cumulative Layout Shift score
    ttfb: number; // Time to First Byte in milliseconds
  };
  warnings: {
    bundleSize: number;
    loadTime: number;
    fcp: number;
    lcp: number;
    fid: number;
    cls: number;
    ttfb: number;
  };
}

interface PerformanceMetrics {
  bundleSize: number;
  loadTime: number;
  fcp: number;
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
  timestamp: number;
}

interface BudgetViolation {
  metric: string;
  actual: number;
  limit: number;
  severity: 'warning' | 'error';
  timestamp: number;
}

// Define performance budgets for different route types
const PERFORMANCE_BUDGETS: Record<string, PerformanceBudget> = {
  homepage: {
    name: 'Homepage',
    limits: {
      bundleSize: 500 * 1024, // 500KB
      loadTime: 2000, // 2 seconds
      fcp: 1500, // 1.5 seconds
      lcp: 2500, // 2.5 seconds
      fid: 100, // 100ms
      cls: 0.1, // 0.1 score
      ttfb: 800, // 800ms
    },
    warnings: {
      bundleSize: 400 * 1024, // 400KB
      loadTime: 1500, // 1.5 seconds
      fcp: 1000, // 1 second
      lcp: 2000, // 2 seconds
      fid: 50, // 50ms
      cls: 0.05, // 0.05 score
      ttfb: 600, // 600ms
    },
  },
  dashboard: {
    name: 'Dashboard',
    limits: {
      bundleSize: 800 * 1024, // 800KB
      loadTime: 3000, // 3 seconds
      fcp: 2000, // 2 seconds
      lcp: 3000, // 3 seconds
      fid: 200, // 200ms
      cls: 0.15, // 0.15 score
      ttfb: 1000, // 1 second
    },
    warnings: {
      bundleSize: 600 * 1024, // 600KB
      loadTime: 2000, // 2 seconds
      fcp: 1500, // 1.5 seconds
      lcp: 2500, // 2.5 seconds
      fid: 100, // 100ms
      cls: 0.1, // 0.1 score
      ttfb: 800, // 800ms
    },
  },
  Course: {
    name: 'Course Learning',
    limits: {
      bundleSize: 1200 * 1024, // 1.2MB
      loadTime: 4000, // 4 seconds
      fcp: 2500, // 2.5 seconds
      lcp: 4000, // 4 seconds
      fid: 300, // 300ms
      cls: 0.2, // 0.2 score
      ttfb: 1200, // 1.2 seconds
    },
    warnings: {
      bundleSize: 1000 * 1024, // 1MB
      loadTime: 3000, // 3 seconds
      fcp: 2000, // 2 seconds
      lcp: 3000, // 3 seconds
      fid: 200, // 200ms
      cls: 0.15, // 0.15 score
      ttfb: 1000, // 1 second
    },
  },
  teacher: {
    name: 'Teacher Tools',
    limits: {
      bundleSize: 1000 * 1024, // 1MB
      loadTime: 3500, // 3.5 seconds
      fcp: 2000, // 2 seconds
      lcp: 3500, // 3.5 seconds
      fid: 250, // 250ms
      cls: 0.18, // 0.18 score
      ttfb: 1100, // 1.1 seconds
    },
    warnings: {
      bundleSize: 800 * 1024, // 800KB
      loadTime: 2500, // 2.5 seconds
      fcp: 1500, // 1.5 seconds
      lcp: 2800, // 2.8 seconds
      fid: 150, // 150ms
      cls: 0.12, // 0.12 score
      ttfb: 900, // 900ms
    },
  },
  analytics: {
    name: 'Analytics',
    limits: {
      bundleSize: 900 * 1024, // 900KB
      loadTime: 3000, // 3 seconds
      fcp: 2000, // 2 seconds
      lcp: 3000, // 3 seconds
      fid: 200, // 200ms
      cls: 0.15, // 0.15 score
      ttfb: 1000, // 1 second
    },
    warnings: {
      bundleSize: 700 * 1024, // 700KB
      loadTime: 2000, // 2 seconds
      fcp: 1500, // 1.5 seconds
      lcp: 2500, // 2.5 seconds
      fid: 100, // 100ms
      cls: 0.1, // 0.1 score
      ttfb: 800, // 800ms
    },
  },
};

class PerformanceBudgetMonitor {
  private violations: BudgetViolation[] = [];
  private metrics: PerformanceMetrics[] = [];
  private alertCallbacks: Array<(violation: BudgetViolation) => void> = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeMonitoring();
    }
  }

  private initializeMonitoring() {
    // Monitor Core Web Vitals
    this.observeWebVitals();
    
    // Monitor bundle size
    this.observeBundleSize();
    
    // Monitor load times
    this.observeLoadTimes();
  }

  private observeWebVitals() {
    // First Contentful Paint
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            this.recordMetric('fcp', entry.startTime);
          }
        });
      });
      observer.observe({ entryTypes: ['paint'] });
    }

    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('lcp', lastEntry.startTime);
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }

    // First Input Delay
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.name === 'first-input') {
            const fid = (entry as any).processingStart - entry.startTime;
            this.recordMetric('fid', fid);
          }
        });
      });
      observer.observe({ entryTypes: ['first-input'] });
    }

    // Cumulative Layout Shift
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });
        this.recordMetric('cls', clsValue);
      });
      observer.observe({ entryTypes: ['layout-shift'] });
    }

    // Time to First Byte
    window.addEventListener('load', () => {
      const navigationEntries = performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const navigation = navigationEntries[0] as PerformanceNavigationTiming;
        const ttfb = navigation.responseStart - navigation.fetchStart;
        this.recordMetric('ttfb', ttfb);
      }
    });
  }

  private observeBundleSize() {
    window.addEventListener('load', () => {
      const resources = performance.getEntriesByType('resource');
      let totalSize = 0;
      
      resources.forEach((resource) => {
        if (resource.name.includes('/_next/') && 'transferSize' in resource) {
          totalSize += (resource as PerformanceResourceTiming).transferSize || 0;
        }
      });
      
      this.recordMetric('bundleSize', totalSize);
    });
  }

  private observeLoadTimes() {
    window.addEventListener('load', () => {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      this.recordMetric('loadTime', loadTime);
    });
  }

  private recordMetric(metric: keyof PerformanceMetrics, value: number) {
    const routeType = this.detectRouteType();
    const budget = PERFORMANCE_BUDGETS[routeType];
    
    if (!budget) return;

    // Check for violations
    if (value > budget.limits[metric]) {
      this.recordViolation({
        metric,
        actual: value,
        limit: budget.limits[metric],
        severity: 'error',
        timestamp: Date.now(),
      });
    } else if (value > budget.warnings[metric]) {
      this.recordViolation({
        metric,
        actual: value,
        limit: budget.warnings[metric],
        severity: 'warning',
        timestamp: Date.now(),
      });
    }

    // Store metric
    this.storeMetric(metric, value);
  }

  private detectRouteType(): string {
    const path = window.location.pathname;
    
    if (path === '/') return 'homepage';
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/courses/') && path.includes('/learn/')) return 'course';
    if (path.includes('/teacher/')) return 'teacher';
    if (path.includes('/analytics/')) return 'analytics';
    
    return 'homepage'; // default
  }

  private recordViolation(violation: BudgetViolation) {
    this.violations.push(violation);
    
    // Trigger alerts
    this.alertCallbacks.forEach(callback => callback(violation));
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      logger.warn(
        `Performance Budget Violation: ${violation.metric} = ${violation.actual} (limit: ${violation.limit})`
      );
    }
  }

  private storeMetric(metric: keyof PerformanceMetrics, value: number) {
    const existingMetric = this.metrics.find(m => m.timestamp === Date.now());
    if (existingMetric) {
      existingMetric[metric] = value;
    } else {
      this.metrics.push({
        bundleSize: 0,
        loadTime: 0,
        fcp: 0,
        lcp: 0,
        fid: 0,
        cls: 0,
        ttfb: 0,
        timestamp: Date.now(),
        [metric]: value,
      });
    }
  }

  // Public methods
  public onAlert(callback: (violation: BudgetViolation) => void) {
    this.alertCallbacks.push(callback);
  }

  public getViolations(): BudgetViolation[] {
    return [...this.violations];
  }

  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  public getBudgetForRoute(routeType: string): PerformanceBudget | null {
    return PERFORMANCE_BUDGETS[routeType] || null;
  }

  public generateReport(): string {
    const routeType = this.detectRouteType();
    const budget = PERFORMANCE_BUDGETS[routeType];
    const latestMetrics = this.metrics[this.metrics.length - 1];
    
    if (!budget || !latestMetrics) return 'No data available';

    const report = {
      route: routeType,
      budget: budget.name,
      timestamp: new Date().toISOString(),
      metrics: latestMetrics,
      violations: this.violations.filter(v => v.timestamp > Date.now() - 5 * 60 * 1000), // Last 5 minutes
      scores: {
        bundleSize: this.calculateScore(latestMetrics.bundleSize, budget.limits.bundleSize),
        loadTime: this.calculateScore(latestMetrics.loadTime, budget.limits.loadTime),
        fcp: this.calculateScore(latestMetrics.fcp, budget.limits.fcp),
        lcp: this.calculateScore(latestMetrics.lcp, budget.limits.lcp),
        fid: this.calculateScore(latestMetrics.fid, budget.limits.fid),
        cls: this.calculateScore(latestMetrics.cls, budget.limits.cls),
        ttfb: this.calculateScore(latestMetrics.ttfb, budget.limits.ttfb),
      },
    };

    return JSON.stringify(report, null, 2);
  }

  private calculateScore(actual: number, limit: number): number {
    return Math.max(0, Math.min(100, 100 - (actual / limit) * 100));
  }

  public clearData() {
    this.violations = [];
    this.metrics = [];
  }
}

// Singleton instance
let performanceBudgetMonitor: PerformanceBudgetMonitor | null = null;

export function getPerformanceBudgetMonitor(): PerformanceBudgetMonitor {
  if (!performanceBudgetMonitor) {
    performanceBudgetMonitor = new PerformanceBudgetMonitor();
  }
  return performanceBudgetMonitor;
}

// React hook for performance monitoring (import React in consuming component)
export function usePerformanceBudget() {
  const monitor = getPerformanceBudgetMonitor();
  
  if (typeof window === 'undefined') {
    return {
      violations: [],
      getReport: () => 'No data available',
      clearData: () => {},
    };
  }
  
  return {
    violations: monitor.getViolations(),
    getReport: () => monitor.generateReport(),
    clearData: () => monitor.clearData(),
  };
}

// Performance budget configuration
export { PERFORMANCE_BUDGETS, PerformanceBudgetMonitor };

// Auto-initialize monitoring in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  getPerformanceBudgetMonitor();
}