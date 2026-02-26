/**
 * Tests for Code Explanations Route - app/api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]/code-explanations/route.ts
 */

import { GET, POST } from '@/app/api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]/code-explanations/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';

const mockAuth = auth as jest.Mock;

if (!(db as Record<string, unknown>).codeExplanation) {
  (db as Record<string, unknown>).codeExplanation = {
    create: jest.fn(),
    findMany: jest.fn(),
  };
}

function props(courseId = 'course-1', chapterId = 'chapter-1', sectionId = 'section-1') {
  return { params: Promise.resolve({ courseId, chapterId, sectionId }) };
}

function postRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/courses/course-1/chapters/chapter-1/sections/section-1/code-explanations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Code Explanations Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.course.findUnique as jest.Mock).mockResolvedValue({ id: 'course-1', userId: 'user-1' });
    (db.codeExplanation.create as jest.Mock).mockResolvedValue({ id: 'exp-1', title: 'Main block' });
    (db.codeExplanation.findMany as jest.Mock).mockResolvedValue([{ id: 'exp-1', title: 'Main block' }]);
  });

  it('POST returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(postRequest({ codeBlocks: [{ title: 'X', code: 'x' }] }) as never, props());
    expect(res.status).toBe(401);
  });

  it('POST returns 400 when codeBlocks are missing', async () => {
    const res = await POST(postRequest({ codeBlocks: [] }) as never, props());
    expect(res.status).toBe(400);
  });

  it('POST returns 401 when user does not own course', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await POST(postRequest({
      codeBlocks: [{ title: 'Main', code: 'const x = 1;' }],
    }) as never, props());
    expect(res.status).toBe(401);
  });

  it('POST creates explanations successfully', async () => {
    const res = await POST(postRequest({
      codeBlocks: [{ title: 'Main', code: 'const x = 1;', language: 'typescript' }],
    }) as never, props());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
    expect(db.codeExplanation.create).toHaveBeenCalled();
  });

  it('GET returns explanations for owned course', async () => {
    const res = await GET(new Request('http://localhost') as never, props());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(1);
  });
});
