// Bundle analysis and monitoring utilities
"use client";

interface BundleMetrics {
  totalSize: number;
  chunks: Record<string, number>;
  loadTimes: Record<string, number>;
  errors: string[];
  timestamp: number;
}

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

class BundleAnalyzer {
  private metrics: BundleMetrics;
  private performanceObserver: PerformanceObserver | null = null;
  private resourceObserver: PerformanceObserver | null = null;

  constructor() {
    this.metrics = {
      totalSize: 0,
      chunks: {},
      loadTimes: {},
      errors: [],
      timestamp: Date.now(),
    };

    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    // Performance observer for resource loading
    if ('PerformanceObserver' in window) {
      this.resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name.includes('/_next/') || entry.name.includes('.js') || entry.name.includes('.css')) {
            this.trackResource(entry);
          }
        });
      });

      this.resourceObserver.observe({ entryTypes: ['resource'] });

      // Performance observer for navigation timing
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            this.trackNavigation(entry as PerformanceNavigationTiming);
          }
        });
      });

      this.performanceObserver.observe({ entryTypes: ['navigation'] });
    }
  }

  private trackResource(entry: PerformanceEntry) {
    const resourceEntry = entry as PerformanceResourceTiming;
    const name = this.getResourceName(resourceEntry.name);
    
    this.metrics.loadTimes[name] = resourceEntry.duration;
    
    // Estimate size from transfer size
    if ('transferSize' in resourceEntry) {
      this.metrics.chunks[name] = resourceEntry.transferSize || 0;
      this.metrics.totalSize += resourceEntry.transferSize || 0;
    }
  }

  private trackNavigation(entry: PerformanceNavigationTiming) {
    this.metrics.loadTimes.navigation = entry.loadEventEnd - entry.fetchStart;
    this.metrics.loadTimes.domContentLoaded = entry.domContentLoadedEventEnd - entry.fetchStart;
    this.metrics.loadTimes.firstByte = entry.responseStart - entry.fetchStart;
  }

  private getResourceName(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // Extract meaningful chunk names
      if (pathname.includes('/_next/static/chunks/')) {
        const chunkMatch = pathname.match(/chunks\/(.+)\.js$/);
        return chunkMatch ? `chunk-${chunkMatch[1]}` : 'unknown-chunk';
      }
      
      if (pathname.includes('/_next/static/css/')) {
        return 'css-bundle';
      }
      
      if (pathname.includes('/_next/static/js/')) {
        return 'js-bundle';
      }
      
      return pathname.split('/').pop() || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  // Public methods
  public trackCustomMetric(name: string, value: number) {
    this.metrics.chunks[name] = value;
  }

  public trackError(error: string) {
    this.metrics.errors.push(error);
  }

  public getMetrics(): BundleMetrics {
    return { ...this.metrics };
  }

  public getCoreWebVitals(): Promise<PerformanceMetrics> {
    return new Promise((resolve) => {
      const metrics: Partial<PerformanceMetrics> = {};

      // Get FCP
      if ('performance' in window) {
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          metrics.fcp = fcpEntry.startTime;
        }
      }

      // Get LCP
      if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          metrics.lcp = lastEntry.startTime;
        });

        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      }

      // Get FID
      if ('PerformanceObserver' in window) {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'first-input') {
              metrics.fid = (entry as any).processingStart - entry.startTime;
            }
          });
        });

        fidObserver.observe({ entryTypes: ['first-input'] });
      }

      // Get CLS
      if ('PerformanceObserver' in window) {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          });
          metrics.cls = clsValue;
        });

        clsObserver.observe({ entryTypes: ['layout-shift'] });
      }

      // Get TTFB
      if ('performance' in window) {
        const navigationEntries = performance.getEntriesByType('navigation');
        if (navigationEntries.length > 0) {
          const navigation = navigationEntries[0] as PerformanceNavigationTiming;
          metrics.ttfb = navigation.responseStart - navigation.fetchStart;
        }
      }

      // Return metrics after a delay to allow observers to collect data
      setTimeout(() => {
        resolve({
          fcp: metrics.fcp || 0,
          lcp: metrics.lcp || 0,
          fid: metrics.fid || 0,
          cls: metrics.cls || 0,
          ttfb: metrics.ttfb || 0,
        });
      }, 1000);
    });
  }

  public generateReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      summary: {
        totalBundleSize: this.formatBytes(this.metrics.totalSize),
        chunkCount: Object.keys(this.metrics.chunks).length,
        averageLoadTime: this.calculateAverageLoadTime(),
        errorCount: this.metrics.errors.length,
      },
      recommendations: this.generateRecommendations(),
    };

    return JSON.stringify(report, null, 2);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private calculateAverageLoadTime(): number {
    const times = Object.values(this.metrics.loadTimes);
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Check bundle size
    if (this.metrics.totalSize > 1024 * 1024) { // 1MB
      recommendations.push('Bundle size is large. Consider code splitting and lazy loading.');
    }

    // Check load times
    const avgLoadTime = this.calculateAverageLoadTime();
    if (avgLoadTime > 1000) { // 1 second
      recommendations.push('Average load time is high. Consider optimizing resource loading.');
    }

    // Check chunk count
    const chunkCount = Object.keys(this.metrics.chunks).length;
    if (chunkCount > 20) {
      recommendations.push('Too many chunks. Consider consolidating smaller chunks.');
    }

    // Check errors
    if (this.metrics.errors.length > 0) {
      recommendations.push('Bundle loading errors detected. Check network and resource availability.');
    }

    return recommendations;
  }

  public cleanup() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    if (this.resourceObserver) {
      this.resourceObserver.disconnect();
    }
  }
}

// Singleton instance
let bundleAnalyzer: BundleAnalyzer | null = null;

export function getBundleAnalyzer(): BundleAnalyzer {
  if (!bundleAnalyzer) {
    bundleAnalyzer = new BundleAnalyzer();
  }
  return bundleAnalyzer;
}

// Utility functions
export function trackBundleMetrics() {
  const analyzer = getBundleAnalyzer();
  
  // Track initial metrics
  if (typeof window !== 'undefined') {
    // Track initial bundle size from performance API
    window.addEventListener('load', () => {
      const resources = performance.getEntriesByType('resource');
      let totalSize = 0;
      
      resources.forEach((resource) => {
        if (resource.name.includes('/_next/') && 'transferSize' in resource) {
          totalSize += (resource as PerformanceResourceTiming).transferSize || 0;
        }
      });
      
      analyzer.trackCustomMetric('initial-bundle-size', totalSize);
    });
  }
  
  return analyzer;
}

export function reportBundleMetrics() {
  const analyzer = getBundleAnalyzer();
  const report = analyzer.generateReport();
  
  // Send to analytics or log
  if (process.env.NODE_ENV === 'development') {
}
  return report;
}

export function setupBundleMonitoring() {
  const analyzer = trackBundleMetrics();
  
  // Report metrics every 30 seconds in development
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      reportBundleMetrics();
    }, 30000);
  }
  
  // Cleanup on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      analyzer.cleanup();
    });
  }
  
  return analyzer;
}