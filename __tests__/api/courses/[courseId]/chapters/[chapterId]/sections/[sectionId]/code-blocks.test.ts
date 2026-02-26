/**
 * Tests for Code Blocks Route - app/api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]/code-blocks/route.ts
 */

jest.unmock('zod');

import { GET, POST } from '@/app/api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]/code-blocks/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';

const mockAuth = auth as jest.Mock;

if (!(db as Record<string, unknown>).codeExplanation) {
  (db as Record<string, unknown>).codeExplanation = {
    findMany: jest.fn(),
    update: jest.fn(),
    aggregate: jest.fn(),
    create: jest.fn(),
  };
}

function props(courseId = 'course-1', chapterId = 'chapter-1', sectionId = 'section-1') {
  return { params: Promise.resolve({ courseId, chapterId, sectionId }) };
}

function postRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:3000/api/courses/course-1/chapters/chapter-1/sections/section-1/code-blocks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Code Blocks Route', () => {
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
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } });
    (db.section.findUnique as jest.Mock).mockResolvedValue({ id: 'section-1' });
    (db.codeExplanation.findMany as jest.Mock).mockResolvedValue([]);
    (db.codeExplanation.aggregate as jest.Mock).mockResolvedValue({ _max: { position: 2 } });
    (db.codeExplanation.create as jest.Mock).mockResolvedValue({ id: 'cb-1', title: 'Block' });
    (db.codeExplanation.update as jest.Mock).mockResolvedValue({ id: 'cb-1' });
  });

  it('GET returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET(new Request('http://localhost') as never, props());
    expect(res.status).toBe(401);
  });

  it('GET returns 403 for non-owned section', async () => {
    (db.section.findUnique as jest.Mock).mockResolvedValue(null);
    const res = await GET(new Request('http://localhost') as never, props());
    expect(res.status).toBe(403);
  });

  it('GET returns empty list successfully', async () => {
    const res = await GET(new Request('http://localhost') as never, props());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual([]);
  });

  it('POST returns 400 for invalid payload', async () => {
    const res = await POST(postRequest({ blocks: [] }) as never, props());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST creates blocks successfully', async () => {
    (db.codeExplanation.findMany as jest.Mock).mockResolvedValue([
      { id: 'cb-1', code: 'const a = 1;', position: 0 },
    ]);

    const res = await POST(postRequest({
      blocks: [
        {
          title: 'Block 1',
          code: 'const a = 1;',
          language: 'typescript',
        },
      ],
    }) as never, props());
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.metadata.count).toBe(1);
    expect(db.codeExplanation.create).toHaveBeenCalled();
  });
});
