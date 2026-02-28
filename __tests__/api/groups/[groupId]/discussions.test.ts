jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { GET, POST } from '@/app/api/groups/[groupId]/discussions/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';

const mockAuth = auth as jest.Mock;

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

const groupDiscussion = ensureModel('groupDiscussion', ['create', 'findMany', 'count']);

function props(groupId = 'group-1') {
  return { params: Promise.resolve({ groupId }) };
}

describe('/api/groups/[groupId]/discussions route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as Record<string, any>).crypto = {
      ...(globalThis as Record<string, any>).crypto,
      randomUUID: jest.fn(() => 'discussion-uuid-1'),
    };
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    groupDiscussion.create.mockResolvedValue({ id: 'd1', title: 'Welcome', content: 'Hello' });
    groupDiscussion.findMany.mockResolvedValue([{ id: 'd1', title: 'Welcome' }]);
    groupDiscussion.count.mockResolvedValue(1);
  });

  it('POST returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new Request('http://localhost:3000/api/groups/group-1/discussions', {
      method: 'POST',
      body: JSON.stringify({ title: 'Welcome', content: 'Hello' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never, props());
    expect(res.status).toBe(401);
  });

  it('POST creates a group discussion for authenticated user', async () => {
    const req = new Request('http://localhost:3000/api/groups/group-1/discussions', {
      method: 'POST',
      body: JSON.stringify({ title: 'Welcome', content: 'Hello' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never, props());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('d1');
    expect(groupDiscussion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          groupId: 'group-1',
          authorId: 'user-1',
          title: 'Welcome',
        }),
      })
    );
  });

  it('GET returns discussions with pagination metadata', async () => {
    const req = new Request('http://localhost:3000/api/groups/group-1/discussions?page=1&limit=10');
    const res = await GET(req as never, props());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.discussions).toHaveLength(1);
    expect(body.metadata).toEqual({
      total: 1,
      page: 1,
      limit: 10,
      hasMore: false,
    });
    expect(groupDiscussion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { groupId: 'group-1' },
      })
    );
  });

  it('GET returns 500 on database failure', async () => {
    groupDiscussion.findMany.mockRejectedValueOnce(new Error('db fail'));
    const req = new Request('http://localhost:3000/api/groups/group-1/discussions');
    const res = await GET(req as never, props());
    expect(res.status).toBe(500);
  });
});
