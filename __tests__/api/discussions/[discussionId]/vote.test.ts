import { DELETE, POST } from '@/app/api/discussions/[discussionId]/vote/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockCurrentUser = currentUser as jest.Mock;

function ensureModel(modelName: string, methods: string[]) {
  if (!(db as Record<string, unknown>)[modelName]) {
    (db as Record<string, unknown>)[modelName] = {};
  }
  const model = (db as Record<string, any>)[modelName];
  for (const method of methods) {
    if (!model[method]) model[method] = jest.fn();
  }
  return model;
}

const discussion = ensureModel('discussion', ['findUnique']);
const discussionVote = ensureModel('discussionVote', ['findUnique', 'delete', 'upsert']);

function createPostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/discussions/discussion-1/vote', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('/api/discussions/[discussionId]/vote route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });

    discussion.findUnique.mockResolvedValue({
      id: 'discussion-1',
      section: {
        chapter: {
          course: {
            userId: 'teacher-1',
            Enrollment: [{ id: 'enrollment-1' }],
          },
        },
      },
    });

    discussionVote.findUnique.mockResolvedValue(null);
    discussionVote.delete.mockResolvedValue({ id: 'vote-1' });
    discussionVote.upsert.mockResolvedValue({
      id: 'vote-1',
      discussionId: 'discussion-1',
      userId: 'user-1',
      voteType: 'UPVOTE',
    });
  });

  it('POST returns 401 for unauthenticated users', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);

    const res = await POST(createPostRequest({ voteType: 'UPVOTE' }), {
      params: { discussionId: 'discussion-1' },
    });

    expect(res.status).toBe(401);
  });

  it('POST returns 404 when discussion does not exist', async () => {
    discussion.findUnique.mockResolvedValueOnce(null);

    const res = await POST(createPostRequest({ voteType: 'UPVOTE' }), {
      params: { discussionId: 'missing' },
    });

    expect(res.status).toBe(404);
  });

  it('POST returns 403 when user has no access to the course discussion', async () => {
    discussion.findUnique.mockResolvedValueOnce({
      id: 'discussion-1',
      section: {
        chapter: {
          course: {
            userId: 'different-teacher',
            Enrollment: [],
          },
        },
      },
    });

    const res = await POST(createPostRequest({ voteType: 'UPVOTE' }), {
      params: { discussionId: 'discussion-1' },
    });

    expect(res.status).toBe(403);
  });

  it('POST toggles an existing vote when the same voteType is submitted', async () => {
    discussionVote.findUnique.mockResolvedValueOnce({ voteType: 'UPVOTE' });

    const res = await POST(createPostRequest({ voteType: 'UPVOTE' }), {
      params: { discussionId: 'discussion-1' },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.action).toBe('removed');
    expect(body.voteType).toBeNull();
    expect(discussionVote.delete).toHaveBeenCalled();
  });

  it('POST creates a vote when none exists', async () => {
    discussionVote.findUnique.mockResolvedValueOnce(null);
    discussionVote.upsert.mockResolvedValueOnce({
      id: 'vote-2',
      discussionId: 'discussion-1',
      userId: 'user-1',
      voteType: 'DOWNVOTE',
    });

    const res = await POST(createPostRequest({ voteType: 'DOWNVOTE' }), {
      params: { discussionId: 'discussion-1' },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.action).toBe('created');
    expect(body.vote.voteType).toBe('DOWNVOTE');
  });

  it('POST returns 400 for invalid voteType payload', async () => {
    const res = await POST(createPostRequest({ voteType: 'INVALID' }), {
      params: { discussionId: 'discussion-1' },
    });

    expect(res.status).toBe(400);
  });

  it('DELETE removes an existing vote', async () => {
    const req = new NextRequest('http://localhost:3000/api/discussions/discussion-1/vote', {
      method: 'DELETE',
    });
    const res = await DELETE(req, { params: { discussionId: 'discussion-1' } });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(discussionVote.delete).toHaveBeenCalledWith({
      where: {
        discussionId_userId: {
          discussionId: 'discussion-1',
          userId: 'user-1',
        },
      },
    });
  });
});
