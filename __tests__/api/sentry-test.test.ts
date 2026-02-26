jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  withScope: jest.fn((callback: (scope: any) => void) => {
    callback({
      setTag: jest.fn(),
      setContext: jest.fn(),
      setLevel: jest.fn(),
    });
  }),
}));

jest.mock('@/lib/api/dev-only-guard', () => ({
  devOnlyGuard: jest.fn(),
}));

import { GET, POST } from '@/app/api/sentry-test/route';
import * as Sentry from '@sentry/nextjs';
import { devOnlyGuard } from '@/lib/api/dev-only-guard';
import { NextRequest, NextResponse } from 'next/server';

const mockDevOnlyGuard = devOnlyGuard as jest.Mock;

describe('/api/sentry-test route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDevOnlyGuard.mockReturnValue(null);
  });

  it('GET returns blocked response when dev guard blocks', async () => {
    mockDevOnlyGuard.mockReturnValueOnce(new NextResponse('blocked', { status: 403 }));
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('GET captures exception and returns 500 in error branch', async () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValueOnce(0.9);
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain('captured');
    expect(Sentry.captureException).toHaveBeenCalled();
    randomSpy.mockRestore();
  });

  it('POST logs sentry message with request body', async () => {
    const req = new NextRequest('http://localhost:3000/api/sentry-test', {
      method: 'POST',
      body: JSON.stringify({ test: true }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Sentry.withScope).toHaveBeenCalled();
    expect(Sentry.captureMessage).toHaveBeenCalled();
  });
});
