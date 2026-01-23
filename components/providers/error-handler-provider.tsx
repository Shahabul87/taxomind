'use client';

/**
 * Client-side Error Handler Provider
 *
 * This component initializes global error handlers on the client side.
 * It should be included in the root layout to capture all client-side errors.
 *
 * Features:
 * - Captures unhandled JavaScript errors
 * - Captures unhandled promise rejections
 * - Captures resource loading errors
 * - Integrates with Sentry (if configured)
 * - Sends errors to API endpoint for server-side logging
 */

import { useEffect } from 'react';

export function ErrorHandlerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Import the client-specific error handlers (not server-only)
    import('@/lib/error-handling/client-error-handlers')
      .then(({ setupClientErrorHandlers }) => {
        setupClientErrorHandlers();
      })
      .catch((error) => {
        console.warn('[ErrorHandlerProvider] Failed to setup client error handlers:', error);
      });
  }, []);

  return <>{children}</>;
}

export default ErrorHandlerProvider;
