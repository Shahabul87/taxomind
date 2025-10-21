import { logger } from '@/lib/logger';

/**
 * Enterprise-grade analytics tracking for course-related user actions
 * Tracks user behavior, engagement, and feature usage
 */

export interface AnalyticsEvent {
  eventName: string;
  userId?: string;
  properties?: Record<string, unknown>;
  timestamp: Date;
}

export interface CourseAnalyticsProperties {
  courseId?: string;
  courseTitle?: string;
  action?: string;
  source?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Track course view event
 */
export function trackCourseView(
  courseId: string,
  properties?: CourseAnalyticsProperties
): void {
  const event: AnalyticsEvent = {
    eventName: 'course_viewed',
    properties: {
      courseId,
      ...properties,
      source: properties?.source || 'teacher_dashboard',
    },
    timestamp: new Date(),
  };

  sendAnalyticsEvent(event);

  logger.info('Course view tracked', {
    courseId,
    source: properties?.source,
  });
}

/**
 * Track course creation
 */
export function trackCourseCreation(
  courseId: string,
  properties?: CourseAnalyticsProperties
): void {
  const event: AnalyticsEvent = {
    eventName: 'course_created',
    properties: {
      courseId,
      ...properties,
    },
    timestamp: new Date(),
  };

  sendAnalyticsEvent(event);

  logger.info('Course creation tracked', { courseId });
}

/**
 * Track course edit
 */
export function trackCourseEdit(
  courseId: string,
  properties?: CourseAnalyticsProperties
): void {
  const event: AnalyticsEvent = {
    eventName: 'course_edited',
    properties: {
      courseId,
      action: properties?.action || 'edit',
      ...properties,
    },
    timestamp: new Date(),
  };

  sendAnalyticsEvent(event);

  logger.info('Course edit tracked', { courseId, action: properties?.action });
}

/**
 * Track course deletion
 */
export function trackCourseDeletion(
  courseId: string,
  properties?: CourseAnalyticsProperties
): void {
  const event: AnalyticsEvent = {
    eventName: 'course_deleted',
    properties: {
      courseId,
      ...properties,
    },
    timestamp: new Date(),
  };

  sendAnalyticsEvent(event);

  logger.info('Course deletion tracked', { courseId });
}

/**
 * Track course publish/unpublish
 */
export function trackCoursePublishChange(
  courseId: string,
  isPublished: boolean,
  properties?: CourseAnalyticsProperties
): void {
  const event: AnalyticsEvent = {
    eventName: isPublished ? 'course_published' : 'course_unpublished',
    properties: {
      courseId,
      isPublished,
      ...properties,
    },
    timestamp: new Date(),
  };

  sendAnalyticsEvent(event);

  logger.info(`Course ${isPublished ? 'published' : 'unpublished'} tracked`, {
    courseId,
  });
}

/**
 * Track bulk operations
 */
export function trackBulkOperation(
  action: 'delete' | 'publish' | 'unpublish' | 'export',
  courseCount: number,
  properties?: CourseAnalyticsProperties
): void {
  const event: AnalyticsEvent = {
    eventName: `bulk_${action}`,
    properties: {
      action,
      courseCount,
      ...properties,
    },
    timestamp: new Date(),
  };

  sendAnalyticsEvent(event);

  logger.info('Bulk operation tracked', { action, courseCount });
}

/**
 * Track search usage
 */
export function trackSearch(
  searchQuery: string,
  resultsCount: number,
  properties?: CourseAnalyticsProperties
): void {
  const event: AnalyticsEvent = {
    eventName: 'courses_searched',
    properties: {
      searchQuery,
      resultsCount,
      searchLength: searchQuery.length,
      ...properties,
    },
    timestamp: new Date(),
  };

  sendAnalyticsEvent(event);

  logger.info('Search tracked', { searchQuery, resultsCount });
}

/**
 * Track filter usage
 */
export function trackFilterApplied(
  filterType: string,
  filterValue: string,
  properties?: CourseAnalyticsProperties
): void {
  const event: AnalyticsEvent = {
    eventName: 'filter_applied',
    properties: {
      filterType,
      filterValue,
      ...properties,
    },
    timestamp: new Date(),
  };

  sendAnalyticsEvent(event);

  logger.info('Filter tracked', { filterType, filterValue });
}

/**
 * Track export action
 */
export function trackExport(
  format: string,
  itemCount: number,
  properties?: CourseAnalyticsProperties
): void {
  const event: AnalyticsEvent = {
    eventName: 'courses_exported',
    properties: {
      format,
      itemCount,
      ...properties,
    },
    timestamp: new Date(),
  };

  sendAnalyticsEvent(event);

  logger.info('Export tracked', { format, itemCount });
}

/**
 * Track page view
 */
export function trackPageView(
  pageName: string,
  properties?: CourseAnalyticsProperties
): void {
  const event: AnalyticsEvent = {
    eventName: 'page_viewed',
    properties: {
      pageName,
      url: typeof window !== 'undefined' ? window.location.pathname : undefined,
      ...properties,
    },
    timestamp: new Date(),
  };

  sendAnalyticsEvent(event);

  logger.info('Page view tracked', { pageName });
}

/**
 * Track time spent on page
 */
export function trackTimeOnPage(
  pageName: string,
  duration: number,
  properties?: CourseAnalyticsProperties
): void {
  const event: AnalyticsEvent = {
    eventName: 'time_on_page',
    properties: {
      pageName,
      duration,
      durationMinutes: Math.round(duration / 60000),
      ...properties,
    },
    timestamp: new Date(),
  };

  sendAnalyticsEvent(event);

  logger.info('Time on page tracked', { pageName, duration });
}

/**
 * Track feature usage
 */
export function trackFeatureUsage(
  featureName: string,
  properties?: CourseAnalyticsProperties
): void {
  const event: AnalyticsEvent = {
    eventName: 'feature_used',
    properties: {
      featureName,
      ...properties,
    },
    timestamp: new Date(),
  };

  sendAnalyticsEvent(event);

  logger.info('Feature usage tracked', { featureName });
}

/**
 * Track errors
 */
export function trackError(
  errorType: string,
  errorMessage: string,
  properties?: CourseAnalyticsProperties
): void {
  const event: AnalyticsEvent = {
    eventName: 'error_occurred',
    properties: {
      errorType,
      errorMessage,
      ...properties,
    },
    timestamp: new Date(),
  };

  sendAnalyticsEvent(event);

  logger.error('Error tracked', { errorType, errorMessage });
}

/**
 * Send analytics event to tracking service
 * This is a placeholder - integrate with your analytics provider
 * (Google Analytics, Mixpanel, Amplitude, PostHog, etc.)
 */
function sendAnalyticsEvent(event: AnalyticsEvent): void {
  try {
    // Store in localStorage for development/debugging
    if (typeof window !== 'undefined') {
      const events = JSON.parse(
        localStorage.getItem('taxomind_analytics') || '[]'
      ) as AnalyticsEvent[];

      events.push(event);

      // Keep only last 100 events
      if (events.length > 100) {
        events.shift();
      }

      localStorage.setItem('taxomind_analytics', JSON.stringify(events));
    }

    // Send to server sink (non-blocking)
    try {
      if (typeof window !== 'undefined') {
        fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
          keepalive: true,
        }).catch(() => {});
      }
    } catch {}

    // TODO: Wire to external provider as needed

    // Google Analytics 4
    // if (typeof window !== 'undefined' && window.gtag) {
    //   window.gtag('event', event.eventName, event.properties);
    // }

    // Mixpanel
    // if (typeof window !== 'undefined' && window.mixpanel) {
    //   window.mixpanel.track(event.eventName, event.properties);
    // }

    // PostHog
    // if (typeof window !== 'undefined' && window.posthog) {
    //   window.posthog.capture(event.eventName, event.properties);
    // }

    // Amplitude
    // if (typeof window !== 'undefined' && window.amplitude) {
    //   window.amplitude.track(event.eventName, event.properties);
    // }

    // Custom API endpoint
    // fetch('/api/analytics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(event),
    // });
  } catch (error) {
    logger.error('Failed to send analytics event', {
      error: error instanceof Error ? error.message : 'Unknown error',
      eventName: event.eventName,
    });
  }
}

/**
 * Get analytics events from localStorage (for debugging)
 */
export function getAnalyticsEvents(): AnalyticsEvent[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const events = localStorage.getItem('taxomind_analytics');
    return events ? JSON.parse(events) : [];
  } catch (error) {
    logger.error('Failed to get analytics events', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return [];
  }
}

/**
 * Clear analytics events from localStorage
 */
export function clearAnalyticsEvents(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('taxomind_analytics');
    logger.info('Analytics events cleared');
  }
}

/**
 * Export analytics data for reporting
 */
export function exportAnalyticsData(): string {
  const events = getAnalyticsEvents();

  const csv = [
    ['Timestamp', 'Event Name', 'Properties'].join(','),
    ...events.map((event) =>
      [
        event.timestamp.toISOString(),
        event.eventName,
        JSON.stringify(event.properties || {}),
      ].join(',')
    ),
  ].join('\n');

  return csv;
}
