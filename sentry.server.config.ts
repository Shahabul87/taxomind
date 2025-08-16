import { initSentry } from './lib/sentry-config';

// Initialize Sentry with server-specific configuration
initSentry({
  // Add server-specific context
  initialScope: {
    tags: {
      runtime: 'node',
      server: true,
    },
  },
});