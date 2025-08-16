export function register() {
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