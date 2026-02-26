jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@/app/actions/get-similar-posts', () => ({
  getSimilarPosts: jest.fn(),
}));

import { GET } from '@/app/api/posts/similar/route';
import { getSimilarPosts } from '@/app/actions/get-similar-posts';
import { NextRequest } from 'next/server';

const mockGetSimilarPosts = getSimilarPosts as jest.Mock;

describe('/api/posts/similar route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSimilarPosts.mockResolvedValue([{ id: 'p2' }]);
  });

  it('returns 400 when postId is missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/posts/similar');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns similar posts list', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/posts/similar?postId=p1&category=engineering'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(mockGetSimilarPosts).toHaveBeenCalledWith('p1', 'engineering');
  });
});
