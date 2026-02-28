jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'mind-1'),
}));

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/minds/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';

const mockAuth = auth as jest.Mock;
const mockDb = db as Record<string, any>;

describe('GET/POST /api/minds', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockDb.mind = {
      create: jest.fn().mockResolvedValue({
        id: 'mind-1',
        title: 'Idea',
        userId: 'user-1',
      }),
      findMany: jest.fn().mockResolvedValue([{ id: 'mind-1', title: 'Idea' }]),
    };
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const res = await POST(
      new NextRequest('http://localhost:3000/api/minds', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'Mind title' }),
      })
    );
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid POST payload', async () => {
    const res = await POST(
      new NextRequest('http://localhost:3000/api/minds', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: '' }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('creates a mind for valid payload', async () => {
    const res = await POST(
      new NextRequest('http://localhost:3000/api/minds', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: 'My Mind',
          description: 'test',
          tags: ['focus'],
        }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockDb.mind.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: 'mind-1',
        userId: 'user-1',
        title: 'My Mind',
      }),
    });
  });

  it('lists minds with filters from query params', async () => {
    const res = await GET(
      new NextRequest('http://localhost:3000/api/minds?status=ACTIVE&category=study')
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockDb.mind.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
          status: 'ACTIVE',
          category: 'study',
        }),
      })
    );
  });
});
