export async function register() {
  // ========================================
  // PART 1: Global Error Handlers
  // ========================================
  // Set up global error handlers first to catch any errors during initialization
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { setupServerErrorHandlers } = await import('./lib/error-handling/global-error-handlers');
      await setupServerErrorHandlers();
    } catch (error) {
      console.warn('[Instrumentation] Failed to setup global error handlers:', error);
    }
  }

  // ========================================
  // PART 2: Sentry Initialization
  // ========================================
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

  // OpenTelemetry tracing - opt-in via ENABLE_OTEL=true
  if (
    process.env.NEXT_RUNTIME === 'nodejs' &&
    process.env.NODE_ENV === 'production' &&
    process.env.ENABLE_OTEL === 'true'
  ) {
    // Dynamically import to avoid loading gRPC packages in development
    import('@/lib/observability/tracing')
      .then(({ initializeTracing }) => {
        initializeTracing();
        console.log('[OTEL] OpenTelemetry tracing initialized');
      })
      .catch((error) => {
        console.warn('[OTEL] Failed to load OpenTelemetry:', error instanceof Error ? error.message : String(error));
      });
  }

  // ========================================
  // PART 3: Superadmin Auto-Initialization
  // ========================================
  // Creates the superadmin in AdminAccount table from env vars on startup
  // Idempotent — skips if admin already exists
  // CRITICAL: Awaited to ensure admin exists before server accepts requests
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const adminEmail = process.env.SUPERADMIN_EMAIL;
    const adminPassword = process.env.SUPERADMIN_PASSWORD;

    if (adminEmail && adminPassword) {
      try {
        const { ensureSuperadminExists } = await import('./lib/auth/admin-initializer');
        const result = await ensureSuperadminExists(adminEmail, adminPassword, process.env.SUPERADMIN_NAME);

        if (result.created) {
          console.log(`[Admin] Superadmin created: ${adminEmail}`);
        } else if (result.exists) {
          const details = [
            result.fixed && 'emailVerified/gracePeriod fixed',
            result.passwordUpdated && 'password synced from env',
            result.hashMigrated && 'hash migrated to noble/scrypt',
          ].filter(Boolean).join(', ');
          console.log(`[Admin] Superadmin verified${details ? ` (${details})` : ''}: ${adminEmail}`);
        }
      } catch (error) {
        // Log but don't crash — admin can still be created via seed script
        console.error('[Admin] Failed to initialize superadmin:', error instanceof Error ? error.message : String(error));
      }
    } else if (process.env.NODE_ENV === 'production') {
      console.warn('[Admin] SUPERADMIN_EMAIL/SUPERADMIN_PASSWORD env vars not set — superadmin auto-init skipped');
    }
  }

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

  // ========================================
  // PART 5: Queue Worker Auto-Initialization
  // ========================================
  // Auto-initialize queue workers when Redis is available
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.REDIS_URL) {
    import('@/lib/queue/queue-manager').then(() => {
      console.log('[instrumentation] Queue workers initialized');
    }).catch((err) => {
      console.error('[instrumentation] Queue worker init failed:', err);
    });
  }
}