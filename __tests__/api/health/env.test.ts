jest.mock('next/headers', () => ({
  headers: jest.fn(),
}));

jest.mock('@/lib/startup-validation', () => ({
  getValidationSummary: jest.fn(),
}));

import { GET, HEAD } from '@/app/api/health/env/route';
import { headers } from 'next/headers';
import { getValidationSummary } from '@/lib/startup-validation';
import { NextRequest } from 'next/server';

const mockHeaders = headers as jest.Mock;
const mockGetValidationSummary = getValidationSummary as jest.Mock;

describe('/api/health/env route', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'development';
    delete process.env.HEALTH_CHECK_TOKEN;
    delete process.env.METRICS_AUTH_TOKEN;

    mockHeaders.mockResolvedValue({
      get: jest.fn(() => null),
    });

    mockGetValidationSummary.mockReturnValue({
      isValid: true,
      environment: 'development',
      errors: [],
      warnings: ['optional var missing'],
      features: {
        ai: true,
        oauth: true,
        media: true,
        caching: true,
        monitoring: true,
      },
    });
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('GET returns healthy payload in non-production', async () => {
    const req = new NextRequest('http://localhost:3000/api/health/env');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('healthy');
    expect(body.validation.isValid).toBe(true);
    expect(body.details).toBeDefined();
  });

  it('GET returns 401 in production when auth header missing', async () => {
    process.env.NODE_ENV = 'production';
    const req = new NextRequest('http://localhost:3000/api/health/env');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Authorization required');
  });

  it('GET returns 401 in production when token is invalid', async () => {
    process.env.NODE_ENV = 'production';
    process.env.HEALTH_CHECK_TOKEN = 'secret-token';
    mockHeaders.mockResolvedValue({
      get: jest.fn(() => 'Bearer wrong'),
    });

    const req = new NextRequest('http://localhost:3000/api/health/env');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Invalid authorization');
  });

  it('GET returns 200 in production when token is valid', async () => {
    process.env.NODE_ENV = 'production';
    process.env.HEALTH_CHECK_TOKEN = 'secret-token';
    mockHeaders.mockResolvedValue({
      get: jest.fn(() => 'Bearer secret-token'),
    });

    const req = new NextRequest('http://localhost:3000/api/health/env');
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('HEAD returns 503 when validation summary is invalid', async () => {
    mockGetValidationSummary.mockReturnValueOnce({
      isValid: false,
      environment: 'development',
      errors: ['missing key'],
      warnings: [],
      features: {
        ai: false,
        oauth: true,
        media: true,
        caching: true,
        monitoring: true,
      },
    });

    const req = new NextRequest('http://localhost:3000/api/health/env');
    const res = await HEAD(req);
    expect(res.status).toBe(503);
  });
});
