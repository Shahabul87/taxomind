/**
 * Tests for SAM Agentic Notifications API
 *
 * Covers:
 * - Rate limiting on all 4 HTTP methods (GET, POST, PATCH, DELETE)
 * - Auth enforcement
 * - GET: query filtering, pagination
 * - POST: mark-read validation
 * - PATCH: dismiss with feedback, ownership check
 * - DELETE: clears only read SAM notifications
 */

import { NextRequest } from 'next/server';

// ============================================================================
// MOCKS
// ============================================================================

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/db-pooled', () => {
  const notificationMocks = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  };
  return {
    db: { notification: notificationMocks },
    getDb: () => ({ notification: notificationMocks }),
    getDbMetrics: jest.fn(),
    checkDatabaseHealth: jest.fn(),
    __mocks__: notificationMocks,
  };
});

jest.mock('@/lib/db', () => {
  const pooled = jest.requireMock('@/lib/db-pooled');
  return { db: pooled.db };
});

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn(),
}));

// ============================================================================
// IMPORTS (after mocks)
// ============================================================================

import { GET, POST, PATCH, DELETE } from '@/app/api/sam/agentic/notifications/route';
import { auth } from '@/auth';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';

const dbMock = jest.requireMock('@/lib/db-pooled').__mocks__;
const mockAuth = auth as jest.Mock;
const mockRateLimit = withRateLimit as jest.Mock;

// ============================================================================
// HELPERS
// ============================================================================

function createRequest(
  method: string,
  query?: Record<string, string>,
  body?: Record<string, unknown>
): NextRequest {
  const url = new URL('http://localhost/api/sam/agentic/notifications');
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.set(k, v);
    }
  }
  const init: RequestInit = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  return new NextRequest(url, init);
}

// ============================================================================
// TESTS
// ============================================================================

describe('Notification API - Rate Limiting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue(null); // Allow by default
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('GET applies readonly rate limit', async () => {
    dbMock.findMany.mockResolvedValue([]);
    dbMock.count.mockResolvedValue(0);

    await GET(createRequest('GET'));

    expect(mockRateLimit).toHaveBeenCalledWith(expect.any(NextRequest), 'readonly');
  });

  it('POST applies standard rate limit', async () => {
    dbMock.updateMany.mockResolvedValue({ count: 1 });

    await POST(createRequest('POST', undefined, { notificationIds: ['n-1'] }));

    expect(mockRateLimit).toHaveBeenCalledWith(expect.any(NextRequest), 'standard');
  });

  it('PATCH applies standard rate limit', async () => {
    dbMock.findFirst.mockResolvedValue({ id: 'n-1', userId: 'user-1', type: 'SAM_CHECK_IN' });
    dbMock.update.mockResolvedValue({});

    await PATCH(createRequest('PATCH', undefined, { notificationId: 'n-1' }));

    expect(mockRateLimit).toHaveBeenCalledWith(expect.any(NextRequest), 'standard');
  });

  it('DELETE applies standard rate limit', async () => {
    dbMock.deleteMany.mockResolvedValue({ count: 0 });

    await DELETE(createRequest('DELETE'));

    expect(mockRateLimit).toHaveBeenCalledWith(expect.any(NextRequest), 'standard');
  });

  it('returns rate limit response when blocked', async () => {
    const blockedResponse = new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
    mockRateLimit.mockResolvedValue(blockedResponse);

    const response = await GET(createRequest('GET'));

    expect(response.status).toBe(429);
    // Auth and DB should NOT have been called
    expect(mockAuth).not.toHaveBeenCalled();
    expect(dbMock.findMany).not.toHaveBeenCalled();
  });
});

describe('Notification API - Auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue(null);
  });

  it('GET returns 401 for unauthenticated user', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await GET(createRequest('GET'));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('POST returns 401 for unauthenticated user', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await POST(
      createRequest('POST', undefined, { notificationIds: ['n-1'] })
    );
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('PATCH returns 401 for unauthenticated user', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await PATCH(
      createRequest('PATCH', undefined, { notificationId: 'n-1' })
    );
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('DELETE returns 401 for unauthenticated user', async () => {
    mockAuth.mockResolvedValue(null);

    const response = await DELETE(createRequest('DELETE'));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });
});

describe('GET /api/sam/agentic/notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue(null);
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('returns notifications with pagination', async () => {
    const mockNotifications = [
      { id: 'n-1', type: 'SAM_CHECK_IN', read: false, createdAt: new Date() },
      { id: 'n-2', type: 'SAM_MILESTONE', read: true, createdAt: new Date() },
    ];
    dbMock.findMany.mockResolvedValue(mockNotifications);
    dbMock.count
      .mockResolvedValueOnce(5)  // total
      .mockResolvedValueOnce(3); // unreadCount

    const response = await GET(createRequest('GET'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.notifications).toHaveLength(2);
    expect(data.data.pagination.total).toBe(5);
    expect(data.data.unreadCount).toBe(3);
  });

  it('filters by type when specified', async () => {
    dbMock.findMany.mockResolvedValue([]);
    dbMock.count.mockResolvedValue(0);

    await GET(createRequest('GET', { type: 'SAM_MILESTONE' }));

    expect(dbMock.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          type: { in: ['SAM_MILESTONE'] },
        }),
      })
    );
  });

  it('returns 400 for invalid query params', async () => {
    const response = await GET(createRequest('GET', { type: 'INVALID_TYPE' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid query parameters');
  });
});

describe('POST /api/sam/agentic/notifications (mark read)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue(null);
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('marks notifications as read', async () => {
    dbMock.updateMany.mockResolvedValue({ count: 2 });

    const response = await POST(
      createRequest('POST', undefined, { notificationIds: ['n-1', 'n-2'] })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.updated).toBe(2);
    expect(dbMock.updateMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['n-1', 'n-2'] },
        userId: 'user-1',
      },
      data: { read: true },
    });
  });

  it('returns 400 for empty notificationIds', async () => {
    const response = await POST(
      createRequest('POST', undefined, { notificationIds: [] })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request data');
  });
});

describe('PATCH /api/sam/agentic/notifications (dismiss)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue(null);
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('dismisses notification with feedback', async () => {
    dbMock.findFirst.mockResolvedValue({
      id: 'n-1',
      userId: 'user-1',
      type: 'SAM_CHECK_IN',
    });
    dbMock.update.mockResolvedValue({});

    const response = await PATCH(
      createRequest('PATCH', undefined, {
        notificationId: 'n-1',
        feedback: 'helpful',
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.dismissed).toBe(true);
    expect(data.data.feedbackRecorded).toBe(true);
    expect(dbMock.update).toHaveBeenCalledWith({
      where: { id: 'n-1' },
      data: expect.objectContaining({
        read: true,
        dismissedAt: expect.any(Date),
        feedback: 'helpful',
      }),
    });
  });

  it('dismisses without feedback', async () => {
    dbMock.findFirst.mockResolvedValue({
      id: 'n-1',
      userId: 'user-1',
      type: 'SAM_CHECK_IN',
    });
    dbMock.update.mockResolvedValue({});

    const response = await PATCH(
      createRequest('PATCH', undefined, { notificationId: 'n-1' })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.feedbackRecorded).toBe(false);
  });

  it('returns 404 if notification not owned by user', async () => {
    dbMock.findFirst.mockResolvedValue(null);

    const response = await PATCH(
      createRequest('PATCH', undefined, { notificationId: 'n-999' })
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Notification not found');
  });

  it('returns 400 for invalid feedback value', async () => {
    const response = await PATCH(
      createRequest('PATCH', undefined, {
        notificationId: 'n-1',
        feedback: 'invalid_value',
      })
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request data');
  });
});

describe('DELETE /api/sam/agentic/notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockResolvedValue(null);
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('deletes only read SAM notifications for the user', async () => {
    dbMock.deleteMany.mockResolvedValue({ count: 3 });

    const response = await DELETE(createRequest('DELETE'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.deleted).toBe(3);
    expect(dbMock.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        read: true,
        type: {
          in: ['SAM_CHECK_IN', 'SAM_INTERVENTION', 'SAM_MILESTONE', 'SAM_RECOMMENDATION'],
        },
      },
    });
  });
});
