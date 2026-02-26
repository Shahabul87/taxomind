jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    sAMExecutionPlan: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@prisma/client', () => ({
  Prisma: {
    DbNull: 'DbNull',
  },
}));

import { POST } from '@/app/api/sam/course-creation/approve/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;
const mockWithRateLimit = withRateLimit as jest.Mock;
const samExecutionPlan = (db as any).sAMExecutionPlan as Record<string, jest.Mock>;

function postReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/sam/course-creation/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/sam/course-creation/approve', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWithRateLimit.mockResolvedValue(null);
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    samExecutionPlan.findFirst.mockResolvedValue({
      id: 'plan-1',
      goal: { userId: 'user-1' },
      checkpointData: { courseId: 'course-1', completedChapterCount: 2, totalChapters: 6 },
    });
    samExecutionPlan.update.mockResolvedValue({ id: 'plan-1' });
  });

  it('returns rate-limit response when blocked', async () => {
    mockWithRateLimit.mockResolvedValueOnce(new Response('Too Many Requests', { status: 429 }));

    const res = await POST(postReq({ courseId: 'course-1', decision: 'approve_continue' }));

    expect(res.status).toBe(429);
  });

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const res = await POST(postReq({ courseId: 'course-1', decision: 'approve_continue' }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('returns 400 for invalid request payload', async () => {
    const res = await POST(postReq({ courseId: '', decision: 'invalid' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid request');
  });

  it('returns 404 when paused plan is not found', async () => {
    samExecutionPlan.findFirst.mockResolvedValueOnce(null);

    const res = await POST(postReq({ courseId: 'course-1', decision: 'approve_continue' }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('approves and continues pipeline', async () => {
    const res = await POST(postReq({ courseId: 'course-1', decision: 'approve_continue' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.decision).toBe('approve_continue');
    expect(body.resumeReady).toBe(true);
    expect(samExecutionPlan.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'plan-1' },
        data: expect.objectContaining({ status: 'ACTIVE' }),
      })
    );
  });

  it('aborts pipeline for reject decision', async () => {
    const res = await POST(postReq({ courseId: 'course-1', decision: 'reject_abort' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.decision).toBe('reject_abort');
    expect(samExecutionPlan.update).toHaveBeenCalledWith({
      where: { id: 'plan-1' },
      data: { status: 'FAILED' },
    });
  });
});
