import { GET, POST } from '@/app/api/job-market-mapping/route';
import { currentUser } from '@/lib/auth';

const mockCurrentUser = currentUser as jest.Mock;

describe('/api/job-market-mapping route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
  });

  it('GET returns 401 when user is unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('POST returns success for authenticated user', async () => {
    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Mapping updated');
  });
});
