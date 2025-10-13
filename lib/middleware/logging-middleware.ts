/**
 * Logging Middleware Integration
 *
 * Provides structured logging with correlation IDs for Next.js middleware
 */

import { NextRequest } from 'next/server';
import { AuthLogger, LoggerManager } from '../logging/structured-logger';

/**
 * Add correlation ID and structured logging to middleware
 */
export function withLogging(pathname: string, req: NextRequest, auth: any) {
  const correlationId =
    req.headers.get('x-correlation-id') ||
    req.headers.get('x-request-id') ||
    LoggerManager.createCorrelationId();

  const context = {
    correlationId,
    userId: auth?.user?.id,
    userEmail: auth?.user?.email,
    requestPath: pathname,
    requestMethod: req.method,
    userAgent: req.headers.get('user-agent') || undefined,
    ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
  };

  // Log authentication attempts
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/settings') || pathname.startsWith('/my-courses')) {
    AuthLogger.info('Authentication check in middleware', {
      pathname,
      isLoggedIn: !!auth?.user,
      hasAuth: !!auth,
      userRole: auth?.user?.role,
      sessionExpires: auth?.expires,
    });
  }

  return { correlationId, context };
}

/**
 * Log access denied events
 */
export function logAccessDenied(
  pathname: string,
  userEmail: string | undefined,
  reason: string,
  correlationId: string
) {
  AuthLogger.warn('Access denied', {
    pathname,
    userEmail,
    reason,
    correlationId,
  });
}

/**
 * Log MFA enforcement events
 */
export function logMFAEnforcement(
  pathname: string,
  userId: string,
  reason: string,
  correlationId: string
) {
  AuthLogger.info('MFA enforcement triggered', {
    pathname,
    userId,
    reason,
    correlationId,
  });
}

/**
 * Log redirect events
 */
export function logRedirect(
  from: string,
  to: string,
  reason: string,
  correlationId: string
) {
  AuthLogger.info('Redirect triggered', {
    from,
    to,
    reason,
    correlationId,
  });
}