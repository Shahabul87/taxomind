jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { GET, PATCH } from '@/app/api/user/profile/route';
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

const user = ensureModel('user', ['findUnique', 'update']);

describe('/api/user/profile route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    user.findUnique.mockResolvedValue(null);
    user.update.mockResolvedValue({
      id: 'user-1',
      name: 'Updated User',
      email: 'user@test.com',
      image: null,
      bio: 'bio',
      location: 'NY',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/user/profile');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('GET returns 404 when user profile is not found', async () => {
    const req = new NextRequest('http://localhost:3000/api/user/profile');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('USER_NOT_FOUND');
  });

  it('PATCH returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated User' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it('PATCH returns 400 for invalid payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify({ website: 'not-a-url' }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  it('PATCH updates profile for authenticated user', async () => {
    const req = new NextRequest('http://localhost:3000/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated User', bio: 'bio', location: 'NY' }),
    });
    const res = await PATCH(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('Updated User');
    expect(user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({ name: 'Updated User' }),
      })
    );
  });
});
