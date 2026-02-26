jest.mock('@/lib/queue/email-tracking', () => ({
  getUserEmailStatus: jest.fn(),
}));

import { GET } from '@/app/api/email-status/route';
import { currentUser } from '@/lib/auth';
import { getUserEmailStatus } from '@/lib/queue/email-tracking';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;
const mockGetUserEmailStatus = getUserEmailStatus as jest.Mock;

describe('/api/email-status route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockGetUserEmailStatus.mockResolvedValue([{ id: 'email-1', status: 'sent' }]);
  });

  it('returns 401 for unauthenticated users', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/email-status');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns email status logs for current user', async () => {
    const req = new NextRequest('http://localhost:3000/api/email-status');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body.emails)).toBe(true);
    expect(body.emails[0].status).toBe('sent');
    expect(mockGetUserEmailStatus).toHaveBeenCalledWith('user-1', 10);
  });

  it('returns 500 when service throws', async () => {
    mockGetUserEmailStatus.mockRejectedValueOnce(new Error('queue down'));
    const req = new NextRequest('http://localhost:3000/api/email-status');
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});
