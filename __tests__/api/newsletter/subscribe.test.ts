import { NextRequest } from 'next/server';
import { POST } from '@/app/api/newsletter/subscribe/route';
import { db } from '@/lib/db';

const mockDb = db as Record<string, any>;

describe('POST /api/newsletter/subscribe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.newsletterSubscriber = {
      findUnique: jest.fn(),
      create: jest.fn(),
    };
  });

  it('returns 400 when email is invalid', async () => {
    const res = await POST(
      new NextRequest('http://localhost:3000/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email' }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns success with alreadySubscribed=true when email exists', async () => {
    mockDb.newsletterSubscriber.findUnique.mockResolvedValueOnce({
      email: 'user@example.com',
    });

    const res = await POST(
      new NextRequest('http://localhost:3000/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'USER@example.com' }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.alreadySubscribed).toBe(true);
  });

  it('creates subscriber and returns success for new email', async () => {
    mockDb.newsletterSubscriber.findUnique.mockResolvedValueOnce(null);
    mockDb.newsletterSubscriber.create.mockResolvedValueOnce({
      id: 'sub-1',
      email: 'user@example.com',
    });

    const res = await POST(
      new NextRequest('http://localhost:3000/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com' }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.alreadySubscribed).toBe(false);
    expect(mockDb.newsletterSubscriber.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: 'user@example.com',
        source: 'footer',
      }),
    });
  });

  it('returns 500 when db operation fails', async () => {
    mockDb.newsletterSubscriber.findUnique.mockRejectedValueOnce(new Error('db down'));

    const res = await POST(
      new NextRequest('http://localhost:3000/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com' }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
