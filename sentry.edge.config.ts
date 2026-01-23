/**
 * Sentry Edge Configuration
 *
 * This file configures Sentry for Edge runtime (middleware, edge functions).
 * It uses a lighter configuration suitable for edge environments.
 *
 * Required environment variables:
 * - SENTRY_DSN: Your Sentry project DSN
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

// Only initialize if DSN is configured
const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Environment configuration
    environment: process.env.NODE_ENV || 'development',
    release: process.env.npm_package_version || '1.0.0',

    // Performance Monitoring
    // Lower sample rate for edge since it handles many requests
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0.5,

    // Debug mode
    debug: false, // Keep false for edge to reduce overhead

    // Filter out known non-critical errors
    beforeSend(event, hint) {
      const error = hint.originalException;

      // Filter out specific errors that are expected/non-critical
      if (error instanceof Error) {
        // Skip rate limit errors (expected behavior)
        if (error.message.includes('Rate limit exceeded')) {
          return null;
        }

        // Skip authentication redirects (not errors)
        if (error.message.includes('NEXT_REDIRECT')) {
          return null;
        }

        // Skip network errors that are transient
        if (
          error.message.includes('ECONNRESET') ||
          error.message.includes('ETIMEDOUT')
        ) {
          return null;
        }
      }

      return event;
    },

    // Ignore specific error types
    ignoreErrors: [
      // Redirect errors (not actual errors)
      'NEXT_REDIRECT',
      'NEXT_NOT_FOUND',
      // Network errors
      'NetworkError',
      'AbortError',
      // Rate limiting (expected)
      'Rate limit exceeded',
    ],

    // Additional tags for all events
    initialScope: {
      tags: {
        runtime: 'edge',
        component: 'middleware',
      },
    },
  });

  console.log('[Sentry] Edge error tracking initialized');
} else {
  console.log('[Sentry] No DSN configured, edge error tracking disabled');
}

export {};
