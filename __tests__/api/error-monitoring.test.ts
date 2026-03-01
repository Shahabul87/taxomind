jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn().mockResolvedValue({ id: 'user-1', email: 'test@test.com' }),
}));

import { POST } from '@/app/api/error-monitoring/route';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

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

const auditLog = ensureModel('auditLog', ['create']);
const progressAlerts = ensureModel('progress_alerts', ['create']);

describe('/api/error-monitoring route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auditLog.create.mockResolvedValue({ id: 'audit-1' });
    progressAlerts.create.mockResolvedValue({ id: 'alert-1' });
  });

  it('logs normal errors to auditLog', async () => {
    const req = new NextRequest('http://localhost:3000/api/error-monitoring', {
      method: 'POST',
      body: JSON.stringify({
        errorId: 'err-1',
        userId: 'user-1',
        message: 'minor error',
        timestamp: '2026-02-26T00:00:00.000Z',
        level: 'error',
        userAgent: 'agent',
        url: '/page',
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(auditLog.create).toHaveBeenCalled();
    expect(progressAlerts.create).not.toHaveBeenCalled();
  });

  it('creates critical alert for critical errors', async () => {
    const req = new NextRequest('http://localhost:3000/api/error-monitoring', {
      method: 'POST',
      body: JSON.stringify({
        errorId: 'err-critical',
        userId: 'user-1',
        message: 'critical error',
        timestamp: '2026-02-26T00:00:00.000Z',
        level: 'critical',
        userAgent: 'agent',
        url: '/critical',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(progressAlerts.create).toHaveBeenCalled();
  });

  it('returns 500 when persistence fails', async () => {
    auditLog.create.mockRejectedValueOnce(new Error('db write failed'));
    const req = new NextRequest('http://localhost:3000/api/error-monitoring', {
      method: 'POST',
      body: JSON.stringify({
        errorId: 'err-2',
        userId: 'user-1',
        message: 'failure',
        timestamp: '2026-02-26T00:00:00.000Z',
      }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to log error');
  });
});
