jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

import { POST } from '@/app/api/users/upload/route';
import { auth } from '@/auth';

const mockAuth = auth as jest.Mock;
const params = { params: Promise.resolve({ courseId: 'course-1' }) };

describe('POST /api/users/upload', () => {
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
      req,
      params
    );
    expect(res.status).toBe(401);
  });

  it('returns 400 when no file uploaded', async () => {
    const req = {
      formData: async () => new FormData(),
    } as unknown as Request;
    const res = await POST(
      req,
      params
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when file exceeds max size', async () => {
    const big = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'big.png', {
      type: 'image/png',
    });
    const formData = new FormData();
    formData.set('file', big);
    const req = {
      formData: async () => formData,
    } as unknown as Request;

    const res = await POST(
      req,
      params
    );
    expect(res.status).toBe(400);
  });
});
