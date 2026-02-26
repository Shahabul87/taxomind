import { POST } from '@/app/api/courses/[courseId]/analytics/report/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

describe('/api/courses/[courseId]/analytics/report route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/courses/course-1/analytics/report', {
      method: 'POST',
      body: JSON.stringify({ timeframe: '30d', metrics: 'overview' }),
    });
    const res = await POST(req, { params: Promise.resolve({ courseId: 'course-1' }) });

    expect(res.status).toBe(401);
  });

  it('returns 403 when user is not an admin account', async () => {
    mockCurrentUser.mockResolvedValueOnce({ id: 'user-1' });
    (db.adminAccount.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/courses/course-1/analytics/report', {
      method: 'POST',
      body: JSON.stringify({ timeframe: '30d', metrics: 'overview' }),
    });
    const res = await POST(req, { params: Promise.resolve({ courseId: 'course-1' }) });

    expect(res.status).toBe(403);
  });

  it('returns 404 when course is not accessible', async () => {
    mockCurrentUser.mockResolvedValueOnce({ id: 'admin-1' });
    (db.adminAccount.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'admin-1', role: 'ADMIN' });
    (db.course.findUnique as jest.Mock).mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/courses/course-1/analytics/report', {
      method: 'POST',
      body: JSON.stringify({ timeframe: '30d', metrics: 'overview' }),
    });
    const res = await POST(req, { params: Promise.resolve({ courseId: 'course-1' }) });

    expect(res.status).toBe(404);
  });

  it('returns downloadable report for admin', async () => {
    mockCurrentUser.mockResolvedValueOnce({ id: 'admin-1' });
    (db.adminAccount.findUnique as jest.Mock).mockResolvedValueOnce({ id: 'admin-1', role: 'ADMIN' });
    (db.course.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'course-1',
      title: 'Course 1',
      description: 'desc',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const req = new NextRequest('http://localhost:3000/api/courses/course-1/analytics/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeframe: '30d', metrics: 'all' }),
    });
    const res = await POST(req, { params: Promise.resolve({ courseId: 'course-1' }) });
    const payload = JSON.parse(await res.text());

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/json');
    expect(res.headers.get('Content-Disposition')).toContain('course-analytics-course-1-');
    expect(payload.courseTitle).toBe('Course 1');
    expect(payload.timeframe).toBe('30d');
    expect(payload.metrics).toBe('all');
  });
});
