/**
 * Tests for Math Equations Route - app/api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]/math-equations/route.ts
 */

jest.unmock('zod');

import { GET, POST } from '@/app/api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]/math-equations/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

if (!(db as Record<string, unknown>).mathExplanation) {
  (db as Record<string, unknown>).mathExplanation = {
    findMany: jest.fn(),
    aggregate: jest.fn(),
    create: jest.fn(),
  };
}

function props(courseId = 'course-1', chapterId = 'chapter-1', sectionId = 'section-1') {
  return { params: Promise.resolve({ courseId, chapterId, sectionId }) };
}

function postRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/courses/course-1/chapters/chapter-1/sections/section-1/math-equations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Math Equations Route', () => {
  beforeAll(() => {
    if (typeof globalThis.crypto?.randomUUID !== 'function') {
      const nodeCrypto = require('crypto');
      Object.defineProperty(globalThis.crypto, 'randomUUID', {
        value: () => nodeCrypto.randomUUID(),
        configurable: true,
        writable: true,
      });
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser.mockResolvedValue({ id: 'user-1' });
    (db.section.findUnique as jest.Mock).mockResolvedValue({ id: 'section-1' });
    (db.mathExplanation.findMany as jest.Mock).mockResolvedValue([{ id: 'm-1' }]);
    (db.mathExplanation.aggregate as jest.Mock).mockResolvedValue({ _max: { position: 1 } });
    (db.mathExplanation.create as jest.Mock).mockResolvedValue({ id: 'm-2', title: 'Equation' });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);
    const res = await GET(new Request('http://localhost') as never, props());
    expect(res.status).toBe(401);
  });

  it('GET returns 403 for non-owned section', async () => {
    (db.section.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await GET(new Request('http://localhost') as never, props());
    expect(res.status).toBe(403);
  });

  it('POST returns 400 for invalid payload', async () => {
    const res = await POST(postRequest({
      title: 'Eq',
      explanation: 'too short',
    }) as never, props());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST creates a math explanation successfully', async () => {
    const res = await POST(postRequest({
      title: 'Pythagoras theorem',
      latexEquation: 'a^2 + b^2 = c^2',
      explanation: 'This equation describes right triangle relationships.',
    }) as never, props());
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('m-2');
    expect(db.mathExplanation.create).toHaveBeenCalled();
  });
});
