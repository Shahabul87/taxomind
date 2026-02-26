jest.mock('@/lib/api-protection', () => ({
  withAuth: jest.fn((handler: (...args: any[]) => Promise<Response>) => {
    return async (...args: any[]) => handler(...args);
  }),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/lib/content-versioning', () => ({
  ContentVersioningService: {
    getContentAtVersion: jest.fn(),
  },
}));

import { GET } from '@/app/api/content/versions/[versionId]/content/route';
import { ContentVersioningService } from '@/lib/content-versioning';
import { NextRequest } from 'next/server';

const mockGetContentAtVersion = ContentVersioningService.getContentAtVersion as jest.Mock;

describe('/api/content/versions/[versionId]/content route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetContentAtVersion.mockResolvedValue({ id: 'v1', content: 'snapshot' });
  });

  it('returns 404 when version content is missing', async () => {
    mockGetContentAtVersion.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/content/versions/v1/content');
    const res = await GET(req, { params: Promise.resolve({ versionId: 'v1' }) });
    expect(res.status).toBe(404);
  });

  it('returns content snapshot for requested version', async () => {
    const req = new NextRequest('http://localhost:3000/api/content/versions/v1/content');
    const res = await GET(req, { params: Promise.resolve({ versionId: 'v1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.content.id).toBe('v1');
    expect(mockGetContentAtVersion).toHaveBeenCalledWith('v1');
  });
});
