jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn(),
}));

jest.mock('@/lib/sam/ai-provider', () => ({
  withSubscriptionGate: jest.fn(),
}));

jest.mock('@/lib/sam/course-creation/orchestrator', () => ({
  resumeCourseCreation: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    sAMExecutionPlan: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    course: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@prisma/client', () => ({
  Prisma: {
    DbNull: 'DbNull',
  },
}));

import { POST } from '@/app/api/sam/course-creation/approve-and-resume/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { withSubscriptionGate } from '@/lib/sam/ai-provider';
import { resumeCourseCreation } from '@/lib/sam/course-creation/orchestrator';
import { NextRequest, NextResponse } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;
const mockWithRateLimit = withRateLimit as jest.Mock;
const mockWithSubscriptionGate = withSubscriptionGate as jest.Mock;
const mockResumeCourseCreation = resumeCourseCreation as jest.Mock;
const samExecutionPlan = (db as any).sAMExecutionPlan as Record<string, jest.Mock>;

function postReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/sam/course-creation/approve-and-resume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/sam/course-creation/approve-and-resume', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWithRateLimit.mockResolvedValue(null);
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockWithSubscriptionGate.mockResolvedValue({ allowed: true });
    samExecutionPlan.findFirst.mockResolvedValue({
      id: 'plan-1',
      goal: { userId: 'user-1' },
      checkpointData: { courseId: 'course-1', config: { totalChapters: 2 } },
    });
    samExecutionPlan.update.mockResolvedValue({ id: 'plan-1' });
    (db.course.findUnique as jest.Mock).mockResolvedValue(null);
    mockResumeCourseCreation.mockResolvedValue({
      success: true,
      chaptersCreated: 1,
      sectionsCreated: 2,
    });
  });

  it('returns rate-limit response when blocked', async () => {
    mockWithRateLimit.mockResolvedValueOnce(new Response('Too Many Requests', { status: 429 }));

    const res = await POST(postReq({ courseId: 'course-1', decision: 'approve_continue' }));

    expect(res.status).toBe(429);
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const res = await POST(postReq({ courseId: 'course-1', decision: 'approve_continue' }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
  });

  it('returns subscription gate response when not allowed', async () => {
    mockWithSubscriptionGate.mockResolvedValueOnce({
      allowed: false,
      response: NextResponse.json({ error: 'Upgrade required' }, { status: 402 }),
    });

    const res = await POST(postReq({ courseId: 'course-1', decision: 'approve_continue' }));

    expect(res.status).toBe(402);
  });

  it('returns 404 when paused plan is not found', async () => {
    samExecutionPlan.findFirst.mockResolvedValueOnce(null);

    const res = await POST(postReq({ courseId: 'course-1', decision: 'approve_continue' }));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('aborts pipeline when decision is reject_abort', async () => {
    const res = await POST(postReq({ courseId: 'course-1', decision: 'reject_abort' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.decision).toBe('reject_abort');
    expect(samExecutionPlan.update).toHaveBeenCalledWith({
      where: { id: 'plan-1' },
      data: { status: 'FAILED' },
    });
    expect(mockResumeCourseCreation).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid request payload', async () => {
    const res = await POST(postReq({ courseId: '', decision: 'invalid' }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(mockResumeCourseCreation).not.toHaveBeenCalled();
  });
});
