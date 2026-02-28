jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { GET, POST, PATCH, DELETE } from '@/app/api/messages/templates/route';
import { currentUser } from '@/lib/auth';

const mockCurrentUser = currentUser as jest.Mock;

describe('GET/POST/PATCH/DELETE /api/messages/templates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const res = await GET(new NextRequest('http://localhost:3000/api/messages/templates'));
    expect(res.status).toBe(401);
  });

  it('GET returns 501 (feature not implemented)', async () => {
    const res = await GET(new NextRequest('http://localhost:3000/api/messages/templates'));
    expect(res.status).toBe(501);
  });

  it('POST returns 400 for invalid payload', async () => {
    const res = await POST(
      new NextRequest('http://localhost:3000/api/messages/templates', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: '', content: '' }),
      })
    );
    expect(res.status).toBe(400);
  });

  it('PATCH returns 400 when templateId is missing', async () => {
    const res = await PATCH(
      new NextRequest('http://localhost:3000/api/messages/templates', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: 'Update' }),
      })
    );
    expect(res.status).toBe(400);
  });

  it('DELETE returns 400 when id query is missing', async () => {
    const res = await DELETE(new NextRequest('http://localhost:3000/api/messages/templates'));
    expect(res.status).toBe(400);
  });

  it('DELETE returns 501 when id is provided', async () => {
    const res = await DELETE(
      new NextRequest('http://localhost:3000/api/messages/templates?id=tpl-1')
    );
    expect(res.status).toBe(501);
  });
});
