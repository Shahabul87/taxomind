/**
 * Tests for Posts API Routes - app/api/posts/route.ts
 *
 * Covers: POST (create a new post), GET (list posts)
 * Both endpoints are wrapped with withAuth which calls currentUser() internally.
 */

// Modules are globally mocked in jest.setup.js: @/lib/db, @/lib/auth, @/lib/logger, next/server

// Mock admin auth modules to prevent Credentials() import error
jest.mock('@/auth.config.admin', () => ({
  default: { providers: [] },
}));

jest.mock('@/auth.admin', () => ({
  adminAuth: jest.fn().mockResolvedValue(null),
  default: jest.fn(),
}));

jest.mock('@/lib/api-protection', () => ({
  requireAuth: jest.fn(),
  requireRole: jest.fn(),
  requirePermission: jest.fn(),
  UnauthorizedError: class extends Error {
    constructor(m?: string) { super(m || 'Unauthorized'); }
  },
  ForbiddenError: class extends Error {
    constructor(m?: string) { super(m || 'Forbidden'); }
  },
}));

jest.mock('@/lib/services/post.service', () => ({
  postService: {
    createPost: jest.fn(),
  },
  PostService: jest.fn(),
  ServiceError: jest.fn(),
}));

jest.mock('@/actions/get-simple-posts', () => ({
  getSimplePostsForBlog: jest.fn(),
}));

jest.mock('@/lib/schemas/post.schemas', () => ({
  safeValidateCreatePostInput: jest.fn(),
  formatValidationErrors: jest.fn(),
  POST_VALIDATION: {
    TITLE_MIN_LENGTH: 3,
    TITLE_MAX_LENGTH: 100,
    CATEGORY_MAX_LENGTH: 50,
    MAX_CATEGORIES: 5,
  },
}));

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn().mockResolvedValue({
    success: true,
    limit: 100,
    remaining: 99,
    reset: Date.now() + 60000,
  }),
  getClientIdentifier: jest.fn().mockReturnValue('127.0.0.1'),
  getRateLimitHeaders: jest.fn().mockReturnValue({}),
  isRateLimited: jest.fn().mockResolvedValue({ limited: false }),
  getRateLimitMessage: jest.fn().mockReturnValue('Rate limit exceeded'),
}));

jest.mock('@/lib/role-management', () => ({
  hasPermission: jest.fn().mockResolvedValue(true),
  Permission: {},
}));

import { POST, GET } from '@/app/api/posts/route';
import { currentUser, currentRole } from '@/lib/auth';
import { postService } from '@/lib/services/post.service';
import { getSimplePostsForBlog } from '@/actions/get-simple-posts';
import {
  safeValidateCreatePostInput,
  formatValidationErrors,
} from '@/lib/schemas/post.schemas';

const mockCurrentUser = currentUser as jest.Mock;
const mockCurrentRole = currentRole as jest.Mock;
const mockPostService = postService.createPost as jest.Mock;
const mockGetSimplePosts = getSimplePostsForBlog as jest.Mock;
const mockSafeValidate = safeValidateCreatePostInput as jest.Mock;
const mockFormatErrors = formatValidationErrors as jest.Mock;

const { NextRequest } = jest.requireMock('next/server');

function createPostRequest(body?: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function createGetRequest(searchParams?: Record<string, string>) {
  let url = 'http://localhost:3000/api/posts';
  if (searchParams) {
    const params = new URLSearchParams(searchParams);
    url += `?${params.toString()}`;
  }
  return new NextRequest(url, {
    method: 'GET',
  });
}

// Polyfill crypto.randomUUID for jsdom test environment
beforeAll(() => {
  if (typeof globalThis.crypto?.randomUUID !== 'function') {
    const nodeCrypto = require('crypto');
    Object.defineProperty(globalThis.crypto, 'randomUUID', {
      value: () => nodeCrypto.randomUUID(),
      configurable: true,
      writable: true,
    });
  }
});

describe('POST /api/posts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      image: null,
      isOAuth: false,
      isTwoFactorEnabled: false,
    });
    mockCurrentRole.mockResolvedValue(null);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await POST(createPostRequest({ title: 'Test Post' }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 400 when request body is invalid JSON', async () => {
    const req = new NextRequest('http://localhost:3000/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });
    // Override json() to throw a parse error
    req.json = jest.fn().mockRejectedValue(new SyntaxError('Unexpected token'));

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_JSON');
  });

  it('returns 400 when validation fails', async () => {
    const zodError = {
      name: 'ZodError',
      errors: [{ path: ['title'], message: 'Too short' }],
    };
    mockSafeValidate.mockReturnValue({
      success: false,
      error: zodError,
    });
    mockFormatErrors.mockReturnValue({
      code: 'VALIDATION_ERROR',
      message: 'Invalid input data',
      details: { title: ['Too short'] },
    });

    const res = await POST(createPostRequest({ title: 'ab' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(mockFormatErrors).toHaveBeenCalledWith(zodError);
  });

  it('returns 201 when post is created successfully', async () => {
    const mockPost = {
      id: 'post-1',
      title: 'My Test Post',
      userId: 'user-1',
      category: 'Tech',
      createdAt: new Date().toISOString(),
    };

    mockSafeValidate.mockReturnValue({
      success: true,
      data: { title: 'My Test Post', categories: ['Tech'] },
    });

    mockPostService.mockResolvedValue({
      success: true,
      post: mockPost,
    });

    const res = await POST(
      createPostRequest({ title: 'My Test Post', categories: ['Tech'] })
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('post-1');
    expect(body.data.title).toBe('My Test Post');
  });

  it('returns 500 when service returns a non-validation error', async () => {
    mockSafeValidate.mockReturnValue({
      success: true,
      data: { title: 'Valid Title' },
    });

    mockPostService.mockResolvedValue({
      success: false,
      error: {
        code: 'POST_CREATION_FAILED',
        message: 'Failed to create post',
      },
    });

    const res = await POST(createPostRequest({ title: 'Valid Title' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('POST_CREATION_FAILED');
  });

  it('returns 400 when service returns a VALIDATION_ERROR', async () => {
    mockSafeValidate.mockReturnValue({
      success: true,
      data: { title: 'Valid Title' },
    });

    mockPostService.mockResolvedValue({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data provided',
      },
    });

    const res = await POST(createPostRequest({ title: 'Valid Title' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 500 on unexpected errors with safe error message', async () => {
    mockSafeValidate.mockReturnValue({
      success: true,
      data: { title: 'Valid Title' },
    });

    mockPostService.mockRejectedValue(new Error('Unexpected DB crash'));

    const res = await POST(createPostRequest({ title: 'Valid Title' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(body.error.message).toBe(
      'An unexpected error occurred. Please try again later.'
    );
  });

  it('includes metadata with requestId and version in success response', async () => {
    mockSafeValidate.mockReturnValue({
      success: true,
      data: { title: 'Meta Test Post' },
    });

    mockPostService.mockResolvedValue({
      success: true,
      post: { id: 'post-2', title: 'Meta Test Post', userId: 'user-1' },
    });

    const res = await POST(createPostRequest({ title: 'Meta Test Post' }));
    const body = await res.json();

    expect(body.metadata).toBeDefined();
    expect(body.metadata.timestamp).toBeDefined();
    expect(body.metadata.requestId).toBeDefined();
    expect(body.metadata.version).toBe('1.0.0');
  });

  it('passes the correct userId to the service', async () => {
    mockSafeValidate.mockReturnValue({
      success: true,
      data: { title: 'Test', categories: [] },
    });

    mockPostService.mockResolvedValue({
      success: true,
      post: { id: 'post-3', title: 'Test', userId: 'user-1' },
    });

    await POST(createPostRequest({ title: 'Test' }));

    expect(mockPostService).toHaveBeenCalledWith('user-1', {
      title: 'Test',
      categories: [],
    });
  });

  it('returns error when validation data is undefined despite success flag', async () => {
    mockSafeValidate.mockReturnValue({
      success: true,
      data: undefined,
    });

    const res = await POST(createPostRequest({ title: 'Test' }));
    const body = await res.json();

    // The route guards: if (!validation.data) throw Error(...)
    // The inner catch block returns 500 INTERNAL_SERVER_ERROR
    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
  });

  it('includes metadata in error responses as well', async () => {
    mockSafeValidate.mockReturnValue({
      success: true,
      data: undefined,
    });

    const res = await POST(createPostRequest({ title: 'Test' }));
    const body = await res.json();

    expect(body.metadata).toBeDefined();
    expect(body.metadata.timestamp).toBeDefined();
    expect(body.metadata.requestId).toBeDefined();
  });
});

describe('GET /api/posts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      image: null,
      isOAuth: false,
      isTwoFactorEnabled: false,
    });
    mockCurrentRole.mockResolvedValue(null);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns list of posts successfully', async () => {
    const mockPosts = [
      { id: 'post-1', title: 'Post 1', description: 'Desc 1' },
      { id: 'post-2', title: 'Post 2', description: 'Desc 2' },
    ];

    mockGetSimplePosts.mockResolvedValue(mockPosts);

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.posts).toHaveLength(2);
    expect(body.data.count).toBe(2);
  });

  it('returns empty array when no posts exist', async () => {
    mockGetSimplePosts.mockResolvedValue([]);

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.posts).toHaveLength(0);
    expect(body.data.count).toBe(0);
  });

  it('returns 500 when fetching posts throws an error', async () => {
    mockGetSimplePosts.mockRejectedValue(new Error('DB connection failed'));

    const res = await GET(createGetRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });

  it('calls getSimplePostsForBlog exactly once', async () => {
    mockGetSimplePosts.mockResolvedValue([]);

    await GET(createGetRequest());

    expect(mockGetSimplePosts).toHaveBeenCalledTimes(1);
  });
});
