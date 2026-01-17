/**
 * SkillBuildTrack Sync Service
 *
 * Syncs practice session data to the SkillBuildTrack engine when sessions complete.
 * This bridges the 10K practice system with the multi-dimensional SkillBuildTrack profiles.
 */

import { getStore } from '@/lib/sam/taxomind-context';
import { createSkillBuildTrackEngine } from '@sam-ai/educational';
import { logger } from '@/lib/logger';

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
}

export interface SyncResult {
  synced: boolean;
  previousLevel?: string;
  newLevel?: string;
  levelChanged?: boolean;
  compositeScore?: number;
  decayDaysReset?: number;
  error?: string;
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

    // Create the engine with the store
    const engine = createSkillBuildTrackEngine({ store });

    // Calculate a normalized score based on quality multiplier and focus level
    // Base score: quality multiplier normalized to 0-100 scale (multiplier of 1.0 = 50, 2.5 = 100)
    const baseScore = Math.min((data.qualityMultiplier / 2.5) * 100, 100);

    // Apply focus level boost
    const focusBoost = FOCUS_TO_SCORE_BOOST[data.focusLevel] ?? 0;

    // Apply Bloom's level boost if provided
    const bloomsBoost = data.bloomsLevel
      ? BLOOMS_TO_SCORE_BOOST[data.bloomsLevel.toUpperCase()] ?? 0
      : 0;

    // Final score capped at 100
    const finalScore = Math.min(Math.max(baseScore + focusBoost + bloomsBoost, 0), 100);

    // Determine source type based on session context
    let sourceType: 'COURSE' | 'PROJECT' | 'EXERCISE' | 'ASSESSMENT' | 'REAL_WORLD' = 'EXERCISE';
    if (data.courseId) {
      sourceType = 'COURSE';
    } else if (data.sessionType === 'ASSESSMENT') {
      sourceType = 'ASSESSMENT';
    } else if (data.sessionType === 'DELIBERATE') {
      sourceType = 'PROJECT'; // Deliberate practice is more like project work
    }

    // Record the practice in SkillBuildTrack
    const result = await engine.recordPractice({
      userId: data.userId,
      skillId: data.skillId,
      durationMinutes: data.durationMinutes,
      score: finalScore,
      maxScore: 100,
      isAssessment: data.sessionType === 'ASSESSMENT',
      completed: true,
      sourceId: data.courseId ?? undefined,
      sourceType,
    });

    logger.info(
      `Synced practice to SkillBuildTrack: user=${data.userId}, skill=${data.skillId}, ` +
        `duration=${data.durationMinutes}min, score=${finalScore.toFixed(1)}, ` +
        `previousLevel=${result.previousLevel}, newLevel=${result.newLevel}, ` +
        `levelChanged=${result.levelChanged}`
    );

    return {
      synced: true,
      previousLevel: result.previousLevel,
      newLevel: result.newLevel,
      levelChanged: result.levelChanged,
      compositeScore: result.profile.compositeScore,
      decayDaysReset: result.profile.decay?.daysSinceLastPractice ?? 0,
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
