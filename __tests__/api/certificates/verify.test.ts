jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('@/lib/certificate/service', () => ({
  certificateService: {
    verifyCertificate: jest.fn(),
  },
}));

import { GET, POST } from '@/app/api/certificates/verify/route';
import { certificateService } from '@/lib/certificate/service';
import { NextRequest } from 'next/server';

const mockVerifyCertificate = certificateService.verifyCertificate as jest.Mock;

describe('/api/certificates/verify route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockVerifyCertificate.mockResolvedValue({
      isValid: true,
      certificate: { id: 'cert-1', verificationCode: 'ABC123' },
      error: null,
    });
  });

  it('POST returns 400 when verificationCode is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/certificates/verify', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('POST verifies certificate and returns payload', async () => {
    const req = new NextRequest('http://localhost:3000/api/certificates/verify', {
      method: 'POST',
      body: JSON.stringify({ verificationCode: 'ABC123' }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.isValid).toBe(true);
    expect(mockVerifyCertificate).toHaveBeenCalledWith('ABC123');
  });

  it('GET returns 400 when code query param is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/certificates/verify');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('GET verifies certificate from query string', async () => {
    const req = new NextRequest('http://localhost:3000/api/certificates/verify?code=ZXCV12');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.isValid).toBe(true);
    expect(mockVerifyCertificate).toHaveBeenCalledWith('ZXCV12');
  });

  it('returns 500 when service throws', async () => {
    mockVerifyCertificate.mockRejectedValueOnce(new Error('service down'));

    const req = new NextRequest('http://localhost:3000/api/certificates/verify?code=ERR500');
    const res = await GET(req);

    expect(res.status).toBe(500);
  });
});
