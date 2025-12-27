/**
 * Golden Test Case Repository
 *
 * Priority 9: Prevent Evaluation Drift
 * Manages golden test cases for regression testing
 */

import type {
  GoldenTestCase,
  TestCategory,
  TestInput,
  TestRubric,
  ExpectedResult,
} from './types';

// ============================================================================
// REPOSITORY INTERFACE
// ============================================================================

/**
 * Golden test case store interface
 */
export interface GoldenTestStore {
  /**
   * Get test case by ID
   */
  get(id: string): Promise<GoldenTestCase | undefined>;

  /**
   * Save test case
   */
  save(testCase: GoldenTestCase): Promise<void>;

  /**
   * Delete test case
   */
  delete(id: string): Promise<boolean>;

  /**
   * List all test cases
   */
  list(): Promise<GoldenTestCase[]>;

  /**
   * List test cases by category
   */
  listByCategory(category: TestCategory): Promise<GoldenTestCase[]>;

  /**
   * List test cases by tags
   */
  listByTags(tags: string[]): Promise<GoldenTestCase[]>;

  /**
   * List active test cases
   */
  listActive(): Promise<GoldenTestCase[]>;

  /**
   * List test cases by priority
   */
  listByPriority(priority: 'low' | 'medium' | 'high' | 'critical'): Promise<GoldenTestCase[]>;

  /**
   * Count test cases
   */
  count(): Promise<number>;
}

// ============================================================================
// IN-MEMORY STORE
// ============================================================================

/**
 * In-memory implementation of GoldenTestStore
 */
export class InMemoryGoldenTestStore implements GoldenTestStore {
  private readonly testCases: Map<string, GoldenTestCase> = new Map();

  async get(id: string): Promise<GoldenTestCase | undefined> {
    return this.testCases.get(id);
  }

  async save(testCase: GoldenTestCase): Promise<void> {
    this.testCases.set(testCase.id, testCase);
  }

  async delete(id: string): Promise<boolean> {
    return this.testCases.delete(id);
  }

  async list(): Promise<GoldenTestCase[]> {
    return Array.from(this.testCases.values());
  }

  async listByCategory(category: TestCategory): Promise<GoldenTestCase[]> {
    const all = await this.list();
    return all.filter((tc) => tc.category === category);
  }

  async listByTags(tags: string[]): Promise<GoldenTestCase[]> {
    const all = await this.list();
    return all.filter((tc) => tags.some((tag) => tc.tags.includes(tag)));
  }

  async listActive(): Promise<GoldenTestCase[]> {
    const all = await this.list();
    return all.filter((tc) => tc.active);
  }

  async listByPriority(
    priority: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<GoldenTestCase[]> {
    const all = await this.list();
    return all.filter((tc) => tc.priority === priority);
  }

  async count(): Promise<number> {
    return this.testCases.size;
  }

  /**
   * Clear all test cases (for testing)
   */
  clear(): void {
    this.testCases.clear();
  }
}

// ============================================================================
// REPOSITORY CONFIGURATION
// ============================================================================

/**
 * Repository configuration
 */
export interface GoldenTestRepositoryConfig {
  /**
   * Test case store
   */
  store?: GoldenTestStore;

  /**
   * Logger
   */
  logger?: GoldenTestRepositoryLogger;

  /**
   * Default tolerance for new test cases
   */
  defaultTolerance?: number;

  /**
   * Default priority for new test cases
   */
  defaultPriority?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Logger interface
 */
export interface GoldenTestRepositoryLogger {
  debug(message: string, data?: Record<string, unknown>): void;
  info(message: string, data?: Record<string, unknown>): void;
  warn(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

/**
 * Default configuration
 */
export const DEFAULT_REPOSITORY_CONFIG: Required<
  Omit<GoldenTestRepositoryConfig, 'store' | 'logger'>
> = {
  defaultTolerance: 5,
  defaultPriority: 'medium',
};

// ============================================================================
// TEST CASE BUILDER
// ============================================================================

/**
 * Builder for creating golden test cases
 */
export class GoldenTestCaseBuilder {
  private testCase: Partial<GoldenTestCase>;
  private idCounter: number = 0;

  constructor() {
    this.testCase = {
      tags: [],
      active: true,
      createdAt: new Date(),
    };
  }

  /**
   * Set test case ID
   */
  withId(id: string): this {
    this.testCase.id = id;
    return this;
  }

  /**
   * Set test case name
   */
  withName(name: string): this {
    this.testCase.name = name;
    return this;
  }

  /**
   * Set test category
   */
  withCategory(category: TestCategory): this {
    this.testCase.category = category;
    return this;
  }

  /**
   * Set test input
   */
  withInput(input: TestInput): this {
    this.testCase.input = input;
    return this;
  }

  /**
   * Set expected result
   */
  withExpected(expected: ExpectedResult): this {
    this.testCase.expected = expected;
    return this;
  }

  /**
   * Set tolerance
   */
  withTolerance(tolerance: number): this {
    this.testCase.tolerance = tolerance;
    return this;
  }

  /**
   * Set priority
   */
  withPriority(priority: 'low' | 'medium' | 'high' | 'critical'): this {
    this.testCase.priority = priority;
    return this;
  }

  /**
   * Add tags
   */
  withTags(tags: string[]): this {
    this.testCase.tags = tags;
    return this;
  }

  /**
   * Set notes
   */
  withNotes(notes: string): this {
    this.testCase.notes = notes;
    return this;
  }

  /**
   * Set active status
   */
  setActive(active: boolean): this {
    this.testCase.active = active;
    return this;
  }

  /**
   * Build the test case
   */
  build(): GoldenTestCase {
    if (!this.testCase.id) {
      this.testCase.id = `test-${++this.idCounter}-${Date.now().toString(36)}`;
    }
    if (!this.testCase.name) {
      throw new Error('Test case name is required');
    }
    if (!this.testCase.category) {
      throw new Error('Test case category is required');
    }
    if (!this.testCase.input) {
      throw new Error('Test case input is required');
    }
    if (!this.testCase.expected) {
      throw new Error('Test case expected result is required');
    }
    if (this.testCase.tolerance === undefined) {
      this.testCase.tolerance = 5;
    }
    if (!this.testCase.priority) {
      this.testCase.priority = 'medium';
    }

    return this.testCase as GoldenTestCase;
  }

  /**
   * Reset the builder
   */
  reset(): this {
    this.testCase = {
      tags: [],
      active: true,
      createdAt: new Date(),
    };
    return this;
  }
}

// ============================================================================
// GOLDEN TEST REPOSITORY
// ============================================================================

/**
 * Golden Test Repository
 * Manages golden test cases for regression testing
 */
export class GoldenTestRepository {
  private readonly store: GoldenTestStore;
  private readonly logger?: GoldenTestRepositoryLogger;
  private readonly config: Required<Omit<GoldenTestRepositoryConfig, 'store' | 'logger'>>;
  private idCounter: number = 0;

  constructor(config: GoldenTestRepositoryConfig = {}) {
    this.store = config.store ?? new InMemoryGoldenTestStore();
    this.logger = config.logger;
    this.config = { ...DEFAULT_REPOSITORY_CONFIG, ...config };
  }

  // ==========================================================================
  // TEST CASE MANAGEMENT
  // ==========================================================================

  /**
   * Create a new golden test case
   */
  async createTestCase(
    name: string,
    category: TestCategory,
    input: TestInput,
    expected: ExpectedResult,
    options?: {
      tolerance?: number;
      priority?: 'low' | 'medium' | 'high' | 'critical';
      tags?: string[];
      notes?: string;
    }
  ): Promise<GoldenTestCase> {
    const testCase: GoldenTestCase = {
      id: this.generateId(),
      name,
      category,
      input,
      expected,
      tolerance: options?.tolerance ?? this.config.defaultTolerance,
      priority: options?.priority ?? this.config.defaultPriority,
      tags: options?.tags ?? [],
      createdAt: new Date(),
      active: true,
      notes: options?.notes,
    };

    await this.store.save(testCase);

    this.logger?.info('Created golden test case', {
      id: testCase.id,
      name,
      category,
      priority: testCase.priority,
    });

    return testCase;
  }

  /**
   * Get test case by ID
   */
  async getTestCase(id: string): Promise<GoldenTestCase | undefined> {
    return this.store.get(id);
  }

  /**
   * Update test case
   */
  async updateTestCase(
    id: string,
    updates: Partial<
      Pick<
        GoldenTestCase,
        'name' | 'category' | 'input' | 'expected' | 'tolerance' | 'priority' | 'tags' | 'notes' | 'active'
      >
    >
  ): Promise<GoldenTestCase> {
    const existing = await this.store.get(id);
    if (!existing) {
      throw new Error(`Test case not found: ${id}`);
    }

    const updated: GoldenTestCase = {
      ...existing,
      ...updates,
    };

    await this.store.save(updated);

    this.logger?.info('Updated golden test case', {
      id,
      updates: Object.keys(updates),
    });

    return updated;
  }

  /**
   * Verify test case (update last verified date)
   */
  async verifyTestCase(id: string): Promise<GoldenTestCase> {
    const existing = await this.store.get(id);
    if (!existing) {
      throw new Error(`Test case not found: ${id}`);
    }

    const verified: GoldenTestCase = {
      ...existing,
      lastVerifiedAt: new Date(),
    };

    await this.store.save(verified);

    this.logger?.debug('Verified golden test case', { id });

    return verified;
  }

  /**
   * Deactivate test case
   */
  async deactivateTestCase(id: string): Promise<GoldenTestCase> {
    return this.updateTestCase(id, { active: false });
  }

  /**
   * Activate test case
   */
  async activateTestCase(id: string): Promise<GoldenTestCase> {
    return this.updateTestCase(id, { active: true });
  }

  /**
   * Delete test case
   */
  async deleteTestCase(id: string): Promise<boolean> {
    const deleted = await this.store.delete(id);
    if (deleted) {
      this.logger?.info('Deleted golden test case', { id });
    }
    return deleted;
  }

  // ==========================================================================
  // QUERYING
  // ==========================================================================

  /**
   * List all test cases
   */
  async listTestCases(): Promise<GoldenTestCase[]> {
    return this.store.list();
  }

  /**
   * List active test cases
   */
  async listActiveTestCases(): Promise<GoldenTestCase[]> {
    return this.store.listActive();
  }

  /**
   * List test cases by category
   */
  async listByCategory(category: TestCategory): Promise<GoldenTestCase[]> {
    return this.store.listByCategory(category);
  }

  /**
   * List test cases by priority
   */
  async listByPriority(
    priority: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<GoldenTestCase[]> {
    return this.store.listByPriority(priority);
  }

  /**
   * List test cases by tags
   */
  async listByTags(tags: string[]): Promise<GoldenTestCase[]> {
    return this.store.listByTags(tags);
  }

  /**
   * Get critical test cases (priority = critical)
   */
  async getCriticalTestCases(): Promise<GoldenTestCase[]> {
    const all = await this.listActiveTestCases();
    return all.filter((tc) => tc.priority === 'critical');
  }

  /**
   * Get test cases for a specific rubric
   */
  async getTestCasesForRubric(rubricId: string): Promise<GoldenTestCase[]> {
    const all = await this.listActiveTestCases();
    return all.filter((tc) => tc.input.rubric.id === rubricId);
  }

  /**
   * Get stale test cases (not verified recently)
   */
  async getStaleTestCases(staleThresholdDays: number = 30): Promise<GoldenTestCase[]> {
    const all = await this.listActiveTestCases();
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - staleThresholdDays);

    return all.filter((tc) => {
      if (!tc.lastVerifiedAt) return true;
      return tc.lastVerifiedAt < threshold;
    });
  }

  /**
   * Count test cases
   */
  async countTestCases(): Promise<number> {
    return this.store.count();
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<GoldenTestStatistics> {
    const all = await this.store.list();
    const active = all.filter((tc) => tc.active);

    const byCategory: Record<TestCategory, number> = {
      scoring_accuracy: 0,
      feedback_quality: 0,
      edge_case: 0,
      boundary_condition: 0,
      consistency: 0,
      bias_detection: 0,
      performance: 0,
      regression: 0,
    };

    const byPriority = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    for (const tc of active) {
      byCategory[tc.category]++;
      byPriority[tc.priority]++;
    }

    return {
      total: all.length,
      active: active.length,
      inactive: all.length - active.length,
      byCategory,
      byPriority,
    };
  }

  // ==========================================================================
  // BULK OPERATIONS
  // ==========================================================================

  /**
   * Import test cases
   */
  async importTestCases(testCases: GoldenTestCase[]): Promise<ImportResult> {
    const results: ImportResult = {
      imported: 0,
      skipped: 0,
      errors: [],
    };

    for (const testCase of testCases) {
      try {
        // Check if already exists
        const existing = await this.store.get(testCase.id);
        if (existing) {
          results.skipped++;
          continue;
        }

        await this.store.save(testCase);
        results.imported++;
      } catch (error) {
        results.errors.push({
          id: testCase.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    this.logger?.info('Imported golden test cases', {
      imported: results.imported,
      skipped: results.skipped,
      errors: results.errors.length,
    });

    return results;
  }

  /**
   * Export test cases
   */
  async exportTestCases(
    filter?: {
      categories?: TestCategory[];
      priorities?: Array<'low' | 'medium' | 'high' | 'critical'>;
      tags?: string[];
      activeOnly?: boolean;
    }
  ): Promise<GoldenTestCase[]> {
    let testCases = await this.store.list();

    if (filter?.activeOnly) {
      testCases = testCases.filter((tc) => tc.active);
    }

    if (filter?.categories) {
      testCases = testCases.filter((tc) => filter.categories!.includes(tc.category));
    }

    if (filter?.priorities) {
      testCases = testCases.filter((tc) => filter.priorities!.includes(tc.priority));
    }

    if (filter?.tags) {
      testCases = testCases.filter((tc) =>
        filter.tags!.some((tag) => tc.tags.includes(tag))
      );
    }

    return testCases;
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `test-${++this.idCounter}-${Date.now().toString(36)}`;
  }

  /**
   * Create a builder for test cases
   */
  createBuilder(): GoldenTestCaseBuilder {
    return new GoldenTestCaseBuilder();
  }
}

// ============================================================================
// TYPES
// ============================================================================

/**
 * Statistics for golden test cases
 */
export interface GoldenTestStatistics {
  total: number;
  active: number;
  inactive: number;
  byCategory: Record<TestCategory, number>;
  byPriority: Record<'low' | 'medium' | 'high' | 'critical', number>;
}

/**
 * Import result
 */
export interface ImportResult {
  imported: number;
  skipped: number;
  errors: Array<{ id: string; error: string }>;
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create golden test repository
 */
export function createGoldenTestRepository(
  config?: GoldenTestRepositoryConfig
): GoldenTestRepository {
  return new GoldenTestRepository(config);
}

// ============================================================================
// DEFAULT INSTANCES
// ============================================================================

let defaultRepository: GoldenTestRepository | undefined;

/**
 * Get default repository instance
 */
export function getDefaultGoldenTestRepository(): GoldenTestRepository {
  if (!defaultRepository) {
    defaultRepository = new GoldenTestRepository();
  }
  return defaultRepository;
}

/**
 * Reset default repository (for testing)
 */
export function resetDefaultGoldenTestRepository(): void {
  defaultRepository = undefined;
}

// ============================================================================
// SAMPLE TEST CASE FACTORY
// ============================================================================

/**
 * Create sample rubric for testing
 */
export function createSampleRubric(): TestRubric {
  return {
    id: 'sample-rubric',
    name: 'Sample Evaluation Rubric',
    criteria: [
      {
        name: 'Content Accuracy',
        description: 'Accuracy of the provided information',
        maxPoints: 30,
        weight: 0.3,
      },
      {
        name: 'Clarity',
        description: 'Clarity and organization of response',
        maxPoints: 25,
        weight: 0.25,
      },
      {
        name: 'Depth',
        description: 'Depth of analysis and understanding',
        maxPoints: 25,
        weight: 0.25,
      },
      {
        name: 'Examples',
        description: 'Quality and relevance of examples',
        maxPoints: 20,
        weight: 0.2,
      },
    ],
  };
}

/**
 * Create sample test cases for demonstration
 */
export function createSampleTestCases(): GoldenTestCase[] {
  const rubric = createSampleRubric();

  return [
    {
      id: 'sample-test-1',
      name: 'Perfect Score Test',
      category: 'scoring_accuracy',
      input: {
        content: 'This is a comprehensive and well-structured response with accurate information, clear explanations, deep analysis, and relevant examples.',
        responseType: 'essay',
        question: 'Explain the concept of machine learning',
        expectedAnswer: 'Machine learning is a subset of AI that enables systems to learn from data...',
        rubric,
        maxPoints: 100,
      },
      expected: {
        score: 95,
        scoreTolerance: 5,
        percentage: 95,
        percentageTolerance: 5,
        minConfidence: 0.8,
        feedbackKeywords: ['excellent', 'comprehensive', 'well-structured'],
        strengthsKeywords: ['accuracy', 'clarity', 'depth'],
      },
      tolerance: 5,
      priority: 'critical',
      tags: ['scoring', 'perfect-score'],
      createdAt: new Date(),
      active: true,
      notes: 'Tests that a near-perfect response receives high score',
    },
    {
      id: 'sample-test-2',
      name: 'Minimum Passing Score Test',
      category: 'boundary_condition',
      input: {
        content: 'Machine learning is when computers learn things.',
        responseType: 'short_answer',
        question: 'What is machine learning?',
        rubric,
        maxPoints: 100,
      },
      expected: {
        score: 60,
        scoreTolerance: 10,
        percentage: 60,
        percentageTolerance: 10,
        minConfidence: 0.6,
        improvementsKeywords: ['more detail', 'examples', 'depth'],
      },
      tolerance: 10,
      priority: 'high',
      tags: ['scoring', 'boundary'],
      createdAt: new Date(),
      active: true,
      notes: 'Tests boundary condition for passing score',
    },
    {
      id: 'sample-test-3',
      name: 'Empty Response Test',
      category: 'edge_case',
      input: {
        content: '',
        responseType: 'essay',
        question: 'Explain neural networks',
        rubric,
        maxPoints: 100,
      },
      expected: {
        score: 0,
        scoreTolerance: 0,
        percentage: 0,
        percentageTolerance: 0,
        minConfidence: 0.9,
        feedbackKeywords: ['no response', 'submit'],
      },
      tolerance: 0,
      priority: 'critical',
      tags: ['edge-case', 'empty'],
      createdAt: new Date(),
      active: true,
      notes: 'Tests that empty responses receive zero score',
    },
  ];
}
