jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

import { POST } from '@/app/api/profile/image/route';
import { auth } from '@/auth';

const mockAuth = auth as jest.Mock;

describe('POST /api/profile/image', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = {
      formData: async () => new FormData(),
    } as unknown as Request;
    const res = await POST(
      req
    );
    expect(res.status).toBe(401);
  });

  it('returns 400 when no file uploaded', async () => {
    const req = {
      formData: async () => new FormData(),
    } as unknown as Request;
    const res = await POST(
      req
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when file is not an image', async () => {
    const file = new File(['text'], 'a.txt', { type: 'text/plain' });
    const formData = new FormData();
    formData.set('file', file);
    const req = {
      formData: async () => formData,
    } as unknown as Request;
    const res = await POST(
      req
    );
    expect(res.status).toBe(400);
  });
});
