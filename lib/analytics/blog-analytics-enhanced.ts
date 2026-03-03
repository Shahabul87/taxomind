/**
 * Enhanced Blog Analytics Integration
 * Supports Google Analytics 4, Google Tag Manager, and custom analytics
 */

import { logger } from '@/lib/logger';

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  customParams?: Record<string, any>;
}

export interface PageViewEvent {
  page_path: string;
  page_title: string;
  page_location: string;
}

export interface ReadingAnalyticsEvent {
  postId: string;
  chapterId?: string;
  readingTime: number;
  scrollDepth: number;
  completionRate: number;
  readingMode?: string;
}

/**
 * Initialize Google Analytics 4
 */
export function initGA4(measurementId: string) {
  if (typeof window === "undefined") return;

  // Load GA4 script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer?.push(arguments);
  };

  window.gtag?.("js", new Date());
  window.gtag?.("config", measurementId, {
    page_path: window.location.pathname,
    send_page_view: true,
  });

  logger.info("[Analytics] GA4 initialized", { measurementId });
}

/**
 * Initialize Google Tag Manager
 */
export function initGTM(containerId: string) {
  if (typeof window === "undefined") return;

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    "gtm.start": new Date().getTime(),
    event: "gtm.js",
  });

  // Load GTM script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}`;
  document.head.appendChild(script);

  // Add noscript iframe
  const noscript = document.createElement("noscript");
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${containerId}`;
  iframe.height = "0";
  iframe.width = "0";
  iframe.style.display = "none";
  iframe.style.visibility = "hidden";
  noscript.appendChild(iframe);
  document.body.insertBefore(noscript, document.body.firstChild);

  logger.info("[Analytics] GTM initialized", { containerId });
}

/**
 * Track page view
 */
export function trackPageView(event: PageViewEvent) {
  if (typeof window === "undefined") return;

  // Google Analytics 4
  if (window.gtag) {
    window.gtag("event", "page_view", {
      page_path: event.page_path,
      page_title: event.page_title,
      page_location: event.page_location,
    });
  }

  // Google Tag Manager
  if (window.dataLayer) {
    window.dataLayer.push({
      event: "page_view",
      page_path: event.page_path,
      page_title: event.page_title,
      page_location: event.page_location,
    });
  }

  logger.debug("[Analytics] Page view tracked", event);
}

/**
 * Track custom event
 */
export function trackEvent(event: AnalyticsEvent) {
  if (typeof window === "undefined") return;

  // Google Analytics 4
  if (window.gtag) {
    window.gtag("event", event.action, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
      ...event.customParams,
    });
  }

  // Google Tag Manager
  if (window.dataLayer) {
    window.dataLayer.push({
      event: event.action,
      event_category: event.category,
      event_label: event.label,
      value: event.value,
      ...event.customParams,
    });
  }

  // Custom analytics endpoint
  sendToCustomAnalytics(event);

  logger.debug("[Analytics] Event tracked", event);
}

/**
 * Track reading analytics
 */
export function trackReadingAnalytics(event: ReadingAnalyticsEvent) {
  trackEvent({
    action: "reading_progress",
    category: "engagement",
    label: event.postId,
    value: event.completionRate,
    customParams: {
      post_id: event.postId,
      chapter_id: event.chapterId,
      reading_time: event.readingTime,
      scroll_depth: event.scrollDepth,
      completion_rate: event.completionRate,
      reading_mode: event.readingMode,
    },
  });
}

/**
 * Track scroll depth
 */
export function trackScrollDepth(depth: number) {
  const milestones = [25, 50, 75, 100];
  const milestone = milestones.find((m) => depth >= m && depth < m + 5);

  if (milestone) {
    trackEvent({
      action: "scroll",
      category: "engagement",
      label: `${milestone}%`,
      value: milestone,
    });
  }
}

/**
 * Track time on page
 */
export function trackTimeOnPage(seconds: number) {
  const intervals = [30, 60, 120, 300, 600]; // 30s, 1m, 2m, 5m, 10m
  const interval = intervals.find((i) => seconds >= i && seconds < i + 5);

  if (interval) {
    trackEvent({
      action: "time_on_page",
      category: "engagement",
      label: `${interval}s`,
      value: interval,
    });
  }
}

/**
 * Track reading mode change
 */
export function trackReadingModeChange(mode: string) {
  trackEvent({
    action: "reading_mode_changed",
    category: "engagement",
    label: mode,
    value: 1,
  });
}

/**
 * Track comment interaction
 */
export function trackCommentInteraction(action: "add" | "edit" | "delete" | "react", postId: string) {
  trackEvent({
    action: `comment_${action}`,
    category: "engagement",
    label: postId,
    value: 1,
  });
}

/**
 * Track share action
 */
export function trackShare(platform: string, postId: string) {
  trackEvent({
    action: "share",
    category: "social",
    label: platform,
    customParams: {
      post_id: postId,
    },
  });
}

/**
 * Track bookmark action
 */
export function trackBookmark(action: "add" | "remove", postId: string) {
  trackEvent({
    action: `bookmark_${action}`,
    category: "engagement",
    label: postId,
    value: 1,
  });
}

/**
 * Track search
 */
export function trackSearch(query: string, resultCount: number) {
  trackEvent({
    action: "search",
    category: "engagement",
    label: query,
    value: resultCount,
  });
}

/**
 * Track error
 */
export function trackError(error: Error, context?: string) {
  trackEvent({
    action: "error",
    category: "technical",
    label: error.message,
    customParams: {
      error_name: error.name,
      error_stack: error.stack,
      context,
    },
  });
}

/**
 * Send to custom analytics endpoint
 */
async function sendToCustomAnalytics(event: AnalyticsEvent) {
  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...event,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
      }),
    });
  } catch (error) {
    logger.error("[Analytics] Failed to send to custom endpoint", error);
  }
}

/**
 * Track user engagement score
 */
export function calculateEngagementScore(data: {
  timeOnPage: number;
  scrollDepth: number;
  interactionCount: number;
  completionRate: number;
}): number {
  const weights = {
    time: 0.3,
    scroll: 0.2,
    interaction: 0.3,
    completion: 0.2,
  };

  const normalizedTime = Math.min(data.timeOnPage / 600, 1); // Max 10 minutes
  const normalizedScroll = data.scrollDepth / 100;
  const normalizedInteraction = Math.min(data.interactionCount / 10, 1); // Max 10 interactions
  const normalizedCompletion = data.completionRate / 100;

  const score =
    normalizedTime * weights.time +
    normalizedScroll * weights.scroll +
    normalizedInteraction * weights.interaction +
    normalizedCompletion * weights.completion;

  return Math.round(score * 100);
}

/**
 * Hook for analytics initialization
 */
export function useAnalytics() {
  if (typeof window === "undefined") return;

  const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  const GTM_CONTAINER_ID = process.env.NEXT_PUBLIC_GTM_CONTAINER_ID;

  // Initialize analytics
  if (GA4_MEASUREMENT_ID) {
    initGA4(GA4_MEASUREMENT_ID);
  }

  if (GTM_CONTAINER_ID) {
    initGTM(GTM_CONTAINER_ID);
  }

  return {
    trackPageView,
    trackEvent,
    trackReadingAnalytics,
    trackScrollDepth,
    trackTimeOnPage,
    trackReadingModeChange,
    trackCommentInteraction,
    trackShare,
    trackBookmark,
    trackSearch,
    trackError,
  };
}

/**
 * Analytics context provider component
 */
export const AnalyticsProvider = {
  init: () => {
    const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
    const GTM_CONTAINER_ID = process.env.NEXT_PUBLIC_GTM_CONTAINER_ID;

    if (GA4_MEASUREMENT_ID) {
      initGA4(GA4_MEASUREMENT_ID);
    }

    if (GTM_CONTAINER_ID) {
      initGTM(GTM_CONTAINER_ID);
    }
  },
};
