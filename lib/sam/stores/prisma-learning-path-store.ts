/**
 * Prisma Learning Path Store Adapter
 * Implements LearningPathStore interface from @sam-ai/agentic package
 */

import { getDb, type PrismaClient } from './db-provider';
import type {
  LearningPathStore,
  PersonalizedLearningPath,
  PathStep,
  DifficultyLevel,
  LearningAction,
  StepPriority,
} from '@sam-ai/agentic';

// Use a type alias for the personalized learning path since
// it conflicts with Prisma's LearningPath model
type AgenticLearningPath = PersonalizedLearningPath;

// ============================================================================
// PRISMA LEARNING PATH STORE ADAPTER
// ============================================================================

export class PrismaLearningPathStore implements LearningPathStore {
  /**
   * Save a personalized learning path
   */
  async saveLearningPath(path: AgenticLearningPath): Promise<void> {
    try {
      // Store personalized path in SAMLearningGoal with metadata
      await getDb().sAMLearningGoal.create({
        data: {
          id: path.id,
          userId: path.userId,
          title: `Learning Path: ${path.courseId ?? 'Personalized'}`,
          description: path.reason,
          courseId: path.courseId ?? undefined,
          priority: 'MEDIUM',
          status: 'ACTIVE',
          targetDate: path.expiresAt,
          metadata: {
            type: 'personalized_learning_path',
            steps: path.steps.map((step) => ({
              order: step.order,
              conceptId: step.conceptId,
              conceptName: step.conceptName,
              action: step.action,
              priority: step.priority,
              estimatedMinutes: step.estimatedMinutes,
              reason: step.reason,
              prerequisites: step.prerequisites,
              completed: false,
            })),
            totalSteps: path.steps.length,
            completedSteps: 0,
            targetConceptId: path.targetConceptId,
            totalEstimatedMinutes: path.totalEstimatedMinutes,
            difficulty: path.difficulty,
            confidence: path.confidence,
          },
        },
      });

      // Also create enrollment if course-specific
      if (path.courseId) {
        await getDb().learningPathEnrollment.upsert({
          where: {
            userId_learningPathId: {
              userId: path.userId,
              learningPathId: path.courseId,
            },
          },
          update: {
            progressPercent: 0,
            status: 'ACTIVE',
          },
          create: {
            userId: path.userId,
            learningPathId: path.courseId,
            progressPercent: 0,
            status: 'ACTIVE',
          },
        });
      }
    } catch (error) {
      console.error('Failed to save learning path:', error);
      throw error;
    }
  }

  /**
   * Get a learning path by ID
   */
  async getLearningPath(id: string): Promise<AgenticLearningPath | null> {
    try {
      const goal = await getDb().sAMLearningGoal.findUnique({
        where: { id },
      });

      if (!goal) {
        return null;
      }

      const metadata = goal.metadata as Record<string, unknown> | null;
      if (metadata?.type !== 'personalized_learning_path') {
        return null;
      }

      return this.mapGoalToLearningPath(goal);
    } catch (error) {
      console.error('Failed to get learning path:', error);
      return null;
    }
  }

  /**
   * Get all active learning paths for a user
   */
  async getActiveLearningPaths(userId: string): Promise<AgenticLearningPath[]> {
    try {
      const goals = await getDb().sAMLearningGoal.findMany({
        where: {
          userId,
          status: { in: ['ACTIVE', 'PAUSED'] },
        },
        orderBy: { createdAt: 'desc' },
      });

      return goals
        .filter((goal) => {
          const metadata = goal.metadata as Record<string, unknown> | null;
          return metadata?.type === 'personalized_learning_path';
        })
        .map((goal) => this.mapGoalToLearningPath(goal));
    } catch (error) {
      console.error('Failed to get active learning paths:', error);
      return [];
    }
  }

  /**
   * Get learning path for a specific course
   */
  async getPathForCourse(
    userId: string,
    courseId: string
  ): Promise<AgenticLearningPath | null> {
    try {
      const goal = await getDb().sAMLearningGoal.findFirst({
        where: {
          userId,
          courseId,
          status: { in: ['ACTIVE', 'PAUSED'] },
        },
      });

      if (!goal) {
        return null;
      }

      const metadata = goal.metadata as Record<string, unknown> | null;
      if (metadata?.type !== 'personalized_learning_path') {
        return null;
      }

      return this.mapGoalToLearningPath(goal);
    } catch (error) {
      console.error('Failed to get path for course:', error);
      return null;
    }
  }

  /**
   * Delete a learning path
   */
  async deleteLearningPath(id: string): Promise<void> {
    try {
      await getDb().sAMLearningGoal.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Failed to delete learning path:', error);
      throw error;
    }
  }

  /**
   * Mark a step as completed
   */
  async markStepCompleted(pathId: string, stepOrder: number): Promise<void> {
    try {
      const goal = await getDb().sAMLearningGoal.findUnique({
        where: { id: pathId },
      });

      if (!goal) {
        throw new Error('Learning path not found');
      }

      const metadata = goal.metadata as {
        steps: Array<{ order: number; completed: boolean }>;
        totalSteps: number;
        completedSteps: number;
      } & Record<string, unknown>;

      // Update the specific step
      if (metadata?.steps) {
        const stepIndex = metadata.steps.findIndex((s) => s.order === stepOrder);
        if (stepIndex >= 0) {
          metadata.steps[stepIndex].completed = true;
          metadata.completedSteps = metadata.steps.filter((s) => s.completed).length;
        }
      }

      const progress =
        (metadata.completedSteps / metadata.totalSteps) * 100;

      await getDb().sAMLearningGoal.update({
        where: { id: pathId },
        data: {
          metadata,
          status: progress >= 100 ? 'COMPLETED' : 'ACTIVE',
          completedAt: progress >= 100 ? new Date() : undefined,
        },
      });
    } catch (error) {
      console.error('Failed to mark step completed:', error);
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private mapGoalToLearningPath(
    goal: Awaited<ReturnType<PrismaClient['sAMLearningGoal']['findUnique']>>
  ): AgenticLearningPath {
    if (!goal) {
      throw new Error('Goal is null');
    }

    const metadata = (goal.metadata as {
      steps?: Array<{
        order: number;
        conceptId: string;
        conceptName: string;
        action: LearningAction;
        priority: StepPriority;
        estimatedMinutes: number;
        reason: string;
        prerequisites: string[];
      }>;
      targetConceptId?: string;
      totalEstimatedMinutes?: number;
      difficulty?: DifficultyLevel;
      confidence?: number;
    }) ?? {};

    const steps: PathStep[] = (metadata.steps ?? []).map((step) => ({
      order: step.order ?? 0,
      conceptId: step.conceptId ?? '',
      conceptName: step.conceptName ?? '',
      action: (step.action as LearningAction) ?? 'learn',
      priority: (step.priority as StepPriority) ?? 'medium',
      estimatedMinutes: step.estimatedMinutes ?? 30,
      reason: step.reason ?? '',
      prerequisites: step.prerequisites ?? [],
    }));

    return {
      id: goal.id,
      userId: goal.userId,
      courseId: goal.courseId ?? undefined,
      targetConceptId: metadata.targetConceptId ?? undefined,
      steps,
      totalEstimatedMinutes: metadata.totalEstimatedMinutes ?? 0,
      difficulty: (metadata.difficulty as DifficultyLevel) ?? 'intermediate',
      confidence: metadata.confidence ?? 0.8,
      reason: goal.description ?? '',
      createdAt: goal.createdAt,
      expiresAt: goal.targetDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createPrismaLearningPathStore(): PrismaLearningPathStore {
  return new PrismaLearningPathStore();
}
