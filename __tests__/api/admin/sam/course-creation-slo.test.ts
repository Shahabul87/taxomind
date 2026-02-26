jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/sam/course-creation/slo-telemetry', () => ({
  getCourseCreationSLODashboard: jest.fn(),
}));

jest.mock('@/lib/sam/course-creation/experiments', () => ({
  getCanaryComparisonStats: jest.fn(),
}));

import { GET } from '@/app/api/admin/sam/course-creation-slo/route';
import { auth } from '@/auth';
import { getCourseCreationSLODashboard } from '@/lib/sam/course-creation/slo-telemetry';
import { getCanaryComparisonStats } from '@/lib/sam/course-creation/experiments';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockGetSLODashboard = getCourseCreationSLODashboard as jest.Mock;
const mockGetCanaryStats = getCanaryComparisonStats as jest.Mock;

describe('/api/admin/sam/course-creation-slo route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
    mockGetSLODashboard.mockResolvedValue({ slo: 99.5 });
    mockGetCanaryStats.mockResolvedValue({ experiment: 'x', improvement: 12 });
  });

  it('returns 401 for non-admin', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user-1', role: 'USER' } });
    const req = new NextRequest('http://localhost:3000/api/admin/sam/course-creation-slo');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns dashboard data for admin', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/admin/sam/course-creation-slo?hours=48&experimentId=exp-1'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.periodHours).toBe(48);
    expect(mockGetSLODashboard).toHaveBeenCalledWith(48);
    expect(mockGetCanaryStats).toHaveBeenCalledWith('exp-1');
  });

  it('clamps invalid hours to lower bound', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/sam/course-creation-slo?hours=0');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.periodHours).toBe(1);
  });
});
