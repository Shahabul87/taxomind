jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/messages/search/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;
const mockDb = db as Record<string, any>;

describe('GET /api/messages/search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockDb.message = {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'm1',
          content: 'Hello world',
          senderId: 'user-1',
          recipientId: 'user-2',
          createdAt: new Date('2026-01-01T00:00:00Z'),
          User_Message_senderIdToUser: { id: 'user-1', name: 'U1', image: null },
          User_Message_recipientIdToUser: { id: 'user-2', name: 'U2', image: null },
        },
      ]),
      count: jest.fn().mockResolvedValue(1),
    };
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const res = await GET(new NextRequest('http://localhost:3000/api/messages/search?query=hello'));
    expect(res.status).toBe(401);
  });

  it('returns 400 when query is missing', async () => {
    const res = await GET(new NextRequest('http://localhost:3000/api/messages/search'));
    expect(res.status).toBe(400);
  });

  it('returns 500 when filters JSON is invalid', async () => {
    const res = await GET(
      new NextRequest('http://localhost:3000/api/messages/search?query=hello&filters={bad')
    );
    expect(res.status).toBe(500);
  });

  it('returns highlighted search results and pagination', async () => {
    const filters = encodeURIComponent(JSON.stringify({ unreadOnly: true }));
    const res = await GET(
      new NextRequest(
        `http://localhost:3000/api/messages/search?query=hello&filters=${filters}&limit=20&offset=0`
      )
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.total).toBe(1);
    expect(body.messages[0].highlightedContent).toContain('<mark>Hello</mark>');
    expect(body.pagination.limit).toBe(20);
    expect(mockDb.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          read: false,
          recipientId: 'user-1',
        }),
      })
    );
  });
});
