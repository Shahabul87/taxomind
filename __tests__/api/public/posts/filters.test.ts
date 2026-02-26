import { GET } from '@/app/api/public/posts/filters/route';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

describe('/api/public/posts/filters route', () => {
  const originalCrypto = globalThis.crypto;

  beforeEach(() => {
    jest.clearAllMocks();
    (db.post.findMany as jest.Mock).mockResolvedValue([
      {
        category: 'Engineering',
        User: { name: 'Alice' },
        Tag: [{ name: 'React' }, { name: 'Testing' }],
      },
      {
        category: null,
        User: { name: 'Bob' },
        Tag: [{ name: 'React' }],
      },
    ]);

    Object.defineProperty(globalThis, 'crypto', {
      value: {
        randomUUID: jest.fn(() => 'req-1'),
      },
      configurable: true,
    });
  });

  afterAll(() => {
    Object.defineProperty(globalThis, 'crypto', {
      value: originalCrypto,
      configurable: true,
    });
  });

  it('returns aggregated filters for public posts', async () => {
    const req = new NextRequest('http://localhost:3000/api/public/posts/filters');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.authors).toEqual(['Alice', 'Bob']);
    expect(body.data.tags).toEqual(['React', 'Testing']);
    expect(body.data.categories).toEqual(
      expect.arrayContaining([{ name: 'Engineering', count: 1 }, { name: 'Uncategorized', count: 1 }])
    );
    expect(body.metadata.requestId).toBe('req-1');
  });

  it('returns 500 when data fetch fails', async () => {
    (db.post.findMany as jest.Mock).mockRejectedValueOnce(new Error('db down'));
    const req = new NextRequest('http://localhost:3000/api/public/posts/filters');
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});
