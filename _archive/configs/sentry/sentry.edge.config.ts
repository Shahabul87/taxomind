import { initSentry } from './lib/sentry-config';

// Initialize Sentry with edge-specific configuration
initSentry({
  // Add edge-specific context
  initialScope: {
    tags: {
      runtime: 'edge',
      server: true,
    },
  },
});