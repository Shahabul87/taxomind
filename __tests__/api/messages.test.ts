jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

import { NextRequest } from 'next/server';
import { GET, POST, PATCH } from '@/app/api/messages/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';

const mockAuth = auth as jest.Mock;
const mockDb = db as Record<string, any>;

describe('GET/POST/PATCH /api/messages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockDb.message = {
      findMany: jest.fn().mockResolvedValue([
        { id: 'm1', content: 'hello', senderId: 'user-1', recipientId: 'user-2' },
      ]),
      create: jest.fn().mockResolvedValue({ id: 'm2', content: 'new message' }),
      update: jest.fn().mockResolvedValue({ id: 'm1', read: true }),
    };
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await GET(new NextRequest('http://localhost:3000/api/messages'));
    expect(res.status).toBe(401);
  });

  it('GET returns recent messages for authenticated user', async () => {
    const res = await GET(new NextRequest('http://localhost:3000/api/messages'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(mockDb.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [{ recipientId: 'user-1' }, { senderId: 'user-1' }],
        },
        take: 50,
      })
    );
  });

  it('POST returns 400 for invalid payload', async () => {
    const res = await POST(
      new NextRequest('http://localhost:3000/api/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ recipientId: 'user-2', content: '' }),
      })
    );
    expect(res.status).toBe(400);
  });

  it('POST creates message for valid payload', async () => {
    const res = await POST(
      new NextRequest('http://localhost:3000/api/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ recipientId: 'user-2', content: 'hello' }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('m2');
    expect(mockDb.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          senderId: 'user-1',
          recipientId: 'user-2',
          content: 'hello',
        }),
      })
    );
  });

  it('PATCH marks message as read', async () => {
    const res = await PATCH(
      new NextRequest('http://localhost:3000/api/messages', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messageId: 'm1' }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.read).toBe(true);
    expect(mockDb.message.update).toHaveBeenCalledWith({
      where: { id: 'm1', recipientId: 'user-1' },
      data: { read: true },
    });
  });
});
