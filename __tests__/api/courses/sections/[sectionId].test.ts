jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import { GET } from '@/app/api/courses/sections/[sectionId]/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

const mockAuth = auth as jest.Mock;

describe('/api/courses/sections/[sectionId] route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.section.findUnique as jest.Mock).mockResolvedValue({
      id: 's1',
      title: 'Section 1',
      chapter: { course: { id: 'c1' } },
      videos: [],
      blogs: [],
      articles: [],
      notes: [],
      codeExplanations: [],
    });
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/courses/sections/s1');
    const res = await GET(req, { params: Promise.resolve({ sectionId: 's1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 404 when section is not found', async () => {
    (db.section.findUnique as jest.Mock).mockResolvedValueOnce(null);
    const req = new NextRequest('http://localhost:3000/api/courses/sections/missing');
    const res = await GET(req, { params: Promise.resolve({ sectionId: 'missing' }) });
    expect(res.status).toBe(404);
  });

  it('returns section details when found', async () => {
    const req = new NextRequest('http://localhost:3000/api/courses/sections/s1');
    const res = await GET(req, { params: Promise.resolve({ sectionId: 's1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('s1');
  });
});
