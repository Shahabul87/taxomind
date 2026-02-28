jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { POST } from '@/app/api/groups/[groupId]/discussions/[discussionId]/likes/route';
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

const groupDiscussionLike = ensureModel('groupDiscussionLike', ['findUnique', 'delete', 'create']);
const groupDiscussion = ensureModel('groupDiscussion', ['update']);

function props(groupId = 'group-1', discussionId = 'discussion-1') {
  return { params: Promise.resolve({ groupId, discussionId }) };
}

describe('/api/groups/[groupId]/discussions/[discussionId]/likes route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as Record<string, any>).crypto = {
      ...(globalThis as Record<string, any>).crypto,
      randomUUID: jest.fn(() => 'like-uuid-1'),
    };
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    groupDiscussionLike.findUnique.mockResolvedValue(null);
    groupDiscussionLike.create.mockResolvedValue({ id: 'like-1' });
    groupDiscussionLike.delete.mockResolvedValue({ id: 'like-1' });
    groupDiscussion.update.mockResolvedValue({ id: 'discussion-1' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new Request('http://localhost:3000/api/groups/group-1/discussions/discussion-1/likes', {
      method: 'POST',
    });
    const res = await POST(req as never, props());
    expect(res.status).toBe(401);
  });

  it('removes like when user already liked the discussion', async () => {
    groupDiscussionLike.findUnique.mockResolvedValueOnce({ id: 'like-1' });

    const req = new Request('http://localhost:3000/api/groups/group-1/discussions/discussion-1/likes', {
      method: 'POST',
    });
    const res = await POST(req as never, props());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.liked).toBe(false);
    expect(groupDiscussionLike.delete).toHaveBeenCalledWith({ where: { id: 'like-1' } });
    expect(groupDiscussion.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'discussion-1' },
        data: { likesCount: { decrement: 1 } },
      })
    );
  });

  it('creates like when user has not liked before', async () => {
    const req = new Request('http://localhost:3000/api/groups/group-1/discussions/discussion-1/likes', {
      method: 'POST',
    });
    const res = await POST(req as never, props());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.liked).toBe(true);
    expect(groupDiscussionLike.create).toHaveBeenCalled();
    expect(groupDiscussion.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { likesCount: { increment: 1 } },
      })
    );
  });
});
