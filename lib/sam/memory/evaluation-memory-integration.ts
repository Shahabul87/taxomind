/**
 * Evaluation Memory Integration
 *
 * Priority 7: Close the Loop with Memory + Personalization
 * Main integration module that connects evaluations to student profiles
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  EvaluationOutcome,
  OutcomeRecordingResult,
  EvaluationMemoryIntegration as IEvaluationMemoryIntegration,
  StudentProfile,
  ReviewScheduleEntry,
  MemoryEntry,
  MemoryEntryType,
  ImportanceLevel,
  MemoryStore,
  StudentProfileStore,
  ReviewScheduleStore,
  LearningPathway,
  MemoryIntegrationConfig,
} from './types';
import { DEFAULT_MEMORY_INTEGRATION_CONFIG } from './types';
import { MasteryTracker } from './mastery-tracker';
import { PathwayCalculator } from './pathway-calculator';
import { SpacedRepetitionScheduler } from './spaced-repetition';

// ============================================================================
// IN-MEMORY MEMORY STORE
// ============================================================================

/**
 * In-memory implementation of MemoryStore
 */
export class InMemoryMemoryStore implements MemoryStore {
  private entries: Map<string, MemoryEntry> = new Map();

  /**
   * Store a memory entry
   */
  async store(
    entry: Omit<MemoryEntry, 'id' | 'accessCount'>
  ): Promise<MemoryEntry> {
    const newEntry: MemoryEntry = {
      ...entry,
      id: uuidv4(),
      accessCount: 0,
    };
    this.entries.set(newEntry.id, newEntry);
    return newEntry;
  }

  /**
   * Get a memory entry by ID
   */
  async get(entryId: string): Promise<MemoryEntry | null> {
    return this.entries.get(entryId) ?? null;
  }

  /**
   * Search memories by type
   */
  async getByType(
    studentId: string,
    type: MemoryEntryType,
    limit?: number
  ): Promise<MemoryEntry[]> {
    const entries = Array.from(this.entries.values())
      .filter((e) => e.studentId === studentId && e.type === type)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return limit ? entries.slice(0, limit) : entries;
  }

  /**
   * Search memories by topic
   */
  async getByTopic(
    studentId: string,
    topicId: string,
    limit?: number
  ): Promise<MemoryEntry[]> {
    const entries = Array.from(this.entries.values())
      .filter(
        (e) => e.studentId === studentId && e.relatedTopics.includes(topicId)
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return limit ? entries.slice(0, limit) : entries;
  }

  /**
   * Get recent memories
   */
  async getRecent(studentId: string, limit?: number): Promise<MemoryEntry[]> {
    const entries = Array.from(this.entries.values())
      .filter((e) => e.studentId === studentId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return limit ? entries.slice(0, limit) : entries;
  }

  /**
   * Get important memories
   */
  async getImportant(
    studentId: string,
    minImportance: ImportanceLevel
  ): Promise<MemoryEntry[]> {
    const importanceOrder: ImportanceLevel[] = ['low', 'medium', 'high', 'critical'];
    const minIndex = importanceOrder.indexOf(minImportance);

    return Array.from(this.entries.values())
      .filter(
        (e) =>
          e.studentId === studentId &&
          importanceOrder.indexOf(e.importance) >= minIndex
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Update access timestamp
   */
  async recordAccess(entryId: string): Promise<void> {
    const entry = this.entries.get(entryId);
    if (entry) {
      entry.lastAccessedAt = new Date();
      entry.accessCount++;
    }
  }

  /**
   * Prune expired entries
   */
  async pruneExpired(): Promise<number> {
    const now = new Date();
    let deleted = 0;

    for (const [id, entry] of this.entries) {
      if (entry.ttlDays !== undefined) {
        const expiryDate = new Date(entry.createdAt);
        expiryDate.setDate(expiryDate.getDate() + entry.ttlDays);

        if (expiryDate < now) {
          this.entries.delete(id);
          deleted++;
        }
      }
    }

    return deleted;
  }

  /**
   * Delete entries for a student
   */
  async deleteForStudent(studentId: string): Promise<number> {
    let deleted = 0;
    for (const [id, entry] of this.entries) {
      if (entry.studentId === studentId) {
        this.entries.delete(id);
        deleted++;
      }
    }
    return deleted;
  }

  /**
   * Clear all entries (for testing)
   */
  clear(): void {
    this.entries.clear();
  }

  /**
   * Get all entries (for testing)
   */
  getAll(): MemoryEntry[] {
    return Array.from(this.entries.values());
  }
}

// ============================================================================
// EVALUATION MEMORY INTEGRATION
// ============================================================================

/**
 * Configuration for EvaluationMemoryIntegrationImpl
 */
export interface EvaluationMemoryIntegrationImplConfig
  extends MemoryIntegrationConfig {
  /**
   * Student profile store
   */
  profileStore: StudentProfileStore;

  /**
   * Review schedule store
   */
  reviewStore: ReviewScheduleStore;

  /**
   * Memory store
   */
  memoryStore: MemoryStore;

  /**
   * Optional logger
   */
  logger?: MemoryIntegrationLogger;
}

/**
 * Logger interface for memory integration
 */
export interface MemoryIntegrationLogger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

/**
 * Default console logger
 */
const defaultLogger: MemoryIntegrationLogger = {
  debug: (msg, ctx) => console.debug(`[MemoryIntegration] ${msg}`, ctx),
  info: (msg, ctx) => console.info(`[MemoryIntegration] ${msg}`, ctx),
  warn: (msg, ctx) => console.warn(`[MemoryIntegration] ${msg}`, ctx),
  error: (msg, ctx) => console.error(`[MemoryIntegration] ${msg}`, ctx),
};

/**
 * Evaluation Memory Integration Implementation
 * Connects evaluation outcomes to student profiles and learning systems
 */
export class EvaluationMemoryIntegrationImpl
  implements IEvaluationMemoryIntegration
{
  private readonly config: Required<MemoryIntegrationConfig>;
  private readonly profileStore: StudentProfileStore;
  private readonly memoryStore: MemoryStore;
  private readonly masteryTracker: MasteryTracker;
  private readonly pathwayCalculator: PathwayCalculator;
  private readonly spacedRepetitionScheduler: SpacedRepetitionScheduler;
  private readonly logger: MemoryIntegrationLogger;

  constructor(implConfig: EvaluationMemoryIntegrationImplConfig) {
    this.config = {
      ...DEFAULT_MEMORY_INTEGRATION_CONFIG,
      ...implConfig,
    };
    this.profileStore = implConfig.profileStore;
    this.memoryStore = implConfig.memoryStore;
    this.logger = implConfig.logger ?? defaultLogger;

    // Create sub-components
    this.masteryTracker = new MasteryTracker(this.profileStore, {
      levelThresholds: {
        beginner: this.config.remediationThreshold,
        intermediate: 70,
        proficient: this.config.masteryImprovementThreshold,
        expert: this.config.skipAheadThreshold,
      },
    });

    this.pathwayCalculator = new PathwayCalculator(this.profileStore, {
      skipAheadThreshold: this.config.skipAheadThreshold,
      remediationThreshold: this.config.remediationThreshold,
    });

    this.spacedRepetitionScheduler = new SpacedRepetitionScheduler(
      implConfig.reviewStore,
      this.config.spacedRepetitionConfig
    );
  }

  /**
   * Record an evaluation outcome
   */
  async recordEvaluationOutcome(
    outcome: EvaluationOutcome
  ): Promise<OutcomeRecordingResult> {
    const result: OutcomeRecordingResult = {
      success: true,
      errors: [],
    };

    this.logger.info('Recording evaluation outcome', {
      evaluationId: outcome.evaluationId,
      studentId: outcome.studentId,
      topicId: outcome.topicId,
      score: outcome.score,
    });

    try {
      // 1. Update mastery
      if (this.config.updateMasteryOnEvaluation) {
        const masteryResult = await this.masteryTracker.processEvaluation(outcome);
        result.newMasteryLevel = masteryResult.currentMastery.level;
        result.masteryChange = masteryResult.scoreDifference;

        this.logger.debug('Mastery updated', {
          level: result.newMasteryLevel,
          change: result.masteryChange,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown mastery error';
      result.errors?.push(`Mastery update failed: ${errorMessage}`);
      this.logger.error('Mastery update failed', { error: errorMessage });
    }

    try {
      // 2. Adjust pathway
      if (this.config.adjustPathwayOnEvaluation && outcome.courseId) {
        const pathways = await this.profileStore.getActivePathways(
          outcome.studentId
        );
        const coursePathway = pathways.find(
          (p) => p.courseId === outcome.courseId
        );

        if (coursePathway) {
          const adjustmentResult = await this.pathwayCalculator.calculateAdjustment(
            outcome.studentId,
            coursePathway.id,
            outcome
          );

          result.pathwayAdjustments = [adjustmentResult.adjustment];

          this.logger.debug('Pathway adjusted', {
            type: adjustmentResult.adjustment.type,
            explanation: adjustmentResult.explanation,
          });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown pathway error';
      result.errors?.push(`Pathway adjustment failed: ${errorMessage}`);
      this.logger.error('Pathway adjustment failed', { error: errorMessage });
    }

    try {
      // 3. Update spaced repetition
      if (this.config.updateSpacedRepetition) {
        const scheduleResult =
          await this.spacedRepetitionScheduler.scheduleFromEvaluation(outcome);

        result.spacedRepetitionUpdates = [
          {
            topicId: outcome.topicId,
            nextReviewDate: scheduleResult.entry.scheduledFor,
            priority: scheduleResult.entry.priority,
          },
        ];

        this.logger.debug('Spaced repetition scheduled', {
          nextReview: scheduleResult.entry.scheduledFor,
          interval: scheduleResult.daysUntilReview,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown spaced repetition error';
      result.errors?.push(`Spaced repetition failed: ${errorMessage}`);
      this.logger.error('Spaced repetition failed', { error: errorMessage });
    }

    try {
      // 4. Store in long-term memory
      if (this.config.storeInMemory) {
        const memoryEntries = await this.createMemoryEntries(outcome, result);
        result.memoryEntriesCreated = memoryEntries.length;

        this.logger.debug('Memory entries created', {
          count: memoryEntries.length,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown memory error';
      result.errors?.push(`Memory storage failed: ${errorMessage}`);
      this.logger.error('Memory storage failed', { error: errorMessage });
    }

    // Set success based on whether there were critical errors
    result.success = !result.errors || result.errors.length === 0;

    this.logger.info('Evaluation outcome recorded', {
      success: result.success,
      newMasteryLevel: result.newMasteryLevel,
      memoryEntriesCreated: result.memoryEntriesCreated,
    });

    return result;
  }

  /**
   * Get student profile
   */
  async getStudentProfile(studentId: string): Promise<StudentProfile | null> {
    return this.profileStore.get(studentId);
  }

  /**
   * Get pending reviews for a student
   */
  async getPendingReviews(studentId: string): Promise<ReviewScheduleEntry[]> {
    return this.spacedRepetitionScheduler.getPendingReviews(studentId);
  }

  /**
   * Get relevant memories for context
   */
  async getRelevantMemories(
    studentId: string,
    topicId: string
  ): Promise<MemoryEntry[]> {
    // Get memories related to this topic
    const topicMemories = await this.memoryStore.getByTopic(
      studentId,
      topicId,
      10
    );

    // Get recent important memories
    const importantMemories = await this.memoryStore.getImportant(
      studentId,
      'high'
    );

    // Combine and deduplicate
    const seenIds = new Set<string>();
    const combined: MemoryEntry[] = [];

    for (const memory of [...topicMemories, ...importantMemories]) {
      if (!seenIds.has(memory.id)) {
        seenIds.add(memory.id);
        combined.push(memory);
        // Record access
        await this.memoryStore.recordAccess(memory.id);
      }
    }

    return combined.slice(0, 20);
  }

  /**
   * Recalculate learning pathway
   */
  async recalculatePathway(
    studentId: string,
    pathwayId: string
  ): Promise<LearningPathway> {
    const recalculated = await this.pathwayCalculator.recalculatePathway(
      studentId,
      pathwayId
    );

    // Update in store
    await this.profileStore.updatePathway(studentId, pathwayId, {
      type: 'no_change',
      reason: 'Full recalculation',
    });

    return recalculated;
  }

  /**
   * Get mastery summary for a student
   */
  async getMasterySummary(studentId: string) {
    return this.masteryTracker.getMasterySummary(studentId);
  }

  /**
   * Get review statistics
   */
  async getReviewStats(studentId: string) {
    return this.spacedRepetitionScheduler.getReviewStats(studentId);
  }

  /**
   * Create memory entries for an evaluation
   */
  private async createMemoryEntries(
    outcome: EvaluationOutcome,
    result: OutcomeRecordingResult
  ): Promise<MemoryEntry[]> {
    const entries: MemoryEntry[] = [];

    // Create evaluation outcome memory
    const evaluationMemory = await this.memoryStore.store({
      studentId: outcome.studentId,
      type: 'EVALUATION_OUTCOME',
      content: {
        evaluationId: outcome.evaluationId,
        topicId: outcome.topicId,
        score: outcome.score,
        maxScore: outcome.maxScore,
        bloomsLevel: outcome.bloomsLevel,
        assessmentType: outcome.assessmentType,
        strengths: outcome.strengths,
        areasForImprovement: outcome.areasForImprovement,
        feedback: outcome.feedback,
      },
      importance: this.calculateImportance(outcome),
      relatedTopics: [outcome.topicId],
      tags: [
        outcome.assessmentType,
        outcome.bloomsLevel,
        outcome.score >= 80 ? 'success' : outcome.score >= 60 ? 'progress' : 'needs-work',
      ],
      createdAt: outcome.evaluatedAt,
      ttlDays: 365, // Keep for 1 year
    });
    entries.push(evaluationMemory);

    // Create mastery update memory if level changed
    if (result.newMasteryLevel && result.masteryChange && Math.abs(result.masteryChange) > 5) {
      const masteryMemory = await this.memoryStore.store({
        studentId: outcome.studentId,
        type: 'MASTERY_UPDATE',
        content: {
          topicId: outcome.topicId,
          newLevel: result.newMasteryLevel,
          scoreChange: result.masteryChange,
        },
        importance: Math.abs(result.masteryChange) > 10 ? 'high' : 'medium',
        relatedTopics: [outcome.topicId],
        tags: ['mastery', result.masteryChange > 0 ? 'improvement' : 'decline'],
        createdAt: new Date(),
        ttlDays: 365,
      });
      entries.push(masteryMemory);
    }

    // Create milestone memory for significant achievements
    if (outcome.score >= 90) {
      const milestoneMemory = await this.memoryStore.store({
        studentId: outcome.studentId,
        type: 'LEARNING_MILESTONE',
        content: {
          topicId: outcome.topicId,
          achievement: 'high_score',
          score: outcome.score,
          bloomsLevel: outcome.bloomsLevel,
        },
        importance: 'high',
        relatedTopics: [outcome.topicId],
        tags: ['milestone', 'achievement', 'high-score'],
        createdAt: new Date(),
        ttlDays: undefined, // Permanent
      });
      entries.push(milestoneMemory);
    }

    // Create struggle point memory for low scores
    if (outcome.score < 50) {
      const struggleMemory = await this.memoryStore.store({
        studentId: outcome.studentId,
        type: 'STRUGGLE_POINT',
        content: {
          topicId: outcome.topicId,
          score: outcome.score,
          areasForImprovement: outcome.areasForImprovement,
        },
        importance: 'high',
        relatedTopics: [outcome.topicId],
        tags: ['struggle', 'needs-attention'],
        createdAt: new Date(),
        ttlDays: 90, // Keep for 90 days
      });
      entries.push(struggleMemory);
    }

    return entries;
  }

  /**
   * Calculate importance of an evaluation outcome
   */
  private calculateImportance(outcome: EvaluationOutcome): ImportanceLevel {
    // High score = high importance (achievement)
    if (outcome.score >= 90) return 'high';

    // Low score = high importance (needs attention)
    if (outcome.score < 50) return 'high';

    // Higher Bloom's levels are more important
    const bloomsOrder = [
      'REMEMBER',
      'UNDERSTAND',
      'APPLY',
      'ANALYZE',
      'EVALUATE',
      'CREATE',
    ];
    const bloomsIndex = bloomsOrder.indexOf(outcome.bloomsLevel);

    if (bloomsIndex >= 4) return 'high';
    if (bloomsIndex >= 2) return 'medium';

    return 'low';
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create an in-memory memory store
 */
export function createInMemoryMemoryStore(): InMemoryMemoryStore {
  return new InMemoryMemoryStore();
}

/**
 * Create an evaluation memory integration
 */
export function createEvaluationMemoryIntegration(
  config: EvaluationMemoryIntegrationImplConfig
): EvaluationMemoryIntegrationImpl {
  return new EvaluationMemoryIntegrationImpl(config);
}

/**
 * Singleton stores for development
 */
let defaultMemoryStore: InMemoryMemoryStore | null = null;

/**
 * Get the default memory store (singleton)
 */
export function getDefaultMemoryStore(): InMemoryMemoryStore {
  if (!defaultMemoryStore) {
    defaultMemoryStore = createInMemoryMemoryStore();
  }
  return defaultMemoryStore;
}

/**
 * Reset the default memory store (for testing)
 */
export function resetDefaultMemoryStore(): void {
  defaultMemoryStore = null;
}
