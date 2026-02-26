jest.mock('@/lib/enterprise-analytics', () => ({
  analyticsEngine: {
    getCourseAnalytics: jest.fn(),
    getStudentAnalytics: jest.fn(),
    getPlatformAnalytics: jest.fn(),
    getRealtimeMetrics: jest.fn(),
    createAlert: jest.fn(),
    getPredictions: jest.fn(),
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { GET, POST } from '@/app/api/analytics/enterprise/route';
import { currentUser } from '@/lib/auth';
import { analyticsEngine } from '@/lib/enterprise-analytics';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;
const mockEngine = analyticsEngine as unknown as {
  getCourseAnalytics: jest.Mock;
  getStudentAnalytics: jest.Mock;
  getPlatformAnalytics: jest.Mock;
  getRealtimeMetrics: jest.Mock;
  createAlert: jest.Mock;
  getPredictions: jest.Mock;
};

describe('/api/analytics/enterprise route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockEngine.getCourseAnalytics.mockResolvedValue({ type: 'course' });
    mockEngine.getStudentAnalytics.mockResolvedValue({ type: 'student' });
    mockEngine.getPlatformAnalytics.mockResolvedValue({ type: 'platform' });
    mockEngine.getRealtimeMetrics.mockResolvedValue({ type: 'realtime' });
    mockEngine.createAlert.mockResolvedValue({ id: 'alert-1' });
    mockEngine.getPredictions.mockResolvedValue([{ id: 'pred-1' }]);
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/analytics/enterprise');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('GET supports platform/course/student/realtime types', async () => {
    const platformRes = await GET(
      new NextRequest('http://localhost:3000/api/analytics/enterprise?type=platform')
    );
    expect(platformRes.status).toBe(200);

    const courseRes = await GET(
      new NextRequest('http://localhost:3000/api/analytics/enterprise?type=course&entityId=c1')
    );
    expect(courseRes.status).toBe(200);

    const studentRes = await GET(
      new NextRequest('http://localhost:3000/api/analytics/enterprise?type=student&entityId=s1')
    );
    expect(studentRes.status).toBe(200);

    const realtimeRes = await GET(
      new NextRequest('http://localhost:3000/api/analytics/enterprise?type=realtime&dashboardId=d1')
    );
    expect(realtimeRes.status).toBe(200);
  });

  it('GET validates required entityId for course/student', async () => {
    const courseRes = await GET(
      new NextRequest('http://localhost:3000/api/analytics/enterprise?type=course')
    );
    expect(courseRes.status).toBe(400);

    const studentRes = await GET(
      new NextRequest('http://localhost:3000/api/analytics/enterprise?type=student')
    );
    expect(studentRes.status).toBe(400);
  });

  it('POST supports create_alert and get_predictions actions', async () => {
    const createReq = new NextRequest('http://localhost:3000/api/analytics/enterprise', {
      method: 'POST',
      body: JSON.stringify({ action: 'create_alert', data: { level: 'HIGH' } }),
    });
    const createRes = await POST(createReq);
    expect(createRes.status).toBe(200);

    const predReq = new NextRequest('http://localhost:3000/api/analytics/enterprise', {
      method: 'POST',
      body: JSON.stringify({ action: 'get_predictions', data: { type: 'course', entityId: 'c1' } }),
    });
    const predRes = await POST(predReq);
    expect(predRes.status).toBe(200);
  });

  it('POST returns 400 for invalid action', async () => {
    const req = new NextRequest('http://localhost:3000/api/analytics/enterprise', {
      method: 'POST',
      body: JSON.stringify({ action: 'bad_action', data: {} }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
