jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { GET } from '@/app/api/social/metrics/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;

function ensureModel(modelName: string, methods: string[]) {
  if (!(db as Record<string, unknown>)[modelName]) {
    (db as Record<string, unknown>)[modelName] = {};
  }
  const model = (db as Record<string, any>)[modelName];
  for (const method of methods) {
    if (!model[method]) model[method] = jest.fn();
  }
  return model;
}

const account = ensureModel('account', ['findFirst']);

describe('/api/social/metrics route', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    account.findFirst.mockResolvedValue({
      provider: 'facebook',
      userId: 'user-1',
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { followers: 120 } }),
      text: async () => '',
      status: 200,
    } as any);
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/social/metrics');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('returns 404 when user has no connected Facebook account', async () => {
    account.findFirst.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/social/metrics');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.shouldConnect).toBe(true);
  });

  it('returns forwarded Facebook metrics payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/social/metrics');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.followers).toBe(120);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('returns fetch error details when internal forwarding fails', async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('network'));
    const req = new NextRequest('http://localhost:3000/api/social/metrics');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Internal server error');
  });
});
