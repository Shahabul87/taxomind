/**
 * Tests for Analytics Realtime Route - app/api/analytics/realtime/route.ts
 *
 * Covers: GET (real-time platform/course metrics)
 * Auth: Uses currentUser() from @/lib/auth
 */

import { GET } from '@/app/api/analytics/realtime/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

describe('GET /api/analytics/realtime', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/analytics/realtime');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns platform-wide metrics when no courseId', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.user.count as jest.Mock).mockResolvedValue(100);
    (db.course.count as jest.Mock).mockResolvedValue(50);
    (db.enrollment.count as jest.Mock).mockResolvedValue(200);

    const req = new NextRequest('http://localhost:3000/api/analytics/realtime');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data.some((m: { id: string }) => m.id === 'total_users')).toBe(true);
    expect(data.some((m: { id: string }) => m.id === 'published_courses')).toBe(true);
  });

  it('returns course-specific metrics when courseId provided', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'teacher-1' });
    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'c1',
      userId: 'teacher-1',
      Enrollment: [
        { createdAt: new Date(), User: { id: 'student-1' } },
      ],
      chapters: [
        {
          sections: [
            {
              exams: [],
              user_progress: [{ isCompleted: true }],
            },
          ],
        },
      ],
    });

    const req = new NextRequest('http://localhost:3000/api/analytics/realtime?courseId=c1');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.some((m: { id: string }) => m.id === 'active_users')).toBe(true);
    expect(data.some((m: { id: string }) => m.id === 'completion_rate')).toBe(true);
  });

  it('returns 404 when course not found', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'teacher-1' });
    (db.course.findUnique as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/analytics/realtime?courseId=nonexistent');
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it('returns correct metric categories', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.user.count as jest.Mock).mockResolvedValue(0);
    (db.course.count as jest.Mock).mockResolvedValue(0);
    (db.enrollment.count as jest.Mock).mockResolvedValue(0);

    const req = new NextRequest('http://localhost:3000/api/analytics/realtime');
    const res = await GET(req);
    const data = await res.json();

    const categories = data.map((m: { category: string }) => m.category);
    expect(categories).toContain('engagement');
    expect(categories).toContain('business');
  });

  it('includes trend information in metrics', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.user.count as jest.Mock).mockResolvedValue(100);
    (db.course.count as jest.Mock).mockResolvedValue(50);
    (db.enrollment.count as jest.Mock).mockResolvedValue(200);

    const req = new NextRequest('http://localhost:3000/api/analytics/realtime');
    const res = await GET(req);
    const data = await res.json();

    data.forEach((metric: { trend: string; period: string }) => {
      expect(metric.trend).toBeDefined();
      expect(metric.period).toBeDefined();
    });
  });

  it('handles period parameter', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.user.count as jest.Mock).mockResolvedValue(100);
    (db.course.count as jest.Mock).mockResolvedValue(50);
    (db.enrollment.count as jest.Mock).mockResolvedValue(200);

    const req = new NextRequest('http://localhost:3000/api/analytics/realtime?period=7d');
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('returns 500 on database error', async () => {
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.user.count as jest.Mock).mockRejectedValue(new Error('DB connection lost'));

    const req = new NextRequest('http://localhost:3000/api/analytics/realtime');
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});
