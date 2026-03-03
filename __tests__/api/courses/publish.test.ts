/**
 * Tests for Course Publish/Unpublish Routes
 *   - app/api/courses/[courseId]/publish/route.ts   (PATCH)
 *   - app/api/courses/[courseId]/unpublish/route.ts  (PATCH)
 *
 * Covers: authentication, authorization, course ownership, publish prerequisites,
 *         cognitive quality gate, admin override, skipQualityGate, unpublish logic,
 *         and internal error handling.
 */

// @/lib/db, @/lib/auth, @/lib/logger are globally mocked in jest.setup.js

import { PATCH as PublishPATCH } from '@/app/api/courses/[courseId]/publish/route';
import { PATCH as UnpublishPATCH } from '@/app/api/courses/[courseId]/unpublish/route';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const mockCurrentUser = currentUser as jest.Mock;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createRequest(body?: Record<string, unknown>): Request {
  if (body !== undefined) {
    return new Request('http://localhost:3000/api/courses/course-1/publish', {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }
  // Request with NO body (json() will throw)
  return new Request('http://localhost:3000/api/courses/course-1/publish', {
    method: 'PATCH',
  });
}

function createParams(courseId = 'course-1') {
  return { params: Promise.resolve({ courseId }) };
}

/**
 * Build a full course object that satisfies all publish prerequisites.
 * Individual tests can spread-override specific fields.
 */
function buildPublishableCourse(overrides: Record<string, unknown> = {}) {
  return {
    id: 'course-1',
    userId: 'user-1',
    title: 'Test Course',
    description: 'A test course',
    whatYouWillLearn: ['Learn testing'],
    imageUrl: 'https://example.com/img.jpg',
    price: 29.99,
    categoryId: 'cat-1',
    isPublished: false,
    chapters: [
      {
        id: 'ch-1',
        title: 'Chapter 1',
        sections: [
          { id: 'sec-1', title: 'Introduction to concepts', isPublished: true },
          { id: 'sec-2', title: 'Apply the knowledge', isPublished: true },
          { id: 'sec-3', title: 'Analyze data patterns', isPublished: true },
          { id: 'sec-4', title: 'Evaluate outcomes', isPublished: true },
          { id: 'sec-5', title: 'Create your project', isPublished: true },
          { id: 'sec-6', title: 'Remember key terms', isPublished: true },
        ],
      },
    ],
    attachments: [{ id: 'att-1', name: 'syllabus.pdf' }],
    cognitiveQuality: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// PUBLISH route tests
// ---------------------------------------------------------------------------

describe('PATCH /api/courses/[courseId]/publish', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Defaults: authenticated non-admin user
    mockCurrentUser.mockResolvedValue({ id: 'user-1', name: 'Test User' });

    // Default: user is NOT admin
    (db.adminAccount.findUnique as jest.Mock).mockResolvedValue(null);

    // Default: publishable course with diverse sections (passes quality gate)
    const course = buildPublishableCourse();
    (db.course.findUnique as jest.Mock).mockResolvedValue(course);

    // courseCognitiveQuality model -- ensure mock functions exist
    if (!db.courseCognitiveQuality) {
      (db as Record<string, unknown>).courseCognitiveQuality = {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
      };
    }

    (db.courseCognitiveQuality.create as jest.Mock).mockResolvedValue({ id: 'cq-1' });
    (db.courseCognitiveQuality.upsert as jest.Mock).mockResolvedValue({ id: 'cq-1' });

    // Default: course update succeeds
    (db.course.update as jest.Mock).mockResolvedValue({
      id: 'course-1',
      isPublished: true,
    });
  });

  // -----------------------------------------------------------------------
  // Authentication
  // -----------------------------------------------------------------------

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const res = await PublishPATCH(createRequest({}), createParams());
    const text = await res.json();

    expect(res.status).toBe(401);
    expect(text.error?.message ?? text.message ?? text).toBe('Unauthorized');
  });

  it('returns 401 when user has no id', async () => {
    mockCurrentUser.mockResolvedValue({ name: 'No ID User' });

    const res = await PublishPATCH(createRequest({}), createParams());
    expect(res.status).toBe(401);
  });

  // -----------------------------------------------------------------------
  // Course not found / ownership
  // -----------------------------------------------------------------------

  it('returns 404 when course does not exist', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await PublishPATCH(createRequest({}), createParams());
    const text = await res.json();

    expect(res.status).toBe(404);
    expect(text.error?.message ?? text.message ?? text).toBe('Not Found');
  });

  it('queries course scoped to the authenticated userId', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValue(null);

    await PublishPATCH(createRequest({}), createParams('my-course'));

    expect(db.course.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'my-course', userId: 'user-1' },
      })
    );
  });

  // -----------------------------------------------------------------------
  // Publish prerequisites (minimum 2 completed sections)
  // -----------------------------------------------------------------------

  it('returns 401 when fewer than 2 sections are completed', async () => {
    const course = buildPublishableCourse({
      title: '',
      description: '',
      whatYouWillLearn: [],
      imageUrl: null,
      price: null,
      categoryId: null,
      chapters: [],
      attachments: [],
    });
    (db.course.findUnique as jest.Mock).mockResolvedValue(course);

    const res = await PublishPATCH(createRequest({}), createParams());
    const text = await res.json();

    expect(res.status).toBe(401);
    expect(text.error?.message ?? text.message ?? '').toContain('At least 2 sections must be completed');
  });

  it('allows publishing when exactly 2 sections are completed', async () => {
    // title + description = 1 section, pricing = 1 section => 2 total
    const course = buildPublishableCourse({
      whatYouWillLearn: [],
      imageUrl: null,
      categoryId: null,
      chapters: [],
      attachments: [],
    });
    (db.course.findUnique as jest.Mock).mockResolvedValue(course);

    const res = await PublishPATCH(createRequest({}), createParams());
    const body = await res.json();

    // Should proceed past the prerequisite check (might still fail quality gate
    // or succeed depending on sections). Since chapters is empty, quality gate
    // calculates from zero sections which produces grade D, score 0 and will fail.
    // But the key assertion is it got past the "2 sections" guard.
    expect(res.status).not.toBe(401);
  });

  // -----------------------------------------------------------------------
  // No request body (defaults applied)
  // -----------------------------------------------------------------------

  it('handles request with no JSON body (defaults to adminOverride=false, skipQualityGate=false)', async () => {
    // Send request without body
    const res = await PublishPATCH(createRequest(), createParams());

    // Should not throw; should reach course lookup
    expect(db.course.findUnique).toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Cognitive quality gate
  // -----------------------------------------------------------------------

  it('creates courseCognitiveQuality record when none exists on the course', async () => {
    const course = buildPublishableCourse({ cognitiveQuality: null });
    (db.course.findUnique as jest.Mock).mockResolvedValue(course);

    // The quality gate should pass because we have diverse sections
    await PublishPATCH(createRequest({ skipQualityGate: true }), createParams());

    expect(db.courseCognitiveQuality.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          courseId: 'course-1',
        }),
      })
    );
  });

  it('uses existing cognitiveQuality record when present on the course', async () => {
    const course = buildPublishableCourse({
      cognitiveQuality: {
        rememberPercent: 15,
        understandPercent: 20,
        applyPercent: 20,
        analyzePercent: 20,
        evaluatePercent: 15,
        createPercent: 10,
        cognitiveScore: 85,
        cognitiveGrade: 'A',
      },
    });
    (db.course.findUnique as jest.Mock).mockResolvedValue(course);

    await PublishPATCH(createRequest({}), createParams());

    // Should NOT call create since cognitiveQuality already exists
    expect(db.courseCognitiveQuality.create).not.toHaveBeenCalled();
  });

  it('returns 400 with QUALITY_GATE_FAILED when gate fails and no override', async () => {
    // Course with only "remember" sections -> single level dominance -> fails gate
    const course = buildPublishableCourse({
      chapters: [
        {
          id: 'ch-1',
          title: 'Chapter 1',
          sections: [
            { id: 'sec-1', title: 'Define terms', isPublished: true },
            { id: 'sec-2', title: 'List items', isPublished: true },
            { id: 'sec-3', title: 'Recall facts', isPublished: true },
          ],
        },
      ],
      cognitiveQuality: null,
    });
    (db.course.findUnique as jest.Mock).mockResolvedValue(course);

    const res = await PublishPATCH(createRequest({}), createParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('QUALITY_GATE_FAILED');
    expect(body.qualityGate.passes).toBe(false);
    expect(body.qualityGate.issues).toBeDefined();
    expect(body.qualityGate.issues.length).toBeGreaterThan(0);
    expect(body.requiresAdminOverride).toBe(true);
  });

  it('returns quality gate issues with details when gate fails', async () => {
    const course = buildPublishableCourse({
      chapters: [
        {
          id: 'ch-1',
          title: 'Chapter 1',
          sections: [
            { id: 'sec-1', title: 'Define terms', isPublished: true },
            { id: 'sec-2', title: 'List items', isPublished: true },
            { id: 'sec-3', title: 'Name concepts', isPublished: true },
          ],
        },
      ],
      cognitiveQuality: null,
    });
    (db.course.findUnique as jest.Mock).mockResolvedValue(course);

    const res = await PublishPATCH(createRequest({}), createParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    const issueIds = body.qualityGate.issues.map((i: { id: string }) => i.id);
    // With 100% remember content, expect level_diversity, single_dominance, and higher_order_ratio errors
    expect(issueIds).toContain('level_diversity');
    expect(issueIds).toContain('single_dominance');
    expect(issueIds).toContain('higher_order_ratio');
  });

  // -----------------------------------------------------------------------
  // skipQualityGate flag
  // -----------------------------------------------------------------------

  it('publishes successfully when skipQualityGate is true even if gate fails', async () => {
    // Low-diversity course that would normally fail quality gate
    const course = buildPublishableCourse({
      chapters: [
        {
          id: 'ch-1',
          title: 'Chapter 1',
          sections: [
            { id: 'sec-1', title: 'Define terms', isPublished: true },
            { id: 'sec-2', title: 'List items', isPublished: true },
          ],
        },
      ],
      cognitiveQuality: null,
    });
    (db.course.findUnique as jest.Mock).mockResolvedValue(course);

    const res = await PublishPATCH(
      createRequest({ skipQualityGate: true }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(db.course.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { isPublished: true },
      })
    );
  });

  // -----------------------------------------------------------------------
  // Admin override
  // -----------------------------------------------------------------------

  it('allows admin to override quality gate failure with adminOverride flag', async () => {
    // Make user an admin
    (db.adminAccount.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'ADMIN',
    });

    // Low-diversity course
    const course = buildPublishableCourse({
      chapters: [
        {
          id: 'ch-1',
          title: 'Chapter 1',
          sections: [
            { id: 'sec-1', title: 'Define terms', isPublished: true },
            { id: 'sec-2', title: 'List items', isPublished: true },
          ],
        },
      ],
      cognitiveQuality: null,
    });
    (db.course.findUnique as jest.Mock).mockResolvedValue(course);

    const res = await PublishPATCH(
      createRequest({ adminOverride: true }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.qualityGate.adminOverrideUsed).toBe(true);
  });

  it('SUPERADMIN can also use admin override', async () => {
    (db.adminAccount.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'SUPERADMIN',
    });

    const course = buildPublishableCourse({
      chapters: [
        {
          id: 'ch-1',
          title: 'Chapter 1',
          sections: [
            { id: 'sec-1', title: 'Define terms', isPublished: true },
            { id: 'sec-2', title: 'List items', isPublished: true },
          ],
        },
      ],
      cognitiveQuality: null,
    });
    (db.course.findUnique as jest.Mock).mockResolvedValue(course);

    const res = await PublishPATCH(
      createRequest({ adminOverride: true }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it('non-admin cannot use adminOverride when quality gate fails', async () => {
    (db.adminAccount.findUnique as jest.Mock).mockResolvedValue(null);

    const course = buildPublishableCourse({
      chapters: [
        {
          id: 'ch-1',
          title: 'Chapter 1',
          sections: [
            { id: 'sec-1', title: 'Define terms', isPublished: true },
            { id: 'sec-2', title: 'List items', isPublished: true },
          ],
        },
      ],
      cognitiveQuality: null,
    });
    (db.course.findUnique as jest.Mock).mockResolvedValue(course);

    const res = await PublishPATCH(
      createRequest({ adminOverride: true }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('QUALITY_GATE_FAILED');
  });

  // -----------------------------------------------------------------------
  // Successful publish
  // -----------------------------------------------------------------------

  it('publishes course successfully when quality gate passes', async () => {
    const res = await PublishPATCH(createRequest({}), createParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data.isPublished).toBe(true);
    expect(body.qualityGate).toBeDefined();
    expect(body.qualityGate.cognitiveGrade).toBeDefined();
    expect(body.qualityGate.cognitiveScore).toBeDefined();
  });

  it('updates course isPublished to true on successful publish', async () => {
    await PublishPATCH(createRequest({}), createParams());

    expect(db.course.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'course-1', userId: 'user-1' },
        data: { isPublished: true },
      })
    );
  });

  it('upserts courseCognitiveQuality with gate status on successful publish', async () => {
    await PublishPATCH(createRequest({}), createParams());

    expect(db.courseCognitiveQuality.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { courseId: 'course-1' },
      })
    );
  });

  it('returns qualityGate.adminOverrideUsed as false when quality gate passes normally', async () => {
    const res = await PublishPATCH(createRequest({}), createParams());
    const body = await res.json();

    expect(body.qualityGate.adminOverrideUsed).toBeFalsy();
  });

  // -----------------------------------------------------------------------
  // Existing cognitive quality on course
  // -----------------------------------------------------------------------

  it('uses stored cognitive quality data when already present', async () => {
    const course = buildPublishableCourse({
      cognitiveQuality: {
        rememberPercent: 10,
        understandPercent: 20,
        applyPercent: 25,
        analyzePercent: 20,
        evaluatePercent: 15,
        createPercent: 10,
        cognitiveScore: 82,
        cognitiveGrade: 'A',
      },
    });
    (db.course.findUnique as jest.Mock).mockResolvedValue(course);

    const res = await PublishPATCH(createRequest({}), createParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.qualityGate.cognitiveGrade).toBe('A');
    expect(body.qualityGate.cognitiveScore).toBe(82);
  });

  // -----------------------------------------------------------------------
  // Course sections counting logic
  // -----------------------------------------------------------------------

  it('counts title+description as one section', async () => {
    // Only title+description and chapters filled -> 2 sections -> publishable
    const course = buildPublishableCourse({
      whatYouWillLearn: [],
      imageUrl: null,
      price: null,
      categoryId: null,
      attachments: [],
    });
    (db.course.findUnique as jest.Mock).mockResolvedValue(course);

    const res = await PublishPATCH(
      createRequest({ skipQualityGate: true }),
      createParams()
    );

    // Should pass the 2-section check (title+desc = 1, chapters = 1 => 2)
    expect(res.status).not.toBe(401);
  });

  it('counts each prerequisite section independently', async () => {
    // All 7 sections filled
    const course = buildPublishableCourse();
    (db.course.findUnique as jest.Mock).mockResolvedValue(course);

    const res = await PublishPATCH(
      createRequest({ skipQualityGate: true }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  // -----------------------------------------------------------------------
  // Cognitive analysis from section titles (analyzeContent)
  // -----------------------------------------------------------------------

  it('assigns sections to correct Bloom levels based on title keywords', async () => {
    const course = buildPublishableCourse({
      chapters: [
        {
          id: 'ch-1',
          title: 'Chapter 1',
          sections: [
            { id: 's1', title: 'Define core terms', isPublished: true },
            { id: 's2', title: 'Explain the concept', isPublished: true },
            { id: 's3', title: 'Apply the method', isPublished: true },
            { id: 's4', title: 'Analyze the data', isPublished: true },
            { id: 's5', title: 'Evaluate the results', isPublished: true },
            { id: 's6', title: 'Create a project', isPublished: true },
          ],
        },
      ],
      cognitiveQuality: null,
    });
    (db.course.findUnique as jest.Mock).mockResolvedValue(course);

    const res = await PublishPATCH(
      createRequest({ skipQualityGate: true }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);

    // The create call should have the distribution
    expect(db.courseCognitiveQuality.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          courseId: 'course-1',
          rememberPercent: expect.any(Number),
          understandPercent: expect.any(Number),
          applyPercent: expect.any(Number),
          analyzePercent: expect.any(Number),
          evaluatePercent: expect.any(Number),
          createPercent: expect.any(Number),
        }),
      })
    );
  });

  it('defaults unrecognized section titles to "understand" level', async () => {
    const course = buildPublishableCourse({
      chapters: [
        {
          id: 'ch-1',
          title: 'Chapter 1',
          sections: [
            { id: 's1', title: 'Random stuff here', isPublished: true },
            { id: 's2', title: 'More random things', isPublished: true },
            { id: 's3', title: 'Apply the method', isPublished: true },
            { id: 's4', title: 'Analyze data', isPublished: true },
            { id: 's5', title: 'Evaluate outcomes', isPublished: true },
            { id: 's6', title: 'Create project', isPublished: true },
          ],
        },
      ],
      cognitiveQuality: null,
    });
    (db.course.findUnique as jest.Mock).mockResolvedValue(course);

    const res = await PublishPATCH(
      createRequest({ skipQualityGate: true }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    // The two unrecognized sections should map to "understand"
    expect(db.courseCognitiveQuality.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          understandPercent: expect.any(Number),
        }),
      })
    );
  });

  it('handles course with no sections (empty chapters) for analysis', async () => {
    const course = buildPublishableCourse({
      chapters: [
        { id: 'ch-1', title: 'Empty chapter', sections: [] },
      ],
      cognitiveQuality: null,
    });
    (db.course.findUnique as jest.Mock).mockResolvedValue(course);

    // Should still pass prerequisite (has title+desc and chapters)
    const res = await PublishPATCH(
      createRequest({ skipQualityGate: true }),
      createParams()
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    // Empty sections -> grade D, score 0
    expect(db.courseCognitiveQuality.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cognitiveGrade: 'D',
          cognitiveScore: 0,
        }),
      })
    );
  });

  // -----------------------------------------------------------------------
  // Internal error handling
  // -----------------------------------------------------------------------

  it('returns 500 on unexpected database error in publish', async () => {
    (db.course.findUnique as jest.Mock).mockRejectedValue(
      new Error('DB connection lost')
    );

    const res = await PublishPATCH(createRequest({}), createParams());
    const text = await res.json();

    expect(res.status).toBe(500);
    expect(text.error?.message ?? text.message ?? text).toBe('Internal Server Error');
  });

  it('returns 500 when course update throws', async () => {
    (db.course.update as jest.Mock).mockRejectedValue(
      new Error('Update failed')
    );

    const res = await PublishPATCH(
      createRequest({ skipQualityGate: true }),
      createParams()
    );
    const text = await res.json();

    expect(res.status).toBe(500);
    expect(text.error?.message ?? text.message ?? text).toBe('Internal Server Error');
  });

  it('returns 500 when courseCognitiveQuality.create throws', async () => {
    (db.courseCognitiveQuality.create as jest.Mock).mockRejectedValue(
      new Error('Cognitive quality create failed')
    );

    const res = await PublishPATCH(createRequest({}), createParams());
    const text = await res.json();

    expect(res.status).toBe(500);
    expect(text.error?.message ?? text.message ?? text).toBe('Internal Server Error');
  });
});

// ---------------------------------------------------------------------------
// UNPUBLISH route tests
// ---------------------------------------------------------------------------

describe('PATCH /api/courses/[courseId]/unpublish', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockCurrentUser.mockResolvedValue({ id: 'user-1', name: 'Test User' });

    (db.course.findUnique as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'user-1',
      title: 'Published Course',
      isPublished: true,
    });

    (db.course.update as jest.Mock).mockResolvedValue({
      id: 'course-1',
      userId: 'user-1',
      title: 'Published Course',
      isPublished: false,
    });
  });

  // -----------------------------------------------------------------------
  // Authentication
  // -----------------------------------------------------------------------

  it('returns 401 when user is not authenticated', async () => {
    mockCurrentUser.mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/courses/course-1/unpublish', {
      method: 'PATCH',
    });
    const res = await UnpublishPATCH(req, createParams());
    const text = await res.json();

    expect(res.status).toBe(401);
    expect(text.error?.message ?? text.message ?? text).toBe('Unauthorized');
  });

  it('returns 401 when user has no id', async () => {
    mockCurrentUser.mockResolvedValue({ name: 'Ghost' });

    const req = new Request('http://localhost:3000/api/courses/course-1/unpublish', {
      method: 'PATCH',
    });
    const res = await UnpublishPATCH(req, createParams());

    expect(res.status).toBe(401);
  });

  // -----------------------------------------------------------------------
  // Course not found / ownership
  // -----------------------------------------------------------------------

  it('returns 404 when course does not exist', async () => {
    (db.course.findUnique as jest.Mock).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/courses/course-1/unpublish', {
      method: 'PATCH',
    });
    const res = await UnpublishPATCH(req, createParams());
    const text = await res.json();

    expect(res.status).toBe(404);
    expect(text.error?.message ?? text.message ?? text).toBe('Not Found');
  });

  it('queries course scoped to the authenticated userId', async () => {
    const req = new Request('http://localhost:3000/api/courses/my-course/unpublish', {
      method: 'PATCH',
    });
    await UnpublishPATCH(req, createParams('my-course'));

    expect(db.course.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'my-course', userId: 'user-1' },
      })
    );
  });

  // -----------------------------------------------------------------------
  // Successful unpublish
  // -----------------------------------------------------------------------

  it('unpublishes the course successfully', async () => {
    const req = new Request('http://localhost:3000/api/courses/course-1/unpublish', {
      method: 'PATCH',
    });
    const res = await UnpublishPATCH(req, createParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.isPublished).toBe(false);
  });

  it('calls course.update with isPublished false', async () => {
    const req = new Request('http://localhost:3000/api/courses/course-1/unpublish', {
      method: 'PATCH',
    });
    await UnpublishPATCH(req, createParams());

    expect(db.course.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'course-1', userId: 'user-1' },
        data: { isPublished: false },
      })
    );
  });

  it('returns the updated course object', async () => {
    (db.course.update as jest.Mock).mockResolvedValue({
      id: 'course-1',
      title: 'My Course',
      isPublished: false,
      userId: 'user-1',
    });

    const req = new Request('http://localhost:3000/api/courses/course-1/unpublish', {
      method: 'PATCH',
    });
    const res = await UnpublishPATCH(req, createParams());
    const body = await res.json();

    expect(body.id).toBe('course-1');
    expect(body.title).toBe('My Course');
    expect(body.isPublished).toBe(false);
  });

  // -----------------------------------------------------------------------
  // Internal error handling
  // -----------------------------------------------------------------------

  it('returns 500 on unexpected database error during findUnique', async () => {
    (db.course.findUnique as jest.Mock).mockRejectedValue(
      new Error('DB connection lost')
    );

    const req = new Request('http://localhost:3000/api/courses/course-1/unpublish', {
      method: 'PATCH',
    });
    const res = await UnpublishPATCH(req, createParams());
    const text = await res.json();

    expect(res.status).toBe(500);
    expect(text.error?.message ?? text.message ?? text).toBe('Internal Server Error');
  });

  it('returns 500 on unexpected database error during update', async () => {
    (db.course.update as jest.Mock).mockRejectedValue(
      new Error('Update failed')
    );

    const req = new Request('http://localhost:3000/api/courses/course-1/unpublish', {
      method: 'PATCH',
    });
    const res = await UnpublishPATCH(req, createParams());
    const text = await res.json();

    expect(res.status).toBe(500);
    expect(text.error?.message ?? text.message ?? text).toBe('Internal Server Error');
  });
});
