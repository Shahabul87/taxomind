import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    
    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Setting this option to true will print useful information to the console while you&apos;re setting up Sentry.
    debug: false,

    // Capture unhandled promise rejections
    integrations: [
      Sentry.captureConsoleIntegration({
        levels: ['error', 'warn'],
      }),
    ],

    // Performance Monitoring
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Error filtering
    beforeSend(event, hint) {
      // Filter out specific errors if needed
      if (event.exception) {
        const error = hint.originalException;
        // Example: Filter out expected errors
        if (error && error.toString().includes('AbortError')) {
          return null;
        }
      }
      return event;
    },

    // Add server-specific context
    initialScope: {
      tags: {
        runtime: 'node',
        server: true,
      },
    },
  });
}