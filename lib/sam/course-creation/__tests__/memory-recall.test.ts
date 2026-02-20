/**
 * Memory Recall — Runtime Behavior Tests
 *
 * Tests recallCourseCreationMemory(), recallChapterContext(), and
 * buildMemoryRecallBlock() from the memory-recall module.
 *
 * Requires mocking server-only, taxomind-context memory stores, and logger.
 */

// Mock server-only before any imports
jest.mock('server-only', () => ({}));

// Mock taxomind-context memory stores — inline jest.fn() to avoid hoisting issues
const mockFindEntities = jest.fn().mockResolvedValue([]);
const mockCreateEntity = jest.fn();
const mockCreateRelationship = jest.fn();
const mockSessionGet = jest.fn().mockResolvedValue(null);
const mockSessionCreate = jest.fn();
const mockSessionUpdate = jest.fn();

jest.mock('@/lib/sam/taxomind-context', () => ({
  getMemoryStores: jest.fn(() => ({
    knowledgeGraph: {
      createEntity: mockCreateEntity,
      createRelationship: mockCreateRelationship,
      findEntities: mockFindEntities,
    },
    sessionContext: {
      get: mockSessionGet,
      create: mockSessionCreate,
      update: mockSessionUpdate,
    },
  })),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

import {
  recallCourseCreationMemory,
  recallChapterContext,
  buildMemoryRecallBlock,
  RecalledMemory,
  PriorConcept,
  QualityPatterns,
  RelatedConcept,
} from '../memory-recall';
import { getMemoryStores } from '@/lib/sam/taxomind-context';

// ============================================================================
// Fixtures
// ============================================================================

function makeEmptyRecalledMemory(): RecalledMemory {
  return {
    priorConcepts: [],
    qualityPatterns: null,
    relatedConcepts: [],
  };
}

function makePriorConcept(overrides: Partial<PriorConcept> = {}): PriorConcept {
  return {
    concept: 'Variables',
    bloomsLevel: 'REMEMBER',
    courseTitle: 'Intro to Programming',
    ...overrides,
  };
}

function makeQualityPatterns(overrides: Partial<QualityPatterns> = {}): QualityPatterns {
  return {
    averageScore: 72,
    weakDimensions: ['uniqueness', 'depth'],
    ...overrides,
  };
}

function makeKnowledgeGraphEntity(overrides: Record<string, unknown> = {}) {
  return {
    id: 'entity-1',
    name: 'Variables',
    type: 'concept',
    properties: {
      userId: 'user-1',
      courseCategory: 'programming',
      bloomsLevel: 'REMEMBER',
      courseTitle: 'Intro to Programming',
    },
    ...overrides,
  };
}

// ============================================================================
// Tests: recallCourseCreationMemory
// ============================================================================

describe('recallCourseCreationMemory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restore default mock implementations after clearAllMocks
    mockFindEntities.mockResolvedValue([]);
    mockSessionGet.mockResolvedValue(null);
  });

  it('returns empty RecalledMemory when no entities found', async () => {
    mockFindEntities.mockResolvedValue([]);
    mockSessionGet.mockResolvedValue(null);

    const result = await recallCourseCreationMemory('user-1', 'programming', 'Learn JS');

    expect(result.priorConcepts).toEqual([]);
    expect(result.qualityPatterns).toBeNull();
    expect(result.relatedConcepts).toEqual([]);
  });

  it('returns empty RecalledMemory on timeout', async () => {
    // Mock findEntities to hang longer than the 3-second timeout
    mockFindEntities.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 5000)),
    );
    mockSessionGet.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(null), 5000)),
    );

    const result = await recallCourseCreationMemory('user-1', 'programming', 'Learn JS');

    // Should return empty results due to timeout, not throw
    expect(result.priorConcepts).toEqual([]);
    expect(result.qualityPatterns).toBeNull();
    expect(result.relatedConcepts).toEqual([]);
  }, 10000);

  it('first-time user returns empty, not error', async () => {
    mockFindEntities.mockResolvedValue([]);
    mockSessionGet.mockResolvedValue(null);

    const result = await recallCourseCreationMemory('new-user-123', 'data-science', 'ML Basics');

    expect(result).toEqual(makeEmptyRecalledMemory());
  });

  it('returns priorConcepts when matching entities found in KnowledgeGraph', async () => {
    const entities = [
      makeKnowledgeGraphEntity({
        name: 'Variables',
        properties: {
          userId: 'user-1',
          courseCategory: 'programming',
          bloomsLevel: 'REMEMBER',
          courseTitle: 'Intro to Programming',
        },
      }),
      makeKnowledgeGraphEntity({
        id: 'entity-2',
        name: 'Functions',
        properties: {
          userId: 'user-1',
          courseCategory: 'coding',
          bloomsLevel: 'APPLY',
          courseTitle: 'Advanced JS',
        },
      }),
    ];
    mockFindEntities.mockResolvedValue(entities);
    mockSessionGet.mockResolvedValue(null);

    const result = await recallCourseCreationMemory('user-1', 'programming', 'Learn JS');

    expect(result.priorConcepts).toHaveLength(2);
    expect(result.priorConcepts[0]).toEqual({
      concept: 'Variables',
      bloomsLevel: 'REMEMBER',
      courseTitle: 'Intro to Programming',
    });
    expect(result.priorConcepts[1]).toEqual({
      concept: 'Functions',
      bloomsLevel: 'APPLY',
      courseTitle: 'Advanced JS',
    });
  });

  it('filters out entities belonging to a different user', async () => {
    const entities = [
      makeKnowledgeGraphEntity({
        name: 'Variables',
        properties: {
          userId: 'user-1',
          courseCategory: 'programming',
          bloomsLevel: 'REMEMBER',
          courseTitle: 'Intro to Programming',
        },
      }),
      makeKnowledgeGraphEntity({
        id: 'entity-other',
        name: 'Algorithms',
        properties: {
          userId: 'other-user',
          courseCategory: 'programming',
          bloomsLevel: 'ANALYZE',
          courseTitle: 'CS 201',
        },
      }),
    ];
    mockFindEntities.mockResolvedValue(entities);
    mockSessionGet.mockResolvedValue(null);

    const result = await recallCourseCreationMemory('user-1', 'programming', 'Learn JS');

    expect(result.priorConcepts).toHaveLength(1);
    expect(result.priorConcepts[0].concept).toBe('Variables');
  });

  it('returns qualityPatterns when session context has quality data', async () => {
    mockFindEntities.mockResolvedValue([]);
    mockSessionGet.mockResolvedValue({
      insights: {
        stage1Quality: {
          averageScore: 68,
          scores: [
            { uniqueness: 55, specificity: 70, bloomsAlignment: 80, completeness: 75, depth: 50 },
          ],
        },
        stage2Quality: {
          averageScore: 76,
          scores: [
            { uniqueness: 60, specificity: 80, bloomsAlignment: 85, completeness: 80, depth: 60 },
          ],
        },
      },
    });

    const result = await recallCourseCreationMemory('user-1', 'programming', 'Learn JS');

    expect(result.qualityPatterns).not.toBeNull();
    expect(result.qualityPatterns!.averageScore).toBe(72);
    // uniqueness average = (55+60)/2 = 57.5 < 65, depth average = (50+60)/2 = 55 < 65
    expect(result.qualityPatterns!.weakDimensions).toContain('uniqueness');
    expect(result.qualityPatterns!.weakDimensions).toContain('depth');
  });
});

// ============================================================================
// Tests: recallChapterContext
// ============================================================================

describe('recallChapterContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindEntities.mockResolvedValue([]);
  });

  it('returns empty array when no related concepts', async () => {
    mockFindEntities.mockResolvedValue([]);

    const result = await recallChapterContext('user-1', 'course-1', ['loops', 'arrays']);

    expect(result).toEqual([]);
  });

  it('returns RelatedConcept[] when knowledge graph has matching concepts', async () => {
    mockFindEntities.mockImplementation(async (_type: string, _query: string) => {
      return [
        {
          id: 'e-1',
          name: 'For Loops',
          type: 'concept',
          properties: {
            userId: 'user-1',
            courseId: 'other-course',
          },
        },
      ];
    });

    const result = await recallChapterContext('user-1', 'course-1', ['loops']);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toEqual(
      expect.objectContaining({
        name: 'For Loops',
        relationship: 'relates_to',
      }),
    );
  });

  it('excludes concepts from the same course', async () => {
    mockFindEntities.mockResolvedValue([
      {
        id: 'e-same',
        name: 'Same Course Concept',
        type: 'concept',
        properties: {
          userId: 'user-1',
          courseId: 'course-1', // Same courseId — should be excluded
        },
      },
    ]);

    const result = await recallChapterContext('user-1', 'course-1', ['topic']);

    expect(result).toEqual([]);
  });

  it('returns empty array on timeout', async () => {
    mockFindEntities.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 5000)),
    );

    const result = await recallChapterContext('user-1', 'course-1', ['loops']);

    expect(result).toEqual([]);
  }, 10000);
});

// ============================================================================
// Tests: buildMemoryRecallBlock
// ============================================================================

describe('buildMemoryRecallBlock', () => {
  it('returns empty string for empty RecalledMemory', () => {
    const result = buildMemoryRecallBlock(makeEmptyRecalledMemory());

    expect(result).toBe('');
  });

  it('returns markdown block with prior concepts section when priorConcepts present', () => {
    const memory: RecalledMemory = {
      priorConcepts: [
        makePriorConcept({ concept: 'Variables', bloomsLevel: 'REMEMBER', courseTitle: 'JS Basics' }),
        makePriorConcept({ concept: 'Functions', bloomsLevel: 'APPLY', courseTitle: 'JS Basics' }),
      ],
      qualityPatterns: null,
      relatedConcepts: [],
    };

    const result = buildMemoryRecallBlock(memory);

    expect(result).toContain('## MEMORY RECALL');
    expect(result).toContain('### Previously Taught Concepts:');
    expect(result).toContain('**JS Basics**');
    expect(result).toContain('Variables (REMEMBER)');
    expect(result).toContain('Functions (APPLY)');
    expect(result).toContain('Cross-reference');
  });

  it('returns markdown block with quality patterns when qualityPatterns present', () => {
    const memory: RecalledMemory = {
      priorConcepts: [],
      qualityPatterns: makeQualityPatterns({
        averageScore: 65,
        weakDimensions: ['specificity', 'depth'],
      }),
      relatedConcepts: [],
    };

    const result = buildMemoryRecallBlock(memory);

    expect(result).toContain('## MEMORY RECALL');
    expect(result).toContain('### Historical Quality Patterns:');
    expect(result).toContain('65/100');
    expect(result).toContain('specificity');
    expect(result).toContain('depth');
    expect(result).toContain('Pay extra attention');
  });

  it('returns markdown block with related concepts when relatedConcepts present', () => {
    const memory: RecalledMemory = {
      priorConcepts: [],
      qualityPatterns: null,
      relatedConcepts: [
        { name: 'Closures', relationship: 'relates_to' },
        { name: 'Scope', relationship: 'prerequisite' },
      ],
    };

    const result = buildMemoryRecallBlock(memory);

    expect(result).toContain('## MEMORY RECALL');
    expect(result).toContain('### Related Concepts in Knowledge Graph:');
    expect(result).toContain('Closures (relates_to)');
    expect(result).toContain('Scope (prerequisite)');
  });

  it('returns all sections when all memory fields are populated', () => {
    const memory: RecalledMemory = {
      priorConcepts: [makePriorConcept()],
      qualityPatterns: makeQualityPatterns(),
      relatedConcepts: [{ name: 'Closures', relationship: 'relates_to' }],
    };

    const result = buildMemoryRecallBlock(memory);

    expect(result).toContain('### Previously Taught Concepts:');
    expect(result).toContain('### Historical Quality Patterns:');
    expect(result).toContain('### Related Concepts in Knowledge Graph:');
  });

  it('groups prior concepts by courseTitle', () => {
    const memory: RecalledMemory = {
      priorConcepts: [
        makePriorConcept({ concept: 'Variables', courseTitle: 'Course A' }),
        makePriorConcept({ concept: 'Loops', courseTitle: 'Course B' }),
        makePriorConcept({ concept: 'Functions', courseTitle: 'Course A' }),
      ],
      qualityPatterns: null,
      relatedConcepts: [],
    };

    const result = buildMemoryRecallBlock(memory);

    // Course A should list Variables and Functions together
    expect(result).toContain('**Course A**: Variables (REMEMBER), Functions (REMEMBER)');
    expect(result).toContain('**Course B**: Loops (REMEMBER)');
  });

  it('omits weak dimensions line when weakDimensions array is empty', () => {
    const memory: RecalledMemory = {
      priorConcepts: [],
      qualityPatterns: makeQualityPatterns({ weakDimensions: [] }),
      relatedConcepts: [],
    };

    const result = buildMemoryRecallBlock(memory);

    expect(result).toContain('### Historical Quality Patterns:');
    expect(result).not.toContain('Pay extra attention');
  });
});
