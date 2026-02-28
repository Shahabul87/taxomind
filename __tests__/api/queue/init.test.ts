jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockInitializeWorkers = jest.fn();
const mockWithCronAuth = jest.fn();

jest.mock('@/lib/queue/workers/init-workers', () => ({
  initializeWorkers: (...args: unknown[]) => mockInitializeWorkers(...args),
}));

jest.mock('@/lib/api/cron-auth', () => ({
  withCronAuth: (...args: unknown[]) => mockWithCronAuth(...args),
}));

const { NextRequest, NextResponse } = jest.requireMock('next/server');

async function loadRoute() {
  jest.resetModules();
  return import('@/app/api/queue/init/route');
}

describe('/api/queue/init route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWithCronAuth.mockReturnValue(null);
  });

  it('GET returns default uninitialized status', async () => {
    const { GET } = await loadRoute();
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.workersInitialized).toBe(false);
  });

  it('POST returns auth response when cron auth fails', async () => {
    mockWithCronAuth.mockReturnValueOnce(
      NextResponse.json({ success: false }, { status: 401 })
    );
    const { POST } = await loadRoute();

    const req = new NextRequest('http://localhost:3000/api/queue/init', { method: 'POST' });
    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(mockInitializeWorkers).not.toHaveBeenCalled();
  });

  it('POST initializes workers once, then returns already initialized', async () => {
    const { POST, GET } = await loadRoute();
    const req = new NextRequest('http://localhost:3000/api/queue/init', { method: 'POST' });

    const first = await POST(req);
    const firstBody = await first.json();
    expect(first.status).toBe(200);
    expect(firstBody.message).toContain('initialized successfully');
    expect(mockInitializeWorkers).toHaveBeenCalledTimes(1);

    const status = await GET();
    const statusBody = await status.json();
    expect(statusBody.workersInitialized).toBe(true);

    const second = await POST(req);
    const secondBody = await second.json();
    expect(second.status).toBe(200);
    expect(secondBody.message).toContain('already initialized');
    expect(mockInitializeWorkers).toHaveBeenCalledTimes(1);
  });

  it('POST returns 500 when initialization throws', async () => {
    mockInitializeWorkers.mockImplementationOnce(() => {
      throw new Error('boom');
    });
    const { POST } = await loadRoute();

    const req = new NextRequest('http://localhost:3000/api/queue/init', { method: 'POST' });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INITIALIZATION_ERROR');
  });
});
