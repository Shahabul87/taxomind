jest.mock('@/lib/cache/redis-cache', () => ({
  redisCache: {
    get: jest.fn(),
    set: jest.fn(),
  },
  CACHE_PREFIXES: { COURSE: 'course' },
  CACHE_TTL: { MEDIUM: 600 },
}));

import { GET } from '@/app/api/blog/statistics/route';
import { db } from '@/lib/db';
import { redisCache } from '@/lib/cache/redis-cache';

const mockCacheGet = redisCache.get as jest.Mock;
const mockCacheSet = redisCache.set as jest.Mock;

function ensureModel(modelName: string, methods: string[]) {
  const dbRecord = db as Record<string, Record<string, jest.Mock> | undefined>;
  if (!dbRecord[modelName]) {
    dbRecord[modelName] = {} as Record<string, jest.Mock>;
  }
  for (const method of methods) {
    if (!(dbRecord[modelName] as Record<string, jest.Mock>)[method]) {
      (dbRecord[modelName] as Record<string, jest.Mock>)[method] = jest.fn();
    }
  }
  return dbRecord[modelName] as Record<string, jest.Mock>;
}

const post = ensureModel('post', ['count', 'aggregate', 'findMany', 'groupBy']);
const comment = ensureModel('comment', ['count', 'findMany']);

describe('/api/blog/statistics route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCacheGet.mockResolvedValue({ hit: false, value: null });
    post.count.mockResolvedValueOnce(10).mockResolvedValueOnce(8);
    post.aggregate.mockResolvedValue({ _sum: { views: 1000 }, _avg: { views: 100 } });
    comment.count.mockResolvedValue(15);
    post.findMany.mockResolvedValue([{ userId: 'u1' }, { userId: 'u2' }]);
    comment.findMany.mockResolvedValue([{ userId: 'u3' }]);
    post.groupBy.mockResolvedValue([{ category: 'Tech', _count: 5 }]);
    mockCacheSet.mockResolvedValue(true);
  });

  it('returns cached statistics when cache hit', async () => {
    mockCacheGet.mockResolvedValueOnce({
      hit: true,
      value: {
        totalArticles: 1,
        publishedArticles: 1,
        totalReaders: 1,
        totalAuthors: 1,
        totalViews: 10,
        totalComments: 1,
        averageViews: 10,
        popularCategories: [],
      },
    });

    const res = await GET(new Request('http://localhost:3000/api/blog/statistics'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.metadata.cached).toBe(true);
  });

  it('calculates and caches statistics on cache miss', async () => {
    const res = await GET(new Request('http://localhost:3000/api/blog/statistics'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.totalArticles).toBe(10);
    expect(mockCacheSet).toHaveBeenCalled();
  });

  it('returns 500 when query fails', async () => {
    post.count.mockReset();
    post.count.mockRejectedValueOnce(new Error('db fail'));
    mockCacheGet.mockResolvedValueOnce({ hit: false, value: null });

    const res = await GET(new Request('http://localhost:3000/api/blog/statistics'));
    expect(res.status).toBe(500);
  });
});
