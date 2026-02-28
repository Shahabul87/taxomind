jest.mock('@/lib/api', () => ({
  withAdminAuth: (handler: any) =>
    async (request: Request, props?: any) =>
      handler(request, { user: { id: 'user-1' } }, props),
  createSuccessResponse: (data: unknown) =>
    new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  createErrorResponse: (error: { message?: string; statusCode?: number }) =>
    new Response(
      JSON.stringify({ success: false, error: error?.message || 'error' }),
      { status: error?.statusCode || 500, headers: { 'content-type': 'application/json' } }
    ),
  ApiError: {
    internal: (message: string) => ({ message, statusCode: 500 }),
  },
}));

jest.mock('@/lib/sam/middleware/rate-limiter', () => ({
  withRateLimit: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
  },
}));

import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/sections/analyze-content/route';
import { withRateLimit } from '@/lib/sam/middleware/rate-limiter';
import { db } from '@/lib/db';

const mockWithRateLimit = withRateLimit as jest.Mock;
const mockDb = db as Record<string, any>;

function req(body: Record<string, unknown>) {
  return new NextRequest('http://localhost:3000/api/sections/analyze-content', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/sections/analyze-content', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWithRateLimit.mockResolvedValue(null);
    mockDb.course = {
      findUnique: jest.fn(),
    };
  });

  it('returns rate-limit response when blocked', async () => {
    mockWithRateLimit.mockResolvedValueOnce(
      NextResponse.json({ error: 'too many requests' }, { status: 429 })
    );
    const res = await POST(
      req({
        sectionId: 's1',
        chapterId: 'c1',
        courseId: 'course-1',
        context: { chapterTitle: 'Intro', courseTitle: 'Course' },
      })
    );

    expect(res.status).toBe(429);
  });

  it('returns 404 when section is not found for owner', async () => {
    mockDb.course.findUnique.mockResolvedValueOnce(null);

    const res = await POST(
      req({
        sectionId: 's1',
        chapterId: 'c1',
        courseId: 'course-1',
        context: { chapterTitle: 'Intro', courseTitle: 'Course' },
      })
    );
    expect(res.status).toBe(404);
  });

  it('returns analysis and suggestions for valid section', async () => {
    mockDb.course.findUnique.mockResolvedValueOnce({
      id: 'course-1',
      chapters: [
        {
          id: 'c1',
          sections: [
            {
              id: 's1',
              title: 'Section title',
              description: 'Explain and apply concept',
              videos: [],
              blogs: [],
              codeExplanations: [],
              mathExplanations: [],
            },
          ],
        },
      ],
    });

    const res = await POST(
      req({
        sectionId: 's1',
        chapterId: 'c1',
        courseId: 'course-1',
        context: { chapterTitle: 'Chapter A', courseTitle: 'Course A' },
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.analysis).toBeDefined();
    expect(Array.isArray(body.data.suggestions)).toBe(true);
  });
});
