jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
}));

jest.mock('@/lib/content-versioning', () => ({
  ContentVersioningService: {
    applyTemplate: jest.fn(),
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn() },
}));

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/templates/[templateId]/apply/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { ContentVersioningService } from '@/lib/content-versioning';

const mockCurrentUser = currentUser as jest.Mock;
const mockDb = db as Record<string, any>;
const mockApplyTemplate = ContentVersioningService.applyTemplate as jest.Mock;

const params = { params: Promise.resolve({ templateId: 'tpl-1' }) };

describe('POST /api/templates/[templateId]/apply', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    mockApplyTemplate.mockResolvedValue({ id: 'ver-1', contentId: 'content-1' });
    mockDb.aIContentTemplate = {
      findUnique: jest.fn().mockResolvedValue({
        id: 'tpl-1',
        name: 'Template',
        User: { id: 'user-1', name: 'User', email: 'u@test.com' },
      }),
    };
  });

  it('returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValueOnce(null);
    const res = await POST(
      new NextRequest('http://localhost:3000/api/templates/tpl-1/apply', { method: 'POST' }),
      params
    );
    expect(res.status).toBe(401);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await POST(
      new NextRequest('http://localhost:3000/api/templates/tpl-1/apply', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ contentType: 'ARTICLE' }),
      }),
      params
    );

    expect(res.status).toBe(400);
  });

  it('applies template and returns created version', async () => {
    const res = await POST(
      new NextRequest('http://localhost:3000/api/templates/tpl-1/apply', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contentType: 'ARTICLE',
          contentId: 'content-1',
          customizations: { tone: 'formal' },
        }),
      }),
      params
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toContain('applied successfully');
    expect(mockApplyTemplate).toHaveBeenCalledWith(
      'tpl-1',
      'ARTICLE',
      'content-1',
      { tone: 'formal' }
    );
  });
});
