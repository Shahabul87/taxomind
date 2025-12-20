/**
 * @sam-ai/api - Authentication Middleware
 */

import type {
  SAMApiRequest,
  SAMApiResponse,
  SAMHandler,
  SAMHandlerContext,
} from '../types';

export interface AuthOptions {
  /** Required roles for access */
  requiredRoles?: string[];
  /** Custom unauthorized response */
  onUnauthorized?: () => SAMApiResponse;
  /** Custom forbidden response */
  onForbidden?: () => SAMApiResponse;
}

/**
 * Create error response for authentication failures
 */
function createAuthErrorResponse(
  status: number,
  code: string,
  message: string
): SAMApiResponse {
  return {
    status,
    body: {
      success: false,
      error: {
        code,
        message,
      },
    },
    headers: {
      'Content-Type': 'application/json',
    },
  };
}

/**
 * Create authentication middleware
 */
export function createAuthMiddleware(
  authenticate?: (request: SAMApiRequest) => Promise<SAMHandlerContext['user'] | null>,
  options?: AuthOptions
): (handler: SAMHandler) => SAMHandler {
  return (handler: SAMHandler): SAMHandler => {
    return async (
      request: SAMApiRequest,
      context: SAMHandlerContext
    ): Promise<SAMApiResponse> => {
      // If no authenticate function provided, pass through
      if (!authenticate) {
        return handler(request, context);
      }

      try {
        // Authenticate the request
        const user = await authenticate(request);

        // Check if user exists
        if (!user) {
          if (options?.onUnauthorized) {
            return options.onUnauthorized();
          }
          return createAuthErrorResponse(
            401,
            'UNAUTHORIZED',
            'Authentication required'
          );
        }

        // Check roles if required
        if (options?.requiredRoles && options.requiredRoles.length > 0) {
          const hasRole = options.requiredRoles.includes(user.role);

          if (!hasRole) {
            if (options?.onForbidden) {
              return options.onForbidden();
            }
            return createAuthErrorResponse(
              403,
              'FORBIDDEN',
              'Insufficient permissions'
            );
          }
        }

        // Add user to context and continue
        const authenticatedContext: SAMHandlerContext = {
          ...context,
          user,
        };

        return handler(request, authenticatedContext);
      } catch (error) {
        console.error('[SAM Auth] Authentication error:', error);
        return createAuthErrorResponse(
          401,
          'AUTH_ERROR',
          'Authentication failed'
        );
      }
    };
  };
}

/**
 * Create a simple token-based authenticator
 */
export function createTokenAuthenticator(
  validateToken: (token: string) => Promise<SAMHandlerContext['user'] | null>
): (request: SAMApiRequest) => Promise<SAMHandlerContext['user'] | null> {
  return async (request: SAMApiRequest) => {
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      return null;
    }

    // Handle array header
    const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;

    // Extract token from Bearer scheme
    if (!headerValue?.startsWith('Bearer ')) {
      return null;
    }

    const token = headerValue.slice(7);

    if (!token) {
      return null;
    }

    return validateToken(token);
  };
}

/**
 * Compose multiple auth middlewares
 */
export function composeAuthMiddleware(
  ...middlewares: Array<(handler: SAMHandler) => SAMHandler>
): (handler: SAMHandler) => SAMHandler {
  return (handler: SAMHandler): SAMHandler => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler
    );
  };
}

/**
 * Create role-based access control middleware
 */
export function requireRoles(
  ...roles: string[]
): (handler: SAMHandler) => SAMHandler {
  return (handler: SAMHandler): SAMHandler => {
    return async (
      request: SAMApiRequest,
      context: SAMHandlerContext
    ): Promise<SAMApiResponse> => {
      if (!context.user) {
        return createAuthErrorResponse(
          401,
          'UNAUTHORIZED',
          'Authentication required'
        );
      }

      if (!roles.includes(context.user.role)) {
        return createAuthErrorResponse(
          403,
          'FORBIDDEN',
          `Required role: ${roles.join(' or ')}`
        );
      }

      return handler(request, context);
    };
  };
}
