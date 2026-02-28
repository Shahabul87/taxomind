jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

jest.mock('@/lib/api', () => {
  class MockApiError extends Error {
    statusCode: number;
    code: string;
    details?: unknown;

    constructor(message: string, statusCode: number, code: string, details?: unknown) {
      super(message);
      this.statusCode = statusCode;
      this.code = code;
      this.details = details;
    }

    static notFound(message = 'Not Found') {
      return new MockApiError(message, 404, 'NOT_FOUND');
    }

    static internal(message = 'Internal Server Error') {
      return new MockApiError(message, 500, 'INTERNAL_ERROR');
    }
  }

  return {
    withAuth: (handler: unknown) => handler,
    withOwnership: (_idGetter: unknown, handler: unknown) => handler,
    createSuccessResponse: (data: unknown, status = 200) =>
      new Response(
        JSON.stringify({ success: true, data }),
        { status, headers: { 'content-type': 'application/json' } }
      ),
    createErrorResponse: (error: InstanceType<typeof MockApiError>) =>
      new Response(
        JSON.stringify({
          success: false,
          error: { message: error.message, code: error.code },
        }),
        { status: error.statusCode, headers: { 'content-type': 'application/json' } }
      ),
    ApiError: MockApiError,
  };
});

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/users/[userId]/route';
import { db } from '@/lib/db';

const mockDb = db as Record<string, any>;
const params = { params: Promise.resolve({ userId: 'user-1' }) };

describe('GET /api/users/[userId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.user = {
      findUnique: jest.fn(),
    };
  });

  it('returns 404 when user is not found', async () => {
    mockDb.user.findUnique.mockResolvedValueOnce(null);

    const res = await GET(new NextRequest('http://localhost:3000/api/users/user-1'), params);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('returns user details when found', async () => {
    mockDb.user.findUnique.mockResolvedValueOnce({
      id: 'user-1',
      name: 'Alice',
      profileLinks: [],
    });

    const res = await GET(new NextRequest('http://localhost:3000/api/users/user-1'), params);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('user-1');
  });
});
