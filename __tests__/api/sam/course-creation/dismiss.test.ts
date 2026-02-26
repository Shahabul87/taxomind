jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    sAMExecutionPlan: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    rateLimit: {
      deleteMany: jest.fn(),
    },
  },
}));

import { POST } from '@/app/api/sam/course-creation/dismiss/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;
const mockWithRateLimit = withRateLimit as jest.Mock;
const samExecutionPlan = (db as any).sAMExecutionPlan as Record<string, jest.Mock>;

if (!(db as any).rateLimit) {
  (db as any).rateLimit = { deleteMany: jest.fn() };
}
const rateLimitModel = (db as any).rateLimit as Record<string, jest.Mock>;

function req() {
  return new NextRequest('http://localhost:3000/api/sam/course-creation/dismiss', {
    method: 'POST',
  });
}

describe('POST /api/sam/course-creation/dismiss', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWithRateLimit.mockResolvedValue(null);
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    samExecutionPlan.findMany.mockResolvedValue([{ id: 'plan-1' }, { id: 'plan-2' }]);
    samExecutionPlan.updateMany.mockResolvedValue({ count: 2 });
    rateLimitModel.deleteMany.mockResolvedValue({ count: 1 });
  });

  it('returns rate-limit response when blocked', async () => {
    mockWithRateLimit.mockResolvedValueOnce(new Response('Too Many Requests', { status: 429 }));

    const res = await POST(req());
    expect(res.status).toBe(429);
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const res = await POST(req());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('returns dismissed: 0 when no active plans exist', async () => {
    samExecutionPlan.findMany.mockResolvedValueOnce([]);

    const res = await POST(req());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.dismissed).toBe(0);
    expect(samExecutionPlan.updateMany).not.toHaveBeenCalled();
  });

  it('cancels active plans and clears dedupe locks', async () => {
    const res = await POST(req());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.dismissed).toBe(2);
    expect(samExecutionPlan.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['plan-1', 'plan-2'] } },
      data: { status: 'CANCELLED' },
    });
    expect(rateLimitModel.deleteMany).toHaveBeenCalledWith({
      where: {
        identifier: { startsWith: 'user-1:' },
        endpoint: 'sam_orchestrate_dedupe_lock',
      },
    });
  });

  it('returns 500 when plan lookup fails', async () => {
    samExecutionPlan.findMany.mockRejectedValueOnce(new Error('db down'));

    const res = await POST(req());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
  });
});
