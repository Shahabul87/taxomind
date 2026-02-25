/**
 * Tests for Analytics Learning Velocity Route - app/api/analytics/learning-velocity/route.ts
 *
 * Covers: GET (calculate learning velocity metrics)
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

import { GET } from '@/app/api/analytics/learning-velocity/route';

const mockCurrentUser = currentUser as jest.Mock;

describe('GET /api/analytics/learning-velocity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const req = new NextRequest(
      'http://localhost:3000/api/analytics/learning-velocity?courseId=c1'
    );
    const res = await GET(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 when courseId is missing', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    const req = new NextRequest('http://localhost:3000/api/analytics/learning-velocity');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('courseId required');
  });

  it('returns velocity metrics for a course', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.user_progress.findMany as jest.Mock).mockResolvedValue([]);
    (db.section.count as jest.Mock).mockResolvedValue(10);
    (db.user_progress.groupBy as jest.Mock).mockResolvedValue([]);

    const req = new NextRequest(
      'http://localhost:3000/api/analytics/learning-velocity?courseId=c1'
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.studentId).toBe('user-1');
    expect(data.courseId).toBe('c1');
    expect(data.velocity).toBeDefined();
    expect(data.peerComparison).toBeDefined();
  });

  it('returns zero velocity when no completions', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.user_progress.findMany as jest.Mock).mockResolvedValue([]);
    (db.section.count as jest.Mock).mockResolvedValue(10);
    (db.user_progress.groupBy as jest.Mock).mockResolvedValue([]);

    const req = new NextRequest(
      'http://localhost:3000/api/analytics/learning-velocity?courseId=c1'
    );
    const res = await GET(req);
    const data = await res.json();

    expect(data.velocity.currentVelocity).toBe(0);
    expect(data.velocity.averageVelocity).toBe(0);
    expect(data.velocity.accelerating).toBe(false);
  });

  it('uses custom days parameter', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.user_progress.findMany as jest.Mock).mockResolvedValue([]);
    (db.section.count as jest.Mock).mockResolvedValue(10);
    (db.user_progress.groupBy as jest.Mock).mockResolvedValue([]);

    const req = new NextRequest(
      'http://localhost:3000/api/analytics/learning-velocity?courseId=c1&days=7'
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
  });

  it('uses studentId parameter when provided', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.user_progress.findMany as jest.Mock).mockResolvedValue([]);
    (db.section.count as jest.Mock).mockResolvedValue(10);
    (db.user_progress.groupBy as jest.Mock).mockResolvedValue([]);

    const req = new NextRequest(
      'http://localhost:3000/api/analytics/learning-velocity?courseId=c1&studentId=student-2'
    );
    const res = await GET(req);
    const data = await res.json();

    expect(data.studentId).toBe('student-2');
  });

  it('calculates projected completion date', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() - 3);
    (db.user_progress.findMany as jest.Mock).mockResolvedValue([
      {
        isCompleted: true,
        completedAt: completionDate,
        Section: { chapter: { courseId: 'c1' } },
      },
    ]);
    (db.section.count as jest.Mock).mockResolvedValue(10);
    (db.user_progress.groupBy as jest.Mock).mockResolvedValue([]);

    const req = new NextRequest(
      'http://localhost:3000/api/analytics/learning-velocity?courseId=c1'
    );
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.projectedCompletion).toBeDefined();
  });

  it('returns 500 on database error', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.user_progress.findMany as jest.Mock).mockRejectedValue(new Error('DB error'));

    const req = new NextRequest(
      'http://localhost:3000/api/analytics/learning-velocity?courseId=c1'
    );
    const res = await GET(req);

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Failed to calculate learning velocity');
  });
});
