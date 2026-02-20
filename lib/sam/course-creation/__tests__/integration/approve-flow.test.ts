/**
 * Integration tests for Escalation Approval Flow
 *
 * Validates that:
 * 1. Approve with correct courseId succeeds and sets status to ACTIVE
 * 2. Approve with wrong courseId returns 404
 * 3. Approve with wrong user returns 403 (authorization check)
 * 4. All three decision types (approve_continue, approve_heal, reject_abort) work
 * 5. Response includes resumeReady, planId, progress for continue/heal decisions
 * 6. Invalid request body returns 400
 * 7. Unauthenticated request returns 401
 */

// Mock external dependencies before imports
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

import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.MockedFunction<typeof currentUser>;
const mockDb = db as jest.Mocked<typeof db>;

// Import the handler
import { POST } from '@/app/api/sam/course-creation/approve/route';

function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/sam/course-creation/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Approve Flow - Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null as never);

    const req = createRequest({ courseId: 'course-1', decision: 'approve_continue' });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error).toContain('Unauthorized');
  });
});

describe('Approve Flow - Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1', email: 'test@test.com' } as never);
  });

  it('should return 400 for missing courseId', async () => {
    const req = createRequest({ decision: 'approve_continue' });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('should return 400 for invalid decision type', async () => {
    const req = createRequest({ courseId: 'course-1', decision: 'invalid_decision' });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('should return 400 for empty courseId', async () => {
    const req = createRequest({ courseId: '', decision: 'approve_continue' });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
  });
});

describe('Approve Flow - Course Lookup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1', email: 'test@test.com' } as never);
  });

  it('should return 404 when no paused plan exists for the courseId', async () => {
    (mockDb.sAMExecutionPlan.findFirst as jest.Mock).mockResolvedValue(null);

    const req = createRequest({ courseId: 'nonexistent-course', decision: 'approve_continue' });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error).toContain('No paused pipeline found');
    expect(json.error).toContain('nonexistent-course');
  });

  it('should query with courseId filter in Prisma where clause', async () => {
    (mockDb.sAMExecutionPlan.findFirst as jest.Mock).mockResolvedValue(null);

    const req = createRequest({ courseId: 'course-42', decision: 'approve_continue' });
    await POST(req);

    // Verify the Prisma query includes courseId in the where clause
    expect(mockDb.sAMExecutionPlan.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'PAUSED',
          checkpointData: expect.objectContaining({
            path: ['courseId'],
            equals: 'course-42',
          }),
        }),
      }),
    );
  });

  it('should return 403 when plan belongs to a different user', async () => {
    // Plan exists but belongs to user-2
    (mockDb.sAMExecutionPlan.findFirst as jest.Mock).mockResolvedValue({
      id: 'plan-1',
      checkpointData: {
        courseId: 'course-1',
        completedChapterCount: 5,
        totalChapters: 10,
      },
      goal: { userId: 'user-2' }, // Different user
    });

    const req = createRequest({ courseId: 'course-1', decision: 'approve_continue' });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json.success).toBe(false);
    expect(json.error).toContain('Unauthorized');
  });
});

describe('Approve Flow - Decision Handling', () => {
  const basePlan = {
    id: 'plan-1',
    checkpointData: {
      courseId: 'course-1',
      completedChapterCount: 5,
      totalChapters: 10,
    },
    goal: { userId: 'user-1' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1', email: 'test@test.com' } as never);
    (mockDb.sAMExecutionPlan.findFirst as jest.Mock).mockResolvedValue(basePlan);
    (mockDb.sAMExecutionPlan.update as jest.Mock).mockResolvedValue({ ...basePlan, status: 'ACTIVE' });
  });

  it('should handle approve_continue: set status to ACTIVE and return resumeReady with instructions', async () => {
    const req = createRequest({ courseId: 'course-1', decision: 'approve_continue' });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.decision).toBe('approve_continue');
    expect(json.courseId).toBe('course-1');
    expect(json.planId).toBe('plan-1');
    expect(json.resumeReady).toBe(true);
    expect(json.resumeToken).toBe('plan-1');
    expect(json.resumeEndpoint).toBe('/api/sam/course-creation/orchestrate');
    expect(json.resumeMethod).toBe('POST');
    expect(json.resumeBody).toEqual({ resumeCourseId: 'course-1' });
    expect(json.resumeDeadline).toBeDefined();
    expect(json.progress).toEqual({
      completedChapters: 5,
      totalChapters: 10,
    });
    expect(json.message).toContain('resumeCourseId');

    // Verify DB update includes checkpointData with resumeDeadline
    expect(mockDb.sAMExecutionPlan.update).toHaveBeenCalledWith({
      where: { id: 'plan-1' },
      data: {
        status: 'ACTIVE',
        checkpointData: expect.objectContaining({
          courseId: 'course-1',
          resumeDeadline: expect.any(String),
        }),
      },
    });
  });

  it('should handle approve_heal: set status to ACTIVE with escalation decision and resume instructions', async () => {
    const req = createRequest({ courseId: 'course-1', decision: 'approve_heal' });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.decision).toBe('approve_heal');
    expect(json.resumeReady).toBe(true);
    expect(json.planId).toBe('plan-1');
    expect(json.resumeToken).toBe('plan-1');
    expect(json.resumeEndpoint).toBe('/api/sam/course-creation/orchestrate');
    expect(json.resumeMethod).toBe('POST');
    expect(json.resumeBody).toEqual({ resumeCourseId: 'course-1' });
    expect(json.resumeDeadline).toBeDefined();
    expect(json.progress).toEqual({
      completedChapters: 5,
      totalChapters: 10,
    });
    expect(json.message).toContain('healing');

    // Verify DB update includes escalation decision and resume deadline
    expect(mockDb.sAMExecutionPlan.update).toHaveBeenCalledWith({
      where: { id: 'plan-1' },
      data: {
        status: 'ACTIVE',
        checkpointData: expect.objectContaining({
          escalationDecision: 'approve_heal',
          courseId: 'course-1',
          completedChapterCount: 5,
          totalChapters: 10,
          resumeDeadline: expect.any(String),
        }),
      },
    });
  });

  it('should handle reject_abort: set status to FAILED', async () => {
    const req = createRequest({ courseId: 'course-1', decision: 'reject_abort' });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.decision).toBe('reject_abort');
    expect(json.courseId).toBe('course-1');
    expect(json.message).toContain('aborted');

    // Should NOT have resumeReady
    expect(json.resumeReady).toBeUndefined();

    // Verify DB update sets FAILED
    expect(mockDb.sAMExecutionPlan.update).toHaveBeenCalledWith({
      where: { id: 'plan-1' },
      data: { status: 'FAILED' },
    });
  });
});

describe('Approve Flow - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1', email: 'test@test.com' } as never);
  });

  it('should handle checkpoint with missing optional fields gracefully', async () => {
    (mockDb.sAMExecutionPlan.findFirst as jest.Mock).mockResolvedValue({
      id: 'plan-2',
      checkpointData: {
        // completedChapterCount and totalChapters are missing
        courseId: 'course-2',
      },
      goal: { userId: 'user-1' },
    });
    (mockDb.sAMExecutionPlan.update as jest.Mock).mockResolvedValue({});

    const req = createRequest({ courseId: 'course-2', decision: 'approve_continue' });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.progress).toEqual({
      completedChapters: 0,
      totalChapters: 0,
    });
  });

  it('should handle null checkpointData gracefully', async () => {
    (mockDb.sAMExecutionPlan.findFirst as jest.Mock).mockResolvedValue({
      id: 'plan-3',
      checkpointData: null,
      goal: { userId: 'user-1' },
    });
    (mockDb.sAMExecutionPlan.update as jest.Mock).mockResolvedValue({});

    const req = createRequest({ courseId: 'course-3', decision: 'approve_continue' });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.progress.completedChapters).toBe(0);
  });

  it('should return 500 when database throws an error', async () => {
    (mockDb.sAMExecutionPlan.findFirst as jest.Mock).mockRejectedValue(
      new Error('Connection refused'),
    );

    const req = createRequest({ courseId: 'course-1', decision: 'approve_continue' });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.error).toContain('Failed to process escalation decision');
  });

  it('should handle user with multiple paused courses by filtering on courseId', async () => {
    // This verifies the fix from Issue #8: the query filters by courseId
    // so only the matching course's plan is returned
    (mockDb.sAMExecutionPlan.findFirst as jest.Mock).mockResolvedValue({
      id: 'plan-for-course-2',
      checkpointData: {
        courseId: 'course-2',
        completedChapterCount: 3,
        totalChapters: 8,
      },
      goal: { userId: 'user-1' },
    });
    (mockDb.sAMExecutionPlan.update as jest.Mock).mockResolvedValue({});

    const req = createRequest({ courseId: 'course-2', decision: 'approve_continue' });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.planId).toBe('plan-for-course-2');
    expect(json.courseId).toBe('course-2');

    // Verify the query explicitly includes courseId filter
    const findFirstCall = (mockDb.sAMExecutionPlan.findFirst as jest.Mock).mock.calls[0][0];
    expect(findFirstCall.where.checkpointData).toEqual(
      expect.objectContaining({
        path: ['courseId'],
        equals: 'course-2',
      }),
    );
  });
});
