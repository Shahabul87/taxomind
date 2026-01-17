/**
 * @sam-ai/api - Authentication Middleware
 */
import type { SAMApiRequest, SAMApiResponse, SAMHandler, SAMHandlerContext } from '../types';
export interface AuthOptions {
    /** Required roles for access */
    requiredRoles?: string[];
    /** Custom unauthorized response */
    onUnauthorized?: () => SAMApiResponse;
    /** Custom forbidden response */
    onForbidden?: () => SAMApiResponse;
}
/**
 * Create authentication middleware
 */
export declare function createAuthMiddleware(authenticate?: (request: SAMApiRequest) => Promise<SAMHandlerContext['user'] | null>, options?: AuthOptions): (handler: SAMHandler) => SAMHandler;
/**
 * Create a simple token-based authenticator
 */
export declare function createTokenAuthenticator(validateToken: (token: string) => Promise<SAMHandlerContext['user'] | null>): (request: SAMApiRequest) => Promise<SAMHandlerContext['user'] | null>;
/**
 * Compose multiple auth middlewares
 */
export declare function composeAuthMiddleware(...middlewares: Array<(handler: SAMHandler) => SAMHandler>): (handler: SAMHandler) => SAMHandler;
/**
 * Create role-based access control middleware
 */
export declare function requireRoles(...roles: string[]): (handler: SAMHandler) => SAMHandler;
//# sourceMappingURL=auth.d.ts.map