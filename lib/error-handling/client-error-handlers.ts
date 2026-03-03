/**
 * Client-side Error Handlers
 *
 * This module sets up global error handlers for client-side (browser) environments.
 * It captures unhandled errors and promise rejections, logging them to console
 * and sending to Sentry.
 *
 * Client-side handlers:
 * - window.addEventListener('error')
 * - window.addEventListener('unhandledrejection')
 *
 * NOTE: This file is separate from global-error-handlers.ts to avoid importing
 * server-only modules (like auth and db) on the client.
 */

import { logger } from '@/lib/logger';

// Track if handlers have been set up to prevent duplicates
let clientHandlersSetup = false;

/**
 * Log error to API endpoint (client-safe)
 * This sends errors to the server for logging without importing server-only modules
 */
async function logErrorToApi(
  error: Error,
  context?: Record<string, unknown>,
  component?: string
): Promise<void> {
  try {
    await fetch('/api/error-log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        name: error.name,
        context,
        component,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    // Silently fail - we don't want error logging to cause more errors
    logger.warn('[ClientErrorHandler] Failed to send error to API');
  }
}

/**
 * Setup client-side global error handlers (Browser)
 * Should be called once during app initialization via ErrorHandlerProvider
 */
export function setupClientErrorHandlers(): void {
  // Prevent duplicate setup or running on server
  if (clientHandlersSetup || typeof window === 'undefined') {
    return;
  }

  clientHandlersSetup = true;

  // Handle global JavaScript errors
  window.addEventListener('error', async (event: ErrorEvent) => {
    // Skip errors from browser extensions
    if (event.filename?.includes('chrome-extension://') ||
        event.filename?.includes('moz-extension://')) {
      return;
    }

    // Skip cross-origin script errors (we can't get details anyway)
    if (event.message === 'Script error.' && !event.filename) {
      return;
    }

    const error = event.error || new Error(event.message);

    logger.error('[CLIENT ERROR]', error);

    try {
      // Send to API endpoint for server-side logging
      await logErrorToApi(error, {
        type: 'windowError',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }, 'ClientGlobalErrorHandler');

      // Also try to send to Sentry if available
      try {
        const Sentry = await import('@sentry/nextjs');
        Sentry.captureException(error, {
          tags: {
            type: 'windowError',
          },
          extra: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        });
      } catch {
        // Sentry not available or failed
      }
    } catch (loggingError) {
      logger.error('[CLIENT ERROR] Failed to log error', loggingError);
    }
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', async (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const error = reason instanceof Error
      ? reason
      : new Error(String(reason));

    logger.error('[CLIENT] Unhandled Promise Rejection', error);

    try {
      // Send to API endpoint for server-side logging
      await logErrorToApi(error, {
        type: 'unhandledRejection',
        reason: String(reason),
      }, 'ClientGlobalErrorHandler');

      // Also try to send to Sentry if available
      try {
        const Sentry = await import('@sentry/nextjs');
        Sentry.captureException(error, {
          tags: {
            type: 'unhandledRejection',
          },
        });
      } catch {
        // Sentry not available or failed
      }
    } catch (loggingError) {
      logger.error('[CLIENT ERROR] Failed to log rejection', loggingError);
    }
  });

  // Handle resource loading errors (images, scripts, stylesheets)
  window.addEventListener('error', (event: Event) => {
    const target = event.target as HTMLElement | null;

    // Only handle resource loading errors
    if (target && (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
      const src = (target as HTMLImageElement).src ||
                  (target as HTMLScriptElement).src ||
                  (target as HTMLLinkElement).href;

      // Skip logging for optional resources or known missing assets
      if (src?.includes('favicon') || src?.includes('placeholder')) {
        return;
      }

      logger.warn(`[CLIENT] Resource loading error: ${target.tagName} ${src}`);

      // Log resource errors at a lower priority
      logErrorToApi(
        new Error(`Failed to load ${target.tagName}: ${src}`),
        {
          type: 'resourceLoadError',
          tagName: target.tagName,
          src,
        },
        'ClientResourceLoader'
      ).catch(() => {
        // Ignore logging errors for resource failures
      });
    }
  }, true); // Use capture phase to catch resource errors

  logger.info('[GlobalErrorHandler] Client-side error handlers initialized');
}

/**
 * Reset client handlers setup flag (for testing)
 */
export function resetClientHandlers(): void {
  clientHandlersSetup = false;
}
