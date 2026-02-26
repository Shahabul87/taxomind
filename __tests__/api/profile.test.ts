/**
 * Tests for Profile Route - app/api/profile/route.ts
 */

import { GET, PATCH } from '@/app/api/profile/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';

const mockAuth = auth as jest.Mock;

for (const model of ['socialMediaAccount', 'userSubscription', 'profileLink']) {
  if (!(db as Record<string, unknown>)[model]) {
    (db as Record<string, unknown>)[model] = {
      findMany: jest.fn(),
    };
  }
}

const mockSocial = (db as Record<string, any>).socialMediaAccount;
const mockSubs = (db as Record<string, any>).userSubscription;
const mockLinks = (db as Record<string, any>).profileLink;

function patchReq(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Profile route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });

    (db.user.findUnique as jest.Mock).mockImplementation((args: any) => {
      if (args?.select?._count) {
        return Promise.resolve({
          _count: {
            Post: 2,
            Comment: 3,
            Reply: 1,
            reactions: 4,
            Video: 1,
            Blog: 1,
            Article: 2,
            Idea_Idea_userIdToUser: 5,
            courses: 2,
          },
        });
      }

      return Promise.resolve({
        id: 'user-1',
        name: 'Jane',
        email: 'jane@example.com',
        image: null,
        phone: null,
        createdAt: new Date('2026-01-01'),
      });
    });

    (db.user.update as jest.Mock).mockResolvedValue({
      id: 'user-1',
      name: 'Jane Updated',
      email: 'jane@example.com',
      image: null,
      phone: '1234567890',
      createdAt: new Date('2026-01-01'),
    });

    mockSocial.findMany.mockResolvedValue([
      { followerCount: 10, followingCount: 2, platform: 'twitter' },
      { followerCount: 5, followingCount: 3, platform: 'linkedin' },
    ]);

    mockSubs.findMany.mockResolvedValue([
      { id: 's1', serviceName: 'Pro', cost: 12, billingCycle: 'MONTHLY' },
      { id: 's2', serviceName: 'Yearly', cost: 120, billingCycle: 'YEARLY' },
    ]);

    mockLinks.findMany.mockResolvedValue([{ id: 'l1', url: 'https://example.com' }]);
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('GET returns 404 when user is missing', async () => {
    (db.user.findUnique as jest.Mock).mockImplementationOnce(() => Promise.resolve(null));

    const res = await GET();
    expect(res.status).toBe(404);
  });

  it('GET returns enriched profile data', async () => {
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('user-1');
    expect(body.stats.posts).toBe(2);
    expect(body.stats.followers).toBe(15);
    expect(body.stats.following).toBe(5);
    expect(body.stats.subscriptions).toBe(2);
    expect(body.stats.monthlySpending).toBe(22);
    expect(body.socialMediaAccounts).toHaveLength(2);
    expect(body.userSubscriptions).toHaveLength(2);
    expect(body.profileLinks).toHaveLength(1);
  });

  it('PATCH returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await PATCH(patchReq({ name: 'X' }));
    expect(res.status).toBe(401);
  });

  it('PATCH updates profile fields', async () => {
    const res = await PATCH(patchReq({ name: 'Jane Updated', phone: '1234567890' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.name).toBe('Jane Updated');
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({ name: 'Jane Updated', phone: '1234567890' }),
      })
    );
  });
});
