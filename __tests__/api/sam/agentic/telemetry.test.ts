jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('@/lib/sam/telemetry', () => ({
  getSAMTelemetryService: jest.fn(),
}));

import { GET } from '@/app/api/sam/agentic/telemetry/route';
import { auth } from '@/auth';
import { getSAMTelemetryService } from '@/lib/sam/telemetry';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockGetSAMTelemetryService = getSAMTelemetryService as jest.Mock;

const telemetry = {
  start: jest.fn(),
  getSystemHealth: jest.fn(),
  getQuickSummary: jest.fn(),
  getMetrics: jest.fn(),
};

describe('/api/sam/agentic/telemetry route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    telemetry.getSystemHealth.mockResolvedValue({ status: 'ok' });
    telemetry.getQuickSummary.mockResolvedValue({ sessions: 3 });
    telemetry.getMetrics.mockResolvedValue([{ key: 'active', value: 2 }]);
    mockGetSAMTelemetryService.mockReturnValue(telemetry);
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/sam/agentic/telemetry');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid query params', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/agentic/telemetry?hours=0');
    const res = await GET(req);

    expect(res.status).toBe(400);
    expect(mockGetSAMTelemetryService).not.toHaveBeenCalled();
  });

  it('returns health payload when health=true', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/agentic/telemetry?health=true');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.health.status).toBe('ok');
    expect(telemetry.getSystemHealth).toHaveBeenCalled();
  });

  it('returns summary payload when summary=true', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/agentic/telemetry?summary=true');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.summary.sessions).toBe(3);
    expect(telemetry.getQuickSummary).toHaveBeenCalled();
  });

  it('returns metrics for requested hours', async () => {
    const req = new NextRequest('http://localhost:3000/api/sam/agentic/telemetry?hours=72');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.metrics)).toBe(true);
    expect(telemetry.getMetrics).toHaveBeenCalledWith(72);
    expect(telemetry.start).toHaveBeenCalled();
  });

  it('returns 500 when telemetry service throws', async () => {
    telemetry.getMetrics.mockRejectedValueOnce(new Error('telemetry down'));

    const req = new NextRequest('http://localhost:3000/api/sam/agentic/telemetry');
    const res = await GET(req);

    expect(res.status).toBe(500);
  });
});
