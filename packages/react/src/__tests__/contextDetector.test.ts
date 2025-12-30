/**
 * Context Detector Utility Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createContextDetector,
  contextDetector,
  getCapabilities,
  hasCapability,
} from '../utils/contextDetector';
import type { SAMContext, SAMPageType } from '@sam-ai/core';

// ============================================================================
// TEST FIXTURES
// ============================================================================

function createMockContext(
  pageType: SAMPageType = 'dashboard',
  capabilities: string[] = []
): SAMContext {
  return {
    user: {
      id: 'user-1',
      role: 'student',
      name: 'Test User',
      preferences: {
        learningStyle: 'visual',
        preferredTone: 'encouraging',
        teachingMethod: 'mixed',
      },
      capabilities: [],
    },
    page: {
      type: pageType,
      path: '/test',
      capabilities,
      breadcrumb: [],
    },
    conversation: {
      id: 'conv-1',
      messages: [],
      totalMessages: 0,
      lastMessageAt: null,
    },
    gamification: {
      points: 0,
      level: 1,
      currentStreak: 0,
      badges: [],
      achievements: [],
    },
    ui: {
      isOpen: false,
      isExpanded: false,
      inputFocus: false,
      scrollPosition: 0,
    },
    metadata: {
      version: '1.0.0',
      timestamp: new Date(),
      environment: 'test',
    },
  };
}

// ============================================================================
// createContextDetector TESTS
// ============================================================================

describe('createContextDetector', () => {
  it('should create a context detector', () => {
    const detector = createContextDetector();

    expect(detector).toBeDefined();
    expect(detector.detectFromPath).toBeDefined();
    expect(detector.detectFromDOM).toBeDefined();
    expect(detector.detect).toBeDefined();
  });

  describe('detectFromPath', () => {
    it('should detect dashboard page', () => {
      const detector = createContextDetector();
      const result = detector.detectFromPath('/dashboard');

      expect(result.type).toBe('dashboard');
      expect(result.path).toBe('/dashboard');
    });

    it('should detect settings page', () => {
      const detector = createContextDetector();
      const result = detector.detectFromPath('/settings');

      expect(result.type).toBe('settings');
    });

    it('should detect courses list', () => {
      const detector = createContextDetector();
      const result = detector.detectFromPath('/teacher/courses');

      expect(result.type).toBe('courses-list');
    });

    it('should detect course detail with entity ID', () => {
      const detector = createContextDetector();
      const result = detector.detectFromPath('/teacher/courses/course-123');

      expect(result.type).toBe('course-detail');
      expect(result.entityId).toBe('course-123');
    });

    it('should detect chapter detail with parent entity ID', () => {
      const detector = createContextDetector();
      const result = detector.detectFromPath('/teacher/courses/course-123/chapters/chapter-456');

      expect(result.type).toBe('chapter-detail');
      expect(result.entityId).toBe('chapter-456');
      expect(result.parentEntityId).toBe('course-123');
    });

    it('should detect section detail with all entity IDs', () => {
      const detector = createContextDetector();
      const result = detector.detectFromPath('/teacher/courses/course-123/chapters/chapter-456/section/section-789');

      expect(result.type).toBe('section-detail');
      expect(result.entityId).toBe('section-789');
      expect(result.parentEntityId).toBe('chapter-456');
    });

    it('should detect course create page', () => {
      const detector = createContextDetector();
      const result = detector.detectFromPath('/teacher/create');

      expect(result.type).toBe('course-create');
    });

    it('should detect analytics page', () => {
      const detector = createContextDetector();
      const result = detector.detectFromPath('/teacher/analytics');

      expect(result.type).toBe('analytics');
    });

    it('should detect student course routes', () => {
      const detector = createContextDetector();

      const courseList = detector.detectFromPath('/courses');
      expect(courseList.type).toBe('courses-list');

      const courseDetail = detector.detectFromPath('/courses/course-123');
      expect(courseDetail.type).toBe('course-detail');
      expect(courseDetail.entityId).toBe('course-123');

      const chapterDetail = detector.detectFromPath('/courses/course-123/chapters/chapter-456');
      expect(chapterDetail.type).toBe('chapter-detail');
    });

    it('should return other for unknown paths', () => {
      const detector = createContextDetector();
      const result = detector.detectFromPath('/unknown/path');

      expect(result.type).toBe('other');
    });

    it('should generate breadcrumb from path', () => {
      const detector = createContextDetector();
      const result = detector.detectFromPath('/teacher/courses/course-123');

      expect(result.breadcrumb).toBeDefined();
      expect(result.breadcrumb.length).toBeGreaterThan(0);
      expect(result.breadcrumb).toContain('Teacher');
      expect(result.breadcrumb).toContain('Courses');
    });

    it('should exclude UUIDs from breadcrumb', () => {
      const detector = createContextDetector();
      const result = detector.detectFromPath('/courses/550e8400-e29b-41d4-a716-446655440000');

      // UUID should not be in breadcrumb
      expect(result.breadcrumb).not.toContain('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should include capabilities for page type', () => {
      const detector = createContextDetector();
      const result = detector.detectFromPath('/dashboard');

      expect(result.capabilities).toBeDefined();
      expect(result.capabilities.length).toBeGreaterThan(0);
    });
  });

  describe('custom route patterns', () => {
    it('should use custom route patterns', () => {
      const detector = createContextDetector({
        routePatterns: {
          '/custom/page': 'course-detail' as SAMPageType,
        },
      });

      const result = detector.detectFromPath('/custom/page');
      expect(result.type).toBe('course-detail');
    });

    it('should prioritize custom patterns over defaults', () => {
      const detector = createContextDetector({
        routePatterns: {
          '/dashboard': 'analytics' as SAMPageType,
        },
      });

      const result = detector.detectFromPath('/dashboard');
      expect(result.type).toBe('analytics');
    });
  });

  describe('custom capability mappings', () => {
    it('should use custom capability mappings', () => {
      const detector = createContextDetector({
        capabilityMappings: {
          dashboard: ['custom-capability-1', 'custom-capability-2'],
        },
      });

      const result = detector.detectFromPath('/dashboard');
      expect(result.capabilities).toContain('custom-capability-1');
      expect(result.capabilities).toContain('custom-capability-2');
    });
  });

  describe('detectFromDOM', () => {
    let originalDocument: Document;

    beforeEach(() => {
      originalDocument = document;
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('should detect entity ID from data attribute', () => {
      document.body.innerHTML = '<div data-entity-id="entity-123"></div>';

      const detector = createContextDetector({ detectFromDOM: true });
      const result = detector.detectFromDOM();

      expect(result.entityId).toBe('entity-123');
    });

    it('should detect page type from data attribute', () => {
      document.body.innerHTML = '<div data-page-type="course-detail"></div>';

      const detector = createContextDetector({ detectFromDOM: true });
      const result = detector.detectFromDOM();

      expect(result.type).toBe('course-detail');
    });

    it('should detect from meta tags', () => {
      document.head.innerHTML = `
        <meta name="sam:entity-id" content="meta-entity-123" />
        <meta name="sam:page-type" content="chapter-detail" />
      `;

      const detector = createContextDetector({ detectFromDOM: true });
      const result = detector.detectFromDOM();

      expect(result.entityId).toBe('meta-entity-123');
      expect(result.type).toBe('chapter-detail');
    });

    it('should return empty object when no DOM context found', () => {
      document.body.innerHTML = '';
      document.head.innerHTML = '';

      const detector = createContextDetector({ detectFromDOM: true });
      const result = detector.detectFromDOM();

      expect(result.entityId).toBeUndefined();
      expect(result.type).toBeUndefined();
    });
  });

  describe('detect', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: {
          pathname: '/dashboard',
          search: '',
          hash: '',
        },
      });
    });

    it('should combine URL and DOM detection', () => {
      document.body.innerHTML = '<div data-entity-id="dom-entity-123"></div>';

      const detector = createContextDetector({ detectFromDOM: true });
      const result = detector.detect();

      expect(result.type).toBe('dashboard');
      expect(result.entityId).toBe('dom-entity-123');
    });

    it('should work without DOM detection', () => {
      const detector = createContextDetector({ detectFromDOM: false });
      const result = detector.detect();

      expect(result.type).toBe('dashboard');
      expect(result.entityId).toBeUndefined();
    });
  });
});

// ============================================================================
// getCapabilities TESTS
// ============================================================================

describe('getCapabilities', () => {
  it('should return capabilities for dashboard', () => {
    const caps = getCapabilities('dashboard');

    expect(caps).toBeDefined();
    expect(caps).toContain('analyze-progress');
    expect(caps).toContain('suggest-next-steps');
  });

  it('should return capabilities for course-detail', () => {
    const caps = getCapabilities('course-detail');

    expect(caps).toBeDefined();
    expect(caps).toContain('analyze-course');
    expect(caps).toContain('ask-questions');
  });

  it('should return capabilities for course-create', () => {
    const caps = getCapabilities('course-create');

    expect(caps).toBeDefined();
    expect(caps).toContain('suggest-title');
    expect(caps).toContain('fill-form');
  });

  it('should return capabilities for section-detail', () => {
    const caps = getCapabilities('section-detail');

    expect(caps).toBeDefined();
    expect(caps).toContain('generate-quiz');
    expect(caps).toContain('explain-topic');
  });

  it('should return default capabilities for unknown type', () => {
    const caps = getCapabilities('other');

    expect(caps).toBeDefined();
    expect(caps).toContain('answer-questions');
    expect(caps).toContain('provide-help');
  });
});

// ============================================================================
// hasCapability TESTS
// ============================================================================

describe('hasCapability', () => {
  it('should return true if capability exists', () => {
    const context = createMockContext('dashboard', ['analyze-progress', 'suggest-next-steps']);

    expect(hasCapability(context, 'analyze-progress')).toBe(true);
    expect(hasCapability(context, 'suggest-next-steps')).toBe(true);
  });

  it('should return false if capability does not exist', () => {
    const context = createMockContext('dashboard', ['analyze-progress']);

    expect(hasCapability(context, 'non-existent-capability')).toBe(false);
  });

  it('should return false for empty capabilities', () => {
    const context = createMockContext('dashboard', []);

    expect(hasCapability(context, 'any-capability')).toBe(false);
  });
});

// ============================================================================
// DEFAULT contextDetector TESTS
// ============================================================================

describe('contextDetector (default instance)', () => {
  it('should be pre-created', () => {
    expect(contextDetector).toBeDefined();
    expect(contextDetector.detectFromPath).toBeDefined();
    expect(contextDetector.detect).toBeDefined();
  });

  it('should work with default settings', () => {
    const result = contextDetector.detectFromPath('/dashboard');

    expect(result.type).toBe('dashboard');
    expect(result.capabilities.length).toBeGreaterThan(0);
  });
});
