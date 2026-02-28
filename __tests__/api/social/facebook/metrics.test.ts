jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockGetUserPages = jest.fn();
const mockGetPageFollowers = jest.fn();
const mockGetPageInsights = jest.fn();
const mockGetPagePosts = jest.fn();
const mockTransformFacebookData = jest.fn();
const mockFormatFacebookError = jest.fn();

jest.mock('@/lib/facebook', () => ({
  facebookClient: {
    getUserPages: (...args: unknown[]) => mockGetUserPages(...args),
    getPageFollowers: (...args: unknown[]) => mockGetPageFollowers(...args),
    getPageInsights: (...args: unknown[]) => mockGetPageInsights(...args),
    getPagePosts: (...args: unknown[]) => mockGetPagePosts(...args),
  },
  transformFacebookData: (...args: unknown[]) => mockTransformFacebookData(...args),
  formatFacebookError: (...args: unknown[]) => mockFormatFacebookError(...args),
}));

import { GET } from '@/app/api/social/facebook/metrics/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';

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

const account = ensureModel('account', ['findFirst']);

describe('/api/social/facebook/metrics route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    account.findFirst.mockResolvedValue({
      userId: 'user-1',
      provider: 'facebook',
      access_token: 'token-1',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    });
    mockGetUserPages.mockResolvedValue([{ id: 'page-1', access_token: 'page-token' }]);
    mockGetPageFollowers.mockResolvedValue({ followers: 100 });
    mockGetPageInsights.mockResolvedValue({ impressions: 500 });
    mockGetPagePosts.mockResolvedValue([{ id: 'post-1' }]);
    mockTransformFacebookData.mockReturnValue({ followers: 100, impressions: 500 });
    mockFormatFacebookError.mockReturnValue('Facebook API unavailable');
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns 404 when no connected Facebook account exists', async () => {
    account.findFirst.mockResolvedValueOnce(null);
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it('returns 401 when Facebook token is expired', async () => {
    account.findFirst.mockResolvedValueOnce({
      userId: 'user-1',
      provider: 'facebook',
      access_token: 'token-1',
      expires_at: Math.floor(Date.now() / 1000) - 10,
    });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns transformed metrics payload for valid account and page data', async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.followers).toBe(100);
    expect(mockGetUserPages).toHaveBeenCalledWith('token-1');
    expect(mockTransformFacebookData).toHaveBeenCalled();
  });
});
