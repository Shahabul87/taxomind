import { GET } from '@/app/api/auth-test/route';
import { auth } from '@/auth';

const mockAuth = auth as jest.Mock;

describe('GET /api/auth-test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns session shape flags', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'user@test.com' },
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.hasSession).toBe(true);
    expect(body.hasUser).toBe(true);
    expect(body.hasUserId).toBe(true);
    expect(body.userId).toBe('user-1');
    expect(body.userEmail).toBe('user@test.com');
  });

  it('returns null user values when no session', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.hasSession).toBe(false);
    expect(body.userId).toBeNull();
    expect(body.userEmail).toBeNull();
  });

  it('returns 500 when auth throws', async () => {
    mockAuth.mockRejectedValueOnce(new Error('auth fail'));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe(true);
    expect(body.message).toBe('auth fail');
  });
});
