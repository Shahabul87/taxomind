/**
 * Tests for Certificate Route - app/api/courses/[courseId]/certificate/route.ts
 *
 * Covers: GET (certificate/progress data), POST (issue certificate)
 */

// @/lib/db, @/lib/auth are globally mocked

import { GET, POST } from '@/app/api/courses/[courseId]/certificate/route';
import { NextRequest } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

// Add models not in global mock
for (const model of ['userSectionCompletion', 'sectionCompletionTracking', 'userCourseEnrollment']) {
  if (!(db as Record<string, unknown>)[model]) {
    (db as Record<string, unknown>)[model] = {
      findFirst: jest.fn(),
      findMany: jest.fn(() => Promise.resolve([])),
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    };
  }
}

function createRequest(method: 'GET' | 'POST' = 'GET', body?: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/courses/course-1/certificate', {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { 'Content-Type': 'application/json' } : {},
  });
}

function createParams(courseId = 'course-1') {
  return { params: Promise.resolve({ courseId }) };
}

const MOCK_COURSE = {
  id: 'course-1',
  title: 'Test Course',
  userId: 'teacher-1',
  chapters: [
    {
      id: 'ch-1',
      title: 'Chapter 1',
      position: 1,
      sections: [
        { id: 'sec-1', title: 'Section 1', position: 1, type: 'VIDEO' },
        { id: 'sec-2', title: 'Section 2', position: 2, type: 'QUIZ' },
      ],
    },
  ],
};

describe('GET /api/courses/[courseId]/certificate', () => {
  beforeEach(() => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1', name: 'Student' });
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    ((db as any).userSectionCompletion.findMany as jest.Mock).mockResolvedValue([]);
    ((db as any).sectionCompletionTracking.findMany as jest.Mock).mockResolvedValue([]);
    ((db as any).userCourseEnrollment.findFirst as jest.Mock).mockResolvedValue(null);
  });

  it('returns 404 when course does not exist', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await GET(createRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain('not found');
  });

  it('returns hasCompleted: false with nextSection for incomplete course', async () => {
    const res = await GET(createRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.hasCompleted).toBe(false);
    expect(body.nextSection).toBeDefined();
    expect(body.nextSection.sectionId).toBe('sec-1');
    expect(body.nextSection.chapterId).toBe('ch-1');
    expect(body.courseTitle).toBe('Test Course');
  });

  it('returns hasCompleted: true when all sections are complete', async () => {
    ((db as any).userSectionCompletion.findMany as jest.Mock).mockResolvedValue([
      { sectionId: 'sec-1', progress: 1, completedAt: new Date() },
      { sectionId: 'sec-2', progress: 1, completedAt: new Date() },
    ]);

    const res = await GET(createRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.hasCompleted).toBe(true);
    expect(body.certificateId).toBeDefined();
    expect(body.studentName).toBe('Student');
    expect(body.issuer).toBe('Taxomind');
  });

  it('includes progress percent from enrollment', async () => {
    ((db as any).userCourseEnrollment.findFirst as jest.Mock).mockResolvedValue({
      progress: 0.65,
      lastAccessedAt: new Date('2026-01-15'),
    });

    const res = await GET(createRequest(), createParams());
    const body = await res.json();

    expect(body.progressPercent).toBe(65);
    expect(body.lastAccessedAt).toBeDefined();
  });

  it('returns canManage: true for course owner', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'teacher-1', name: 'Teacher' });

    const res = await GET(createRequest(), createParams());
    const body = await res.json();

    expect(body.canManage).toBe(true);
  });

  it('returns canManage: false for regular student', async () => {
    const res = await GET(createRequest(), createParams());
    const body = await res.json();

    expect(body.canManage).toBe(false);
  });

  it('returns pendingCounts with section types', async () => {
    const res = await GET(createRequest(), createParams());
    const body = await res.json();

    expect(body.pendingCounts).toBeDefined();
    expect(body.pendingCounts.total).toBe(2);
  });

  it('handles anonymous user (no progress)', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await GET(createRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.nextSection).toBeDefined();
    expect(body.nextSection.sectionId).toBe('sec-1');
  });

  it('returns 500 on unexpected errors', async () => {
    (db.course.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await GET(createRequest(), createParams());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('Failed');
  });
});

describe('POST /api/courses/[courseId]/certificate', () => {
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

  beforeEach(() => {
    mockCurrentUser.mockResolvedValue({ id: 'teacher-1', name: 'Teacher', role: 'ADMIN' });
    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      title: 'Test Course',
      userId: 'teacher-1',
    });
    ((db as any).userCourseEnrollment.upsert as jest.Mock).mockResolvedValue({
      userId: 'user-1',
      courseId: 'course-1',
      progress: 1,
    });
  });

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await POST(
      createRequest('POST', { action: 'issue', userId: 'user-1' }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(401);
  });

  it('returns 404 when course does not exist', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await POST(
      createRequest('POST', { action: 'issue', userId: 'user-1' }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(404);
  });

  it('returns 403 when non-owner tries to issue for another user', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-2', name: 'Student' });
    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'teacher-1',
    });

    const res = await POST(
      createRequest('POST', { action: 'issue', userId: 'user-1' }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(403);
  });

  it('successfully issues a certificate', async () => {
    const res = await POST(
      createRequest('POST', { action: 'issue', userId: 'user-1' }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect((db as any).userCourseEnrollment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_courseId: { userId: 'user-1', courseId: 'course-1' } },
        update: expect.objectContaining({ progress: 1, certificateIssued: true }),
      })
    );
  });

  it('returns 400 for invalid action', async () => {
    const res = await POST(
      createRequest('POST', { action: 'invalid' }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('Invalid action');
  });

  it('returns 500 on unexpected errors', async () => {
    (db.course.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await POST(
      createRequest('POST', { action: 'issue' }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(500);
  });
});
