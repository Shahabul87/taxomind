/**
 * Sentry configuration utilities
 * Handles Sentry initialization with proper Prisma integration
 */

import * as Sentry from '@sentry/nextjs';

// Check if we should skip Sentry initialization
export const shouldInitSentry = () => {
  const skipSentry = process.env.SKIP_SENTRY === 'true';
  const sentryDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  
  return !skipSentry && !!sentryDsn;
};

// Configure Sentry integrations
export const getSentryIntegrations = () => {
  const integrations = [
    Sentry.captureConsoleIntegration({
      levels: ['error', 'warn'],
    }),
  ];

  // Note: Prisma integration is not available in the current Sentry version
  // The OpenTelemetry instrumentation warnings are suppressed in webpack config

  return integrations;
};

// Initialize Sentry with proper error handling
export const initSentry = (options: Partial<Sentry.NodeOptions> = {}) => {
  if (!shouldInitSentry()) {
    return;
  }

  try {
    Sentry.init({
      dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      debug: false,
      integrations: getSentryIntegrations(),
      profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      
      // Error filtering
      beforeSend(event, hint) {
        // Filter out specific errors if needed
        if (event.exception) {
          const error = hint.originalException;
          // Filter out expected errors
          if (error && error.toString().includes('AbortError')) {
            return null;
          }
          // Filter out OpenTelemetry related errors
          if (error && error.toString().includes('OpenTelemetry')) {
            return null;
          }
        }
        return event;
      },
      
      ...options,
    });
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
};