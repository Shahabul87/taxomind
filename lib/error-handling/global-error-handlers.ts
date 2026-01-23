/**
 * Global Error Handlers - Server-side only
 *
 * This module sets up global error handlers for server-side (Node.js) environments.
 * It captures unhandled errors and promise rejections, logging them and sending to monitoring services.
 *
 * Server-side handlers:
 * - process.on('uncaughtException')
 * - process.on('unhandledRejection')
 *
 * NOTE: Client-side handlers are in a separate file (client-error-handlers.ts)
 * to avoid importing server-only modules on the client.
 */

import { ErrorType, ErrorSeverity } from './types';

// Track if handlers have been set up to prevent duplicates
let serverHandlersSetup = false;

/**
 * Setup server-side global error handlers (Node.js)
 * Should be called once during server startup via instrumentation.ts
 */
export async function setupServerErrorHandlers(): Promise<void> {
  // Prevent duplicate setup
  if (serverHandlersSetup || typeof process === 'undefined') {
    return;
  }

  serverHandlersSetup = true;

  // Dynamically import errorLogger to ensure server-only code runs only on server
  const { errorLogger } = await import('./error-logger');

  // Handle uncaught exceptions
  process.on('uncaughtException', async (error: Error, origin: string) => {
    console.error('[FATAL] Uncaught Exception:', error);
    console.error('Origin:', origin);

    try {
      // Log to our error tracking system
      await errorLogger.logError(error, {
        type: 'uncaughtException',
        origin,
        fatal: true,
      }, 'GlobalErrorHandler');

      // Also try to send to Sentry if available
      try {
        const Sentry = await import('@sentry/nextjs');
        Sentry.captureException(error, {
          tags: {
            type: 'uncaughtException',
            origin,
          },
          level: 'fatal',
        });
        // Give Sentry time to send the event
        await Sentry.flush(2000);
      } catch {
        // Sentry not available or failed
      }
    } catch (loggingError) {
      console.error('[FATAL] Failed to log uncaught exception:', loggingError);
    }

    // Note: In production, you might want to gracefully shutdown
    // For now, we let the process continue but log the error
    // process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', async (reason: unknown, promise: Promise<unknown>) => {
    console.error('[ERROR] Unhandled Promise Rejection:', reason);

    const error = reason instanceof Error
      ? reason
      : new Error(String(reason));

    try {
      // Log to our error tracking system
      await errorLogger.logError(error, {
        type: 'unhandledRejection',
        promise: String(promise),
      }, 'GlobalErrorHandler');

      // Also try to send to Sentry if available
      try {
        const Sentry = await import('@sentry/nextjs');
        Sentry.captureException(error, {
          tags: {
            type: 'unhandledRejection',
          },
          level: 'error',
        });
      } catch {
        // Sentry not available or failed
      }
    } catch (loggingError) {
      console.error('[ERROR] Failed to log unhandled rejection:', loggingError);
    }
  });

  // Handle warnings (optional, useful for deprecation notices)
  process.on('warning', (warning: Error) => {
    console.warn('[WARNING]', warning.name, warning.message);

    // Only log significant warnings, not all deprecation notices
    if (warning.name !== 'DeprecationWarning') {
      errorLogger.logError(warning, {
        type: 'processWarning',
      }, 'GlobalErrorHandler').catch(() => {
        // Ignore logging errors for warnings
      });
    }
  });

  console.log('[GlobalErrorHandler] Server-side error handlers initialized');
}

/**
 * Create a custom error with additional context
 */
export function createContextualError(
  message: string,
  context: Record<string, unknown>,
  originalError?: Error
): Error {
  const error = new Error(message);

  if (originalError) {
    error.cause = originalError;
    error.stack = `${error.stack}\nCaused by: ${originalError.stack}`;
  }

  // Attach context to the error
  (error as Error & { context: Record<string, unknown> }).context = context;

  return error;
}

/**
 * Export types for external use
 */
export { ErrorType, ErrorSeverity };
