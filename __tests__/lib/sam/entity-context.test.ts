/**
 * Tests for lib/sam/entity-context.ts
 *
 * Verifies fetchCourseContext, fetchChapterContext, fetchSectionContext,
 * buildEntityContext, and buildFormSummary.
 */

jest.mock('@/lib/db');

import { db } from '@/lib/db';
import {
  fetchCourseContext,
  fetchChapterContext,
  fetchSectionContext,
  buildEntityContext,
  buildFormSummary,
} from '@/lib/sam/entity-context';

const mockDb = db as jest.Mocked<typeof db>;

describe('entity-context', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchCourseContext', () => {
    it('should fetch and transform course data', async () => {
      (mockDb.course.findUnique as jest.Mock).mockResolvedValue({
        id: 'c1',
        title: 'React Course',
        description: 'Learn React',
        subtitle: 'Intro',
        courseGoals: 'Build apps',
        whatYouWillLearn: ['Hooks', 'State'],
        prerequisites: 'JS',
        difficulty: 'INTERMEDIATE',
        isPublished: true,
        category: { name: 'Web Dev' },
        chapters: [
          { id: 'ch1', title: 'Intro', position: 1, _count: { sections: 3 } },
        ],
      });

      const result = await fetchCourseContext('c1');
      expect(result).not.toBeNull();
      expect(result?.title).toBe('React Course');
      expect(result?.categoryName).toBe('Web Dev');
      expect(result?.chapterCount).toBe(1);
      expect(result?.chapters[0].sectionCount).toBe(3);
    });

    it('should return null when course not found', async () => {
      (mockDb.course.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await fetchCourseContext('nonexistent');
      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      (mockDb.course.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));
      const result = await fetchCourseContext('c1');
      expect(result).toBeNull();
    });
  });

  describe('fetchChapterContext', () => {
    it('should fetch and transform chapter data', async () => {
      (mockDb.chapter.findUnique as jest.Mock).mockResolvedValue({
        id: 'ch1',
        title: 'Intro to Hooks',
        description: 'Learn hooks',
        position: 1,
        course: { id: 'c1', title: 'React Course' },
        sections: [
          { id: 's1', title: 'useState', position: 1, type: 'TEXT' },
        ],
      });

      const result = await fetchChapterContext('ch1');
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Intro to Hooks');
      expect(result?.courseTitle).toBe('React Course');
      expect(result?.sections).toHaveLength(1);
    });

    it('should return null when chapter not found', async () => {
      (mockDb.chapter.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await fetchChapterContext('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('fetchSectionContext', () => {
    it('should fetch and transform section data', async () => {
      (mockDb.section.findUnique as jest.Mock).mockResolvedValue({
        id: 's1',
        title: 'useState',
        description: 'Learn useState hook',
        position: 1,
        videoUrl: null,
        type: 'TEXT',
        chapter: {
          id: 'ch1',
          title: 'Hooks',
          course: { id: 'c1', title: 'React' },
        },
      });

      const result = await fetchSectionContext('s1');
      expect(result).not.toBeNull();
      expect(result?.title).toBe('useState');
      expect(result?.chapterTitle).toBe('Hooks');
      expect(result?.courseTitle).toBe('React');
    });

    it('should return null when section not found', async () => {
      (mockDb.section.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await fetchSectionContext('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('buildEntityContext', () => {
    it('should return none type for unknown page type', async () => {
      const result = await buildEntityContext('unknown-page');
      expect(result.type).toBe('none');
    });

    it('should build course context for course-detail page', async () => {
      (mockDb.course.findUnique as jest.Mock).mockResolvedValue({
        id: 'c1', title: 'Test', description: 'desc', subtitle: null,
        courseGoals: '', whatYouWillLearn: [], prerequisites: null,
        difficulty: 'BEGINNER', isPublished: false,
        category: null, chapters: [],
      });

      const result = await buildEntityContext('course-detail', 'c1');
      expect(result.type).toBe('course');
      expect(result.course).toBeDefined();
    });

    it('should build courses-list context with userId', async () => {
      (mockDb.course.findMany as jest.Mock).mockResolvedValue([]);

      const result = await buildEntityContext('courses-list', undefined, undefined, undefined, 'user-1');
      expect(result.type).toBe('course-list');
    });
  });

  describe('buildFormSummary', () => {
    it('should return no form data message for empty input', () => {
      expect(buildFormSummary(undefined)).toBe('No form data available on this page.');
      expect(buildFormSummary({})).toBe('No form data available on this page.');
    });

    it('should format form fields with values', () => {
      const formData = {
        title: { value: 'My Course', type: 'text', label: 'Course Title' },
        description: { value: '', type: 'text' },
      };
      const summary = buildFormSummary(formData);
      expect(summary).toContain('Course Title');
      expect(summary).toContain('My Course');
      expect(summary).toContain('(empty)');
    });

    it('should use field name as fallback label', () => {
      const formData = {
        category: { value: 'Tech', type: 'select' },
      };
      const summary = buildFormSummary(formData);
      expect(summary).toContain('category');
    });
  });
});
