jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

import { POST } from '@/app/api/users/[userId]/image/route';
import { auth } from '@/auth';

const mockAuth = auth as jest.Mock;
const params = { params: Promise.resolve({ userId: 'user-1' }) };

describe('POST /api/users/[userId]/image', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('returns 401 when user is not owner', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user-2' } });
    const formData = new FormData();
    const req = {
      formData: async () => formData,
    } as unknown as Request;

    const res = await POST(req, params);

    expect(res.status).toBe(401);
  });

  it('returns 400 when no file is provided', async () => {
    const formData = new FormData();
    const req = {
      formData: async () => formData,
    } as unknown as Request;
    const res = await POST(req, params);

    expect(res.status).toBe(400);
  });
});
