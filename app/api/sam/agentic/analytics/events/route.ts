/**
 * SAM Agentic Analytics Events API
 * Ingests learning/assessment events for persistent analytics stores
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import {
  createProgressAnalyzer,
  createSkillAssessor,
  AssessmentSource,
} from '@sam-ai/agentic';
import { getAnalyticsStores } from '@/lib/sam/taxomind-context';

// ============================================================================
// LAZY SINGLETONS (using TaxomindContext for centralized store access)
// ============================================================================

let progressAnalyzerInstance: ReturnType<typeof createProgressAnalyzer> | null = null;
let skillAssessorInstance: ReturnType<typeof createSkillAssessor> | null = null;

function getProgressAnalyzer() {
  if (!progressAnalyzerInstance) {
    const stores = getAnalyticsStores();
    progressAnalyzerInstance = createProgressAnalyzer({
      logger,
      sessionStore: stores.learningSession,
      progressStore: stores.topicProgress,
      gapStore: stores.learningGap,
    });
  }
  return progressAnalyzerInstance;
}

function getSkillAssessor() {
  if (!skillAssessorInstance) {
    const stores = getAnalyticsStores();
    skillAssessorInstance = createSkillAssessor({
      logger,
      store: stores.skillAssessment,
    });
  }
  return skillAssessorInstance;
}

// ============================================================================
// VALIDATION
// ============================================================================

const AssessmentSourceSchema = z.enum([
  'quiz',
  'exercise',
  'project',
  'peer_review',
  'self_assessment',
  'ai_evaluation',
]);

const LearningSessionEventSchema = z.object({
  type: z.literal('learning_session'),
  data: z.object({
    topicId: z.string().min(1),
    durationMinutes: z.number().min(0).optional(),
    durationSeconds: z.number().min(0).optional(),
    activitiesCompleted: z.number().min(0).optional(),
    questionsAnswered: z.number().min(0).optional(),
    correctAnswers: z.number().min(0).optional(),
    conceptsCovered: z.array(z.string()).optional(),
    focusScore: z.number().min(0).max(1).optional(),
    startTime: z.string().datetime().optional(),
  }),
});

const PracticeSessionEventSchema = z.object({
  type: z.literal('practice_session'),
  data: LearningSessionEventSchema.shape.data,
});

const ContentCompletedEventSchema = z.object({
  type: z.literal('content_completed'),
  data: z.object({
    topicId: z.string().min(1),
    durationMinutes: z.number().min(0).optional(),
    durationSeconds: z.number().min(0).optional(),
    conceptsCovered: z.array(z.string()).optional(),
  }),
});

const AssessmentCompletedEventSchema = z.object({
  type: z.literal('assessment_completed'),
  data: z.object({
    skillId: z.string().min(1),
    skillName: z.string().optional(),
    score: z.number().min(0),
    maxScore: z.number().min(1).optional(),
    source: AssessmentSourceSchema.optional(),
    durationMinutes: z.number().min(0).optional(),
    durationSeconds: z.number().min(0).optional(),
    questionsAnswered: z.number().min(0).optional(),
    correctAnswers: z.number().min(0).optional(),
    topicId: z.string().optional(),
    evidence: z
      .array(
        z.object({
          type: z.string().min(1),
          description: z.string().min(1),
          score: z.number().optional(),
          timestamp: z.string().datetime().optional(),
          weight: z.number().min(0).max(1).optional().default(0.5),
        })
      )
      .optional(),
  }),
});

const AnalyticsEventSchema = z.discriminatedUnion('type', [
  LearningSessionEventSchema,
  PracticeSessionEventSchema,
  ContentCompletedEventSchema,
  AssessmentCompletedEventSchema,
]);

const AnalyticsEventsBatchSchema = z.object({
  events: z.array(AnalyticsEventSchema).min(1).max(200),
});

// ============================================================================
// HELPERS
// ============================================================================

const mapAssessmentSource = (source?: z.infer<typeof AssessmentSourceSchema>): AssessmentSource => {
  switch (source) {
    case 'exercise':
      return AssessmentSource.EXERCISE;
    case 'project':
      return AssessmentSource.PROJECT;
    case 'peer_review':
      return AssessmentSource.PEER_REVIEW;
    case 'self_assessment':
      return AssessmentSource.SELF_ASSESSMENT;
    case 'ai_evaluation':
      return AssessmentSource.AI_EVALUATION;
    default:
      return AssessmentSource.QUIZ;
  }
};

const resolveDurationMinutes = (minutes?: number, seconds?: number): number | undefined => {
  if (typeof minutes === 'number') return minutes;
  if (typeof seconds === 'number') return Math.round(seconds / 60);
  return undefined;
};

const normalizeScore = (score: number, maxScore?: number): number => {
  if (maxScore && maxScore > 0) {
    return Math.min(100, (score / maxScore) * 100);
  }
  if (score <= 1) {
    return score * 100;
  }
  return Math.min(100, score);
};

// ============================================================================
// POST /api/sam/agentic/analytics/events
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

    const payload = await req.json();
    const events = 'events' in payload
      ? AnalyticsEventsBatchSchema.parse(payload).events
      : [AnalyticsEventSchema.parse(payload)];

    const progressAnalyzer = getProgressAnalyzer();
    const skillAssessor = getSkillAssessor();

    const results: Array<{
      type: string;
      status: 'recorded' | 'assessed' | 'skipped';
      sessionId?: string;
      assessmentId?: string;
      skillId?: string;
    }> = [];

    for (const event of events) {
      switch (event.type) {
        case 'learning_session':
        case 'practice_session': {
          const duration = resolveDurationMinutes(
            event.data.durationMinutes,
            event.data.durationSeconds
          );

          const session = await progressAnalyzer.recordSession({
            userId: user.id,
            topicId: event.data.topicId,
            startTime: event.data.startTime ? new Date(event.data.startTime) : undefined,
            duration,
            activitiesCompleted: event.data.activitiesCompleted,
            questionsAnswered: event.data.questionsAnswered,
            correctAnswers: event.data.correctAnswers,
            conceptsCovered: event.data.conceptsCovered,
            focusScore: event.data.focusScore,
          });

          results.push({
            type: event.type,
            status: 'recorded',
            sessionId: session.id,
          });
          break;
        }
        case 'content_completed': {
          const duration = resolveDurationMinutes(
            event.data.durationMinutes,
            event.data.durationSeconds
          );
          const session = await progressAnalyzer.recordSession({
            userId: user.id,
            topicId: event.data.topicId,
            duration,
            activitiesCompleted: 1,
            conceptsCovered: event.data.conceptsCovered,
          });

          results.push({
            type: event.type,
            status: 'recorded',
            sessionId: session.id,
          });
          break;
        }
        case 'assessment_completed': {
          const normalizedScore = normalizeScore(event.data.score, event.data.maxScore);
          const assessment = await skillAssessor.assessSkill({
            userId: user.id,
            skillId: event.data.skillId,
            skillName: event.data.skillName,
            score: normalizedScore,
            maxScore: event.data.maxScore ?? 100,
            source: mapAssessmentSource(event.data.source),
            duration: resolveDurationMinutes(
              event.data.durationMinutes,
              event.data.durationSeconds
            ),
            questionsAnswered: event.data.questionsAnswered,
            correctAnswers: event.data.correctAnswers,
            evidence: event.data.evidence?.map((e) => ({
              ...e,
              timestamp: e.timestamp ? new Date(e.timestamp) : new Date(),
              weight: e.weight ?? 0.5,
            })),
          });

          if (event.data.topicId) {
            await progressAnalyzer.recordSession({
              userId: user.id,
              topicId: event.data.topicId,
              duration: resolveDurationMinutes(
                event.data.durationMinutes,
                event.data.durationSeconds
              ),
              questionsAnswered: event.data.questionsAnswered,
              correctAnswers: event.data.correctAnswers,
              conceptsCovered: [event.data.skillId],
            });
          }

          results.push({
            type: event.type,
            status: 'assessed',
            assessmentId: assessment.id,
            skillId: assessment.skillId,
          });
          break;
        }
        default:
          // Cast to access type for exhaustiveness handling
          results.push({ type: (event as { type: string }).type, status: 'skipped' });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        processed: results.length,
        results,
      },
    });
  } catch (error) {
    logger.error('Error ingesting analytics events:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid event payload', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to ingest analytics events' },
      { status: 500 }
    );
  }
}
