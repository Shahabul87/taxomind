'use client';

/**
 * Performance Monitor Component
 * Initializes Web Vitals tracking and provides performance context
 */

import { useEffect } from 'react';
import { initWebVitals, observeLongTasks, trackSlowResources } from '@/lib/web-vitals';

export function PerformanceMonitor() {
  useEffect(() => {
    // Initialize Web Vitals monitoring
    initWebVitals();

    // Observe long tasks that block the main thread
    observeLongTasks();

    // Track slow resources after page load
    const handleLoad = () => {
      setTimeout(() => {
        trackSlowResources(1000); // Track resources taking > 1s
      }, 2000);
    };

    // Dev-only performance logging
    const handleDevLoad = process.env.NODE_ENV === 'development'
      ? () => {
          const perfData = window.performance.timing;
          const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
          const connectTime = perfData.responseEnd - perfData.requestStart;
          const renderTime = perfData.domComplete - perfData.domLoading;
          console.log('Performance Metrics:');
          console.log(`  Page Load Time: ${pageLoadTime}ms`);
          console.log(`  Connect Time: ${connectTime}ms`);
          console.log(`  Render Time: ${renderTime}ms`);
        }
      : null;

    if (typeof window !== 'undefined') {
      window.addEventListener('load', handleLoad);
      if (handleDevLoad) {
        window.addEventListener('load', handleDevLoad);
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('load', handleLoad);
        if (handleDevLoad) {
          window.removeEventListener('load', handleDevLoad);
        }
      }
    };
  }, []);

  // This component doesn't render anything
  return null;
}

export default PerformanceMonitor;