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
  // NOTE: Observability/tracing disabled during migration cleanup
  // if (
  //   process.env.NEXT_RUNTIME === 'nodejs' &&
  //   process.env.NODE_ENV === 'production' &&
  //   process.env.ENABLE_OTEL === 'true'
  // ) {
  //   // Dynamically import to avoid loading gRPC packages in development
  //   import('@/lib/observability/tracing')
  //     .then(({ initializeTracing }) => {
  //       initializeTracing();
  //     })
  //     .catch((error) => {
  //       console.warn('Failed to load OpenTelemetry:', error.message);
  //     });
  // }

  // Initialize SAM Memory Lifecycle Manager (background jobs for memory reindexing)
  // Gated by SAM_FEATURES.MEMORY_LIFECYCLE_ENABLED feature flag
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Import feature flags to check if memory lifecycle is enabled
    import('@/lib/sam/feature-flags')
      .then(({ SAM_FEATURES }) => {
        if (SAM_FEATURES.MEMORY_LIFECYCLE_ENABLED) {
          import('@/lib/sam/memory-lifecycle-service')
            .then(({ startMemoryLifecycle }) => {
              startMemoryLifecycle()
                .then(() => {
                  console.log('[SAM] Memory lifecycle scheduler started');
                })
                .catch((error) => {
                  console.warn('[SAM] Failed to start memory lifecycle:', error.message);
                });
            })
            .catch((error) => {
              console.warn('[SAM] Failed to load memory lifecycle service:', error.message);
            });
        } else {
          console.log('[SAM] Memory lifecycle disabled (SAM_MEMORY_LIFECYCLE=false)');
        }
      })
      .catch((error) => {
        console.warn('[SAM] Failed to load feature flags:', error.message);
      });
  }

  // Initialize SAM Realtime Server (WebSocket/SSE infrastructure)
  // Gated by SAM_FEATURES.WEBSOCKET_ENABLED feature flag
  // This starts the server-side realtime infrastructure for:
  // - Presence tracking (user online/offline status)
  // - Push delivery queue (persisted to database)
  // - Intervention dispatcher (real-time notifications)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    import('@/lib/sam/feature-flags')
      .then(({ SAM_FEATURES }) => {
        if (SAM_FEATURES.WEBSOCKET_ENABLED) {
          import('@/lib/sam/realtime')
            .then(({ getSAMRealtimeServer }) => {
              try {
                const realtimeServer = getSAMRealtimeServer();
                realtimeServer.start();
                console.log('[SAM] Realtime server started (push dispatcher active)');

                // Log configuration status
                const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
                if (wsUrl) {
                  console.log(`[SAM] WebSocket URL configured: ${wsUrl}`);
                } else {
                  console.log('[SAM] WebSocket URL not configured, using SSE fallback');
                }
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.warn('[SAM] Failed to start realtime server:', errorMessage);
              }
            })
            .catch((error) => {
              console.warn('[SAM] Failed to load realtime module:', error.message);
            });
        } else {
          console.log('[SAM] Realtime server disabled (SAM_WEBSOCKET_ENABLED=false)');
        }
      })
      .catch((error) => {
        console.warn('[SAM] Failed to load feature flags:', error.message);
      });
  }
}