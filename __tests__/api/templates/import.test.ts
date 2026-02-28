jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn() },
}));

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/templates/import/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;
const mockDb = db as Record<string, any>;

describe('POST /api/templates/import', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockDb.aIContentTemplate = {
      findFirst: jest.fn(),
      create: jest.fn().mockResolvedValue({ id: 'tpl-1' }),
      update: jest.fn().mockResolvedValue({ id: 'tpl-1' }),
    };
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const res = await POST(
      new NextRequest('http://localhost:3000/api/templates/import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ templates: [] }),
      })
    );
    expect(res.status).toBe(401);
  });

  it('returns 400 when templates is not an array', async () => {
    const res = await POST(
      new NextRequest('http://localhost:3000/api/templates/import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ templates: 'invalid' }),
      })
    );
    expect(res.status).toBe(400);
  });

  it('creates new templates and reports counts', async () => {
    mockDb.aIContentTemplate.findFirst.mockResolvedValue(null);
    const res = await POST(
      new NextRequest('http://localhost:3000/api/templates/import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          templates: [
            {
              name: 'Template A',
              contentType: 'ARTICLE',
              templateData: { a: 1 },
            },
          ],
          overwrite: false,
        }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.results.created).toBe(1);
    expect(body.results.updated).toBe(0);
    expect(body.results.skipped).toBe(0);
  });

  it('updates existing template when overwrite=true', async () => {
    mockDb.aIContentTemplate.findFirst.mockResolvedValue({ id: 'tpl-existing' });
    const res = await POST(
      new NextRequest('http://localhost:3000/api/templates/import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          templates: [
            {
              name: 'Template A',
              contentType: 'ARTICLE',
              templateData: { a: 1 },
            },
          ],
          overwrite: true,
        }),
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.results.updated).toBe(1);
    expect(mockDb.aIContentTemplate.update).toHaveBeenCalled();
  });
});
