jest.mock('@/lib/api-protection', () => ({
  withAuth: (handler: any) => (request: any) => handler(request),
}));

jest.mock('@/lib/content-versioning', () => ({
  ContentVersioningService: {
    createVersion: jest.fn(),
    getVersionHistory: jest.fn(),
  },
}));

import { GET, POST } from '@/app/api/content/versions/route';
import { ContentVersioningService } from '@/lib/content-versioning';
import { NextRequest } from 'next/server';

const mockCreateVersion = ContentVersioningService.createVersion as jest.Mock;
const mockGetVersionHistory = ContentVersioningService.getVersionHistory as jest.Mock;

describe('/api/content/versions route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateVersion.mockResolvedValue({ id: 'v1', contentId: 'c1' });
    mockGetVersionHistory.mockResolvedValue([{ id: 'v1' }]);
  });

  it('POST returns 400 when required fields are missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/content/versions', {
      method: 'POST',
      body: JSON.stringify({ contentType: 'COURSE' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('POST creates new content version', async () => {
    const req = new NextRequest('http://localhost:3000/api/content/versions', {
      method: 'POST',
      body: JSON.stringify({
        contentType: 'COURSE',
        contentId: 'course-1',
        contentSnapshot: { title: 'Course' },
      }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.version.id).toBe('v1');
    expect(mockCreateVersion).toHaveBeenCalled();
  });

  it('GET returns 400 when query params are missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/content/versions');
    const res = await GET(req);

    expect(res.status).toBe(400);
  });

  it('GET returns version history', async () => {
    const req = new NextRequest('http://localhost:3000/api/content/versions?contentType=COURSE&contentId=course-1');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body.versions)).toBe(true);
    expect(mockGetVersionHistory).toHaveBeenCalledWith('COURSE', 'course-1');
  });
});
