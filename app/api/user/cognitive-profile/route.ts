import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { CognitiveLevel, CognitiveMilestoneType } from '@prisma/client';

// ==========================================
// Zod Validation Schemas
// ==========================================

const CognitiveProfileResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  overallLevel: z.number(),
  levelName: z.string(),
  levelNumber: z.number(),
  distribution: z.object({
    remember: z.number(),
    understand: z.number(),
    apply: z.number(),
    analyze: z.number(),
    evaluate: z.number(),
    create: z.number(),
  }),
  xp: z.object({
    remember: z.number(),
    understand: z.number(),
    apply: z.number(),
    analyze: z.number(),
    evaluate: z.number(),
    create: z.number(),
  }),
  levels: z.object({
    remember: z.number(),
    understand: z.number(),
    apply: z.number(),
    analyze: z.number(),
    evaluate: z.number(),
    create: z.number(),
  }),
  growth: z.object({
    startingLevel: z.number().nullable(),
    peakLevel: z.number().nullable(),
    totalGrowth: z.number(),
  }),
  strengths: z.array(z.string()),
  growthArea: z.string().nullable(),
  totalActivities: z.number(),
  lastActivityAt: z.string().nullable(),
  recentMilestones: z.array(z.object({
    id: z.string(),
    type: z.string(),
    level: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    achievedAt: z.string(),
    xpAwarded: z.number(),
  })),
  recommendations: z.array(z.object({
    type: z.string(),
    title: z.string(),
    description: z.string(),
    level: z.string(),
    courseId: z.string().optional(),
  })),
});

// ==========================================
// API Response Interface
// ==========================================

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>
  };
  metadata?: {
    timestamp: string;
    requestId: string;
  };
}

// ==========================================
// Constants
// ==========================================

const LEVEL_NAMES: Record<CognitiveLevel, { name: string; number: number }> = {
  REMEMBERER: { name: 'Rememberer', number: 1 },
  UNDERSTANDER: { name: 'Understander', number: 2 },
  APPLIER: { name: 'Applier', number: 3 },
  ANALYZER: { name: 'Analyzer', number: 4 },
  EVALUATOR: { name: 'Evaluator', number: 5 },
  CREATOR: { name: 'Creator', number: 6 },
};

const BLOOM_LEVELS = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'] as const;

// ==========================================
// Helper Functions
// ==========================================

function getLevelFromScore(overallLevel: number): CognitiveLevel {
  if (overallLevel >= 5.5) return 'CREATOR';
  if (overallLevel >= 4.5) return 'EVALUATOR';
  if (overallLevel >= 3.5) return 'ANALYZER';
  if (overallLevel >= 2.5) return 'APPLIER';
  if (overallLevel >= 1.5) return 'UNDERSTANDER';
  return 'REMEMBERER';
}

function calculateStrengths(distribution: Record<string, number>): string[] {
  const sorted = Object.entries(distribution)
    .sort(([, a], [, b]) => b - a)
    .filter(([, score]) => score >= 50);

  return sorted.slice(0, 2).map(([level]) => level);
}

function calculateGrowthArea(distribution: Record<string, number>): string | null {
  const sorted = Object.entries(distribution)
    .filter(([level]) => ['apply', 'analyze', 'evaluate', 'create'].includes(level))
    .sort(([, a], [, b]) => a - b);

  if (sorted.length > 0 && sorted[0][1] < 50) {
    return sorted[0][0];
  }
  return null;
}

function generateRecommendations(
  distribution: Record<string, number>,
  growthArea: string | null
): Array<{ type: string; title: string; description: string; level: string }> {
  const recommendations: Array<{ type: string; title: string; description: string; level: string }> = [];

  if (growthArea) {
    const levelDescriptions: Record<string, { title: string; description: string }> = {
      apply: {
        title: 'Practice Application Skills',
        description: 'Try hands-on exercises that require you to use concepts in new situations',
      },
      analyze: {
        title: 'Develop Analysis Skills',
        description: 'Work on case studies that require breaking down complex problems',
      },
      evaluate: {
        title: 'Build Evaluation Skills',
        description: 'Practice critiquing and comparing different approaches to problems',
      },
      create: {
        title: 'Unlock Creative Thinking',
        description: 'Take on projects that require designing original solutions',
      },
    };

    const levelInfo = levelDescriptions[growthArea];
    if (levelInfo) {
      recommendations.push({
        type: 'growth_area',
        level: growthArea.toUpperCase(),
        ...levelInfo,
      });
    }
  }

  // Add strength-based recommendations
  const strengths = calculateStrengths(distribution);
  if (strengths.length > 0) {
    recommendations.push({
      type: 'leverage_strength',
      level: strengths[0].toUpperCase(),
      title: `Your ${strengths[0]} Skills Are Strong`,
      description: 'Consider tackling more advanced challenges in this area',
    });
  }

  return recommendations;
}

// ==========================================
// GET - Fetch User Cognitive Profile
// ==========================================

export async function GET(request: NextRequest) {
  let session;
  try {
    session = await auth();

    if (!session?.user?.id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      };
      return NextResponse.json(response, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch or create cognitive profile
    let profile = await db.userCognitiveProfile.findUnique({
      where: { userId },
      include: {
        milestones: {
          orderBy: { achievedAt: 'desc' },
          take: 5,
        },
      },
    });

    // If no profile exists, create a default one
    if (!profile) {
      profile = await db.userCognitiveProfile.create({
        data: {
          userId,
          overallLevel: 1.0,
          levelName: 'REMEMBERER',
          rememberScore: 100,
          understandScore: 0,
          applyScore: 0,
          analyzeScore: 0,
          evaluateScore: 0,
          createScore: 0,
          rememberXP: 0,
          understandXP: 0,
          applyXP: 0,
          analyzeXP: 0,
          evaluateXP: 0,
          createXP: 0,
          rememberLevel: 1,
          understandLevel: 0,
          applyLevel: 0,
          analyzeLevel: 0,
          evaluateLevel: 0,
          createLevel: 0,
          startingLevel: 1.0,
          topStrengths: ['remember'],
          totalActivities: 0,
        },
        include: {
          milestones: {
            orderBy: { achievedAt: 'desc' },
            take: 5,
          },
        },
      });
    }

    // Build response
    const distribution = {
      remember: profile.rememberScore,
      understand: profile.understandScore,
      apply: profile.applyScore,
      analyze: profile.analyzeScore,
      evaluate: profile.evaluateScore,
      create: profile.createScore,
    };

    const xp = {
      remember: profile.rememberXP,
      understand: profile.understandXP,
      apply: profile.applyXP,
      analyze: profile.analyzeXP,
      evaluate: profile.evaluateXP,
      create: profile.createXP,
    };

    const levels = {
      remember: profile.rememberLevel,
      understand: profile.understandLevel,
      apply: profile.applyLevel,
      analyze: profile.analyzeLevel,
      evaluate: profile.evaluateLevel,
      create: profile.createLevel,
    };

    const levelInfo = LEVEL_NAMES[profile.levelName];
    const growthArea = profile.primaryGrowthArea || calculateGrowthArea(distribution);
    const recommendations = generateRecommendations(distribution, growthArea);

    const responseData = {
      id: profile.id,
      userId: profile.userId,
      overallLevel: profile.overallLevel,
      levelName: levelInfo.name,
      levelNumber: levelInfo.number,
      distribution,
      xp,
      levels,
      growth: {
        startingLevel: profile.startingLevel,
        peakLevel: profile.peakLevel,
        totalGrowth: profile.totalGrowth,
      },
      strengths: profile.topStrengths,
      growthArea,
      totalActivities: profile.totalActivities,
      lastActivityAt: profile.lastActivityAt?.toISOString() ?? null,
      recentMilestones: profile.milestones.map((m) => ({
        id: m.id,
        type: m.type,
        level: m.level,
        title: m.title,
        description: m.description,
        achievedAt: m.achievedAt.toISOString(),
        xpAwarded: m.xpAwarded,
      })),
      recommendations,
    };

    const validatedData = CognitiveProfileResponseSchema.parse(responseData);

    const response: ApiResponse<typeof validatedData> = {
      success: true,
      data: validatedData,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: request.headers.get('x-request-id') || 'unknown',
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('[COGNITIVE_PROFILE_GET] Validation error:', { error: error.errors });
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid profile data structure',
          details: { errors: error.errors },
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    logger.error('[COGNITIVE_PROFILE_GET] Unexpected error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: session?.user?.id,
    });

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Unable to load cognitive profile',
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// ==========================================
// POST - Recalculate Cognitive Profile
// ==========================================

const RecalculateRequestSchema = z.object({
  force: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  let session;
  try {
    session = await auth();

    if (!session?.user?.id) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      };
      return NextResponse.json(response, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    RecalculateRequestSchema.parse(body);

    // Fetch user&apos;s learning activity data
    // This includes exam attempts, quiz results, and course progress

    // 1. Get exam attempts with Bloom&apos;s level data
    const examAttempts = await db.userExamAttempt.findMany({
      where: {
        userId,
        status: 'COMPLETED',
      },
      include: {
        exam: {
          include: {
            bloomsProfile: true,
          },
        },
      },
    });

    // 2. Get student Bloom&apos;s progress across courses
    const bloomsProgress = await db.studentBloomsProgress.findMany({
      where: { userId },
    });

    // 3. Get performance metrics
    const performanceMetrics = await db.bloomsPerformanceMetric.findMany({
      where: { userId },
    });

    // Calculate aggregated scores
    const levelScores: Record<string, { total: number; count: number; xp: number }> = {
      remember: { total: 0, count: 0, xp: 0 },
      understand: { total: 0, count: 0, xp: 0 },
      apply: { total: 0, count: 0, xp: 0 },
      analyze: { total: 0, count: 0, xp: 0 },
      evaluate: { total: 0, count: 0, xp: 0 },
      create: { total: 0, count: 0, xp: 0 },
    };

    // Process exam attempts
    for (const attempt of examAttempts) {
      if (attempt.exam?.bloomsProfile) {
        const profile = attempt.exam.bloomsProfile;
        const distribution = profile.distribution as Record<string, number>;
        const score = attempt.score ?? 0;
        const maxScore = attempt.maxScore ?? 100;
        const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

        // Weight by both the exam&apos;s Bloom&apos;s distribution and the student&apos;s performance
        for (const [level, weight] of Object.entries(distribution)) {
          const normalizedLevel = level.toLowerCase();
          if (levelScores[normalizedLevel]) {
            const weightedScore = percentage * (weight / 100);
            levelScores[normalizedLevel].total += weightedScore;
            levelScores[normalizedLevel].count += 1;
            levelScores[normalizedLevel].xp += Math.round(weightedScore * 10);
          }
        }
      }
    }

    // Process Bloom&apos;s progress data
    for (const progress of bloomsProgress) {
      const levelData = progress.levelData as Record<string, number> | null;
      if (levelData) {
        for (const [level, score] of Object.entries(levelData)) {
          const normalizedLevel = level.toLowerCase();
          if (levelScores[normalizedLevel]) {
            levelScores[normalizedLevel].total += score;
            levelScores[normalizedLevel].count += 1;
            levelScores[normalizedLevel].xp += Math.round(score * 5);
          }
        }
      }
    }

    // Process performance metrics
    for (const metric of performanceMetrics) {
      const normalizedLevel = metric.bloomsLevel.toLowerCase();
      if (levelScores[normalizedLevel]) {
        const accuracy = metric.accuracy ?? 0;
        levelScores[normalizedLevel].total += accuracy * 100;
        levelScores[normalizedLevel].count += 1;
        levelScores[normalizedLevel].xp += Math.round(accuracy * 50);
      }
    }

    // Calculate final scores
    const finalScores: Record<string, number> = {};
    const finalXP: Record<string, number> = {};
    const finalLevels: Record<string, number> = {};

    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const [level, data] of Object.entries(levelScores)) {
      finalScores[level] = data.count > 0 ? data.total / data.count : 0;
      finalXP[level] = data.xp;
      // Level = XP / 1000, capped at 10
      finalLevels[level] = Math.min(10, Math.floor(data.xp / 1000));

      // Calculate overall level (weighted by Bloom&apos;s hierarchy)
      const levelWeight = BLOOM_LEVELS.indexOf(level.toUpperCase() as typeof BLOOM_LEVELS[number]) + 1;
      totalWeightedScore += finalScores[level] * levelWeight;
      totalWeight += levelWeight * 100; // Max score per level
    }

    // Overall level (1.0 - 6.0 scale)
    const overallLevel = totalWeight > 0
      ? Math.min(6, Math.max(1, 1 + (totalWeightedScore / totalWeight) * 5))
      : 1.0;

    const levelName = getLevelFromScore(overallLevel);
    const strengths = calculateStrengths(finalScores);
    const growthArea = calculateGrowthArea(finalScores);

    const totalActivities = examAttempts.length + bloomsProgress.length + performanceMetrics.length;

    // Upsert the profile
    const existingProfile = await db.userCognitiveProfile.findUnique({
      where: { userId },
    });

    const profileData = {
      overallLevel,
      levelName,
      rememberScore: finalScores.remember,
      understandScore: finalScores.understand,
      applyScore: finalScores.apply,
      analyzeScore: finalScores.analyze,
      evaluateScore: finalScores.evaluate,
      createScore: finalScores.create,
      rememberXP: finalXP.remember,
      understandXP: finalXP.understand,
      applyXP: finalXP.apply,
      analyzeXP: finalXP.analyze,
      evaluateXP: finalXP.evaluate,
      createXP: finalXP.create,
      rememberLevel: finalLevels.remember,
      understandLevel: finalLevels.understand,
      applyLevel: finalLevels.apply,
      analyzeLevel: finalLevels.analyze,
      evaluateLevel: finalLevels.evaluate,
      createLevel: finalLevels.create,
      topStrengths: strengths,
      primaryGrowthArea: growthArea,
      totalActivities,
      lastActivityAt: new Date(),
      lastCalculated: new Date(),
      peakLevel: existingProfile?.peakLevel
        ? Math.max(existingProfile.peakLevel, overallLevel)
        : overallLevel,
      totalGrowth: existingProfile?.startingLevel
        ? overallLevel - existingProfile.startingLevel
        : 0,
    };

    // Use a transaction to ensure profile update + milestone creation are atomic
    const updatedProfile = await db.$transaction(async (tx) => {
      if (existingProfile) {
        // Check for level-up
        const previousLevel = getLevelFromScore(existingProfile.overallLevel);
        const newLevel = getLevelFromScore(overallLevel);

        const profile = await tx.userCognitiveProfile.update({
          where: { userId },
          data: profileData,
          include: {
            milestones: {
              orderBy: { achievedAt: 'desc' },
              take: 5,
            },
          },
        });

        // Create milestone if level-up occurred
        if (LEVEL_NAMES[newLevel].number > LEVEL_NAMES[previousLevel].number) {
          await tx.cognitiveMilestone.create({
            data: {
              profileId: profile.id,
              type: 'LEVEL_UP',
              level: newLevel,
              title: `Reached ${LEVEL_NAMES[newLevel].name} Level!`,
              description: `You have grown from ${LEVEL_NAMES[previousLevel].name} to ${LEVEL_NAMES[newLevel].name}`,
              xpAwarded: (LEVEL_NAMES[newLevel].number - LEVEL_NAMES[previousLevel].number) * 500,
            },
          });
        }

        return profile;
      } else {
        return tx.userCognitiveProfile.create({
          data: {
            userId,
            ...profileData,
            startingLevel: overallLevel,
          },
          include: {
            milestones: {
              orderBy: { achievedAt: 'desc' },
              take: 5,
            },
          },
        });
      }
    });

    // Build response
    const levelInfo = LEVEL_NAMES[updatedProfile.levelName];

    const responseData = {
      id: updatedProfile.id,
      userId: updatedProfile.userId,
      overallLevel: updatedProfile.overallLevel,
      levelName: levelInfo.name,
      levelNumber: levelInfo.number,
      distribution: finalScores,
      xp: finalXP,
      levels: finalLevels,
      growth: {
        startingLevel: updatedProfile.startingLevel,
        peakLevel: updatedProfile.peakLevel,
        totalGrowth: updatedProfile.totalGrowth,
      },
      strengths: updatedProfile.topStrengths,
      growthArea: updatedProfile.primaryGrowthArea,
      totalActivities: updatedProfile.totalActivities,
      lastActivityAt: updatedProfile.lastActivityAt?.toISOString() ?? null,
      recentMilestones: updatedProfile.milestones.map((m) => ({
        id: m.id,
        type: m.type,
        level: m.level,
        title: m.title,
        description: m.description,
        achievedAt: m.achievedAt.toISOString(),
        xpAwarded: m.xpAwarded,
      })),
      recommendations: generateRecommendations(finalScores, growthArea),
    };

    const validatedData = CognitiveProfileResponseSchema.parse(responseData);

    const response: ApiResponse<typeof validatedData> = {
      success: true,
      data: validatedData,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: request.headers.get('x-request-id') || 'unknown',
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('[COGNITIVE_PROFILE_POST] Validation error:', { error: error.errors });
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: { errors: error.errors },
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    logger.error('[COGNITIVE_PROFILE_POST] Unexpected error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: session?.user?.id,
    });

    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Unable to recalculate cognitive profile',
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
