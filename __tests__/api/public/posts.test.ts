import { GET } from '@/app/api/public/posts/route';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

describe('GET /api/public/posts', () => {
  const originalCrypto = globalThis.crypto;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        randomUUID: jest.fn(() => 'req-public-posts-1'),
      },
      configurable: true,
    });

    (db.post.count as jest.Mock).mockResolvedValue(2);
    (db.post.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'post-1',
        title: 'Testing in Production',
        description: 'A practical guide to test pipelines.',
        imageUrl: 'https://example.com/p1.jpg',
        category: 'Engineering',
        createdAt: new Date('2026-01-10T10:00:00.000Z'),
        views: 42,
        User: { name: 'Ari', image: 'https://example.com/u1.jpg' },
        Tag: [{ name: 'testing' }, { name: 'ci' }],
        _count: { comments: 3 },
      },
      {
        id: 'post-2',
        title: 'Release Notes',
        description: null,
        imageUrl: null,
        category: 'Product',
        createdAt: new Date('2026-01-09T10:00:00.000Z'),
        views: 10,
        User: { name: 'Sam', image: null },
        Tag: [],
        _count: { comments: 0 },
      },
    ]);
  });

  it('returns paginated published posts with transformed fields', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/public/posts?page=1&limit=2&sort=latest'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.posts).toHaveLength(2);
    expect(body.data.totalCount).toBe(2);
    expect(body.data.posts[0]).toEqual(
      expect.objectContaining({
        id: 'post-1',
        title: 'Testing in Production',
        readingTime: '2 min read',
        user: { name: 'Ari', image: 'https://example.com/u1.jpg' },
        tags: ['testing', 'ci'],
      })
    );
    expect(body.metadata.requestId).toBeDefined();
  });

  it('passes parsed filters to Prisma query', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/public/posts?category=Engineering&authors=Ari,Sam&tags=ci,testing&sort=trending'
    );

    await GET(req);

    expect(db.post.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          published: true,
          isArchived: false,
          category: { in: ['Engineering'] },
          User: { is: { name: { in: ['Ari', 'Sam'] } } },
          Tag: { some: { name: { in: ['ci', 'testing'] } } },
          createdAt: expect.any(Object),
        }),
      })
    );
    expect(db.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ views: 'desc' }, { createdAt: 'desc' }],
      })
    );
  });

  afterAll(() => {
    Object.defineProperty(globalThis, 'crypto', {
      value: originalCrypto,
      configurable: true,
    });
  });

  it('returns 400 for invalid query params', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/public/posts?sort=unsupported'
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 500 when database access fails', async () => {
    (db.post.count as jest.Mock).mockRejectedValueOnce(new Error('db down'));

    const req = new NextRequest('http://localhost:3000/api/public/posts');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
