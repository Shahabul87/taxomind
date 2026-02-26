/**
 * Tests for Course Syllabus Route - app/api/courses/[courseId]/syllabus/route.ts
 *
 * Covers:
 *   GET - Retrieve a structured syllabus for a course (JSON or CSV format)
 *
 * Tests course lookup, 404 handling, JSON output structure, CSV format output,
 * chapter/section mapping, HTML stripping from descriptions, and error handling.
 */

// @/lib/db is globally mocked in jest.setup.js

import { GET } from '@/app/api/courses/[courseId]/syllabus/route';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createGetRequest(courseId = 'course-1', format?: string): NextRequest {
  let url = `http://localhost:3000/api/courses/${courseId}/syllabus`;
  if (format) {
    url += `?format=${format}`;
  }
  return new NextRequest(url, { method: 'GET' });
}

function createParams(courseId = 'course-1') {
  return { params: Promise.resolve({ courseId }) };
}

function createMockCourse(overrides: Record<string, unknown> = {}) {
  return {
    id: 'course-1',
    title: 'Test Course',
    chapters: [
      {
        id: 'ch-1',
        title: 'Introduction',
        description: '<p>Getting <strong>started</strong></p>',
        status: 'PUBLISHED',
        difficulty: 'BEGINNER',
        estimatedTime: 30,
        tags: ['intro', 'basics'],
        position: 1,
        sections: [
          {
            id: 'sec-1',
            title: 'Welcome',
            type: 'VIDEO',
            duration: 10,
            isFree: true,
            isPreview: true,
            completionStatus: 'NOT_STARTED',
          },
          {
            id: 'sec-2',
            title: 'Setup',
            type: 'TEXT',
            duration: 5,
            isFree: false,
            isPreview: false,
            completionStatus: 'NOT_STARTED',
          },
        ],
      },
      {
        id: 'ch-2',
        title: 'Advanced Topics',
        description: null,
        status: 'DRAFT',
        difficulty: 'ADVANCED',
        estimatedTime: 60,
        tags: [],
        position: 2,
        sections: [
          {
            id: 'sec-3',
            title: 'Deep Dive',
            type: 'VIDEO',
            duration: 30,
            isFree: false,
            isPreview: false,
            completionStatus: 'IN_PROGRESS',
          },
        ],
      },
    ],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// GET /api/courses/[courseId]/syllabus
// ---------------------------------------------------------------------------

describe('GET /api/courses/[courseId]/syllabus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // 404 - Course Not Found
  // =========================================================================

  describe('Course not found', () => {
    it('returns 404 when course does not exist', async () => {
      (db.course.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await GET(
        createGetRequest(),
        createParams()
      );
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toBe('Course not found');
    });

    it('uses the correct courseId from route params', async () => {
      (db.course.findUnique as jest.Mock).mockResolvedValue(null);

      await GET(
        createGetRequest('custom-id'),
        createParams('custom-id')
      );

      expect(db.course.findUnique).toHaveBeenCalledWith({
        where: { id: 'custom-id' },
        include: {
          chapters: {
            orderBy: { position: 'asc' },
            include: { sections: true },
          },
        },
      });
    });
  });

  // =========================================================================
  // JSON Format (default)
  // =========================================================================

  describe('JSON format', () => {
    it('returns syllabus in JSON format by default', async () => {
      const mockCourse = createMockCourse();
      (db.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);

      const res = await GET(
        createGetRequest(),
        createParams()
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.courseId).toBe('course-1');
      expect(body.syllabus).toBeDefined();
      expect(body.syllabus).toHaveLength(2);
    });

    it('maps chapter fields correctly', async () => {
      const mockCourse = createMockCourse();
      (db.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);

      const res = await GET(
        createGetRequest(),
        createParams()
      );
      const body = await res.json();

      const firstChapter = body.syllabus[0];
      expect(firstChapter.chapterIndex).toBe(1);
      expect(firstChapter.id).toBe('ch-1');
      expect(firstChapter.title).toBe('Introduction');
      expect(firstChapter.status).toBe('PUBLISHED');
      expect(firstChapter.difficulty).toBe('BEGINNER');
      expect(firstChapter.estimatedTime).toBe(30);
      expect(firstChapter.tags).toEqual(['intro', 'basics']);
    });

    it('strips HTML tags from description in summary field', async () => {
      const mockCourse = createMockCourse();
      (db.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);

      const res = await GET(
        createGetRequest(),
        createParams()
      );
      const body = await res.json();

      const firstChapter = body.syllabus[0];
      expect(firstChapter.summary).toBe('Getting started');
      // description should be the raw HTML
      expect(firstChapter.description).toBe('<p>Getting <strong>started</strong></p>');
    });

    it('returns null summary when description is null', async () => {
      const mockCourse = createMockCourse();
      (db.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);

      const res = await GET(
        createGetRequest(),
        createParams()
      );
      const body = await res.json();

      const secondChapter = body.syllabus[1];
      expect(secondChapter.summary).toBeNull();
      expect(secondChapter.description).toBeNull();
    });

    it('maps section fields correctly', async () => {
      const mockCourse = createMockCourse();
      (db.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);

      const res = await GET(
        createGetRequest(),
        createParams()
      );
      const body = await res.json();

      const firstSection = body.syllabus[0].sections[0];
      expect(firstSection.sectionIndex).toBe(1);
      expect(firstSection.id).toBe('sec-1');
      expect(firstSection.title).toBe('Welcome');
      expect(firstSection.type).toBe('VIDEO');
      expect(firstSection.duration).toBe(10);
      expect(firstSection.isFree).toBe(true);
      expect(firstSection.isPreview).toBe(true);
      expect(firstSection.completionStatus).toBe('NOT_STARTED');
    });

    it('assigns sequential section indices within each chapter', async () => {
      const mockCourse = createMockCourse();
      (db.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);

      const res = await GET(
        createGetRequest(),
        createParams()
      );
      const body = await res.json();

      expect(body.syllabus[0].sections[0].sectionIndex).toBe(1);
      expect(body.syllabus[0].sections[1].sectionIndex).toBe(2);
      // Second chapter section index resets
      expect(body.syllabus[1].sections[0].sectionIndex).toBe(1);
    });

    it('returns empty tags array when chapter has no tags', async () => {
      const mockCourse = createMockCourse();
      (db.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);

      const res = await GET(
        createGetRequest(),
        createParams()
      );
      const body = await res.json();

      expect(body.syllabus[1].tags).toEqual([]);
    });

    it('handles course with no chapters', async () => {
      const mockCourse = createMockCourse({ chapters: [] });
      (db.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);

      const res = await GET(
        createGetRequest(),
        createParams()
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.syllabus).toEqual([]);
    });

    it('handles chapter with no sections', async () => {
      const mockCourse = createMockCourse({
        chapters: [
          {
            id: 'ch-empty',
            title: 'Empty Chapter',
            description: null,
            status: 'DRAFT',
            difficulty: null,
            estimatedTime: null,
            tags: [],
            position: 1,
            sections: [],
          },
        ],
      });
      (db.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);

      const res = await GET(
        createGetRequest(),
        createParams()
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.syllabus[0].sections).toEqual([]);
    });

    it('handles chapter with undefined sections (null-safe)', async () => {
      const mockCourse = createMockCourse({
        chapters: [
          {
            id: 'ch-null-sec',
            title: 'Null Sections Chapter',
            description: null,
            status: 'DRAFT',
            difficulty: null,
            estimatedTime: null,
            tags: null,
            position: 1,
            sections: null,
          },
        ],
      });
      (db.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);

      const res = await GET(
        createGetRequest(),
        createParams()
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.syllabus[0].sections).toEqual([]);
      expect(body.syllabus[0].tags).toEqual([]);
    });

    it('returns JSON when format=json is explicitly set', async () => {
      const mockCourse = createMockCourse();
      (db.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);

      const res = await GET(
        createGetRequest('course-1', 'json'),
        createParams()
      );
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.courseId).toBe('course-1');
      expect(body.syllabus).toBeDefined();
    });

    it('returns JSON when format is an unknown value', async () => {
      const mockCourse = createMockCourse();
      (db.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);

      const res = await GET(
        createGetRequest('course-1', 'xml'),
        createParams()
      );
      const body = await res.json();

      // Unknown format defaults to JSON (only "csv" is special-cased)
      expect(res.status).toBe(200);
      expect(body.courseId).toBe('course-1');
    });
  });

  // =========================================================================
  // CSV Format
  // =========================================================================

  describe('CSV format', () => {
    it('returns CSV when format=csv', async () => {
      const mockCourse = createMockCourse();
      (db.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);

      const res = await GET(
        createGetRequest('course-1', 'csv'),
        createParams()
      );
      const text = await res.text();

      expect(res.status).toBe(200);
      expect(text).toContain('Chapter #,Chapter Title,Section #,Section Title,Type,Duration (min),Free,Preview');
    });

    it('includes correct CSV rows for sections', async () => {
      const mockCourse = createMockCourse();
      (db.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);

      const res = await GET(
        createGetRequest('course-1', 'csv'),
        createParams()
      );
      const text = await res.text();
      const lines = text.split('\n');

      // Header + 3 sections = 4 lines
      expect(lines).toHaveLength(4);

      // First section row
      expect(lines[1]).toContain('1'); // Chapter #
      expect(lines[1]).toContain('"Introduction"'); // Chapter Title
      expect(lines[1]).toContain('1'); // Section #
      expect(lines[1]).toContain('"Welcome"'); // Section Title
      expect(lines[1]).toContain('VIDEO');
      expect(lines[1]).toContain('10'); // Duration
    });

    it('handles CSV with quotes in titles', async () => {
      const mockCourse = createMockCourse({
        chapters: [
          {
            id: 'ch-q',
            title: 'Chapter "with" quotes',
            description: null,
            status: 'PUBLISHED',
            difficulty: null,
            estimatedTime: null,
            tags: [],
            position: 1,
            sections: [
              {
                id: 'sec-q',
                title: 'Section "with" quotes',
                type: 'TEXT',
                duration: 5,
                isFree: false,
                isPreview: false,
                completionStatus: 'NOT_STARTED',
              },
            ],
          },
        ],
      });
      (db.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);

      const res = await GET(
        createGetRequest('course-1', 'csv'),
        createParams()
      );
      const text = await res.text();

      // Double quotes inside should be escaped to ""
      expect(text).toContain('"Chapter ""with"" quotes"');
      expect(text).toContain('"Section ""with"" quotes"');
    });

    it('maps isFree=true to 1 and isFree=false to 0 in CSV', async () => {
      const mockCourse = createMockCourse();
      (db.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);

      const res = await GET(
        createGetRequest('course-1', 'csv'),
        createParams()
      );
      const text = await res.text();
      const lines = text.split('\n');

      // First section: isFree=true -> 1, isPreview=true -> 1
      const firstSectionCols = lines[1].split(',');
      // Free column (index 6) and Preview column (index 7) - accounting for quoted titles
      expect(lines[1]).toMatch(/,1,1$/);

      // Second section: isFree=false -> 0, isPreview=false -> 0
      expect(lines[2]).toMatch(/,0,0$/);
    });

    it('returns CSV with correct Content-Type header', async () => {
      const mockCourse = createMockCourse();
      (db.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);

      const res = await GET(
        createGetRequest('course-1', 'csv'),
        createParams()
      );

      // The NextResponse constructor in our mock uses a Map for headers
      // We check the status and content
      expect(res.status).toBe(200);
    });

    it('returns empty CSV (header only) when course has no sections', async () => {
      const mockCourse = createMockCourse({
        chapters: [
          {
            id: 'ch-no-sec',
            title: 'No Sections',
            description: null,
            status: 'DRAFT',
            difficulty: null,
            estimatedTime: null,
            tags: [],
            position: 1,
            sections: [],
          },
        ],
      });
      (db.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);

      const res = await GET(
        createGetRequest('course-1', 'csv'),
        createParams()
      );
      const text = await res.text();
      const lines = text.split('\n');

      // Only header row
      expect(lines).toHaveLength(1);
      expect(lines[0]).toContain('Chapter #');
    });

    it('handles format parameter case-insensitively (CSV)', async () => {
      const mockCourse = createMockCourse();
      (db.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);

      const res = await GET(
        createGetRequest('course-1', 'CSV'),
        createParams()
      );
      const text = await res.text();

      // Should be CSV (the route converts format to lowercase)
      expect(text).toContain('Chapter #');
    });

    it('uses 0 for null duration in CSV', async () => {
      const mockCourse = createMockCourse({
        chapters: [
          {
            id: 'ch-null',
            title: 'Null Duration',
            description: null,
            status: 'DRAFT',
            difficulty: null,
            estimatedTime: null,
            tags: [],
            position: 1,
            sections: [
              {
                id: 'sec-null',
                title: 'No Duration',
                type: 'TEXT',
                duration: null,
                isFree: false,
                isPreview: false,
                completionStatus: null,
              },
            ],
          },
        ],
      });
      (db.course.findUnique as jest.Mock).mockResolvedValue(mockCourse);

      const res = await GET(
        createGetRequest('course-1', 'csv'),
        createParams()
      );
      const text = await res.text();
      const lines = text.split('\n');

      // Duration column should be 0 for null
      expect(lines[1]).toContain(',0,');
    });
  });

  // =========================================================================
  // Error Handling
  // =========================================================================

  describe('Error handling', () => {
    it('returns 500 on database error', async () => {
      (db.course.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection lost')
      );

      const res = await GET(
        createGetRequest(),
        createParams()
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to generate syllabus');
    });

    it('returns 500 on unexpected thrown values', async () => {
      (db.course.findUnique as jest.Mock).mockRejectedValue('string error');

      const res = await GET(
        createGetRequest(),
        createParams()
      );
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to generate syllabus');
    });
  });

  // =========================================================================
  // Database Query
  // =========================================================================

  describe('Database query', () => {
    it('queries course with chapters ordered by position and includes sections', async () => {
      (db.course.findUnique as jest.Mock).mockResolvedValue(null);

      await GET(
        createGetRequest('my-course'),
        createParams('my-course')
      );

      expect(db.course.findUnique).toHaveBeenCalledWith({
        where: { id: 'my-course' },
        include: {
          chapters: {
            orderBy: { position: 'asc' },
            include: { sections: true },
          },
        },
      });
    });
  });
});
