jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/certificate/service', () => ({
  certificateService: {
    getUserCertificates: jest.fn(),
  },
}));

import { GET } from '@/app/api/certificates/user/route';
import { auth } from '@/auth';
import { certificateService } from '@/lib/certificate/service';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockGetUserCertificates = certificateService.getUserCertificates as jest.Mock;

describe('/api/certificates/user route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockGetUserCertificates.mockResolvedValue([{ id: 'cert-1' }]);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const req = new NextRequest('http://localhost:3000/api/certificates/user');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns user certificates', async () => {
    const req = new NextRequest('http://localhost:3000/api/certificates/user');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.certificates)).toBe(true);
    expect(mockGetUserCertificates).toHaveBeenCalledWith('user-1');
  });

  it('returns 500 when service throws', async () => {
    mockGetUserCertificates.mockRejectedValueOnce(new Error('service down'));
    const req = new NextRequest('http://localhost:3000/api/certificates/user');
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});
