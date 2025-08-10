import { logger } from '@/lib/logger';

'use client'

// Web Vitals thresholds (based on Google's Core Web Vitals)
const THRESHOLDS = {
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FID: { good: 100, needsImprovement: 300 },
  FCP: { good: 1800, needsImprovement: 3000 },
  LCP: { good: 2500, needsImprovement: 4000 },
  TTFB: { good: 800, needsImprovement: 1800 },
}

interface Metric {
  name: string
  value: number
  id: string
  delta?: number
}

// Performance rating based on thresholds
const getPerformanceRating = (metric: Metric): 'good' | 'needs-improvement' | 'poor' => {
  const threshold = THRESHOLDS[metric.name as keyof typeof THRESHOLDS]
  if (!threshold) return 'good'
  
  if (metric.value <= threshold.good) return 'good'
  if (metric.value <= threshold.needsImprovement) return 'needs-improvement'
  return 'poor'
}

// Send metric to analytics endpoint
const sendToAnalytics = async (metric: Metric) => {
  try {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      id: metric.id,
      url: window.location.pathname,
      timestamp: Date.now(),
      rating: getPerformanceRating(metric),
      delta: metric.delta || 0,
    })

    // Use navigator.sendBeacon if available for reliability
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/web-vitals', body)
    } else {
      fetch('/api/analytics/web-vitals', {
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/json',
        },
        keepalive: true,
      }).catch(console.error)
    }
  } catch (error) {
    logger.error('Failed to send web vitals:', error)
  }
}

// Initialize performance monitoring (only on client side)
export const initPerformanceMonitoring = async () => {
  if (typeof window === 'undefined') return

  try {
    // Dynamically import web-vitals only on client side
    const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals')
    
    // Start measuring Core Web Vitals
    getCLS(sendToAnalytics)
    getFID(sendToAnalytics)
    getFCP(sendToAnalytics)
    getLCP(sendToAnalytics)
    getTTFB(sendToAnalytics)

  } catch (error) {
    logger.error('Failed to initialize web vitals monitoring:', error)
  }
}

// Custom performance marks for measuring specific operations
export const markPerformance = (name: string) => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.mark(name)
  }
}

export const measurePerformance = (name: string, startMark: string, endMark?: string) => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    try {
      performance.measure(name, startMark, endMark)
      const measure = performance.getEntriesByName(name, 'measure')[0]
      
      if (measure) {
        sendToAnalytics({
          name: `custom.${name}`,
          value: measure.duration,
          id: `${Date.now()}-${Math.random()}`,
        })
      }
    } catch (error) {
      logger.error('Failed to measure performance:', error)
    }
  }
}

// Track navigation timing
export const trackNavigation = () => {
  if (typeof window === 'undefined') return

  window.addEventListener('load', () => {
    setTimeout(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      if (navigation) {
        // Track various navigation metrics
        const metrics = [
          { name: 'navigation.domContentLoaded', value: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart },
          { name: 'navigation.loadComplete', value: navigation.loadEventEnd - navigation.loadEventStart },
          { name: 'navigation.totalTime', value: navigation.loadEventEnd - navigation.fetchStart },
        ]

        metrics.forEach(metric => {
          if (metric.value > 0) {
            sendToAnalytics({
              ...metric,
              id: `nav-${Date.now()}-${Math.random()}`,
            })
          }
        })
      }
    }, 0)
  })
}

// Track resource loading performance
export const trackResourceTiming = () => {
  if (typeof window === 'undefined') return

  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === 'resource') {
        const resource = entry as PerformanceResourceTiming
        
        // Only track significant resources
        if (resource.duration > 100 && (
          resource.name.includes('.js') || 
          resource.name.includes('.css') ||
          resource.name.includes('/api/')
        )) {
          sendToAnalytics({
            name: 'resource.loadTime',
            value: resource.duration,
            id: `resource-${Date.now()}-${Math.random()}`,
          })
        }
      }
    })
  })

  try {
    observer.observe({ entryTypes: ['resource'] })
  } catch (error) {
    logger.error('Failed to observe resource timing:', error)
  }
}

// Initialize all performance monitoring
export const initAllPerformanceMonitoring = () => {
  if (typeof window === 'undefined') return

  initPerformanceMonitoring()
  trackNavigation()
  trackResourceTiming()
}