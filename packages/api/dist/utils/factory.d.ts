/**
 * @sam-ai/api - Route Handler Factory
 * Creates standardized API route handlers with middleware support
 */
import type { SAMApiResponse, RouteHandlerFactoryOptions, RouteHandlerFactory } from '../types';
/**
 * Generate a unique request ID
 */
declare function generateRequestId(): string;
/**
 * Create an error response
 */
declare function createErrorResponse(status: number, code: string, message: string, details?: Record<string, unknown>): SAMApiResponse;
/**
 * Create a success response
 */
declare function createSuccessResponse<T>(data: T, status?: number): SAMApiResponse;
/**
 * Create the route handler factory
 */
export declare function createRouteHandlerFactory(options: RouteHandlerFactoryOptions): RouteHandlerFactory;
export { createErrorResponse, createSuccessResponse, generateRequestId };
//# sourceMappingURL=factory.d.ts.map