jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { GET } from '@/app/api/messages/unread/count/route';
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

const message = ensureModel('message', ['count']);

describe('/api/messages/unread/count route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    message.count.mockResolvedValue(4);
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/messages/unread/count');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns unread message count', async () => {
    const req = new NextRequest('http://localhost:3000/api/messages/unread/count');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.count).toBe(4);
    expect(message.count).toHaveBeenCalledWith({
      where: {
        recipientId: 'user-1',
        read: false,
      },
    });
  });

  it('returns 500 on db error', async () => {
    message.count.mockRejectedValueOnce(new Error('db error'));
    const req = new NextRequest('http://localhost:3000/api/messages/unread/count');
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});
