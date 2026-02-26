jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('@/lib/certificate/service', () => ({
  certificateService: {
    generateCertificate: jest.fn(),
  },
}));

import { POST } from '@/app/api/certificates/generate/route';
import { auth } from '@/auth';
import { certificateService } from '@/lib/certificate/service';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;
const mockGenerateCertificate = certificateService.generateCertificate as jest.Mock;

describe('/api/certificates/generate route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    mockGenerateCertificate.mockResolvedValue({
      success: true,
      certificate: { id: 'cert-1' },
    });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/certificates/generate', {
      method: 'POST',
      body: JSON.stringify({ courseId: 'c1' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when courseId is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/certificates/generate', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns generated certificate', async () => {
    const req = new NextRequest('http://localhost:3000/api/certificates/generate', {
      method: 'POST',
      body: JSON.stringify({ courseId: 'c1', templateId: 't1' }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.certificate.id).toBe('cert-1');
  });
});
