/**
 * Cross-Feature Data Flow Bridge
 *
 * Wires data between independent SAM subsystems that otherwise operate in silos:
 *
 * 1. Assessment results  -> SkillBuildTrack engine (proficiency / decay model)
 * 2. Assessment results  -> Behavior monitor (proactive intervention patterns)
 * 3. Chat skill analysis -> SkillBuildTrack engine (self-assessment evidence)
 *
 * Each bridge function is fire-and-forget with internal error handling so that
 * a failure in one subsystem never blocks the caller.
 */

import { logger } from '@/lib/logger';
import {
  createSkillBuildTrackEngine,
  type SkillBuildTrackEngineConfig,
  type SkillBuildProficiencyLevel,
  type SkillBuildEvidenceType,
} from '@sam-ai/educational';
import { createSAMConfig } from '@sam-ai/core';
import { getCoreAIAdapter } from '@/lib/sam/integration-adapters';
import { getStore } from '@/lib/sam/taxomind-context';
import { trackAssessmentAttempt } from '@/lib/sam/proactive-intervention-integration';

// ============================================================================
// SHARED SKILL BUILD TRACK ENGINE (lazy singleton)
// ============================================================================

let sharedEngine: ReturnType<typeof createSkillBuildTrackEngine> | null = null;
let engineInitPromise: Promise<ReturnType<typeof createSkillBuildTrackEngine>> | null = null;

async function getSharedSkillBuildTrackEngine(): Promise<ReturnType<typeof createSkillBuildTrackEngine>> {
  if (sharedEngine) return sharedEngine;

  // Avoid concurrent initialization races
  if (engineInitPromise) return engineInitPromise;

  engineInitPromise = (async () => {
    const store = getStore('skillBuildTrack');
    const coreAiAdapter = await getCoreAIAdapter();
    const aiAdapter = coreAiAdapter ?? {
      name: 'cross-feature-bridge-fallback',
      version: '1.0.0',
      chat: async () => ({
        content: '',
        model: 'fallback',
        usage: { inputTokens: 0, outputTokens: 0 },
        finishReason: 'stop' as const,
      }),
      isConfigured: () => false,
      getModel: () => 'fallback',
    };

    const samConfig = createSAMConfig({
      ai: aiAdapter,
      logger: {
        debug: (msg: string, data?: unknown) => logger.debug(msg, data),
        info: (msg: string, data?: unknown) => logger.info(msg, data),
        warn: (msg: string, data?: unknown) => logger.warn(msg, data),
        error: (msg: string, data?: unknown) => logger.error(msg, data),
      },
      features: {
        gamification: false,
        formSync: false,
        autoContext: true,
        emotionDetection: false,
        learningStyleDetection: false,
        streaming: false,
        analytics: true,
      },
    });

    const config: SkillBuildTrackEngineConfig = {
      samConfig,
      database: store as unknown as import('@sam-ai/core').SAMDatabaseAdapter,
      enableVelocityTracking: true,
      enableDecayPrediction: true,
      enableBenchmarking: false,
    };

    sharedEngine = createSkillBuildTrackEngine(config);
    return sharedEngine;
  })();

  return engineInitPromise;
}

// ============================================================================
// BRIDGE 1: Assessment Results -> SkillBuildTrack (decay / proficiency model)
// ============================================================================

export interface AssessmentBridgeInput {
  userId: string;
  sectionId: string;
  sectionTitle: string;
  courseId?: string;
  scorePercentage: number;
  maxScore: number;
  timeSpentMinutes: number;
  isPassed: boolean;
  bloomsLevel?: string;
  attemptId: string;
}

/**
 * Forward exam assessment results to the SkillBuildTrack engine so that
 * the proficiency model is updated and decay predictions stay accurate.
 *
 * Records both a practice session and a piece of evidence.
 */
export async function bridgeAssessmentToSkillTrack(
  input: AssessmentBridgeInput,
): Promise<void> {
  try {
    const engine = await getSharedSkillBuildTrackEngine();
    const skillId = input.sectionId;

    // Record practice session (feeds velocity tracking + last-practice timestamps)
    await engine.recordPractice({
      userId: input.userId,
      skillId,
      durationMinutes: input.timeSpentMinutes,
      score: input.scorePercentage,
      maxScore: 100,
      isAssessment: true,
      completed: true,
      sourceId: input.attemptId,
      sourceType: 'ASSESSMENT',
    });

    // Determine demonstrated proficiency level from score
    const demonstratedLevel = scoreToProficiencyLevel(input.scorePercentage);

    // Add evidence record (feeds proficiency level calculations + decay prediction)
    await engine.addEvidence({
      userId: input.userId,
      skillId,
      type: 'ASSESSMENT' as SkillBuildEvidenceType,
      title: `Exam: ${input.sectionTitle}`,
      description: `Scored ${input.scorePercentage.toFixed(1)}% on assessment for ${input.sectionTitle}`,
      sourceId: input.attemptId,
      demonstratedLevel: demonstratedLevel as SkillBuildProficiencyLevel,
      date: new Date(),
      score: input.scorePercentage,
      maxScore: 100,
    });

    logger.info('[CROSS_FEATURE_BRIDGE] Assessment forwarded to SkillBuildTrack', {
      userId: input.userId,
      skillId,
      scorePercentage: input.scorePercentage,
      demonstratedLevel,
    });
  } catch (error) {
    logger.warn('[CROSS_FEATURE_BRIDGE] Failed to forward assessment to SkillBuildTrack (non-fatal)', {
      error: error instanceof Error ? error.message : 'Unknown error',
      attemptId: input.attemptId,
    });
  }
}

// ============================================================================
// BRIDGE 2: Assessment Results -> Behavior Monitor (proactive interventions)
// ============================================================================

export interface AssessmentBehaviorInput {
  userId: string;
  sessionId: string;
  assessmentId: string;
  passed: boolean;
  score: number;
  maxScore: number;
  timeSpentMinutes: number;
  pageContext: {
    path: string;
    courseId?: string;
    chapterId?: string;
    sectionId?: string;
  };
}

/**
 * Emit an ASSESSMENT_ATTEMPT behavior event so the proactive intervention
 * system can detect patterns (e.g. repeated failures, struggling learners).
 */
export async function bridgeAssessmentToBehaviorMonitor(
  input: AssessmentBehaviorInput,
): Promise<void> {
  try {
    await trackAssessmentAttempt(
      input.userId,
      input.sessionId,
      input.pageContext,
      {
        assessmentId: input.assessmentId,
        passed: input.passed,
        score: input.score,
        maxScore: input.maxScore,
        timeSpentMinutes: input.timeSpentMinutes,
      },
    );

    logger.info('[CROSS_FEATURE_BRIDGE] Assessment forwarded to Behavior Monitor', {
      userId: input.userId,
      assessmentId: input.assessmentId,
      passed: input.passed,
    });
  } catch (error) {
    logger.warn('[CROSS_FEATURE_BRIDGE] Failed to forward assessment to Behavior Monitor (non-fatal)', {
      error: error instanceof Error ? error.message : 'Unknown error',
      assessmentId: input.assessmentId,
    });
  }
}

// ============================================================================
// BRIDGE 3: Chat Skill Assessment -> SkillBuildTrack (self-assessment evidence)
// ============================================================================

export interface ChatSkillBridgeInput {
  userId: string;
  skillId: string;
  skillName: string;
  score: number;
  bloomsLevel?: string;
}

/**
 * Forward chat-based skill analysis (from the agentic stage) to the
 * SkillBuildTrack engine as self-assessment evidence.
 */
export async function bridgeChatSkillToSkillTrack(
  input: ChatSkillBridgeInput,
): Promise<void> {
  try {
    const engine = await getSharedSkillBuildTrackEngine();

    const demonstratedLevel = scoreToProficiencyLevel(input.score);

    await engine.recordPractice({
      userId: input.userId,
      skillId: input.skillId,
      durationMinutes: 1, // Chat interactions are brief
      score: input.score,
      maxScore: 100,
      isAssessment: false,
      completed: true,
      sourceType: 'EXERCISE',
    });

    await engine.addEvidence({
      userId: input.userId,
      skillId: input.skillId,
      type: 'SELF_ASSESSMENT' as SkillBuildEvidenceType,
      title: `Chat analysis: ${input.skillName}`,
      description: `Blooms level ${input.bloomsLevel ?? 'N/A'} detected during chat interaction`,
      demonstratedLevel: demonstratedLevel as SkillBuildProficiencyLevel,
      date: new Date(),
      score: input.score,
      maxScore: 100,
    });

    logger.info('[CROSS_FEATURE_BRIDGE] Chat skill forwarded to SkillBuildTrack', {
      userId: input.userId,
      skillId: input.skillId,
      score: input.score,
    });
  } catch (error) {
    logger.warn('[CROSS_FEATURE_BRIDGE] Failed to forward chat skill to SkillBuildTrack (non-fatal)', {
      error: error instanceof Error ? error.message : 'Unknown error',
      skillId: input.skillId,
    });
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Map a percentage score to a proficiency level.
 */
function scoreToProficiencyLevel(score: number): SkillBuildProficiencyLevel {
  if (score >= 95) return 'EXPERT';
  if (score >= 85) return 'ADVANCED';
  if (score >= 75) return 'PROFICIENT';
  if (score >= 60) return 'COMPETENT';
  if (score >= 40) return 'BEGINNER';
  return 'NOVICE';
}
