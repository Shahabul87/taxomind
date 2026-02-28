jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

var prismaMock: {
  socialMediaAccount: { findFirst: jest.Mock; update: jest.Mock };
  socialMetric: { create: jest.Mock };
};

jest.mock('@prisma/client', () => {
  prismaMock = {
    socialMediaAccount: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    socialMetric: {
      create: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => prismaMock),
  };
});

import { POST } from '@/app/api/platforms/[platform]/sync/route';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const socialMediaAccount = () => prismaMock.socialMediaAccount;

describe('/api/platforms/[platform]/sync route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    socialMediaAccount().findFirst.mockResolvedValue(null);
    socialMediaAccount().update.mockResolvedValue({ id: 'acc-1' });
  });

  it('returns 401 when session user does not match request userId', async () => {
    const req = new NextRequest('http://localhost:3000/api/platforms/twitter/sync', {
      method: 'POST',
      body: JSON.stringify({ userId: 'different-user' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req, { params: Promise.resolve({ platform: 'twitter' }) });
    expect(res.status).toBe(401);
  });

  it('returns 404 when platform account is not connected', async () => {
    const req = new NextRequest('http://localhost:3000/api/platforms/twitter/sync', {
      method: 'POST',
      body: JSON.stringify({ userId: 'user-1' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req, { params: Promise.resolve({ platform: 'twitter' }) });
    expect(res.status).toBe(404);
  });
});
