jest.mock('@/lib/admin', () => ({
  isAdmin: jest.fn(),
}));

import { GET } from '@/app/api/admin/route';
import { isAdmin } from '@/lib/admin';

const mockIsAdmin = isAdmin as jest.Mock;

describe('/api/admin route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 403 when caller is not admin', async () => {
    mockIsAdmin.mockResolvedValue(false);
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('returns success payload for admin', async () => {
    mockIsAdmin.mockResolvedValue(true);
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toBe('Admin access granted');
  });

  it('returns 500 when admin check throws', async () => {
    mockIsAdmin.mockRejectedValueOnce(new Error('auth error'));
    const res = await GET();
    expect(res.status).toBe(500);
  });
});
