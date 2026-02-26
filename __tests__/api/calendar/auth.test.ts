jest.mock('@/lib/google-calendar', () => ({
  generateAuthUrl: jest.fn(() => 'https://accounts.google.com/o/oauth2/v2/auth?state=test-state'),
}));

import { GET } from '@/app/api/calendar/auth/route';
import { currentUser } from '@/lib/auth';
import { generateAuthUrl } from '@/lib/google-calendar';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;
const mockGenerateAuthUrl = generateAuthUrl as jest.Mock;

describe('/api/calendar/auth route', () => {
  const originalClientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const originalClientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    process.env.GOOGLE_CALENDAR_CLIENT_ID = 'client-id';
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET = 'client-secret';
  });

  afterAll(() => {
    process.env.GOOGLE_CALENDAR_CLIENT_ID = originalClientId;
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET = originalClientSecret;
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const res = await GET(new NextRequest('http://localhost:3000/api/calendar/auth'));
    expect(res.status).toBe(401);
  });

  it('returns 503 when calendar credentials are missing', async () => {
    process.env.GOOGLE_CALENDAR_CLIENT_ID = '';

    const res = await GET(new NextRequest('http://localhost:3000/api/calendar/auth'));
    expect(res.status).toBe(503);
  });

  it('returns auth URL and state', async () => {
    const res = await GET(new NextRequest('http://localhost:3000/api/calendar/auth'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(typeof body.data.state).toBe('string');
    expect(mockGenerateAuthUrl).toHaveBeenCalledWith(expect.any(String));
  });
});
