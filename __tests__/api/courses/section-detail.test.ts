/**
 * Tests for Section Detail Route
 * app/api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]/route.ts
 *
 * Covers:
 *   GET    - Fetch a single section by ID (requires course ownership)
 *   PATCH  - Update a section (requires course ownership, Zod validation)
 *   DELETE - Delete a section (requires course ownership)
 *
 * Tests auth checks, authorization (course owner), Zod validation,
 * field mapping (estimatedDuration, contentType aliases), error handling,
 * memory reindex queueing, and happy paths.
 */

// Global mocks are set up in jest.setup.js for:
//   @/lib/db, @/auth, @/lib/logger, next/server

jest.mock('@/lib/sam/memory-lifecycle-service', () => ({
  queueSectionReindex: jest.fn().mockResolvedValue(undefined),
}));

// Ensure crypto.randomUUID is available (route uses it in response metadata)
// jsdom + restoreMocks can remove the setup from jest.setup.js
const nodeCrypto = require('crypto');
if (!global.crypto?.randomUUID) {
  Object.defineProperty(global, 'crypto', {
    value: {
      ...global.crypto,
      randomUUID: () => nodeCrypto.randomUUID(),
    },
    writable: true,
    configurable: true,
  });
} else if (typeof global.crypto.randomUUID !== 'function') {
  (global.crypto as Record<string, unknown>).randomUUID = () => nodeCrypto.randomUUID();
}

import { GET, PATCH, DELETE } from '@/app/api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]/route';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { queueSectionReindex } from '@/lib/sam/memory-lifecycle-service';

const mockAuth = auth as jest.Mock;
const mockQueueReindex = queueSectionReindex as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createRequest(method: string, body?: Record<string, unknown>) {
  const init: RequestInit = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  return new Request(
    'http://localhost:3000/api/courses/course-1/chapters/chapter-1/sections/section-1',
    init
  );
}

function createParams(
  courseId = 'course-1',
  chapterId = 'chapter-1',
  sectionId = 'section-1'
) {
  return { params: Promise.resolve({ courseId, chapterId, sectionId }) };
}

const MOCK_SESSION = { user: { id: 'user-1' } };

const MOCK_COURSE = {
  id: 'course-1',
  userId: 'user-1',
  title: 'Test Course',
};

const MOCK_SECTION = {
  id: 'section-1',
  title: 'Test Section',
  description: 'A section',
  chapterId: 'chapter-1',
  position: 0,
  isPublished: false,
  isFree: false,
  videoUrl: null,
  chapter: {
    title: 'Chapter 1',
    course: { title: 'Test Course' },
  },
};

// ---------------------------------------------------------------------------
// GET /api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]
// ---------------------------------------------------------------------------

describe('GET /api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(createRequest('GET'), createParams());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
    expect(body.error.message).toBe('Authentication required');
  });

  it('returns 401 when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} });

    const res = await GET(createRequest('GET'), createParams());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 404 when the course is not found or user is not the owner', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await GET(createRequest('GET'), createParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toContain('Course not found');
  });

  it('verifies course ownership using courseId and userId from session', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.findUnique as jest.Mock).mockResolvedValue(MOCK_SECTION);

    await GET(createRequest('GET'), createParams('my-course', 'ch-99', 'sec-99'));

    expect(db.course.findUnique).toHaveBeenCalledWith({
      where: { id: 'my-course', userId: 'user-1' },
    });
  });

  it('returns 404 when the section is not found', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await GET(createRequest('GET'), createParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('Section not found');
  });

  it('queries the section by sectionId and chapterId with includes', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.findUnique as jest.Mock).mockResolvedValue(MOCK_SECTION);

    await GET(createRequest('GET'), createParams('course-1', 'ch-abc', 'sec-xyz'));

    expect(db.section.findUnique).toHaveBeenCalledWith({
      where: { id: 'sec-xyz', chapterId: 'ch-abc' },
      include: {
        chapter: {
          select: {
            title: true,
            course: { select: { title: true } },
          },
        },
      },
    });
  });

  it('returns the section data with standard API response format on success', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.findUnique as jest.Mock).mockResolvedValue(MOCK_SECTION);

    const res = await GET(createRequest('GET'), createParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('section-1');
    expect(body.data.title).toBe('Test Section');
    expect(body.data.chapter.title).toBe('Chapter 1');
    expect(body.metadata).toBeDefined();
    expect(body.metadata.version).toBe('1.0.0');
    expect(body.metadata.timestamp).toBeDefined();
    expect(body.metadata.requestId).toBeDefined();
  });

  it('returns 500 on unexpected database errors', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockRejectedValue(new Error('DB down'));

    const res = await GET(createRequest('GET'), createParams());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toContain('fetching the section');
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]
// ---------------------------------------------------------------------------

describe('PATCH /api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -- Auth checks --

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await PATCH(
      createRequest('PATCH', { title: 'Updated' }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: { name: 'No Id' } });

    const res = await PATCH(
      createRequest('PATCH', { title: 'Updated' }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  // -- Authorization (course ownership) --

  it('returns 404 when the course is not found or user is not the owner', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await PATCH(
      createRequest('PATCH', { title: 'Updated' }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  // -- Validation errors --

  it('returns 400 for invalid title (empty string)', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);

    const res = await PATCH(
      createRequest('PATCH', { title: '' }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'title' }),
      ])
    );
  });

  it('returns 400 for title exceeding 200 characters', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);

    const res = await PATCH(
      createRequest('PATCH', { title: 'A'.repeat(201) }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for invalid videoUrl', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);

    const res = await PATCH(
      createRequest('PATCH', { videoUrl: 'not-a-url' }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for negative position', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);

    const res = await PATCH(
      createRequest('PATCH', { position: -1 }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for non-integer position', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);

    const res = await PATCH(
      createRequest('PATCH', { position: 1.5 }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  // -- Happy path: basic field updates --

  it('updates the section title successfully', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    const updated = { id: 'section-1', title: 'New Title' };
    (db.section.update as jest.Mock).mockResolvedValue(updated);

    const res = await PATCH(
      createRequest('PATCH', { title: 'New Title' }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('New Title');

    expect(db.section.update).toHaveBeenCalledWith({
      where: { id: 'section-1', chapterId: 'chapter-1' },
      data: { title: 'New Title' },
    });
  });

  it('updates description to a new value', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.update as jest.Mock).mockResolvedValue({
      id: 'section-1',
      description: 'Updated description',
    });

    const res = await PATCH(
      createRequest('PATCH', { description: 'Updated description' }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(db.section.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { description: 'Updated description' },
      })
    );
  });

  it('allows nullable description', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.update as jest.Mock).mockResolvedValue({
      id: 'section-1',
      description: null,
    });

    const res = await PATCH(
      createRequest('PATCH', { description: null }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(db.section.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { description: null },
      })
    );
  });

  it('updates position to a valid integer', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.update as jest.Mock).mockResolvedValue({ id: 'section-1', position: 5 });

    await PATCH(createRequest('PATCH', { position: 5 }), createParams());

    expect(db.section.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { position: 5 },
      })
    );
  });

  it('updates isFree boolean', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.update as jest.Mock).mockResolvedValue({ id: 'section-1', isFree: true });

    await PATCH(createRequest('PATCH', { isFree: true }), createParams());

    expect(db.section.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { isFree: true },
      })
    );
  });

  it('updates isPublished boolean', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.update as jest.Mock).mockResolvedValue({
      id: 'section-1',
      isPublished: true,
    });

    await PATCH(createRequest('PATCH', { isPublished: true }), createParams());

    expect(db.section.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { isPublished: true },
      })
    );
  });

  it('updates learningObjectives', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.update as jest.Mock).mockResolvedValue({ id: 'section-1' });

    await PATCH(
      createRequest('PATCH', { learningObjectives: 'Learn X, Y, Z' }),
      createParams()
    );

    expect(db.section.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { learningObjectives: 'Learn X, Y, Z' },
      })
    );
  });

  it('updates creatorGuidelines', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.update as jest.Mock).mockResolvedValue({ id: 'section-1' });

    await PATCH(
      createRequest('PATCH', { creatorGuidelines: 'Follow these rules' }),
      createParams()
    );

    expect(db.section.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { creatorGuidelines: 'Follow these rules' },
      })
    );
  });

  it('updates completionStatus', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.update as jest.Mock).mockResolvedValue({ id: 'section-1' });

    await PATCH(
      createRequest('PATCH', { completionStatus: 'COMPLETED' }),
      createParams()
    );

    expect(db.section.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { completionStatus: 'COMPLETED' },
      })
    );
  });

  it('updates resourceUrls', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.update as jest.Mock).mockResolvedValue({ id: 'section-1' });

    await PATCH(
      createRequest('PATCH', { resourceUrls: 'http://example.com/resource' }),
      createParams()
    );

    expect(db.section.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { resourceUrls: 'http://example.com/resource' },
      })
    );
  });

  // -- Video URL edge cases --

  it('converts empty string videoUrl to null', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.update as jest.Mock).mockResolvedValue({ id: 'section-1', videoUrl: null });

    await PATCH(createRequest('PATCH', { videoUrl: '' }), createParams());

    expect(db.section.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { videoUrl: null },
      })
    );
  });

  it('passes valid videoUrl through', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.update as jest.Mock).mockResolvedValue({ id: 'section-1' });

    await PATCH(
      createRequest('PATCH', { videoUrl: 'https://example.com/video.mp4' }),
      createParams()
    );

    expect(db.section.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { videoUrl: 'https://example.com/video.mp4' },
      })
    );
  });

  it('allows nullable videoUrl', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.update as jest.Mock).mockResolvedValue({ id: 'section-1' });

    await PATCH(
      createRequest('PATCH', { videoUrl: null }),
      createParams()
    );

    expect(db.section.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { videoUrl: null },
      })
    );
  });

  // -- Duration and estimatedDuration alias --

  it('uses direct duration when provided', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.update as jest.Mock).mockResolvedValue({ id: 'section-1' });

    await PATCH(createRequest('PATCH', { duration: 30 }), createParams());

    expect(db.section.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { duration: 30 },
      })
    );
  });

  it('maps numeric estimatedDuration to duration when duration is not provided', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.update as jest.Mock).mockResolvedValue({ id: 'section-1' });

    await PATCH(
      createRequest('PATCH', { estimatedDuration: 45 }),
      createParams()
    );

    expect(db.section.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { duration: 45 },
      })
    );
  });

  it('maps string estimatedDuration (e.g. "20 minutes") to integer duration', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.update as jest.Mock).mockResolvedValue({ id: 'section-1' });

    await PATCH(
      createRequest('PATCH', { estimatedDuration: '20 minutes' }),
      createParams()
    );

    expect(db.section.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { duration: 20 },
      })
    );
  });

  it('prefers direct duration over estimatedDuration when both are provided', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.update as jest.Mock).mockResolvedValue({ id: 'section-1' });

    await PATCH(
      createRequest('PATCH', { duration: 10, estimatedDuration: '30 minutes' }),
      createParams()
    );

    expect(db.section.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ duration: 10 }),
      })
    );
  });

  it('does not set duration when estimatedDuration string has no digits', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.update as jest.Mock).mockResolvedValue({ id: 'section-1' });

    await PATCH(
      createRequest('PATCH', { estimatedDuration: 'unknown' }),
      createParams()
    );

    const updateCall = (db.section.update as jest.Mock).mock.calls[0][0];
    expect(updateCall.data).not.toHaveProperty('duration');
  });

  // -- Type and contentType alias --

  it('uses direct type when provided', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.update as jest.Mock).mockResolvedValue({ id: 'section-1' });

    await PATCH(createRequest('PATCH', { type: 'video' }), createParams());

    expect(db.section.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { type: 'video' },
      })
    );
  });

  it('maps contentType to type when type is not provided', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.update as jest.Mock).mockResolvedValue({ id: 'section-1' });

    await PATCH(
      createRequest('PATCH', { contentType: 'quiz' }),
      createParams()
    );

    expect(db.section.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { type: 'quiz' },
      })
    );
  });

  it('prefers direct type over contentType when both are provided', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.update as jest.Mock).mockResolvedValue({ id: 'section-1' });

    await PATCH(
      createRequest('PATCH', { type: 'video', contentType: 'quiz' }),
      createParams()
    );

    expect(db.section.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: 'video' }),
      })
    );
  });

  // -- Multiple fields at once --

  it('updates multiple fields at once', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.update as jest.Mock).mockResolvedValue({
      id: 'section-1',
      title: 'Multi',
      isPublished: true,
      isFree: true,
      position: 3,
    });

    await PATCH(
      createRequest('PATCH', {
        title: 'Multi',
        isPublished: true,
        isFree: true,
        position: 3,
      }),
      createParams()
    );

    expect(db.section.update).toHaveBeenCalledWith({
      where: { id: 'section-1', chapterId: 'chapter-1' },
      data: {
        title: 'Multi',
        isPublished: true,
        isFree: true,
        position: 3,
      },
    });
  });

  // -- Uses correct params --

  it('uses sectionId and chapterId from route params for the update query', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.update as jest.Mock).mockResolvedValue({ id: 'sec-99' });

    await PATCH(
      createRequest('PATCH', { title: 'T' }),
      createParams('course-1', 'ch-99', 'sec-99')
    );

    expect(db.section.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'sec-99', chapterId: 'ch-99' },
      })
    );
  });

  // -- Memory reindex --

  it('queues a memory reindex after successful update', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.update as jest.Mock).mockResolvedValue({ id: 'section-1' });

    await PATCH(
      createRequest('PATCH', { title: 'Reindex Me' }),
      createParams('course-X', 'ch-Y', 'sec-Z')
    );

    expect(mockQueueReindex).toHaveBeenCalledWith('sec-Z', 'course-X', 'update');
  });

  it('does not fail when reindex queue errors (caught silently)', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.update as jest.Mock).mockResolvedValue({ id: 'section-1' });
    mockQueueReindex.mockRejectedValue(new Error('Queue failed'));

    const res = await PATCH(
      createRequest('PATCH', { title: 'Still OK' }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  // -- Response format --

  it('returns standard API response format with metadata', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.update as jest.Mock).mockResolvedValue({ id: 'section-1', title: 'X' });

    const res = await PATCH(
      createRequest('PATCH', { title: 'X' }),
      createParams()
    );
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.metadata).toBeDefined();
    expect(body.metadata.version).toBe('1.0.0');
    expect(body.metadata.timestamp).toBeDefined();
    expect(body.metadata.requestId).toBeDefined();
  });

  // -- Internal errors --

  it('returns 500 on unexpected database error during update', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.update as jest.Mock).mockRejectedValue(new Error('DB crash'));

    const res = await PATCH(
      createRequest('PATCH', { title: 'Fail' }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toContain('updating the section');
  });

  // -- Does not include undefined fields in updateData --

  it('sends only provided fields to db.section.update', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.update as jest.Mock).mockResolvedValue({ id: 'section-1' });

    await PATCH(
      createRequest('PATCH', { isFree: false }),
      createParams()
    );

    const updateCall = (db.section.update as jest.Mock).mock.calls[0][0];
    expect(Object.keys(updateCall.data)).toEqual(['isFree']);
  });

  // -- isPreview field --

  it('updates isPreview boolean', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.update as jest.Mock).mockResolvedValue({ id: 'section-1' });

    await PATCH(
      createRequest('PATCH', { isPreview: true }),
      createParams()
    );

    expect(db.section.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { isPreview: true },
      })
    );
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]
// ---------------------------------------------------------------------------

describe('DELETE /api/courses/[courseId]/chapters/[chapterId]/sections/[sectionId]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const res = await DELETE(createRequest('DELETE'), createParams());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
    expect(body.error.message).toBe('Authentication required');
  });

  it('returns 401 when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} });

    const res = await DELETE(createRequest('DELETE'), createParams());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 when the user does not own the course', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await DELETE(createRequest('DELETE'), createParams());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
    expect(body.error.message).toContain('permission');
  });

  it('verifies course ownership using courseId and userId from session', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.delete as jest.Mock).mockResolvedValue({ id: 'section-1' });

    await DELETE(createRequest('DELETE'), createParams('crs-77', 'ch-88', 'sec-99'));

    expect(db.course.findUnique).toHaveBeenCalledWith({
      where: { id: 'crs-77', userId: 'user-1' },
    });
  });

  it('deletes the section by sectionId and chapterId', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    const deleted = { id: 'sec-99', title: 'Deleted Section' };
    (db.section.delete as jest.Mock).mockResolvedValue(deleted);

    await DELETE(createRequest('DELETE'), createParams('course-1', 'ch-88', 'sec-99'));

    expect(db.section.delete).toHaveBeenCalledWith({
      where: { id: 'sec-99', chapterId: 'ch-88' },
    });
  });

  it('returns deleted section data with standard API response format', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    const deleted = { id: 'section-1', title: 'Deleted', chapterId: 'chapter-1' };
    (db.section.delete as jest.Mock).mockResolvedValue(deleted);

    const res = await DELETE(createRequest('DELETE'), createParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('section-1');
    expect(body.data.title).toBe('Deleted');
    expect(body.metadata).toBeDefined();
    expect(body.metadata.version).toBe('1.0.0');
    expect(body.metadata.timestamp).toBeDefined();
    expect(body.metadata.requestId).toBeDefined();
  });

  it('queues a memory reindex with delete action after successful deletion', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.delete as jest.Mock).mockResolvedValue({ id: 'section-1' });

    await DELETE(
      createRequest('DELETE'),
      createParams('course-A', 'ch-B', 'sec-C')
    );

    expect(mockQueueReindex).toHaveBeenCalledWith('sec-C', 'course-A', 'delete');
  });

  it('does not fail when reindex queue errors (caught silently)', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.delete as jest.Mock).mockResolvedValue({ id: 'section-1' });
    mockQueueReindex.mockRejectedValue(new Error('Queue down'));

    const res = await DELETE(createRequest('DELETE'), createParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('returns 500 on unexpected database error during deletion', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockResolvedValue(MOCK_COURSE);
    (db.section.delete as jest.Mock).mockRejectedValue(new Error('Delete failed'));

    const res = await DELETE(createRequest('DELETE'), createParams());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INTERNAL_ERROR');
    expect(body.error.message).toContain('deleting the section');
  });

  it('returns 500 when course.findUnique throws', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION);
    (db.course.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));

    const res = await DELETE(createRequest('DELETE'), createParams());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
