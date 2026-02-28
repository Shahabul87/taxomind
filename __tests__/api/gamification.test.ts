jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('@/lib/gamification', () => ({
  getGamificationDashboard: jest.fn(),
}));

import { GET } from '@/app/api/gamification/route';
import { currentUser } from '@/lib/auth';
import { getGamificationDashboard } from '@/lib/gamification';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;
const mockGetGamificationDashboard = getGamificationDashboard as jest.Mock;

describe('/api/gamification route', () => {
  const originalCrypto = globalThis.crypto;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockGetGamificationDashboard.mockResolvedValue({
      points: 1200,
      level: 4,
      streak: 7,
    });
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        randomUUID: jest.fn(() => 'req-gamification-1'),
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

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/gamification');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('returns gamification dashboard for authenticated user', async () => {
    const req = new NextRequest('http://localhost:3000/api/gamification');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.level).toBe(4);
    expect(body.metadata.requestId).toBeDefined();
  });
});
