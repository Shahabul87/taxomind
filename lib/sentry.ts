import * as Sentry from '@sentry/nextjs';

/**
 * Custom error reporting utility for Sentry
 */

export interface ErrorContext {
  userId?: string;
  userEmail?: string;
  action?: string;
  metadata?: Record<string, any>;
  tags?: Record<string, string>;
  level?: Sentry.SeverityLevel;
}

/**
 * Report an error to Sentry with additional context
 */
export function reportError(error: Error | unknown, context?: ErrorContext) {
  Sentry.withScope((scope) => {
    // Set user context if provided
    if (context?.userId || context?.userEmail) {
      scope.setUser({
        id: context.userId,
        email: context.userEmail,
      });
    }

    // Set tags
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    // Set extra context
    if (context?.metadata) {
      scope.setContext('metadata', context.metadata);
    }

    // Set action context
    if (context?.action) {
      scope.setTag('action', context.action);
      scope.addBreadcrumb({
        message: `Action: ${context.action}`,
        level: 'info',
        category: 'user-action',
      });
    }

    // Set severity level
    if (context?.level) {
      scope.setLevel(context.level);
    }

    // Capture the exception
    if (error instanceof Error) {
      Sentry.captureException(error);
    } else {
      Sentry.captureMessage(String(error), context?.level || 'error');
    }
  });
}

/**
 * Log a custom message to Sentry
 */
export function logMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Omit<ErrorContext, 'level'>
) {
  Sentry.withScope((scope) => {
    // Set user context if provided
    if (context?.userId || context?.userEmail) {
      scope.setUser({
        id: context.userId,
        email: context.userEmail,
      });
    }

    // Set tags
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    // Set extra context
    if (context?.metadata) {
      scope.setContext('metadata', context.metadata);
    }

    // Set action context
    if (context?.action) {
      scope.setTag('action', context.action);
    }

    scope.setLevel(level);
    Sentry.captureMessage(message, level);
  });
}

/**
 * Add breadcrumb for tracking user actions
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Start a performance transaction
 */
export function startTransaction(
  name: string,
  operation: string,
  data?: Record<string, any>
) {
  const startedAt = Date.now();
  let status: string | undefined;
  return {
    setStatus: (s: any) => {
      try { status = String(s); } catch { status = undefined; }
    },
    finish: () => {
      const durationMs = Date.now() - startedAt;
      Sentry.addBreadcrumb({
        message: `transaction:${name}`,
        category: 'performance',
        level: 'info',
        data: { op: operation, durationMs, status, ...(data || {}) },
        timestamp: Date.now() / 1000,
      });
    },
  };
}

/**
 * Wrapper for async functions with automatic error reporting
 */
export async function withErrorReporting<T>(
  fn: () => Promise<T>,
  context?: ErrorContext
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    reportError(error, context);
    return null;
  }
}

/**
 * Monitor API response times and errors
 */
export async function monitorApiCall<T>(
  apiCall: () => Promise<T>,
  endpoint: string,
  method: string = 'GET'
): Promise<T> {
  const transaction = startTransaction(`api.${method.toLowerCase()}`, endpoint);
  
  try {
    const result = await apiCall();
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    reportError(error, {
      tags: {
        endpoint,
        method,
        type: 'api_error',
      },
    });
    throw error;
  } finally {
    transaction.finish();
  }
}

/**
 * Set user context for all subsequent Sentry events
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  username?: string;
  role?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  });
}

/**
 * Clear user context
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Report specific application events
 */
export const AppEvents = {
  // Authentication events
  loginSuccess: (userId: string, method: string) => {
    logMessage('User logged in successfully', 'info', {
      userId,
      tags: { 
        event: 'login_success',
        method 
      },
    });
  },
  
  loginFailed: (email: string, reason: string) => {
    logMessage('Login attempt failed', 'warning', {
      tags: { 
        event: 'login_failed',
        reason 
      },
      metadata: { email },
    });
  },

  // Course events
  courseCreated: (courseId: string, userId: string) => {
    logMessage('Course created', 'info', {
      userId,
      tags: { 
        event: 'course_created',
        courseId 
      },
    });
  },

  coursePurchased: (courseId: string, userId: string, amount: number) => {
    logMessage('Course purchased', 'info', {
      userId,
      tags: { 
        event: 'course_purchased',
        courseId 
      },
      metadata: { amount },
    });
  },

  // Error events
  paymentFailed: (userId: string, error: string, amount: number) => {
    reportError(new Error(`Payment failed: ${error}`), {
      userId,
      level: 'error',
      tags: { 
        event: 'payment_failed',
        type: 'payment_error' 
      },
      metadata: { amount },
    });
  },

  // Performance events
  slowApiResponse: (endpoint: string, duration: number) => {
    logMessage(`Slow API response: ${endpoint}`, 'warning', {
      tags: { 
        event: 'slow_api',
        endpoint 
      },
      metadata: { duration },
    });
  },
};