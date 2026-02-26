jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { POST } from '@/app/api/custom-tabs/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

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

const customTab = ensureModel('customTab', ['create']);

describe('/api/custom-tabs route', () => {
  const originalCrypto = globalThis.crypto;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    customTab.create.mockResolvedValue({
      id: 'tab-1',
      label: 'My Tab',
      icon: 'book',
      userId: 'user-1',
    });

    Object.defineProperty(globalThis, 'crypto', {
      value: {
        randomUUID: jest.fn(() => 'tab-1'),
      },
      configurable: true,
    });
  });

  afterAll(() => {
    Object.defineProperty(globalThis, 'crypto', {
      value: originalCrypto,
      configurable: true,
    });
  });

  it('returns 401 when user is unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/custom-tabs', {
      method: 'POST',
      body: JSON.stringify({ label: 'X', icon: 'i' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('creates a custom tab for authenticated user', async () => {
    const req = new NextRequest('http://localhost:3000/api/custom-tabs', {
      method: 'POST',
      body: JSON.stringify({ label: 'My Tab', icon: 'book' }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('tab-1');
    expect(customTab.create).toHaveBeenCalled();
  });
});
