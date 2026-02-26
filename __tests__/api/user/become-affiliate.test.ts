import { POST } from '@/app/api/user/become-affiliate/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

describe('/api/user/become-affiliate route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.user.findUnique as jest.Mock).mockResolvedValue({ isAffiliate: false, affiliateCode: null });
    (db.user.update as jest.Mock).mockResolvedValue({
      isAffiliate: true,
      affiliateCode: 'AFFUSERABC123',
      affiliateActivatedAt: '2026-02-26T00:00:00.000Z',
    });
  });

  it('returns 401 for unauthenticated user', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it('returns 400 when user is already affiliate', async () => {
    (db.user.findUnique as jest.Mock).mockResolvedValueOnce({ isAffiliate: true, affiliateCode: 'AFFX' });
    const res = await POST();
    expect(res.status).toBe(400);
  });

  it('upgrades user to affiliate and returns code', async () => {
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValueOnce(0.123456789);
    const res = await POST();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.isAffiliate).toBe(true);
    expect(body.data.affiliateCode).toContain('AFF');
    randomSpy.mockRestore();
  });
});
