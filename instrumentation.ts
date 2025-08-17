export async function register() {
  // Initialize Sentry only if enabled and configs exist
  if (process.env.SKIP_SENTRY !== 'true') {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      try {
        await import('./sentry.server.config')
      } catch (error) {
        // Sentry config not found, skip initialization
        console.log('Sentry server config not found, skipping initialization')
      }
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
      try {
        await import('./sentry.edge.config')
      } catch (error) {
        // Sentry config not found, skip initialization
        console.log('Sentry edge config not found, skipping initialization')
      }
    }
  }

  // Only initialize tracing in production server environment
  if (
    process.env.NEXT_RUNTIME === 'nodejs' &&
    process.env.NODE_ENV === 'production' &&
    process.env.ENABLE_OTEL === 'true'
  ) {
    // Dynamically import to avoid loading gRPC packages in development
    import('@/lib/observability/tracing')
      .then(({ initializeTracing }) => {
        initializeTracing();
      })
      .catch((error) => {
        console.warn('Failed to load OpenTelemetry:', error.message);
      });
  }
}