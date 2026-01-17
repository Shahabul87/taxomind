/**
 * @sam-ai/api - Authentication Middleware
 */
/**
 * Create error response for authentication failures
 */
function createAuthErrorResponse(status, code, message) {
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
export function createAuthMiddleware(authenticate, options) {
    return (handler) => {
        return async (request, context) => {
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
                    return createAuthErrorResponse(401, 'UNAUTHORIZED', 'Authentication required');
                }
                // Check roles if required
                if (options?.requiredRoles && options.requiredRoles.length > 0) {
                    const hasRole = options.requiredRoles.includes(user.role);
                    if (!hasRole) {
                        if (options?.onForbidden) {
                            return options.onForbidden();
                        }
                        return createAuthErrorResponse(403, 'FORBIDDEN', 'Insufficient permissions');
                    }
                }
                // Add user to context and continue
                const authenticatedContext = {
                    ...context,
                    user,
                };
                return handler(request, authenticatedContext);
            }
            catch (error) {
                console.error('[SAM Auth] Authentication error:', error);
                return createAuthErrorResponse(401, 'AUTH_ERROR', 'Authentication failed');
            }
        };
    };
}
/**
 * Create a simple token-based authenticator
 */
export function createTokenAuthenticator(validateToken) {
    return async (request) => {
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
export function composeAuthMiddleware(...middlewares) {
    return (handler) => {
        return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
    };
}
/**
 * Create role-based access control middleware
 */
export function requireRoles(...roles) {
    return (handler) => {
        return async (request, context) => {
            if (!context.user) {
                return createAuthErrorResponse(401, 'UNAUTHORIZED', 'Authentication required');
            }
            if (!roles.includes(context.user.role)) {
                return createAuthErrorResponse(403, 'FORBIDDEN', `Required role: ${roles.join(' or ')}`);
            }
            return handler(request, context);
        };
    };
}
