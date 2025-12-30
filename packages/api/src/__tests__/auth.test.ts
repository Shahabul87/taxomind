/**
 * Authentication Middleware Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createAuthMiddleware,
  createTokenAuthenticator,
  composeAuthMiddleware,
  requireRoles,
} from '../middleware/auth';
import type {
  SAMApiRequest,
  SAMApiResponse,
  SAMHandler,
  SAMHandlerContext,
} from '../types';

// ============================================================================
// TEST FIXTURES
// ============================================================================

function createMockRequest(overrides?: Partial<SAMApiRequest>): SAMApiRequest {
  return {
    body: {},
    headers: {},
    method: 'POST',
    url: '/api/test',
    ...overrides,
  };
}

function createMockContext(overrides?: Partial<SAMHandlerContext>): SAMHandlerContext {
  return {
    config: {} as SAMHandlerContext['config'],
    requestId: 'test-request-id',
    timestamp: new Date(),
    ...overrides,
  };
}

function createMockHandler(): SAMHandler {
  return vi.fn().mockResolvedValue({
    status: 200,
    body: { success: true },
    headers: { 'Content-Type': 'application/json' },
  });
}

// ============================================================================
// createAuthMiddleware TESTS
// ============================================================================

describe('createAuthMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should pass through if no authenticate function provided', async () => {
    const handler = createMockHandler();
    const middleware = createAuthMiddleware(undefined);
    const wrappedHandler = middleware(handler);

    const request = createMockRequest();
    const context = createMockContext();

    await wrappedHandler(request, context);

    expect(handler).toHaveBeenCalledWith(request, context);
  });

  it('should return 401 if user is not authenticated', async () => {
    const handler = createMockHandler();
    const authenticate = vi.fn().mockResolvedValue(null);
    const middleware = createAuthMiddleware(authenticate);
    const wrappedHandler = middleware(handler);

    const request = createMockRequest();
    const context = createMockContext();

    const response = await wrappedHandler(request, context);

    expect(response.status).toBe(401);
    expect((response.body as { error: { code: string } }).error.code).toBe('UNAUTHORIZED');
    expect(handler).not.toHaveBeenCalled();
  });

  it('should call handler with user context when authenticated', async () => {
    const handler = createMockHandler();
    const user = { id: 'user-1', role: 'admin', name: 'Test User' };
    const authenticate = vi.fn().mockResolvedValue(user);
    const middleware = createAuthMiddleware(authenticate);
    const wrappedHandler = middleware(handler);

    const request = createMockRequest();
    const context = createMockContext();

    await wrappedHandler(request, context);

    expect(handler).toHaveBeenCalledWith(request, expect.objectContaining({ user }));
  });

  it('should check required roles', async () => {
    const handler = createMockHandler();
    const user = { id: 'user-1', role: 'user' };
    const authenticate = vi.fn().mockResolvedValue(user);
    const middleware = createAuthMiddleware(authenticate, { requiredRoles: ['admin'] });
    const wrappedHandler = middleware(handler);

    const request = createMockRequest();
    const context = createMockContext();

    const response = await wrappedHandler(request, context);

    expect(response.status).toBe(403);
    expect((response.body as { error: { code: string } }).error.code).toBe('FORBIDDEN');
  });

  it('should pass when user has required role', async () => {
    const handler = createMockHandler();
    const user = { id: 'user-1', role: 'admin' };
    const authenticate = vi.fn().mockResolvedValue(user);
    const middleware = createAuthMiddleware(authenticate, { requiredRoles: ['admin'] });
    const wrappedHandler = middleware(handler);

    const request = createMockRequest();
    const context = createMockContext();

    await wrappedHandler(request, context);

    expect(handler).toHaveBeenCalled();
  });

  it('should use custom onUnauthorized handler', async () => {
    const handler = createMockHandler();
    const authenticate = vi.fn().mockResolvedValue(null);
    const customResponse: SAMApiResponse = {
      status: 401,
      body: { custom: 'unauthorized' },
    };
    const middleware = createAuthMiddleware(authenticate, {
      onUnauthorized: () => customResponse,
    });
    const wrappedHandler = middleware(handler);

    const request = createMockRequest();
    const context = createMockContext();

    const response = await wrappedHandler(request, context);

    expect(response).toBe(customResponse);
  });

  it('should use custom onForbidden handler', async () => {
    const handler = createMockHandler();
    const user = { id: 'user-1', role: 'user' };
    const authenticate = vi.fn().mockResolvedValue(user);
    const customResponse: SAMApiResponse = {
      status: 403,
      body: { custom: 'forbidden' },
    };
    const middleware = createAuthMiddleware(authenticate, {
      requiredRoles: ['admin'],
      onForbidden: () => customResponse,
    });
    const wrappedHandler = middleware(handler);

    const request = createMockRequest();
    const context = createMockContext();

    const response = await wrappedHandler(request, context);

    expect(response).toBe(customResponse);
  });

  it('should handle authentication errors', async () => {
    const handler = createMockHandler();
    const authenticate = vi.fn().mockRejectedValue(new Error('Auth service error'));
    const middleware = createAuthMiddleware(authenticate);
    const wrappedHandler = middleware(handler);

    const request = createMockRequest();
    const context = createMockContext();

    const response = await wrappedHandler(request, context);

    expect(response.status).toBe(401);
    expect((response.body as { error: { code: string } }).error.code).toBe('AUTH_ERROR');
  });
});

// ============================================================================
// createTokenAuthenticator TESTS
// ============================================================================

describe('createTokenAuthenticator', () => {
  it('should return null if no authorization header', async () => {
    const validateToken = vi.fn();
    const authenticator = createTokenAuthenticator(validateToken);

    const request = createMockRequest({ headers: {} });
    const result = await authenticator(request);

    expect(result).toBeNull();
    expect(validateToken).not.toHaveBeenCalled();
  });

  it('should return null if authorization header is not Bearer scheme', async () => {
    const validateToken = vi.fn();
    const authenticator = createTokenAuthenticator(validateToken);

    const request = createMockRequest({
      headers: { authorization: 'Basic abc123' },
    });
    const result = await authenticator(request);

    expect(result).toBeNull();
    expect(validateToken).not.toHaveBeenCalled();
  });

  it('should extract and validate Bearer token', async () => {
    const user = { id: 'user-1', role: 'admin' };
    const validateToken = vi.fn().mockResolvedValue(user);
    const authenticator = createTokenAuthenticator(validateToken);

    const request = createMockRequest({
      headers: { authorization: 'Bearer valid-token-123' },
    });
    const result = await authenticator(request);

    expect(result).toBe(user);
    expect(validateToken).toHaveBeenCalledWith('valid-token-123');
  });

  it('should handle array authorization header', async () => {
    const user = { id: 'user-1', role: 'admin' };
    const validateToken = vi.fn().mockResolvedValue(user);
    const authenticator = createTokenAuthenticator(validateToken);

    const request = createMockRequest({
      headers: { authorization: ['Bearer token-1', 'Bearer token-2'] },
    });
    const result = await authenticator(request);

    expect(result).toBe(user);
    expect(validateToken).toHaveBeenCalledWith('token-1');
  });

  it('should return null if token is empty', async () => {
    const validateToken = vi.fn();
    const authenticator = createTokenAuthenticator(validateToken);

    const request = createMockRequest({
      headers: { authorization: 'Bearer ' },
    });
    const result = await authenticator(request);

    expect(result).toBeNull();
    expect(validateToken).not.toHaveBeenCalled();
  });
});

// ============================================================================
// composeAuthMiddleware TESTS
// ============================================================================

describe('composeAuthMiddleware', () => {
  it('should compose multiple middlewares', async () => {
    const middleware1 = vi.fn((handler: SAMHandler) => handler);
    const middleware2 = vi.fn((handler: SAMHandler) => handler);
    const composed = composeAuthMiddleware(middleware1, middleware2);

    const handler = createMockHandler();
    composed(handler);

    expect(middleware1).toHaveBeenCalled();
    expect(middleware2).toHaveBeenCalled();
  });

  it('should execute middlewares in correct order (right to left)', async () => {
    const order: number[] = [];

    const middleware1 = (handler: SAMHandler): SAMHandler => {
      order.push(1);
      return handler;
    };

    const middleware2 = (handler: SAMHandler): SAMHandler => {
      order.push(2);
      return handler;
    };

    const composed = composeAuthMiddleware(middleware1, middleware2);
    const handler = createMockHandler();
    composed(handler);

    expect(order).toEqual([2, 1]);
  });
});

// ============================================================================
// requireRoles TESTS
// ============================================================================

describe('requireRoles', () => {
  it('should return 401 if no user in context', async () => {
    const handler = createMockHandler();
    const middleware = requireRoles('admin');
    const wrappedHandler = middleware(handler);

    const request = createMockRequest();
    const context = createMockContext();

    const response = await wrappedHandler(request, context);

    expect(response.status).toBe(401);
    expect((response.body as { error: { code: string } }).error.code).toBe('UNAUTHORIZED');
  });

  it('should return 403 if user does not have required role', async () => {
    const handler = createMockHandler();
    const middleware = requireRoles('admin');
    const wrappedHandler = middleware(handler);

    const request = createMockRequest();
    const context = createMockContext({ user: { id: 'user-1', role: 'user' } });

    const response = await wrappedHandler(request, context);

    expect(response.status).toBe(403);
    expect((response.body as { error: { code: string } }).error.code).toBe('FORBIDDEN');
  });

  it('should call handler if user has required role', async () => {
    const handler = createMockHandler();
    const middleware = requireRoles('admin');
    const wrappedHandler = middleware(handler);

    const request = createMockRequest();
    const context = createMockContext({ user: { id: 'user-1', role: 'admin' } });

    await wrappedHandler(request, context);

    expect(handler).toHaveBeenCalled();
  });

  it('should accept any of multiple roles', async () => {
    const handler = createMockHandler();
    const middleware = requireRoles('admin', 'moderator');
    const wrappedHandler = middleware(handler);

    const request = createMockRequest();
    const context = createMockContext({ user: { id: 'user-1', role: 'moderator' } });

    await wrappedHandler(request, context);

    expect(handler).toHaveBeenCalled();
  });

  it('should include required roles in error message', async () => {
    const handler = createMockHandler();
    const middleware = requireRoles('admin', 'moderator');
    const wrappedHandler = middleware(handler);

    const request = createMockRequest();
    const context = createMockContext({ user: { id: 'user-1', role: 'user' } });

    const response = await wrappedHandler(request, context);

    expect((response.body as { error: { message: string } }).error.message).toContain('admin or moderator');
  });
});
