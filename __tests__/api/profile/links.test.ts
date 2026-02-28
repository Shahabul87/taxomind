jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

import { NextRequest } from 'next/server';
import { GET, POST, DELETE } from '@/app/api/profile/links/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';

const mockAuth = auth as jest.Mock;
const mockDb = db as Record<string, any>;

describe('GET/POST/DELETE /api/profile/links', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1', role: 'USER' } });
    mockDb.profileLink = {
      findMany: jest.fn().mockResolvedValue([{ id: 'l1', userId: 'user-1' }]),
      findUnique: jest.fn().mockResolvedValue({ id: 'l1', userId: 'user-1' }),
      delete: jest.fn().mockResolvedValue({ id: 'l1' }),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn().mockResolvedValue({ id: 'l2' }),
      update: jest.fn().mockResolvedValue({ id: 'l1' }),
    };
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await GET(new NextRequest('http://localhost:3000/api/profile/links'));
    expect(res.status).toBe(401);
  });

  it('GET returns profile links for current user', async () => {
    const res = await GET(new NextRequest('http://localhost:3000/api/profile/links'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(mockDb.profileLink.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } })
    );
  });

  it('POST returns 403 when modifying other user links', async () => {
    const res = await POST(
      new NextRequest('http://localhost:3000/api/profile/links', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: 'user-2', links: [] }),
      })
    );
    expect(res.status).toBe(403);
  });

  it('DELETE returns 400 when linkId is missing', async () => {
    const res = await DELETE(new NextRequest('http://localhost:3000/api/profile/links'));
    expect(res.status).toBe(400);
  });

  it('DELETE returns 204 for owned link', async () => {
    const res = await DELETE(
      new NextRequest('http://localhost:3000/api/profile/links?linkId=l1')
    );
    expect(res.status).toBe(204);
    expect(mockDb.profileLink.delete).toHaveBeenCalledWith({ where: { id: 'l1' } });
  });
});
