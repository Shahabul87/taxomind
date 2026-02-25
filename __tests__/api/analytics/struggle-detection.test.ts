/**
 * Tests for Analytics Struggle Detection Route - app/api/analytics/struggle-detection/route.ts
 *
 * Covers: GET (detect student struggles), POST (record struggle indicator)
 * Auth: Uses currentUser() from @/lib/auth
 */

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

// Add missing model mocks not in global jest.setup.js
const mockModel = () => ({
  findMany: jest.fn(() => Promise.resolve([])),
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  create: jest.fn(),
  count: jest.fn(() => Promise.resolve(0)),
  groupBy: jest.fn(() => Promise.resolve([])),
  aggregate: jest.fn(),
});
if (!(db as Record<string, unknown>).user_progress) {
  (db as Record<string, unknown>).user_progress = mockModel();
}
if (!(db as Record<string, unknown>).userExamAttempt) {
  (db as Record<string, unknown>).userExamAttempt = mockModel();
}
if (!(db as Record<string, unknown>).learning_metrics) {
  (db as Record<string, unknown>).learning_metrics = mockModel();
}

import { GET, POST } from '@/app/api/analytics/struggle-detection/route';

const mockCurrentUser = currentUser as jest.Mock;

describe('GET /api/analytics/struggle-detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const req = new NextRequest(
      'http://localhost:3000/api/analytics/struggle-detection?courseId=c1'
    );
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when courseId is missing', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    const req = new NextRequest('http://localhost:3000/api/analytics/struggle-detection');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('courseId required');
  });

  it('returns 403 when user does not own the course', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.course.findUnique as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest(
      'http://localhost:3000/api/analytics/struggle-detection?courseId=c1'
    );
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it('detects struggle patterns for course owner', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'teacher-1' });
    (db.course.findUnique as jest.Mock).mockResolvedValue({ id: 'c1', userId: 'teacher-1' });
    (db.userExamAttempt.groupBy as jest.Mock).mockResolvedValue([
      { userId: 's1', _count: 5 },
    ]);
    ((db as Record<string, unknown>).learning_metrics as { findMany: jest.Mock }).findMany
      .mockResolvedValue([
        { userId: 's2', riskScore: 0.85, courseId: 'c1' },
      ]);

    const req = new NextRequest(
      'http://localhost:3000/api/analytics/struggle-detection?courseId=c1'
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.courseId).toBe('c1');
    expect(data.struggles).toBeDefined();
    expect(data.summary).toBeDefined();
    expect(data.summary.totalStruggles).toBeGreaterThanOrEqual(0);
  });

  it('returns empty struggles when none found', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'teacher-1' });
    (db.course.findUnique as jest.Mock).mockResolvedValue({ id: 'c1', userId: 'teacher-1' });
    (db.userExamAttempt.groupBy as jest.Mock).mockResolvedValue([]);
    ((db as Record<string, unknown>).learning_metrics as { findMany: jest.Mock }).findMany
      .mockResolvedValue([]);

    const req = new NextRequest(
      'http://localhost:3000/api/analytics/struggle-detection?courseId=c1'
    );
    const res = await GET(req);
    const data = await res.json();

    expect(data.struggles).toHaveLength(0);
    expect(data.summary.totalStruggles).toBe(0);
    expect(data.summary.affectedStudents).toBe(0);
  });

  it('uses custom threshold parameter', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'teacher-1' });
    (db.course.findUnique as jest.Mock).mockResolvedValue({ id: 'c1', userId: 'teacher-1' });
    (db.userExamAttempt.groupBy as jest.Mock).mockResolvedValue([
      { userId: 's1', _count: 2 },
    ]);
    ((db as Record<string, unknown>).learning_metrics as { findMany: jest.Mock }).findMany
      .mockResolvedValue([]);

    const req = new NextRequest(
      'http://localhost:3000/api/analytics/struggle-detection?courseId=c1&threshold=5'
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    // With threshold=5, a student with _count=2 should not appear
    const examStruggles = data.struggles.filter(
      (s: { type: string }) => s.type === 'exam_failures'
    );
    expect(examStruggles).toHaveLength(0);
  });

  it('returns 500 on database error', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'teacher-1' });
    (db.course.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));

    const req = new NextRequest(
      'http://localhost:3000/api/analytics/struggle-detection?courseId=c1'
    );
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});

describe('POST /api/analytics/struggle-detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/analytics/struggle-detection', {
      method: 'POST',
      body: JSON.stringify({ contentType: 'quiz', contentId: 'q1', indicator: 'low_score' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when required fields are missing', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    const req = new NextRequest('http://localhost:3000/api/analytics/struggle-detection', {
      method: 'POST',
      body: JSON.stringify({ contentType: 'quiz' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Missing required fields');
  });
});
