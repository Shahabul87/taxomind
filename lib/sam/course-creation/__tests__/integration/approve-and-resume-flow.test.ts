/**
 * Integration tests for atomic approve+resume route.
 *
 * Validates:
 * 1. Auth + validation behavior
 * 2. Reject path aborts without resume
 * 3. Approve path returns SSE and invokes resumeCourseCreation once
 */

jest.mock('@prisma/client', () => ({
  Prisma: {
    DbNull: Symbol('DbNull'),
    JsonNull: Symbol('JsonNull'),
    AnyNull: Symbol('AnyNull'),
  },
}));

jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  db: {
    sAMExecutionPlan: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/lib/sam/ai-provider', () => ({
  withSubscriptionGate: jest.fn().mockResolvedValue({ allowed: true }),
}));

jest.mock('@/lib/sam/course-creation/orchestrator', () => ({
  resumeCourseCreation: jest.fn(),
}));

if (!(global as unknown as { ReadableStream?: unknown }).ReadableStream) {
  // Jest Node environment may not expose WHATWG ReadableStream by default.
  (global as unknown as { ReadableStream: unknown }).ReadableStream = require('stream/web').ReadableStream;
}

import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { resumeCourseCreation } from '@/lib/sam/course-creation/orchestrator';
import { POST } from '@/app/api/sam/course-creation/approve-and-resume/route';

const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
const mockDb = db as jest.Mocked<typeof db>;
const mockWithRateLimit = withRateLimit as jest.MockedFunction<typeof withRateLimit>;
const mockResume = resumeCourseCreation as jest.MockedFunction<typeof resumeCourseCreation>;

function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/sam/course-creation/approve-and-resume', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Approve + Resume Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWithRateLimit.mockResolvedValue(null);
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null as never);
    const res = await POST(createRequest({ courseId: 'c-1', decision: 'approve_continue' }));
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
  });

  it('returns 404 when paused plan does not exist', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' } as never);
    (mockDb.sAMExecutionPlan.findFirst as jest.Mock).mockResolvedValue(null);

    const res = await POST(createRequest({ courseId: 'missing', decision: 'approve_continue' }));
    const json = await res.json();
    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
  });

  it('handles reject_abort without invoking resume', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' } as never);
    (mockDb.sAMExecutionPlan.findFirst as jest.Mock).mockResolvedValue({
      id: 'plan-1',
      checkpointData: { courseId: 'course-1' },
      goal: { userId: 'user-1' },
    });
    (mockDb.sAMExecutionPlan.update as jest.Mock).mockResolvedValue({});

    const res = await POST(createRequest({ courseId: 'course-1', decision: 'reject_abort' }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.decision).toBe('reject_abort');
    expect(mockResume).not.toHaveBeenCalled();
    expect(mockDb.sAMExecutionPlan.update).toHaveBeenCalledWith({
      where: { id: 'plan-1' },
      data: { status: 'FAILED' },
    });
  });

  it('approves and returns SSE stream while invoking resume', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' } as never);
    (mockDb.sAMExecutionPlan.findFirst as jest.Mock).mockResolvedValue({
      id: 'plan-1',
      checkpointData: {
        courseId: 'course-1',
        totalChapters: 5,
        config: {
          courseTitle: 'Test',
          courseDescription: 'Desc',
          targetAudience: 'Teachers',
          difficulty: 'beginner',
          totalChapters: 5,
          sectionsPerChapter: 3,
          learningObjectivesPerChapter: 5,
          learningObjectivesPerSection: 3,
          courseGoals: ['Goal'],
          bloomsFocus: [],
          preferredContentTypes: [],
        },
      },
      goal: { userId: 'user-1' },
    });
    (mockDb.sAMExecutionPlan.update as jest.Mock).mockResolvedValue({});
    mockResume.mockResolvedValue({
      success: true,
      courseId: 'course-1',
      chaptersCreated: 3,
      sectionsCreated: 9,
    });

    const res = await POST(createRequest({ courseId: 'course-1', decision: 'approve_continue' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/event-stream');
    expect(mockResume).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        resumeCourseId: 'course-1',
      }),
    );
  });
});
