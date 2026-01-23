/**
 * Sentry Client Configuration
 *
 * This file configures Sentry for client-side (browser) error tracking.
 * It captures JavaScript errors, unhandled promise rejections, and provides
 * session replay capabilities.
 *
 * Required environment variables:
 * - NEXT_PUBLIC_SENTRY_DSN: Your Sentry project DSN (must be NEXT_PUBLIC_ for client-side)
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

// Only initialize if DSN is configured
const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment configuration
    environment: process.env.NODE_ENV || 'development',
    release: process.env.npm_package_version || '1.0.0',

    // Performance Monitoring
    // Capture 10% of transactions in production, 100% in development
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session Replay
    // Capture 10% of all sessions, and 100% of sessions with errors
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    replaysOnErrorSampleRate: 1.0,

    // Debug mode (enable in development for troubleshooting)
    debug: process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_SENTRY_DEBUG === 'true',

    // Filter out known non-critical errors
    beforeSend(event, hint) {
      const error = hint.originalException;

      // Filter out specific errors that are expected/non-critical
      if (error instanceof Error) {
        // Skip rate limit errors (expected behavior)
        if (error.message.includes('Rate limit exceeded')) {
          return null;
        }

        // Skip authentication errors (user-facing, not bugs)
        if (
          error.message.includes('Unauthorized') ||
          error.message.includes('Invalid credentials')
        ) {
          return null;
        }

        // Skip network errors that are transient
        if (
          error.message.includes('NetworkError') ||
          error.message.includes('Failed to fetch') ||
          error.message.includes('Load failed')
        ) {
          // Still log but at a lower sample rate
          if (Math.random() > 0.1) {
            return null;
          }
        }

        // Skip browser extension errors
        if (
          error.message.includes('chrome-extension://') ||
          error.message.includes('moz-extension://')
        ) {
          return null;
        }
      }

      return event;
    },

    // Ignore specific error types that are common but not actionable
    ignoreErrors: [
      // Browser-specific errors
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      // Network errors
      'NetworkError',
      'Network request failed',
      'Failed to fetch',
      'Load failed',
      // AbortController
      'AbortError',
      'The operation was aborted',
      // User-initiated cancellations
      'The user aborted a request',
      // Script loading errors
      'Script error.',
      'Script error',
      // Browser extensions
      /^chrome-extension:\/\//,
      /^moz-extension:\/\//,
      // Third-party scripts
      'top.GLOBALS',
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      'atomicFindClose',
      // Safari-specific
      "Can't find variable: Set",
      // Common false positives
      'Non-Error exception captured',
      'Non-Error promise rejection captured',
    ],

    // URLs to ignore
    denyUrls: [
      // Browser extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      /^moz-extension:\/\//i,
      // Third-party scripts
      /graph\.facebook\.com/i,
      /connect\.facebook\.net/i,
      /googleads/i,
      /googlesyndication/i,
      /doubleclick\.net/i,
      /analytics\.google\.com/i,
    ],

    // Integration configuration
    integrations: [
      // Session replay for error debugging
      Sentry.replayIntegration({
        // Mask all text content and block all media for privacy
        maskAllText: false,
        blockAllMedia: false,
        // Only mask sensitive inputs
        maskAllInputs: true,
      }),
      // Browser tracing for performance monitoring
      Sentry.browserTracingIntegration({
        // Trace fetch requests
        traceFetch: true,
        // Trace XHR requests
        traceXHR: true,
        // Enable navigation tracing
        enableInp: true,
      }),
    ],

    // Additional tags for all events
    initialScope: {
      tags: {
        runtime: 'browser',
        component: 'client',
      },
    },
  });

  // Log initialization in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Sentry] Client-side error tracking initialized');
  }
} else if (process.env.NODE_ENV === 'development') {
  console.log('[Sentry] No DSN configured, client-side error tracking disabled');
}

export {};
