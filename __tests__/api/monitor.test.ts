jest.mock('@/lib/api/with-api-auth', () => ({
  withAdminAuth: jest.fn((handler: (request: any, context: any) => Promise<any>) => {
    return async (request: any) =>
      handler(request, {
        user: { id: 'admin-1', role: 'ADMIN' },
      });
  }),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/data-fetching/enterprise-data-api', () => ({
  enterpriseDataAPI: {
    healthCheck: jest.fn(),
    fetchPosts: jest.fn(),
    fetchCourses: jest.fn(),
  },
}));

import { GET } from '@/app/api/monitor/route';
import { enterpriseDataAPI } from '@/lib/data-fetching/enterprise-data-api';
import { NextRequest } from 'next/server';

const mockHealthCheck = enterpriseDataAPI.healthCheck as jest.Mock;
const mockFetchPosts = enterpriseDataAPI.fetchPosts as jest.Mock;
const mockFetchCourses = enterpriseDataAPI.fetchCourses as jest.Mock;

describe('/api/monitor route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHealthCheck.mockResolvedValue({ success: true, data: { ok: true } });
    mockFetchPosts.mockResolvedValue({ success: true, data: [{ id: 'p1' }] });
    mockFetchCourses.mockResolvedValue({ success: true, data: [{ id: 'c1' }] });
  });

  it('returns healthy report when all services pass', async () => {
    const req = new NextRequest('http://localhost:3000/api/monitor');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.system.status).toBe('healthy');
    expect(body.services.database.status).toBe('healthy');
    expect(body.services.posts.status).toBe('healthy');
    expect(body.services.courses.status).toBe('healthy');
  });

  it('returns degraded report when one service fails', async () => {
    mockFetchPosts.mockResolvedValueOnce({
      success: false,
      error: { message: 'posts down' },
      data: [],
    });
    const req = new NextRequest('http://localhost:3000/api/monitor');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.system.status).toBe('degraded');
    expect(body.services.posts.status).toBe('error');
  });
});
