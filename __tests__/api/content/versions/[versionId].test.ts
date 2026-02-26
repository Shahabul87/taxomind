jest.mock('@/lib/api-protection', () => ({
  withAuth: (handler: any) => (request: any, props?: any) => handler(request, props),
}));

jest.mock('@/lib/content-versioning', () => ({
  ContentVersioningService: {
    getVersion: jest.fn(),
    publishVersion: jest.fn(),
    submitForReview: jest.fn(),
    reviewVersion: jest.fn(),
  },
}));

import { GET, PATCH } from '@/app/api/content/versions/[versionId]/route';
import { ContentVersioningService } from '@/lib/content-versioning';
import { NextRequest } from 'next/server';

const mockGetVersion = ContentVersioningService.getVersion as jest.Mock;
const mockPublishVersion = ContentVersioningService.publishVersion as jest.Mock;
const mockSubmitForReview = ContentVersioningService.submitForReview as jest.Mock;
const mockReviewVersion = ContentVersioningService.reviewVersion as jest.Mock;

function params(versionId = 'v1') {
  return { params: Promise.resolve({ versionId }) };
}

describe('/api/content/versions/[versionId] route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetVersion.mockResolvedValue({ id: 'v1' });
    mockPublishVersion.mockResolvedValue({ id: 'v1', status: 'PUBLISHED' });
    mockSubmitForReview.mockResolvedValue([{ id: 'approval-1' }]);
    mockReviewVersion.mockResolvedValue({ id: 'approval-1', approved: true });
  });

  it('GET returns 404 when version is not found', async () => {
    mockGetVersion.mockResolvedValueOnce(null);

    const res = await GET(new NextRequest('http://localhost:3000/api/content/versions/v1') as never, params());
    expect(res.status).toBe(404);
  });

  it('GET returns version when found', async () => {
    const res = await GET(new NextRequest('http://localhost:3000/api/content/versions/v1') as never, params());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.version.id).toBe('v1');
  });

  it('PATCH returns 400 for invalid action', async () => {
    const req = new NextRequest('http://localhost:3000/api/content/versions/v1', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'invalid' }),
    });

    const res = await PATCH(req as never, params());
    expect(res.status).toBe(400);
  });

  it('PATCH publishes version for action=publish', async () => {
    const req = new NextRequest('http://localhost:3000/api/content/versions/v1', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'publish' }),
    });

    const res = await PATCH(req as never, params());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.version.status).toBe('PUBLISHED');
    expect(mockPublishVersion).toHaveBeenCalledWith('v1');
  });

  it('PATCH returns 400 for submit_for_review without reviewerIds', async () => {
    const req = new NextRequest('http://localhost:3000/api/content/versions/v1', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'submit_for_review' }),
    });

    const res = await PATCH(req as never, params());
    expect(res.status).toBe(400);
  });

  it('PATCH returns 400 for review without approved flag', async () => {
    const req = new NextRequest('http://localhost:3000/api/content/versions/v1', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'review', comments: 'Looks good' }),
    });

    const res = await PATCH(req as never, params());
    expect(res.status).toBe(400);
  });
});
