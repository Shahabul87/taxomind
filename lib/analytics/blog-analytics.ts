/**
 * Blog Analytics Tracking
 * Tracks user interactions with blog content
 */

import { logger } from '@/lib/logger';

export interface BlogAnalyticsEvent {
  event: string;
  properties: Record<string, unknown>;
  timestamp: number;
}

export interface BlogViewEvent {
  postId: string;
  postTitle: string;
  category?: string;
  referrer: string;
  viewDuration?: number;
}

export interface BlogSearchEvent {
  query: string;
  resultsCount: number;
  selectedFilters?: {
    category?: string;
    dateRange?: string;
    minViews?: number;
  };
}

export interface BlogFilterEvent extends Record<string, unknown> {
  filterType: 'category' | 'sort' | 'dateRange' | 'views';
  filterValue: string | number;
  resultsCount: number;
}

export interface BlogInteractionEvent extends Record<string, unknown> {
  action: 'load_more' | 'show_all' | 'view_mode_change' | 'bookmark' | 'share';
  postId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Track blog page view
 */
export function trackBlogPageView(): void {
  if (typeof window === 'undefined') return;

  try {
    const event: BlogAnalyticsEvent = {
      event: 'blog_page_view',
      properties: {
        url: window.location.href,
        referrer: document.referrer,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug('[ANALYTICS] Blog page view', event);
    }

    // Send to analytics service (placeholder)
    sendAnalyticsEvent(event);
  } catch (error) {
    logger.error('[ANALYTICS] Error tracking page view', error);
  }
}

/**
 * Track blog post view
 */
export function trackBlogPostView(data: BlogViewEvent): void {
  if (typeof window === 'undefined') return;

  try {
    const event: BlogAnalyticsEvent = {
      event: 'blog_post_view',
      properties: {
        ...data,
        url: window.location.href,
      },
      timestamp: Date.now(),
    };

    if (process.env.NODE_ENV === 'development') {
      logger.debug('[ANALYTICS] Blog post view', event);
    }

    sendAnalyticsEvent(event);
  } catch (error) {
    logger.error('[ANALYTICS] Error tracking post view', error);
  }
}

/**
 * Track search query
 */
export function trackBlogSearch(data: BlogSearchEvent): void {
  if (typeof window === 'undefined') return;

  try {
    const event: BlogAnalyticsEvent = {
      event: 'blog_search',
      properties: {
        ...data,
        searchLength: data.query.length,
      },
      timestamp: Date.now(),
    };

    if (process.env.NODE_ENV === 'development') {
      logger.debug('[ANALYTICS] Blog search', event);
    }

    sendAnalyticsEvent(event);
  } catch (error) {
    logger.error('[ANALYTICS] Error tracking search', error);
  }
}

/**
 * Track filter usage
 */
export function trackBlogFilter(data: BlogFilterEvent): void {
  if (typeof window === 'undefined') return;

  try {
    const event: BlogAnalyticsEvent = {
      event: 'blog_filter',
      properties: data,
      timestamp: Date.now(),
    };

    if (process.env.NODE_ENV === 'development') {
      logger.debug('[ANALYTICS] Blog filter', event);
    }

    sendAnalyticsEvent(event);
  } catch (error) {
    logger.error('[ANALYTICS] Error tracking filter', error);
  }
}

/**
 * Track user interactions
 */
export function trackBlogInteraction(data: BlogInteractionEvent): void {
  if (typeof window === 'undefined') return;

  try {
    const event: BlogAnalyticsEvent = {
      event: 'blog_interaction',
      properties: data,
      timestamp: Date.now(),
    };

    if (process.env.NODE_ENV === 'development') {
      logger.debug('[ANALYTICS] Blog interaction', event);
    }

    sendAnalyticsEvent(event);
  } catch (error) {
    logger.error('[ANALYTICS] Error tracking interaction', error);
  }
}

/**
 * Track reading time
 */
export function trackReadingTime(postId: string, duration: number): void {
  if (typeof window === 'undefined') return;

  try {
    const event: BlogAnalyticsEvent = {
      event: 'blog_reading_time',
      properties: {
        postId,
        duration,
        durationMinutes: Math.round(duration / 60000),
      },
      timestamp: Date.now(),
    };

    if (process.env.NODE_ENV === 'development') {
      logger.debug('[ANALYTICS] Reading time', event);
    }

    sendAnalyticsEvent(event);
  } catch (error) {
    logger.error('[ANALYTICS] Error tracking reading time', error);
  }
}

/**
 * Send analytics event to backend
 * This is a placeholder - integrate with your analytics service
 */
async function sendAnalyticsEvent(event: BlogAnalyticsEvent): Promise<void> {
  // Option 1: Send to your own analytics API
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(5_000),
    });
  } catch (error) {
    // Fail silently - don't disrupt user experience
    logger.debug('[ANALYTICS] Failed to send event', error);
  }

  // Option 2: Send to Google Analytics (if configured)
  if (typeof window !== 'undefined' && 'gtag' in window) {
    try {
      (window as any).gtag('event', event.event, event.properties);
    } catch (error) {
      logger.debug('[ANALYTICS] Failed to send to GA', error);
    }
  }

  // Option 3: Send to PostHog (if configured)
  if (typeof window !== 'undefined' && 'posthog' in window) {
    try {
      (window as any).posthog.capture(event.event, event.properties);
    } catch (error) {
      logger.debug('[ANALYTICS] Failed to send to PostHog', error);
    }
  }
}

/**
 * Debounce function for search tracking
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Hook for tracking page time
 */
export function usePageTimeTracking(postId?: string) {
  if (typeof window === 'undefined') return;

  const startTime = Date.now();

  // Track on unmount or page leave
  const trackTime = () => {
    const duration = Date.now() - startTime;
    if (postId && duration > 5000) {
      // Only track if user stayed > 5 seconds
      trackReadingTime(postId, duration);
    }
  };

  // Cleanup on unmount
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', trackTime);
    return () => {
      window.removeEventListener('beforeunload', trackTime);
      trackTime();
    };
  }
}

/**
 * Performance tracking
 */
export function trackPerformance(metric: string, value: number): void {
  if (typeof window === 'undefined') return;

  try {
    const event: BlogAnalyticsEvent = {
      event: 'blog_performance',
      properties: {
        metric,
        value,
        url: window.location.href,
      },
      timestamp: Date.now(),
    };

    if (process.env.NODE_ENV === 'development') {
      logger.debug('[ANALYTICS] Performance', event);
    }

    sendAnalyticsEvent(event);
  } catch (error) {
    logger.error('[ANALYTICS] Error tracking performance', error);
  }
}

/**
 * Track Core Web Vitals
 */
export function trackWebVitals(): void {
  if (typeof window === 'undefined') return;

  try {
    // Track Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        trackPerformance('LCP', entry.startTime);
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Track First Input Delay (FID)
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fidEntry = entry as PerformanceEventTiming;
        const fid = fidEntry.processingStart - fidEntry.startTime;
        trackPerformance('FID', fid);
      }
    }).observe({ entryTypes: ['first-input'] });

    // Track Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as any;
        if (!layoutShift.hadRecentInput) {
          clsValue += layoutShift.value;
        }
      }
      trackPerformance('CLS', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  } catch (error) {
    logger.error('[ANALYTICS] Error tracking web vitals', error);
  }
}
