jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { POST } from '@/app/api/support/tickets/route';
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

const supportTicket = ensureModel('supportTicket', ['create']);

describe('/api/support/tickets route', () => {
  const originalCrypto = globalThis.crypto;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    supportTicket.create.mockResolvedValue({ id: 't1', subject: 'Issue', status: 'OPEN' });
    Object.defineProperty(globalThis, 'crypto', {
      value: { randomUUID: jest.fn(() => 't1') },
      configurable: true,
    });
  });

  afterAll(() => {
    Object.defineProperty(globalThis, 'crypto', {
      value: originalCrypto,
      configurable: true,
    });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/support/tickets', {
      method: 'POST',
      body: JSON.stringify({ subject: 'Issue', category: 'general', message: 'help' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('creates support ticket for valid payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/support/tickets', {
      method: 'POST',
      body: JSON.stringify({ subject: 'Issue', category: 'general', message: 'help' }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('t1');
    expect(supportTicket.create).toHaveBeenCalled();
  });

  it('returns 500 on validation failure', async () => {
    const req = new NextRequest('http://localhost:3000/api/support/tickets', {
      method: 'POST',
      body: JSON.stringify({ subject: '', category: 'x', message: 'm' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});
