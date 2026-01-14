/**
 * SAM Agentic Learning Path API
 * Provides personalized learning path recommendations and skill tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getLearningPathStores } from '@/lib/sam/taxomind-context';
import {
  createSkillTracker,
  createPathRecommender,
  type SkillTrackerConfig,
  type PathRecommenderConfig,
} from '@sam-ai/agentic';

// ============================================================================
// VALIDATION
// ============================================================================

const getPathQuerySchema = z.object({
  courseId: z.string().optional(),
  maxSteps: z.coerce.number().min(1).max(20).optional().default(10),
  maxMinutes: z.coerce.number().min(5).max(180).optional().default(60),
  includeReview: z.enum(['true', 'false']).optional().transform(v => v !== 'false'),
  focusOnWeakAreas: z.enum(['true', 'false']).optional().transform(v => v !== 'false'),
  difficultyPreference: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
});

const generatePathToTargetSchema = z.object({
  targetConceptId: z.string().min(1),
  courseId: z.string().min(1),
});

const recordPerformanceSchema = z.object({
  conceptId: z.string().min(1),
  conceptName: z.string().optional(),
  score: z.number().min(0).max(100),
  timeSpentMinutes: z.number().min(0).optional(),
  attemptCount: z.number().min(1).optional().default(1),
  correctAnswers: z.number().min(0).optional(),
  totalQuestions: z.number().min(0).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
});

const completeStepSchema = z.object({
  pathId: z.string().min(1),
  stepOrder: z.number().min(1),
});

// ============================================================================
// LAZY SINGLETONS
// ============================================================================

let skillTrackerInstance: ReturnType<typeof createSkillTracker> | null = null;
let pathRecommenderInstance: ReturnType<typeof createPathRecommender> | null = null;

function getSkillTracker() {
  if (!skillTrackerInstance) {
    const stores = getLearningPathStores();
    const config: SkillTrackerConfig = {
      store: stores.skill,
      masteryThreshold: 80,
      struggleThreshold: 40,
      decayRatePerDay: 0.02,
      maxMasteryGain: 20,
      minMasteryLoss: 5,
      logger: {
        debug: (msg: string, meta?: Record<string, unknown>) => logger.debug(`[SkillTracker] ${msg}`, meta),
        info: (msg: string, meta?: Record<string, unknown>) => logger.info(`[SkillTracker] ${msg}`, meta),
        warn: (msg: string, meta?: Record<string, unknown>) => logger.warn(`[SkillTracker] ${msg}`, meta),
        error: (msg: string, meta?: Record<string, unknown>) => logger.error(`[SkillTracker] ${msg}`, meta),
      },
    };
    skillTrackerInstance = createSkillTracker(config);
  }
  return skillTrackerInstance;
}

function getPathRecommender() {
  if (!pathRecommenderInstance) {
    const stores = getLearningPathStores();
    const skillTracker = getSkillTracker();
    const config: PathRecommenderConfig = {
      pathStore: stores.learningPath,
      courseGraphStore: stores.courseGraph,
      skillTracker,
      defaultMaxSteps: 10,
      defaultMaxMinutes: 60,
      pathExpirationHours: 24,
      logger: {
        debug: (msg: string, meta?: Record<string, unknown>) => logger.debug(`[PathRecommender] ${msg}`, meta),
        info: (msg: string, meta?: Record<string, unknown>) => logger.info(`[PathRecommender] ${msg}`, meta),
        warn: (msg: string, meta?: Record<string, unknown>) => logger.warn(`[PathRecommender] ${msg}`, meta),
        error: (msg: string, meta?: Record<string, unknown>) => logger.error(`[PathRecommender] ${msg}`, meta),
      },
    };
    pathRecommenderInstance = createPathRecommender(config);
  }
  return pathRecommenderInstance;
}

// ============================================================================
// GET /api/sam/agentic/learning-path
// Returns active learning path or skill profile
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') ?? 'active-path';

    switch (action) {
      case 'active-path': {
        const courseId = searchParams.get('courseId') ?? undefined;
        const recommender = getPathRecommender();
        const path = await recommender.getActivePath(user.id, courseId);

        if (!path) {
          return NextResponse.json({
            success: true,
            data: { path: null, message: 'No active learning path found' },
          });
        }

        return NextResponse.json({
          success: true,
          data: {
            path: {
              id: path.id,
              userId: path.userId,
              courseId: path.courseId,
              targetConceptId: path.targetConceptId,
              steps: path.steps.map((step) => ({
                order: step.order,
                conceptId: step.conceptId,
                conceptName: step.conceptName,
                action: step.action,
                priority: step.priority,
                estimatedMinutes: step.estimatedMinutes,
                reason: step.reason,
                prerequisites: step.prerequisites,
              })),
              totalEstimatedMinutes: path.totalEstimatedMinutes,
              difficulty: path.difficulty,
              confidence: path.confidence,
              reason: path.reason,
              createdAt: path.createdAt.toISOString(),
              expiresAt: path.expiresAt.toISOString(),
            },
          },
        });
      }

      case 'skill-profile': {
        const tracker = getSkillTracker();
        const profile = await tracker.getSkillProfile(user.id);

        return NextResponse.json({
          success: true,
          data: {
            profile: {
              userId: profile.userId,
              skills: profile.skills.map((skill) => ({
                conceptId: skill.conceptId,
                conceptName: skill.conceptName,
                masteryLevel: Math.round(skill.masteryLevel),
                trend: skill.strengthTrend,
                practiceCount: skill.practiceCount,
                lastPracticedAt: skill.lastPracticedAt.toISOString(),
                nextReviewAt: skill.nextReviewAt?.toISOString(),
              })),
              masteredConcepts: profile.masteredConcepts,
              inProgressConcepts: profile.inProgressConcepts,
              strugglingConcepts: profile.strugglingConcepts,
              totalLearningTimeMinutes: profile.totalLearningTimeMinutes,
              streakDays: profile.streakDays,
              lastActivityAt: profile.lastActivityAt.toISOString(),
            },
          },
        });
      }

      case 'due-for-review': {
        const limit = parseInt(searchParams.get('limit') ?? '10', 10);
        const tracker = getSkillTracker();
        const dueForReview = await tracker.getConceptsDueForReview(user.id, limit);

        return NextResponse.json({
          success: true,
          data: {
            dueForReview: dueForReview.map((skill) => ({
              conceptId: skill.conceptId,
              conceptName: skill.conceptName,
              masteryLevel: Math.round(skill.masteryLevel),
              lastPracticedAt: skill.lastPracticedAt.toISOString(),
              nextReviewAt: skill.nextReviewAt?.toISOString(),
              daysSinceLastPractice: Math.floor(
                (Date.now() - skill.lastPracticedAt.getTime()) / (1000 * 60 * 60 * 24)
              ),
            })),
            total: dueForReview.length,
          },
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Error in learning-path GET:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve learning path data' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/sam/agentic/learning-path
// Generate paths, record performance, complete steps
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') ?? 'generate-path';

    switch (action) {
      case 'generate-path': {
        const parsed = getPathQuerySchema.safeParse({
          courseId: body.courseId ?? searchParams.get('courseId'),
          maxSteps: body.maxSteps ?? searchParams.get('maxSteps'),
          maxMinutes: body.maxMinutes ?? searchParams.get('maxMinutes'),
          includeReview: body.includeReview?.toString() ?? searchParams.get('includeReview'),
          focusOnWeakAreas: body.focusOnWeakAreas?.toString() ?? searchParams.get('focusOnWeakAreas'),
          difficultyPreference: body.difficultyPreference ?? searchParams.get('difficultyPreference'),
        });

        if (!parsed.success) {
          return NextResponse.json(
            { success: false, error: 'Invalid parameters', details: parsed.error.issues },
            { status: 400 }
          );
        }

        const recommender = getPathRecommender();
        const path = await recommender.generatePath(user.id, {
          courseId: parsed.data.courseId,
          maxSteps: parsed.data.maxSteps,
          maxMinutes: parsed.data.maxMinutes,
          includeReview: parsed.data.includeReview,
          focusOnWeakAreas: parsed.data.focusOnWeakAreas,
          difficultyPreference: parsed.data.difficultyPreference,
        });

        return NextResponse.json({
          success: true,
          data: {
            path: {
              id: path.id,
              steps: path.steps.map((step) => ({
                order: step.order,
                conceptId: step.conceptId,
                conceptName: step.conceptName,
                action: step.action,
                priority: step.priority,
                estimatedMinutes: step.estimatedMinutes,
                reason: step.reason,
              })),
              totalEstimatedMinutes: path.totalEstimatedMinutes,
              difficulty: path.difficulty,
              confidence: path.confidence,
              reason: path.reason,
              createdAt: path.createdAt.toISOString(),
              expiresAt: path.expiresAt.toISOString(),
            },
          },
        });
      }

      case 'generate-path-to-target': {
        const parsed = generatePathToTargetSchema.safeParse(body);

        if (!parsed.success) {
          return NextResponse.json(
            { success: false, error: 'Invalid parameters', details: parsed.error.issues },
            { status: 400 }
          );
        }

        const recommender = getPathRecommender();
        const path = await recommender.generatePathToTarget(
          user.id,
          parsed.data.targetConceptId,
          parsed.data.courseId
        );

        return NextResponse.json({
          success: true,
          data: {
            path: {
              id: path.id,
              targetConceptId: path.targetConceptId,
              steps: path.steps.map((step) => ({
                order: step.order,
                conceptId: step.conceptId,
                conceptName: step.conceptName,
                action: step.action,
                priority: step.priority,
                estimatedMinutes: step.estimatedMinutes,
                reason: step.reason,
                prerequisites: step.prerequisites,
              })),
              totalEstimatedMinutes: path.totalEstimatedMinutes,
              difficulty: path.difficulty,
              reason: path.reason,
            },
          },
        });
      }

      case 'record-performance': {
        const parsed = recordPerformanceSchema.safeParse(body);

        if (!parsed.success) {
          return NextResponse.json(
            { success: false, error: 'Invalid parameters', details: parsed.error.issues },
            { status: 400 }
          );
        }

        const tracker = getSkillTracker();
        const result = await tracker.recordPerformance({
          userId: user.id,
          conceptId: parsed.data.conceptId,
          completed: true,
          score: parsed.data.score,
          timeSpentMinutes: parsed.data.timeSpentMinutes,
          attemptCount: parsed.data.attemptCount,
          timestamp: new Date(),
        });

        return NextResponse.json({
          success: true,
          data: {
            result: {
              conceptId: result.conceptId,
              previousMastery: Math.round(result.previousMastery),
              newMastery: Math.round(result.newMastery),
              change: Math.round(result.masteryChange),
              trend: result.newTrend,
              unlockedConcepts: result.unlockedConcepts,
              recommendedNext: result.recommendedNext,
            },
          },
        });
      }

      case 'complete-step': {
        const parsed = completeStepSchema.safeParse(body);

        if (!parsed.success) {
          return NextResponse.json(
            { success: false, error: 'Invalid parameters', details: parsed.error.issues },
            { status: 400 }
          );
        }

        const recommender = getPathRecommender();
        await recommender.completeStep(parsed.data.pathId, parsed.data.stepOrder);

        return NextResponse.json({
          success: true,
          data: {
            message: `Step ${parsed.data.stepOrder} marked as completed`,
            pathId: parsed.data.pathId,
            stepOrder: parsed.data.stepOrder,
          },
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Error in learning-path POST:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process learning path request' },
      { status: 500 }
    );
  }
}
