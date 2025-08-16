import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const SKIP_SENTRY = process.env.SKIP_SENTRY === 'true';

if (SENTRY_DSN && !SKIP_SENTRY) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    
    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Setting this option to true will print useful information to the console while you&apos;re setting up Sentry.
    debug: false,

    // Replay configuration for session recording
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.5,

    integrations: [
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    // Performance Monitoring
    tracePropagationTargets: [
      'localhost',
      /^https:\/\/yourserver\.io\/api/,
    ],

    // Error filtering
    beforeSend(event, hint) {
      // Filter out specific errors if needed
      if (event.exception) {
        const error = hint.originalException;
        // Filter out network errors
        if (error && error.toString().includes('NetworkError')) {
          return null;
        }
        // Filter out OpenTelemetry related errors
        if (error && error.toString().includes('OpenTelemetry')) {
          return null;
        }
        // Filter out instrumentation errors
        if (error && error.toString().includes('instrumentation')) {
          return null;
        }
      }
      return event;
    },
  });
}