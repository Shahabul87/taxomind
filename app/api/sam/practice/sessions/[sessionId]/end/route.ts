import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { getPracticeStores } from '@/lib/sam/taxomind-context';
import {
  SESSION_TYPE_MULTIPLIERS,
  FOCUS_LEVEL_MULTIPLIERS,
  BLOOMS_MULTIPLIERS,
} from '@/lib/sam/stores';
import { syncSessionToSkillBuildTrack } from '@/lib/practice/sync-skill-build';
import { getAchievementEngine } from '@/lib/adapters/achievement-adapter';
import {
  createTransactionalPracticeSessionOrchestrator,
  type TransactionalEndSessionInput,
} from '@/lib/sam/orchestrator/transactional-practice-session-orchestrator';

// Get practice stores from TaxomindContext singleton
const {
  practiceSession: practiceSessionStore,
  skillMastery10K: masteryStore,
  dailyPracticeLog: dailyLogStore,
  practiceGoal: practiceGoalStore,
} = getPracticeStores();

// Create orchestrator for transactional session management
const orchestrator = createTransactionalPracticeSessionOrchestrator();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const BloomsLevelEnum = z.enum([
  'REMEMBER',
  'UNDERSTAND',
  'APPLY',
  'ANALYZE',
  'EVALUATE',
  'CREATE',
]);

// Convert focus level string to numeric value for daily log
function focusLevelToNumber(level: string): number {
  const mapping: Record<string, number> = {
    VERY_LOW: 1,
    LOW: 2,
    MEDIUM: 3,
    HIGH: 4,
    DEEP_FLOW: 5,
  };
  return mapping[level] ?? 3;
}

// Type definitions for multiplier breakdown
type SessionType = keyof typeof SESSION_TYPE_MULTIPLIERS;
type FocusLevel = keyof typeof FOCUS_LEVEL_MULTIPLIERS;

interface MultiplierBreakdown {
  sessionType: {
    level: string;
    multiplier: number;
    description: string;
  };
  focusLevel: {
    level: string;
    multiplier: number;
    description: string;
  };
  bloomsLevel: {
    level: string | null;
    multiplier: number;
    description: string;
  };
  combined: {
    raw: number;
    capped: number;
    wasCapped: boolean;
  };
  qualityImpact: {
    rawHours: number;
    qualityHours: number;
    hoursGained: number;
    percentageBoost: number;
  };
}

// Get description for session type
function getSessionTypeDescription(type: string): string {
  const descriptions: Record<string, string> = {
    DELIBERATE: 'Focused, intentional practice with specific goals',
    POMODORO: 'Time-boxed deep work sessions',
    GUIDED: 'Following structured learning materials',
    ASSESSMENT: 'Testing your knowledge and skills',
    CASUAL: 'Light, relaxed practice',
    REVIEW: 'Reviewing previously learned material',
  };
  return descriptions[type] || 'Standard practice session';
}

// Get description for focus level
function getFocusLevelDescription(level: string): string {
  const descriptions: Record<string, string> = {
    DEEP_FLOW: 'Complete immersion, peak performance state',
    HIGH: 'Strong concentration, minimal distractions',
    MEDIUM: 'Normal focus, occasional distractions',
    LOW: 'Frequent distractions, interrupted flow',
    VERY_LOW: 'Highly distracted, minimal engagement',
  };
  return descriptions[level] || 'Normal focus level';
}

// Get description for Bloom's level
function getBloomsLevelDescription(level: string | null): string {
  if (!level) return 'No cognitive level specified';

  const descriptions: Record<string, string> = {
    CREATE: 'Producing new work, designing solutions',
    EVALUATE: 'Judging, critiquing, defending ideas',
    ANALYZE: 'Breaking down, examining relationships',
    APPLY: 'Using knowledge in new situations',
    UNDERSTAND: 'Explaining, summarizing concepts',
    REMEMBER: 'Recalling facts and basic concepts',
  };
  return descriptions[level.toUpperCase()] || 'Cognitive engagement level';
}

// Generate detailed multiplier breakdown
function generateMultiplierBreakdown(
  sessionType: string,
  focusLevel: string,
  bloomsLevel: string | null,
  rawHours: number,
  qualityHours: number
): MultiplierBreakdown {
  const sessionTypeMultiplier = SESSION_TYPE_MULTIPLIERS[sessionType as SessionType] ?? 1.0;
  const focusMultiplier = FOCUS_LEVEL_MULTIPLIERS[focusLevel as FocusLevel] ?? 1.0;
  const bloomsMultiplier = bloomsLevel
    ? BLOOMS_MULTIPLIERS[bloomsLevel.toUpperCase()] ?? 1.0
    : 1.0;

  const rawCombined = sessionTypeMultiplier * focusMultiplier * bloomsMultiplier;
  const cappedCombined = Math.min(rawCombined, 2.5);
  const hoursGained = qualityHours - rawHours;
  const percentageBoost = rawHours > 0 ? ((qualityHours - rawHours) / rawHours) * 100 : 0;

  return {
    sessionType: {
      level: sessionType,
      multiplier: sessionTypeMultiplier,
      description: getSessionTypeDescription(sessionType),
    },
    focusLevel: {
      level: focusLevel,
      multiplier: focusMultiplier,
      description: getFocusLevelDescription(focusLevel),
    },
    bloomsLevel: {
      level: bloomsLevel,
      multiplier: bloomsMultiplier,
      description: getBloomsLevelDescription(bloomsLevel),
    },
    combined: {
      raw: rawCombined,
      capped: cappedCombined,
      wasCapped: rawCombined > 2.5,
    },
    qualityImpact: {
      rawHours,
      qualityHours,
      hoursGained,
      percentageBoost,
    },
  };
}

const ProjectOutcomeEnum = z.enum(['SUCCESS', 'PARTIAL', 'FAILED']);
const FocusLevelEnum = z.enum(['DEEP_FLOW', 'HIGH', 'MEDIUM', 'LOW', 'VERY_LOW']);

const EndSessionSchema = z.object({
  // Existing fields
  bloomsLevel: BloomsLevelEnum.optional(),
  difficultyRating: z.number().min(1).max(10).optional(),
  notes: z.string().max(2000).optional(),
  reflection: z.string().max(2000).optional(),
  accomplishments: z.array(z.string()).optional(),
  focusLevel: FocusLevelEnum.optional(),
  distractionCount: z.number().min(0).optional(),
  pomodoroCount: z.number().min(0).optional(),
  breaksTaken: z.number().min(0).optional(),

  // Phase 3: Enhanced Quality Scoring Inputs
  selfRatedDifficulty: z.number().min(1).max(5).optional(),
  assessmentScore: z.number().min(0).max(100).optional(),
  assessmentPassed: z.boolean().optional(),
  projectOutcome: ProjectOutcomeEnum.optional(),
  peerReviewScore: z.number().min(0).max(100).optional(),

  // Phase 2: Timezone support
  timezone: z.string().optional(),

  // Custom target hours for skill mastery (defaults to 10000)
  targetHours: z.number().min(1).max(100000).optional(),

  // Feature flag: Use transactional orchestrator
  useTransactional: z.boolean().optional().default(true),
});

// ============================================================================
// POST - End a practice session (completes and records hours)
// ============================================================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;

    // Verify session exists and belongs to user
    const existingSession = await practiceSessionStore.getById(sessionId);

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Practice session not found' },
        { status: 404 }
      );
    }

    if (existingSession.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only active or paused sessions can be ended
    if (existingSession.status !== 'ACTIVE' && existingSession.status !== 'PAUSED') {
      return NextResponse.json(
        {
          error: 'Cannot end session',
          message: 'Only active or paused sessions can be ended',
        },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const validated = EndSessionSchema.parse(body);

    // Build orchestrator input with Phase 3/4 fields
    const orchestratorInput: TransactionalEndSessionInput = {
      notes: validated.notes
        ? (existingSession.notes ? `${existingSession.notes}\n\n${validated.notes}` : validated.notes)
        : undefined,
      focusLevel: validated.focusLevel,
      distractionCount: validated.distractionCount,
      pomodoroCount: validated.pomodoroCount,
      breaksTaken: validated.breaksTaken,
      timezone: validated.timezone,
      // Custom target hours for skill mastery
      targetHours: validated.targetHours,
      // Phase 3: Enhanced quality scoring inputs
      selfRatedDifficulty: validated.selfRatedDifficulty,
      assessmentScore: validated.assessmentScore,
      assessmentPassed: validated.assessmentPassed,
      projectOutcome: validated.projectOutcome,
      peerReviewScore: validated.peerReviewScore,
    };

    // Use transactional orchestrator for atomic session end with Phase 3/4 features
    const result = await orchestrator.endSessionTransactionally(sessionId, orchestratorInput);

    const {
      session: completedSession,
      mastery: updatedMastery,
      dailyLog,
      newMilestones,
      streakContinued,
      firstPracticeToday,
      qualityScore,
      validation,
      focusDrift,
    } = result;

    // Calculate session duration in minutes
    const sessionDurationMinutes = completedSession.rawHours * 60;

    // Sync to SkillBuildTrack for multi-dimensional tracking (with Phase 3 evidence-based scoring)
    let skillBuildSyncResult = null;
    if (existingSession.skillId) {
      skillBuildSyncResult = await syncSessionToSkillBuildTrack({
        userId: session.user.id,
        skillId: existingSession.skillId,
        skillName: existingSession.skillName ?? 'Unknown Skill',
        durationMinutes: sessionDurationMinutes,
        qualityMultiplier: completedSession.qualityMultiplier,
        sessionType: completedSession.sessionType,
        focusLevel: completedSession.focusLevel,
        bloomsLevel: completedSession.bloomsLevel,
        courseId: existingSession.courseId,
        rawHours: completedSession.rawHours,
        qualityHours: completedSession.qualityHours,
        // Phase 3: Enhanced quality scoring inputs
        distractionCount: completedSession.distractionCount,
        breaksTaken: completedSession.breaksTaken,
        pomodoroCount: completedSession.pomodoroCount,
        assessmentScore: validated.assessmentScore,
        assessmentPassed: validated.assessmentPassed,
        projectOutcome: validated.projectOutcome,
        peerReviewScore: validated.peerReviewScore,
        selfRatedDifficulty: validated.selfRatedDifficulty,
      });
    }

    // Auto-update practice goals based on session results
    const goalUpdates = await practiceGoalStore.updateGoalsOnSessionEnd(
      session.user.id,
      {
        rawHours: completedSession.rawHours,
        qualityHours: completedSession.qualityHours,
        sessionsCount: 1,
        skillId: existingSession.skillId ?? undefined,
      }
    );

    // Log any completed goals
    const completedGoals = goalUpdates.filter((g) => g.wasCompleted);
    if (completedGoals.length > 0) {
      logger.info(
        `User ${session.user.id} completed ${completedGoals.length} goal(s): ` +
        completedGoals.map((g) => g.goal.title).join(', ')
      );
    }

    // Generate detailed multiplier breakdown (using Phase 3 quality score)
    const multiplierBreakdown = generateMultiplierBreakdown(
      completedSession.sessionType,
      completedSession.focusLevel,
      completedSession.bloomsLevel ?? null,
      completedSession.rawHours,
      completedSession.qualityHours
    );

    logger.info(
      `Ended practice session: ${sessionId}, ` +
      `raw hours: ${completedSession.rawHours.toFixed(2)}, ` +
      `quality hours: ${completedSession.qualityHours.toFixed(2)}, ` +
      `multiplier: ${completedSession.qualityMultiplier.toFixed(2)}, ` +
      `validation: ${validation.isValid ? 'VALID' : `FLAGGED (${validation.flags.join(', ')})`}, ` +
      `focusDrift: ${focusDrift.driftDirection}`
    );

    // Build response message with multiplier insights
    let message = `Great practice! You logged ${completedSession.rawHours.toFixed(2)} hours ` +
      `(${completedSession.qualityHours.toFixed(2)} quality hours with ${completedSession.qualityMultiplier.toFixed(1)}x multiplier)`;

    // Add multiplier breakdown to message
    const boostPercent = multiplierBreakdown.qualityImpact.percentageBoost;
    if (boostPercent > 0) {
      message += ` - ${boostPercent.toFixed(0)}% boost from your practice style!`;
    }

    if (completedGoals.length > 0) {
      message += ` You completed ${completedGoals.length} goal(s)!`;
    }

    if (firstPracticeToday) {
      message += ' First practice today!';
    }

    if (streakContinued && updatedMastery) {
      message += ` Streak: ${updatedMastery.currentStreak} days!`;
    }

    // Add tips for improving multiplier (combine with focus drift recommendations)
    const tips: string[] = [];
    if (multiplierBreakdown.focusLevel.multiplier < 1.0) {
      tips.push('Try minimizing distractions to boost your focus multiplier');
    }
    if (!completedSession.bloomsLevel || multiplierBreakdown.bloomsLevel.multiplier < 0.9) {
      tips.push('Engage in higher cognitive activities like creating or evaluating for better quality hours');
    }
    if (multiplierBreakdown.sessionType.multiplier < 1.25) {
      tips.push('Consider deliberate or pomodoro sessions for higher quality multipliers');
    }
    // Add focus drift recommendations
    tips.push(...focusDrift.recommendations.slice(0, 2));

    // Add validation warnings if session was adjusted
    const warnings: string[] = [];
    if (validation.wasAdjusted) {
      warnings.push(`Session duration was adjusted from ${validation.originalDuration} to ${completedSession.durationMinutes} minutes`);
    }
    if (!validation.isValid) {
      warnings.push(`Session validation flags: ${validation.flags.join(', ')}`);
    }

    getAchievementEngine()
      .then((engine) => engine.trackProgress(
        session.user.id,
        'form_completed',
        { sessionId, qualityHours: completedSession.qualityHours },
        {
          courseId: completedSession.courseId ?? undefined,
          chapterId: completedSession.chapterId ?? undefined,
          sectionId: completedSession.sectionId ?? undefined,
        }
      ))
      .catch((err) => {
        logger.warn('[Practice Session] Achievement tracking failed', { error: err });
      });

    return NextResponse.json({
      success: true,
      data: {
        session: completedSession,
        mastery: updatedMastery,
        newMilestones: newMilestones.map((m) => ({
          milestoneType: m.milestoneType,
          skillName: m.skillName,
          hoursRequired: m.hoursRequired,
          xpReward: m.xpReward,
          badgeName: m.badgeName,
        })),
        dailyLog,
        goalUpdates: goalUpdates.map((g) => ({
          goalId: g.goal.id,
          title: g.goal.title,
          goalType: g.goal.goalType,
          previousValue: g.previousValue,
          newValue: g.newValue,
          targetValue: g.goal.targetValue,
          progressDelta: g.progressDelta,
          wasCompleted: g.wasCompleted,
          progressPercent: Math.min((g.newValue / g.goal.targetValue) * 100, 100),
        })),
        completedGoals: completedGoals.map((g) => ({
          id: g.goal.id,
          title: g.goal.title,
          goalType: g.goal.goalType,
          targetValue: g.goal.targetValue,
          completedAt: g.goal.completedAt,
        })),
        summary: {
          rawHours: completedSession.rawHours,
          qualityHours: completedSession.qualityHours,
          qualityMultiplier: completedSession.qualityMultiplier,
          totalQualityHours: updatedMastery?.totalQualityHours ?? 0,
          proficiencyLevel: updatedMastery?.proficiencyLevel ?? 'BEGINNER',
          currentStreak: updatedMastery?.currentStreak ?? 0,
          milestonesEarned: newMilestones.length,
          goalsUpdated: goalUpdates.length,
          goalsCompleted: completedGoals.length,
          firstPracticeToday,
          streakContinued,
        },
        skillBuildSync: skillBuildSyncResult
          ? {
              synced: skillBuildSyncResult.synced,
              levelChanged: skillBuildSyncResult.levelChanged,
              newLevel: skillBuildSyncResult.newLevel,
              compositeScore: skillBuildSyncResult.compositeScore,
              scoreUsed: skillBuildSyncResult.scoreUsed,
              scoreConfidence: skillBuildSyncResult.scoreConfidence,
              evidenceType: skillBuildSyncResult.evidenceType,
            }
          : null,
        multiplierBreakdown,
        // Phase 3: Enhanced quality scoring breakdown (mapped to UI types)
        qualityScoring: {
          multiplier: qualityScore.finalMultiplier, // UI expects 'multiplier'
          confidenceLevel: qualityScore.confidence, // UI expects 'confidenceLevel'
          evidenceType: qualityScore.evidenceType,
          breakdown: {
            timeWeight: qualityScore.breakdown.sessionType ?? 0,
            focusWeight: qualityScore.breakdown.focus ?? 0,
            bloomsWeight: qualityScore.breakdown.blooms ?? 0,
            sessionTypeWeight: qualityScore.breakdown.sessionType ?? 0,
            assessmentBonus: qualityScore.breakdown.assessment ?? 0,
            projectBonus: qualityScore.breakdown.project ?? 0,
            peerReviewBonus: qualityScore.breakdown.peerReview ?? 0,
            difficultyAdjustment: qualityScore.breakdown.difficulty ?? 0,
          },
          // Also include raw values for debugging/advanced use
          baseMultiplier: qualityScore.baseMultiplier,
          bloomsMultiplier: qualityScore.bloomsMultiplier,
          outcomeMultiplier: qualityScore.outcomeMultiplier,
          engagementBonus: qualityScore.engagementBonus,
          difficultyBonus: qualityScore.difficultyBonus,
        },
        // Phase 4: Session validation results (mapped to UI types)
        validation: {
          isValid: validation.isValid,
          flags: validation.flags,
          warnings: validation.flags.map((f: string) => `Session flagged: ${f}`),
          confidence: validation.confidence,
          adjustedDuration: validation.wasAdjusted ? validation.suggestedDuration : undefined, // UI expects 'adjustedDuration'
          // Also include raw values
          wasAdjusted: validation.wasAdjusted,
          originalDuration: validation.originalDuration,
        },
        // Phase 4: Focus drift analysis (mapped to UI types)
        focusDrift: {
          overallDrift: focusDrift.driftDirection, // UI expects 'overallDrift'
          driftSeverity: focusDrift.driftSeverity,
          trendLine: { slope: focusDrift.driftScore, intercept: 0 },
          volatility: Math.abs(focusDrift.driftScore),
          fatigueIndicators: focusDrift.fatigueIndicators,
          recommendations: focusDrift.recommendations,
          // Also include raw values
          score: focusDrift.driftScore,
          optimalSessionLength: focusDrift.optimalSessionLength,
          breakRecommended: focusDrift.breakRecommended,
        },
        improvementTips: tips.length > 0 ? tips : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
      },
      message,
    });
  } catch (error) {
    logger.error('Error ending practice session:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to end practice session' },
      { status: 500 }
    );
  }
}
