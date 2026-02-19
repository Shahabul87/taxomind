/**
 * SkillBuildTrack Sync Service
 *
 * Syncs practice session data to the SkillBuildTrack engine when sessions complete.
 * This bridges the 10K practice system with the multi-dimensional SkillBuildTrack profiles.
 *
 * Phase 3 Enhancement: Uses evidence-based scoring that prioritizes actual outcomes
 * (assessments, projects, peer reviews) over self-reported metrics.
 */

import { getStore } from '@/lib/sam/taxomind-context';
import { createSkillBuildTrackEngine } from '@sam-ai/educational';
import { logger } from '@/lib/logger';
import {
  calculateEvidenceBasedScore,
  type QualityScoringInputs,
  type EvidenceType,
  type ProjectOutcome,
} from '@/lib/sam/quality/multi-signal-scorer';
import type { PracticeSessionType, PracticeFocusLevel } from '@/lib/sam/stores/prisma-practice-session-store';

// ============================================================================
// TYPES
// ============================================================================

export interface SessionSyncData {
  userId: string;
  skillId: string;
  skillName: string;
  durationMinutes: number;
  qualityMultiplier: number;
  sessionType: string;
  focusLevel: string;
  bloomsLevel?: string | null;
  courseId?: string | null;
  rawHours: number;
  qualityHours: number;

  // Enhanced quality scoring inputs (Phase 3)
  distractionCount?: number;
  breaksTaken?: number;
  pomodoroCount?: number;
  assessmentScore?: number;
  assessmentPassed?: boolean;
  projectOutcome?: ProjectOutcome;
  peerReviewScore?: number;
  selfRatedDifficulty?: number;
}

export interface SyncResult {
  synced: boolean;
  previousLevel?: string;
  newLevel?: string;
  levelChanged?: boolean;
  compositeScore?: number;
  decayDaysReset?: number;
  error?: string;

  // Evidence-based scoring metadata (Phase 3)
  scoreUsed?: number;
  scoreConfidence?: number;
  evidenceType?: EvidenceType;
}

// ============================================================================
// FOCUS LEVEL TO SCORE MAPPING
// ============================================================================

const FOCUS_TO_SCORE_BOOST: Record<string, number> = {
  DEEP_FLOW: 20, // +20 points for deep flow
  HIGH: 10, // +10 for high focus
  MEDIUM: 0, // baseline
  LOW: -10, // -10 for low focus
  VERY_LOW: -20, // -20 for very low focus
};

const BLOOMS_TO_SCORE_BOOST: Record<string, number> = {
  CREATE: 15,
  EVALUATE: 12,
  ANALYZE: 9,
  APPLY: 6,
  UNDERSTAND: 3,
  REMEMBER: 0,
};

// ============================================================================
// SYNC FUNCTION
// ============================================================================

/**
 * Syncs a completed practice session to SkillBuildTrack.
 * This updates the multi-dimensional skill profile, resets decay, and recalculates velocity.
 *
 * Phase 3 Enhancement: Uses evidence-based scoring that prioritizes actual outcomes
 * (assessments, projects, peer reviews) over self-reported proxy metrics.
 */
export async function syncSessionToSkillBuildTrack(
  data: SessionSyncData
): Promise<SyncResult> {
  try {
    // Get the SkillBuildTrack store from context
    const store = getStore('skillBuildTrack');

    if (!store) {
      logger.warn('SkillBuildTrack store not available, skipping sync');
      return { synced: false, error: 'Store not available' };
    }

    // Create the engine with database adapter
    // @ts-expect-error - Store adapter compatibility: getStore returns a runtime-compatible adapter that doesn't match the strict SAMConfig type
    const engine = createSkillBuildTrackEngine({ samConfig: {}, database: store });

    // Build quality scoring inputs from session data
    const qualityInputs: QualityScoringInputs = {
      sessionType: data.sessionType as PracticeSessionType,
      focusLevel: data.focusLevel as PracticeFocusLevel,
      bloomsLevel: data.bloomsLevel ?? undefined,
      durationMinutes: data.durationMinutes,
      distractionCount: data.distractionCount ?? 0,
      breaksTaken: data.breaksTaken ?? 0,
      pomodoroCount: data.pomodoroCount ?? 0,
      assessmentScore: data.assessmentScore,
      assessmentPassed: data.assessmentPassed,
      projectOutcome: data.projectOutcome,
      peerReviewScore: data.peerReviewScore,
      selfRatedDifficulty: data.selfRatedDifficulty,
    };

    // Calculate evidence-based score
    // This prioritizes actual outcomes over proxy metrics
    const evidenceScore = calculateEvidenceBasedScore(qualityInputs);

    // Log scoring decision for transparency
    logger.debug(
      `Evidence-based scoring: type=${evidenceScore.evidenceType}, ` +
        `score=${evidenceScore.score}, confidence=${evidenceScore.confidence.toFixed(2)}`
    );

    // Determine source type based on session context
    let sourceType: 'COURSE' | 'PROJECT' | 'EXERCISE' | 'ASSESSMENT' | 'REAL_WORLD' = 'EXERCISE';
    if (data.courseId) {
      sourceType = 'COURSE';
    } else if (data.sessionType === 'ASSESSMENT') {
      sourceType = 'ASSESSMENT';
    } else if (data.sessionType === 'DELIBERATE') {
      sourceType = 'PROJECT'; // Deliberate practice is more like project work
    } else if (data.projectOutcome) {
      sourceType = 'PROJECT';
    }

    // Record the practice in SkillBuildTrack
    const result = await engine.recordPractice({
      userId: data.userId,
      skillId: data.skillId,
      durationMinutes: data.durationMinutes,
      score: evidenceScore.score,
      maxScore: 100,
      isAssessment: data.sessionType === 'ASSESSMENT',
      completed: true,
      sourceId: data.courseId ?? undefined,
      sourceType,
    });

    const previousLevel = result.levelChange?.fromLevel ?? result.profile.proficiencyLevel;
    const newLevel = result.levelChange?.toLevel ?? result.profile.proficiencyLevel;
    const levelChanged = !!result.levelChange;

    logger.info(
      `Synced practice to SkillBuildTrack: user=${data.userId}, skill=${data.skillId}, ` +
        `duration=${data.durationMinutes}min, score=${evidenceScore.score} (${evidenceScore.evidenceType}, ` +
        `confidence=${evidenceScore.confidence.toFixed(2)}), ` +
        `previousLevel=${previousLevel}, newLevel=${newLevel}, ` +
        `levelChanged=${levelChanged}`
    );

    return {
      synced: true,
      previousLevel,
      newLevel,
      levelChanged,
      compositeScore: result.profile.compositeScore,
      decayDaysReset: result.profile.decay?.daysSinceLastPractice ?? 0,
      scoreUsed: evidenceScore.score,
      scoreConfidence: evidenceScore.confidence,
      evidenceType: evidenceScore.evidenceType,
    };
  } catch (error) {
    logger.error('Failed to sync session to SkillBuildTrack:', error);
    return {
      synced: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Batch sync multiple sessions (useful for catching up missed syncs).
 */
export async function batchSyncSessionsToSkillBuildTrack(
  sessions: SessionSyncData[]
): Promise<Map<string, SyncResult>> {
  const results = new Map<string, SyncResult>();

  for (const session of sessions) {
    const key = `${session.userId}:${session.skillId}`;
    const result = await syncSessionToSkillBuildTrack(session);
    results.set(key, result);
  }

  return results;
}
