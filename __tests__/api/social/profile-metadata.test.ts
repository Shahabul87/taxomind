jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { POST } from '@/app/api/social/profile-metadata/route';
import { auth } from '@/auth';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;

describe('/api/social/profile-metadata route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/social/profile-metadata', {
      method: 'POST',
      body: JSON.stringify({ profileLinks: [] }),
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('returns 400 when profileLinks payload is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/social/profile-metadata', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('returns metadata result rows for supplied profile links', async () => {
    const req = new NextRequest('http://localhost:3000/api/social/profile-metadata', {
      method: 'POST',
      body: JSON.stringify({
        profileLinks: [
          {
            id: 'link-1',
            platform: 'twitter',
            url: 'https://twitter.com/test_user',
          },
        ],
      }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body.results)).toBe(true);
    expect(body.results[0].linkId).toBe('link-1');
    expect(body.results[0].platform).toBe('twitter');
    expect(body.results[0].username).toBe('test_user');
  });
});
