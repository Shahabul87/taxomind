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
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        // Wait a bit to ensure all resources are loaded
        setTimeout(() => {
          trackSlowResources(1000); // Track resources taking > 1s
        }, 2000);
      });
    }
    
    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      window.addEventListener('load', () => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        const connectTime = perfData.responseEnd - perfData.requestStart;
        const renderTime = perfData.domComplete - perfData.domLoading;
        
        console.log('⚡ Performance Metrics:');
        console.log(`  Page Load Time: ${pageLoadTime}ms`);
        console.log(`  Connect Time: ${connectTime}ms`);
        console.log(`  Render Time: ${renderTime}ms`);
      });
    }
  }, []);

  // This component doesn't render anything
  return null;
}

export default PerformanceMonitor;