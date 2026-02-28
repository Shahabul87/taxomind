jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { GET, POST } from '@/app/api/groups/[groupId]/discussions/[discussionId]/comments/route';
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

const groupDiscussionComment = ensureModel('groupDiscussionComment', ['create', 'findMany', 'count']);
const groupDiscussion = ensureModel('groupDiscussion', ['update']);

function props(groupId = 'group-1', discussionId = 'discussion-1') {
  return { params: Promise.resolve({ groupId, discussionId }) };
}

describe('/api/groups/[groupId]/discussions/[discussionId]/comments route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as Record<string, any>).crypto = {
      ...(globalThis as Record<string, any>).crypto,
      randomUUID: jest.fn(() => 'comment-uuid-1'),
    };
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    groupDiscussionComment.create.mockResolvedValue({ id: 'c1', content: 'Nice topic' });
    groupDiscussionComment.findMany.mockResolvedValue([{ id: 'c1', content: 'Nice topic' }]);
    groupDiscussionComment.count.mockResolvedValue(1);
    groupDiscussion.update.mockResolvedValue({ id: 'discussion-1' });
  });

  it('POST returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new Request('http://localhost:3000/api/groups/group-1/discussions/discussion-1/comments', {
      method: 'POST',
      body: JSON.stringify({ content: 'Nice topic' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never, props());
    expect(res.status).toBe(401);
  });

  it('POST returns 400 when comment content is invalid', async () => {
    const req = new Request('http://localhost:3000/api/groups/group-1/discussions/discussion-1/comments', {
      method: 'POST',
      body: JSON.stringify({ content: '' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never, props());
    expect(res.status).toBe(400);
  });

  it('POST creates comment and increments discussion count', async () => {
    const req = new Request('http://localhost:3000/api/groups/group-1/discussions/discussion-1/comments', {
      method: 'POST',
      body: JSON.stringify({ content: 'Nice topic' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never, props());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('c1');
    expect(groupDiscussion.update).toHaveBeenCalledWith({
      where: { id: 'discussion-1' },
      data: { commentsCount: { increment: 1 } },
    });
  });

  it('GET lists comments with metadata', async () => {
    const req = new Request(
      'http://localhost:3000/api/groups/group-1/discussions/discussion-1/comments?page=1&limit=10'
    );
    const res = await GET(req as never, props());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.comments).toHaveLength(1);
    expect(body.metadata).toEqual({
      total: 1,
      page: 1,
      limit: 10,
      hasMore: false,
    });
  });
});
