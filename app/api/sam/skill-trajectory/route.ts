/**
 * SAM AI - Skill Trajectory API
 *
 * Provides skill progression visualization and predictions using the
 * SkillBuildTrack engine. Shows proficiency level changes over time,
 * velocity metrics, and projections to target levels.
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { getStore } from '@/lib/sam/taxomind-context';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetTrajectorySchema = z.object({
  skillId: z.string().uuid().optional(),
  category: z
    .enum(['TECHNICAL', 'SOFT', 'DOMAIN', 'TOOL', 'METHODOLOGY', 'CERTIFICATION', 'LEADERSHIP'])
    .optional(),
  includeProjections: z.coerce.boolean().optional().default(true),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
});

// ============================================================================
// TYPES
// ============================================================================

interface SkillTrajectoryPoint {
  date: Date;
  compositeScore: number;
  proficiencyLevel: string;
  masteryScore: number;
  retentionScore: number;
}

interface SkillProjection {
  daysFromNow: number;
  projectedScore: number;
  projectedLevel: string;
  confidence: number;
}

interface SkillTrajectory {
  skillId: string;
  skillName: string;
  category: string;
  currentLevel: string;
  targetLevel?: string;
  compositeScore: number;
  dimensions: {
    mastery: number;
    retention: number;
    application: number;
    confidence: number;
    calibration: number;
  };
  velocity: {
    learningSpeed: number;
    trend: string;
    sessionsToNextLevel: number;
    daysToNextLevel: number;
  };
  decay: {
    riskLevel: string;
    daysUntilLevelDrop?: number;
    recommendedReviewDate?: Date;
  };
  history: SkillTrajectoryPoint[];
  projections: SkillProjection[];
  practiceStats: {
    totalSessions: number;
    totalMinutes: number;
    currentStreak: number;
    longestStreak: number;
    averageScore: number;
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const PROFICIENCY_LEVELS = ['NOVICE', 'BEGINNER', 'COMPETENT', 'PROFICIENT', 'ADVANCED', 'EXPERT', 'STRATEGIST'];

function getLevelIndex(level: string): number {
  return PROFICIENCY_LEVELS.indexOf(level);
}

function getNextLevel(currentLevel: string): string | null {
  const idx = getLevelIndex(currentLevel);
  if (idx < 0 || idx >= PROFICIENCY_LEVELS.length - 1) return null;
  return PROFICIENCY_LEVELS[idx + 1];
}

function projectFutureScore(
  currentScore: number,
  learningSpeed: number,
  daysFromNow: number,
  trend: string
): number {
  // Base projection using learning speed
  let dailyGain = learningSpeed / 30; // Convert monthly speed to daily

  // Adjust for trend
  if (trend === 'ACCELERATING') dailyGain *= 1.2;
  else if (trend === 'SLOWING') dailyGain *= 0.8;
  else if (trend === 'STAGNANT') dailyGain *= 0.3;
  else if (trend === 'DECLINING') dailyGain = -Math.abs(dailyGain) * 0.5;

  // Apply diminishing returns as score increases
  const diminishingFactor = 1 - currentScore / 150;
  const projectedGain = dailyGain * daysFromNow * diminishingFactor;

  return Math.max(0, Math.min(100, currentScore + projectedGain));
}

function scoreToLevel(score: number): string {
  if (score >= 95) return 'STRATEGIST';
  if (score >= 85) return 'EXPERT';
  if (score >= 70) return 'ADVANCED';
  if (score >= 55) return 'PROFICIENT';
  if (score >= 40) return 'COMPETENT';
  if (score >= 25) return 'BEGINNER';
  return 'NOVICE';
}

function calculateProjectionConfidence(daysFromNow: number, trend: string): number {
  // Confidence decreases with time and unstable trends
  let baseConfidence = Math.max(30, 95 - daysFromNow * 0.5);

  if (trend === 'STAGNANT' || trend === 'DECLINING') {
    baseConfidence *= 0.8;
  } else if (trend === 'ACCELERATING') {
    baseConfidence *= 0.9; // Acceleration is hard to maintain
  }

  return Math.round(baseConfidence);
}

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * GET - Get skill trajectory for user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const validatedParams = GetTrajectorySchema.parse({
      skillId: searchParams.get('skillId') || undefined,
      category: searchParams.get('category') || undefined,
      includeProjections: searchParams.get('includeProjections') || 'true',
      limit: searchParams.get('limit') || '20',
    });

    const skillBuildTrackStore = getStore('skillBuildTrack');

    // Get user skill profiles
    const profiles = await skillBuildTrackStore.getUserSkillProfiles(user.id, {
      category: validatedParams.category,
    });

    // Filter by specific skill if requested
    const filteredProfiles = validatedParams.skillId
      ? profiles.filter((p) => p.skillId === validatedParams.skillId)
      : profiles.slice(0, validatedParams.limit);

    // Build trajectory data for each skill
    const trajectories: SkillTrajectory[] = await Promise.all(
      filteredProfiles.map(async (profile) => {
        // Get practice logs for history
        const logs = await skillBuildTrackStore.getPracticeLogs(user.id, profile.skillId, 30);

        // Build history from logs
        const history: SkillTrajectoryPoint[] = logs.map((log) => ({
          date: log.timestamp,
          compositeScore: (log.score ?? 0) + (log.compositeScoreChange ?? 0),
          proficiencyLevel: profile.proficiencyLevel,
          masteryScore: log.dimensionChanges?.mastery ?? profile.dimensions.mastery,
          retentionScore: log.dimensionChanges?.retention ?? profile.dimensions.retention,
        }));

        // Generate projections if requested
        const projections: SkillProjection[] = [];
        if (validatedParams.includeProjections) {
          const projectionDays = [7, 14, 30, 60, 90];
          for (const days of projectionDays) {
            const projectedScore = projectFutureScore(
              profile.compositeScore,
              profile.velocity.learningSpeed,
              days,
              profile.velocity.trend
            );
            projections.push({
              daysFromNow: days,
              projectedScore: Math.round(projectedScore),
              projectedLevel: scoreToLevel(projectedScore),
              confidence: calculateProjectionConfidence(days, profile.velocity.trend),
            });
          }
        }

        return {
          skillId: profile.skillId,
          skillName: profile.skill?.name ?? profile.skillId,
          category: profile.skill?.category ?? 'TECHNICAL',
          currentLevel: profile.proficiencyLevel,
          targetLevel: profile.targetLevel,
          compositeScore: profile.compositeScore,
          dimensions: profile.dimensions,
          velocity: {
            learningSpeed: profile.velocity.learningSpeed,
            trend: profile.velocity.trend,
            sessionsToNextLevel: profile.velocity.sessionsToNextLevel,
            daysToNextLevel: profile.velocity.daysToNextLevel,
          },
          decay: {
            riskLevel: profile.decay.riskLevel,
            daysUntilLevelDrop: profile.decay.daysUntilLevelDrop,
            recommendedReviewDate: profile.decay.recommendedReviewDate,
          },
          history,
          projections,
          practiceStats: {
            totalSessions: profile.practiceHistory.totalSessions,
            totalMinutes: profile.practiceHistory.totalMinutes,
            currentStreak: profile.practiceHistory.currentStreak,
            longestStreak: profile.practiceHistory.longestStreak,
            averageScore: profile.practiceHistory.averageScore,
          },
        };
      })
    );

    // Calculate aggregate statistics
    const totalSkills = trajectories.length;
    const avgCompositeScore =
      totalSkills > 0
        ? trajectories.reduce((sum, t) => sum + t.compositeScore, 0) / totalSkills
        : 0;

    const levelDistribution = trajectories.reduce(
      (dist, t) => {
        dist[t.currentLevel] = (dist[t.currentLevel] || 0) + 1;
        return dist;
      },
      {} as Record<string, number>
    );

    const trendDistribution = trajectories.reduce(
      (dist, t) => {
        dist[t.velocity.trend] = (dist[t.velocity.trend] || 0) + 1;
        return dist;
      },
      {} as Record<string, number>
    );

    const atRiskSkills = trajectories.filter(
      (t) => t.decay.riskLevel === 'HIGH' || t.decay.riskLevel === 'CRITICAL'
    );

    // Generate recommendations
    const recommendations: Array<{ skillId: string; skillName: string; type: string; message: string }> =
      [];

    // Skills about to decay
    for (const skill of atRiskSkills) {
      recommendations.push({
        skillId: skill.skillId,
        skillName: skill.skillName,
        type: 'decay_warning',
        message: `${skill.skillName} is at ${skill.decay.riskLevel.toLowerCase()} risk of decay. Review recommended.`,
      });
    }

    // Skills close to next level
    const closeToLevelUp = trajectories.filter(
      (t) => t.velocity.sessionsToNextLevel > 0 && t.velocity.sessionsToNextLevel <= 5
    );
    for (const skill of closeToLevelUp.slice(0, 3)) {
      const nextLevel = getNextLevel(skill.currentLevel);
      if (nextLevel) {
        recommendations.push({
          skillId: skill.skillId,
          skillName: skill.skillName,
          type: 'level_up_soon',
          message: `${skill.skillName} is ${skill.velocity.sessionsToNextLevel} sessions away from ${nextLevel}!`,
        });
      }
    }

    // Stagnant skills
    const stagnantSkills = trajectories.filter((t) => t.velocity.trend === 'STAGNANT');
    for (const skill of stagnantSkills.slice(0, 2)) {
      recommendations.push({
        skillId: skill.skillId,
        skillName: skill.skillName,
        type: 'stagnant',
        message: `${skill.skillName} progress has stalled. Try different practice activities.`,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalSkills,
          avgCompositeScore: Math.round(avgCompositeScore),
          levelDistribution,
          trendDistribution,
          atRiskCount: atRiskSkills.length,
        },
        skills: trajectories,
        recommendations,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('[SKILL TRAJECTORY] Get error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid parameters', details: error.errors },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get skill trajectory' } },
      { status: 500 }
    );
  }
}
