/**
 * SAM Transaction Wrapper
 *
 * Provides atomic transaction support for cross-store operations.
 * Prevents orphaned records when multi-step operations fail.
 *
 * PROBLEM:
 * Store adapters operate independently:
 * ```typescript
 * const goal = await goalStore.create(data);
 * const plan = await planStore.create({ goalId: goal.id }); // If this fails, orphaned goal!
 * ```
 *
 * SOLUTION:
 * Use Prisma's $transaction for atomic operations:
 * ```typescript
 * const [goal, plan] = await withTransaction(async (tx) => {
 *   const goal = await tx.sAMLearningGoal.create({ data });
 *   const plan = await tx.sAMExecutionPlan.create({ data: { goalId: goal.id } });
 *   return [goal, plan];
 * });
 * ```
 */

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { Prisma, PrismaClient } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Transaction client type - same as PrismaClient but within a transaction
 */
export type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

/**
 * Transaction options
 */
export interface TransactionOptions {
  /** Maximum time to wait for the transaction to complete (in ms) */
  maxWait?: number;
  /** Transaction timeout (in ms) */
  timeout?: number;
  /** Isolation level for the transaction */
  isolationLevel?: Prisma.TransactionIsolationLevel;
  /** Component name for logging */
  component?: string;
  /** Operation name for logging */
  operation?: string;
}

/**
 * Result of a transaction operation
 */
export interface TransactionResult<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    cause?: Error;
  };
  durationMs: number;
}

// ============================================================================
// TRANSACTION FUNCTIONS
// ============================================================================

/**
 * Execute a function within a Prisma transaction
 *
 * @example
 * // Create goal and plan atomically
 * const result = await withTransaction(async (tx) => {
 *   const goal = await tx.sAMLearningGoal.create({
 *     data: { userId, title: 'Learn TypeScript' }
 *   });
 *
 *   const plan = await tx.sAMExecutionPlan.create({
 *     data: { goalId: goal.id, userId }
 *   });
 *
 *   return { goal, plan };
 * });
 *
 * if (!result.success) {
 *   console.error('Transaction failed:', result.error);
 * }
 */
export async function withTransaction<T>(
  fn: (tx: TransactionClient) => Promise<T>,
  options: TransactionOptions = {}
): Promise<TransactionResult<T>> {
  const {
    maxWait = 5000,
    timeout = 10000,
    isolationLevel,
    component = 'Transaction',
    operation = 'execute',
  } = options;

  const startTime = Date.now();
  const logPrefix = `[${component}]`;

  try {
    const result = await db.$transaction(fn, {
      maxWait,
      timeout,
      isolationLevel,
    });

    const durationMs = Date.now() - startTime;

    logger.debug(`${logPrefix} ${operation} completed`, {
      durationMs,
      success: true,
    });

    return {
      success: true,
      data: result,
      durationMs,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : String(error);

    logger.error(`${logPrefix} ${operation} failed - transaction rolled back`, {
      error: message,
      durationMs,
    });

    return {
      success: false,
      error: {
        message,
        code: isPrismaError(error) ? error.code : undefined,
        cause: error instanceof Error ? error : undefined,
      },
      durationMs,
    };
  }
}

/**
 * Execute a function within a transaction, throwing on failure
 *
 * Use this when you want exceptions to propagate rather than handling
 * the result object.
 *
 * @example
 * try {
 *   const { goal, plan } = await withTransactionOrThrow(async (tx) => {
 *     const goal = await tx.sAMLearningGoal.create({ data: goalData });
 *     const plan = await tx.sAMExecutionPlan.create({ data: planData });
 *     return { goal, plan };
 *   });
 * } catch (error) {
 *   // Handle rollback
 * }
 */
export async function withTransactionOrThrow<T>(
  fn: (tx: TransactionClient) => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> {
  const result = await withTransaction(fn, options);

  if (!result.success) {
    throw result.error?.cause ?? new Error(result.error?.message ?? 'Transaction failed');
  }

  return result.data as T;
}

// ============================================================================
// SAM-SPECIFIC TRANSACTION HELPERS
// ============================================================================

/**
 * Create a goal with subGoals atomically
 */
export async function createGoalWithSubGoals(
  goalData: {
    userId: string;
    title: string;
    description?: string;
    targetDate?: Date;
    priority?: string;
    status?: string;
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
    topicIds?: string[];
    skillIds?: string[];
    tags?: string[];
  },
  subGoals: Array<{
    title: string;
    description?: string;
    type?: string;
    order: number;
    estimatedMinutes?: number;
    difficulty?: string;
  }>
): Promise<TransactionResult<{ goalId: string; subGoalIds: string[] }>> {
  return withTransaction(
    async (tx) => {
      // Create the goal
      const goal = await tx.sAMLearningGoal.create({
        data: {
          userId: goalData.userId,
          title: goalData.title,
          description: goalData.description,
          targetDate: goalData.targetDate,
          priority: (goalData.priority?.toUpperCase() ?? 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
          status: (goalData.status?.toUpperCase() ?? 'DRAFT') as 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ABANDONED',
          courseId: goalData.courseId,
          chapterId: goalData.chapterId,
          sectionId: goalData.sectionId,
          topicIds: goalData.topicIds ?? [],
          skillIds: goalData.skillIds ?? [],
          tags: goalData.tags ?? [],
        },
      });

      // Create subGoals linked to the goal
      const createdSubGoals = await Promise.all(
        subGoals.map((sg) =>
          tx.sAMSubGoal.create({
            data: {
              goalId: goal.id,
              title: sg.title,
              description: sg.description,
              type: (sg.type?.toUpperCase() ?? 'LEARN') as 'LEARN' | 'PRACTICE' | 'ASSESS' | 'REVIEW' | 'RESEARCH' | 'CREATE',
              order: sg.order,
              estimatedMinutes: sg.estimatedMinutes ?? 30,
              difficulty: (sg.difficulty?.toUpperCase() ?? 'MEDIUM') as 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT',
              status: 'PENDING',
            },
          })
        )
      );

      return {
        goalId: goal.id,
        subGoalIds: createdSubGoals.map((sg) => sg.id),
      };
    },
    {
      component: 'SAM Goal',
      operation: 'createGoalWithSubGoals',
    }
  );
}

/**
 * Create an execution plan with steps atomically
 */
export async function createPlanWithSteps(
  planData: {
    goalId: string;
    userId: string;
    startDate?: Date;
    targetDate?: Date;
    schedule?: Record<string, unknown>;
  },
  steps: Array<{
    subGoalId?: string;
    type?: string;
    title: string;
    description?: string;
    order: number;
    estimatedMinutes?: number;
  }>
): Promise<TransactionResult<{ planId: string; stepIds: string[] }>> {
  return withTransaction(
    async (tx) => {
      // Create the plan
      const plan = await tx.sAMExecutionPlan.create({
        data: {
          goalId: planData.goalId,
          userId: planData.userId,
          startDate: planData.startDate,
          targetDate: planData.targetDate,
          schedule: planData.schedule ?? {},
          status: 'DRAFT',
          overallProgress: 0,
        },
      });

      // Create steps linked to the plan
      const createdSteps = await Promise.all(
        steps.map((step) =>
          tx.sAMPlanStep.create({
            data: {
              planId: plan.id,
              subGoalId: step.subGoalId,
              type: (step.type?.toUpperCase() ?? 'READ_CONTENT') as 'READ_CONTENT' | 'WATCH_VIDEO' | 'COMPLETE_QUIZ' | 'PRACTICE' | 'REVIEW' | 'DISCUSS' | 'SUBMIT_ASSIGNMENT' | 'CUSTOM',
              title: step.title,
              description: step.description,
              order: step.order,
              estimatedMinutes: step.estimatedMinutes ?? 30,
              status: 'PENDING',
            },
          })
        )
      );

      return {
        planId: plan.id,
        stepIds: createdSteps.map((step) => step.id),
      };
    },
    {
      component: 'SAM Plan',
      operation: 'createPlanWithSteps',
    }
  );
}

/**
 * Complete a goal and all its subGoals atomically
 */
export async function completeGoalWithSubGoals(
  goalId: string
): Promise<TransactionResult<{ updatedGoalId: string; updatedSubGoalCount: number }>> {
  return withTransaction(
    async (tx) => {
      // Update all pending/in_progress subGoals to completed
      const subGoalUpdate = await tx.sAMSubGoal.updateMany({
        where: {
          goalId,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Update the goal itself
      await tx.sAMLearningGoal.update({
        where: { id: goalId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      return {
        updatedGoalId: goalId,
        updatedSubGoalCount: subGoalUpdate.count,
      };
    },
    {
      component: 'SAM Goal',
      operation: 'completeGoalWithSubGoals',
    }
  );
}

/**
 * Delete a goal and all related data atomically
 */
export async function deleteGoalCascade(
  goalId: string
): Promise<TransactionResult<{ deletedGoalId: string; deletedSubGoals: number; deletedPlans: number }>> {
  return withTransaction(
    async (tx) => {
      // Delete plan steps first (they reference subGoals)
      await tx.sAMPlanStep.deleteMany({
        where: {
          plan: { goalId },
        },
      });

      // Delete plan state
      await tx.sAMPlanState.deleteMany({
        where: {
          plan: { goalId },
        },
      });

      // Delete checkpoints
      await tx.sAMCheckpoint.deleteMany({
        where: {
          plan: { goalId },
        },
      });

      // Delete plans
      const planDelete = await tx.sAMExecutionPlan.deleteMany({
        where: { goalId },
      });

      // Delete subGoals
      const subGoalDelete = await tx.sAMSubGoal.deleteMany({
        where: { goalId },
      });

      // Delete the goal itself
      await tx.sAMLearningGoal.delete({
        where: { id: goalId },
      });

      return {
        deletedGoalId: goalId,
        deletedSubGoals: subGoalDelete.count,
        deletedPlans: planDelete.count,
      };
    },
    {
      component: 'SAM Goal',
      operation: 'deleteGoalCascade',
    }
  );
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Execute multiple operations in a single transaction
 *
 * @example
 * const results = await batchTransaction([
 *   (tx) => tx.sAMLearningGoal.update({ where: { id: '1' }, data: { progress: 50 } }),
 *   (tx) => tx.sAMLearningGoal.update({ where: { id: '2' }, data: { progress: 75 } }),
 * ]);
 */
export async function batchTransaction<T extends unknown[]>(
  operations: Array<(tx: TransactionClient) => Promise<unknown>>,
  options: TransactionOptions = {}
): Promise<TransactionResult<T>> {
  return withTransaction(
    async (tx) => {
      const results = await Promise.all(operations.map((op) => op(tx)));
      return results as T;
    },
    {
      ...options,
      operation: options.operation ?? `batch(${operations.length} operations)`,
    }
  );
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Check if an error is a Prisma error
 */
function isPrismaError(
  error: unknown
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof (error as Prisma.PrismaClientKnownRequestError).code === 'string'
  );
}

/**
 * Get a human-readable description of a Prisma error code
 */
export function getPrismaErrorDescription(code: string): string {
  const descriptions: Record<string, string> = {
    P2000: 'Value too long for the column',
    P2001: 'Record not found',
    P2002: 'Unique constraint violation',
    P2003: 'Foreign key constraint violation',
    P2004: 'Constraint violation',
    P2005: 'Invalid value stored in database',
    P2006: 'Invalid value provided',
    P2007: 'Data validation error',
    P2008: 'Failed to parse query',
    P2009: 'Failed to validate query',
    P2010: 'Raw query failed',
    P2011: 'Null constraint violation',
    P2012: 'Missing required value',
    P2013: 'Missing required argument',
    P2014: 'Required relation violation',
    P2015: 'Related record not found',
    P2016: 'Query interpretation error',
    P2017: 'Records not connected',
    P2018: 'Required connected records not found',
    P2019: 'Input error',
    P2020: 'Value out of range',
    P2021: 'Table does not exist',
    P2022: 'Column does not exist',
    P2023: 'Inconsistent column data',
    P2024: 'Timed out fetching connection',
    P2025: 'Record not found for operation',
    P2026: 'Feature not supported',
    P2027: 'Multiple errors in database',
    P2028: 'Transaction API error',
    P2030: 'Cannot find fulltext index',
    P2031: 'MongoDB replica set required',
    P2033: 'Number larger than 64-bit signed integer',
    P2034: 'Transaction conflict - retry',
  };

  return descriptions[code] ?? `Unknown error (${code})`;
}
