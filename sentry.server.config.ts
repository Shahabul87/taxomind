/**
 * Sentry Server Configuration
 *
 * This file configures Sentry for server-side error tracking in Node.js runtime.
 * It captures unhandled exceptions, promise rejections, and provides performance monitoring.
 *
 * Required environment variables:
 * - SENTRY_DSN: Your Sentry project DSN
 * - SENTRY_ORG: Your Sentry organization slug (optional, for source maps)
 * - SENTRY_PROJECT: Your Sentry project slug (optional, for source maps)
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
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // Adjust this value in production for better performance/cost balance.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session Replay (server-side is typically not needed, but keeping for completeness)
    // replaysSessionSampleRate: 0.1,
    // replaysOnErrorSampleRate: 1.0,

    // Profiling (optional - uncomment if you want profiling)
    // profilesSampleRate: 0.1,

    // Debug mode (enable in development for troubleshooting)
    debug: process.env.NODE_ENV === 'development' && process.env.SENTRY_DEBUG === 'true',

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
          error.message.includes('ECONNRESET') ||
          error.message.includes('ETIMEDOUT') ||
          error.message.includes('fetch failed')
        ) {
          // Still log but at a lower sample rate
          if (Math.random() > 0.1) {
            return null;
          }
        }
      }

      return event;
    },

    // Ignore specific error types
    ignoreErrors: [
      // Browser/client-side errors that shouldn't appear server-side
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      // Network errors
      'NetworkError',
      'Network request failed',
      // AbortController
      'AbortError',
      'The operation was aborted',
      // User-initiated cancellations
      'The user aborted a request',
    ],

    // Integration configuration
    integrations: [
      // Prisma integration for database query tracking
      Sentry.prismaIntegration(),
    ],

    // Additional tags for all events
    initialScope: {
      tags: {
        runtime: 'nodejs',
        component: 'server',
      },
    },
  });

  console.log('[Sentry] Server-side error tracking initialized');
} else {
  console.log('[Sentry] No DSN configured, server-side error tracking disabled');
}

export {};
