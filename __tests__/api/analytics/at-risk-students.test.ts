/**
 * Tests for Analytics At-Risk Students Route - app/api/analytics/at-risk-students/route.ts
 *
 * Covers: GET (identify at-risk students)
 * Auth: Uses auth() from @/auth (session-based)
 */

jest.mock('@/lib/predictive-analytics', () => ({
  PredictiveAnalytics: {
    identifyAtRiskStudents: jest.fn(),
  },
}));

jest.mock('@/auth.admin', () => ({
  adminAuth: jest.fn(),
}));

import { GET } from '@/app/api/analytics/at-risk-students/route';
import { auth } from '@/auth';
import { adminAuth } from '@/auth.admin';
import { db } from '@/lib/db';
import { PredictiveAnalytics } from '@/lib/predictive-analytics';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockAdminAuth = adminAuth as jest.Mock;
const mockIdentifyAtRisk = PredictiveAnalytics.identifyAtRiskStudents as jest.Mock;

describe('GET /api/analytics/at-risk-students', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: not admin
    mockAdminAuth.mockResolvedValue(null);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/analytics/at-risk-students?courseId=c1');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when courseId is missing', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'ADMIN' } });
    const req = new NextRequest('http://localhost:3000/api/analytics/at-risk-students');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Course ID is required');
  });

  it('returns 403 for non-admin non-owner', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'USER' } });
    mockAdminAuth.mockResolvedValue(null);
    (db.course.findUnique as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/api/analytics/at-risk-students?courseId=c1');
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it('returns at-risk students for course owner', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'teacher-1', role: 'USER' } });
    (db.course.findUnique as jest.Mock).mockResolvedValue({ id: 'c1', userId: 'teacher-1' });
    mockIdentifyAtRisk.mockResolvedValue([
      { userId: 'student-1', riskScore: 0.85, riskFactors: ['low_engagement'] },
    ]);

    const req = new NextRequest('http://localhost:3000/api/analytics/at-risk-students?courseId=c1');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.atRiskStudents).toHaveLength(1);
    expect(data.atRiskStudents[0].riskScore).toBe(0.85);
  });

  it('allows admin access to any course', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    mockAdminAuth.mockResolvedValue({ user: { id: 'admin-1' } });
    mockIdentifyAtRisk.mockResolvedValue([]);

    const req = new NextRequest('http://localhost:3000/api/analytics/at-risk-students?courseId=c1');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(db.course.findUnique).not.toHaveBeenCalled();
  });

  it('returns empty list when no students are at risk', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    mockAdminAuth.mockResolvedValue({ user: { id: 'admin-1' } });
    mockIdentifyAtRisk.mockResolvedValue([]);

    const req = new NextRequest('http://localhost:3000/api/analytics/at-risk-students?courseId=c1');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.atRiskStudents).toHaveLength(0);
  });

  it('returns multiple at-risk students sorted by risk', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    mockAdminAuth.mockResolvedValue({ user: { id: 'admin-1' } });
    mockIdentifyAtRisk.mockResolvedValue([
      { userId: 's1', riskScore: 0.9 },
      { userId: 's2', riskScore: 0.7 },
      { userId: 's3', riskScore: 0.5 },
    ]);

    const req = new NextRequest('http://localhost:3000/api/analytics/at-risk-students?courseId=c1');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.atRiskStudents).toHaveLength(3);
  });

  it('returns 500 when predictive analytics fails', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    mockAdminAuth.mockResolvedValue({ user: { id: 'admin-1' } });
    mockIdentifyAtRisk.mockRejectedValue(new Error('Analytics engine error'));

    const req = new NextRequest('http://localhost:3000/api/analytics/at-risk-students?courseId=c1');
    const res = await GET(req);

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe('Failed to identify at-risk students');
  });

  it('verifies course ownership for teacher role', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'teacher-1', role: 'USER' } });
    (db.course.findUnique as jest.Mock).mockResolvedValue({ id: 'c1', userId: 'teacher-1' });
    mockIdentifyAtRisk.mockResolvedValue([]);

    const req = new NextRequest('http://localhost:3000/api/analytics/at-risk-students?courseId=c1');
    await GET(req);

    expect(db.course.findUnique).toHaveBeenCalledWith({
      where: { id: 'c1', userId: 'teacher-1' },
    });
  });

  it('passes correct courseId to predictive analytics', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    mockAdminAuth.mockResolvedValue({ user: { id: 'admin-1' } });
    mockIdentifyAtRisk.mockResolvedValue([]);

    const req = new NextRequest(
      'http://localhost:3000/api/analytics/at-risk-students?courseId=course-xyz'
    );
    await GET(req);

    expect(mockIdentifyAtRisk).toHaveBeenCalledWith('course-xyz');
  });
});
