jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { POST } from '@/app/api/analytics/route';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;
const mockLogger = logger as unknown as { info: jest.Mock; error: jest.Mock };

describe('POST /api/analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1', organizationId: 'org-1' });
  });

  it('logs event and returns success', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics', {
      method: 'POST',
      headers: { referer: 'http://localhost/dashboard' },
      body: JSON.stringify({
        eventName: 'page_view',
        properties: { page: '/dashboard' },
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Analytics event',
      expect.objectContaining({
        eventName: 'page_view',
        userId: 'user-1',
      })
    );
  });

  it('falls back to unknown event when payload omits analytics fields', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Analytics event',
      expect.objectContaining({ eventName: 'unknown' })
    );
  });

  it('returns 500 when unexpected errors occur', async () => {
    mockCurrentUser.mockRejectedValueOnce(new Error('auth failed'));

    const req = new NextRequest('http://localhost:3000/api/analytics', {
      method: 'POST',
      body: JSON.stringify({ eventName: 'test' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Server error');
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
