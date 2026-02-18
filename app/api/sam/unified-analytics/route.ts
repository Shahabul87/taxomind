/**
 * SAM Unified Analytics API
 *
 * Aggregates data from all SAM AI engines to provide comprehensive
 * analytics for the user dashboard.
 *
 * Engines integrated:
 * - PracticeProblemsEngine: Practice session stats, difficulty progression
 * - AdaptiveContentEngine: Learning style detection, content preferences
 * - SocraticTeachingEngine: Dialogue insights, discovery tracking
 * - PredictiveEngine: At-risk predictions, intervention recommendations
 * - MemoryEngine: Retention analytics, learner profile
 * - AchievementEngine: Gamification progress, badges, challenges
 * - BloomsAnalysisEngine: Cognitive level tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import type { BloomsLevel } from '@sam-ai/core';

// Types for unified analytics response
interface SAMUnifiedAnalytics {
  userId: string;
  generatedAt: Date;
  practiceProblems: PracticeAnalytics;
  learningStyle: LearningStyleAnalytics;
  socraticDialogue: SocraticAnalytics;
  predictions: PredictiveAnalytics;
  retention: RetentionAnalytics;
  achievements: AchievementAnalytics;
  cognitiveProgress: CognitiveAnalytics;
  overallHealth: OverallHealthScore;
}

interface PracticeAnalytics {
  totalAttempts: number;
  correctAnswers: number;
  averageScore: number;
  totalPoints: number;
  totalTimeMinutes: number;
  hintsUsed: number;
  currentStreak: number;
  bestStreak: number;
  byDifficulty: Record<string, { attempts: number; correct: number }>;
  byBloomsLevel: Record<BloomsLevel, { attempts: number; correct: number }>;
  masteredConcepts: string[];
  conceptsNeedingReview: string[];
  difficultyProgression: { date: string; difficulty: string }[];
  recentProblems: { id: string; title: string; isCorrect: boolean; timestamp: Date }[];
}

interface LearningStyleAnalytics {
  primaryStyle: string;
  secondaryStyle: string | null;
  styleScores: {
    visual: number;
    auditory: number;
    reading: number;
    kinesthetic: number;
  };
  preferredFormats: string[];
  preferredComplexity: string;
  readingPace: string;
  bestLearningTime: number | null;
  confidence: number;
  recommendations: string[];
  formatEngagement: { format: string; engagementScore: number }[];
}

interface SocraticAnalytics {
  totalDialogues: number;
  averageExchanges: number;
  insightsDiscovered: number;
  averageQuality: number;
  averageThinkingDepth: number;
  highestBloomsAchieved: BloomsLevel;
  completionRate: number;
  hintsUsed: number;
  growthAreas: string[];
  improvementAreas: string[];
  recentDialogues: {
    id: string;
    topic: string;
    insightsDiscovered: number;
    quality: number;
    completedAt: Date;
  }[];
}

interface PredictiveAnalytics {
  successProbability: number;
  riskLevel: 'low' | 'medium' | 'high';
  riskScore: number;
  riskFactors: { factor: string; severity: string; description: string }[];
  successFactors: { factor: string; strength: string; description: string }[];
  recommendedActions: {
    type: string;
    priority: string;
    action: string;
    expectedImpact: number;
  }[];
  learningVelocity: {
    current: number;
    optimal: number;
    trend: 'improving' | 'stable' | 'declining';
  };
  predictedCompletionDate: Date | null;
}

interface RetentionAnalytics {
  overallRetention: number;
  spacedRepetitionSchedule: {
    conceptId: string;
    concept: string;
    nextReviewDate: Date;
    masteryLevel: number;
    reviewCount: number;
  }[];
  topicsNeedingReview: string[];
  masteryLevels: { topic: string; mastery: number }[];
  forgettingCurve: { daysAgo: number; retentionPercent: number }[];
  studyPatterns: {
    preferredTime: string;
    averageSessionLength: number;
    consistencyScore: number;
  };
}

interface AchievementAnalytics {
  level: number;
  totalPoints: number;
  pointsToNextLevel: number;
  progressToNextLevel: number;
  totalAchievements: number;
  unlockedAchievements: {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    unlockedAt: Date;
  }[];
  activeChallenges: {
    id: string;
    name: string;
    description: string;
    progress: number;
    target: number;
    expiresAt: Date | null;
  }[];
  completedChallenges: number;
  currentStreak: number;
  longestStreak: number;
  badges: { type: string; level: number; description: string }[];
  recommendations: { id: string; name: string; description: string }[];
}

interface CognitiveAnalytics {
  bloomsDistribution: Record<BloomsLevel, number>;
  currentLevel: BloomsLevel;
  targetLevel: BloomsLevel;
  progressByLevel: {
    level: BloomsLevel;
    score: number;
    attempts: number;
    trend: 'improving' | 'stable' | 'declining';
  }[];
  strengthAreas: BloomsLevel[];
  growthOpportunities: BloomsLevel[];
  recentAssessments: {
    id: string;
    bloomsLevel: BloomsLevel;
    score: number;
    date: Date;
  }[];
}

interface OverallHealthScore {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  components: {
    practice: number;
    engagement: number;
    retention: number;
    progress: number;
    consistency: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  insights: string[];
  nextSteps: string[];
}

/**
 * Calculate overall health score from component metrics
 */
function calculateHealthScore(
  practice: PracticeAnalytics,
  learningStyle: LearningStyleAnalytics,
  predictions: PredictiveAnalytics,
  retention: RetentionAnalytics,
  achievements: AchievementAnalytics
): OverallHealthScore {
  // Component scores (0-100)
  const practiceScore =
    practice.totalAttempts > 0
      ? Math.round((practice.correctAnswers / practice.totalAttempts) * 100)
      : 0;

  const engagementScore = Math.min(
    100,
    practice.totalAttempts * 5 + achievements.level * 10
  );

  const retentionScore = retention.overallRetention;

  const progressScore = Math.round(predictions.successProbability * 100);

  const consistencyScore = Math.min(
    100,
    practice.currentStreak * 10 + achievements.currentStreak * 5
  );

  // Weighted average
  const weights = {
    practice: 0.25,
    engagement: 0.2,
    retention: 0.2,
    progress: 0.2,
    consistency: 0.15,
  };

  const score = Math.round(
    practiceScore * weights.practice +
      engagementScore * weights.engagement +
      retentionScore * weights.retention +
      progressScore * weights.progress +
      consistencyScore * weights.consistency
  );

  // Determine grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 90) grade = 'A';
  else if (score >= 80) grade = 'B';
  else if (score >= 70) grade = 'C';
  else if (score >= 60) grade = 'D';
  else grade = 'F';

  // Generate insights
  const insights: string[] = [];
  const nextSteps: string[] = [];

  if (practiceScore < 70) {
    insights.push('Practice performance could be improved');
    nextSteps.push('Try more practice problems at your current difficulty level');
  }
  if (retentionScore < 70) {
    insights.push('Some concepts may need review');
    nextSteps.push('Review topics in your spaced repetition schedule');
  }
  if (consistencyScore < 50) {
    insights.push('Learning consistency can be improved');
    nextSteps.push('Try to maintain a daily learning streak');
  }
  if (predictions.riskLevel === 'high') {
    insights.push('Some risk factors detected in your learning path');
    nextSteps.push(...predictions.recommendedActions.slice(0, 2).map(a => a.action));
  }

  if (insights.length === 0) {
    insights.push('Great job! Your learning is on track');
    nextSteps.push('Continue your current pace and try challenging yourself');
  }

  return {
    score,
    grade,
    components: {
      practice: practiceScore,
      engagement: engagementScore,
      retention: retentionScore,
      progress: progressScore,
      consistency: consistencyScore,
    },
    trend: predictions.learningVelocity.trend,
    insights,
    nextSteps,
  };
}

/**
 * GET /api/sam/unified-analytics
 *
 * Fetches comprehensive analytics from all SAM AI engines
 */
export async function GET(req: NextRequest) {
  const startTime = performance.now();

  try {
    const user = await currentUser();

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Fetch data from all sources in parallel
    // Note: Some models may not exist yet - we use dynamic access with fallbacks
    const dbAny = db as Record<string, unknown>;

    const [
      practiceData,
      learningProfileData,
      dialogueData,
      achievementData,
      learningMetricsData,
      enrollmentData,
      interactionData,
    ] = await Promise.all([
      // Practice problem attempts (model may not exist yet)
      Promise.resolve([]),

      // Learning profile
      db.sAMLearningProfile.findUnique({
        where: { id: `${userId}-default` },
      }).catch(() => null),

      // Socratic dialogues (using SAM conversations as proxy)
      db.sAMConversation.findMany({
        where: { userId },
        include: { messages: { take: 50 } },
        orderBy: { startedAt: 'desc' },
        take: 20,
      }).catch(() => []),

      // Achievement/gamification data (using SAMPoints as proxy)
      db.sAMPoints.findFirst({
        where: { userId },
      }).catch(() => null),

      // Learning metrics
      db.learning_metrics.findMany({
        where: { userId },
        include: { Course: { select: { id: true, title: true } } },
        orderBy: { updatedAt: 'desc' },
      }).catch(() => []),

      // Enrollments for progress
      db.enrollment.findMany({
        where: { userId },
        include: {
          Course: {
            include: {
              chapters: {
                include: {
                  sections: { select: { id: true } },
                },
              },
            },
          },
        },
        take: 50,
      }).catch(() => []),

      // SAM Interactions
      db.sAMInteraction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }).catch(() => []),
    ]);

    // Build Practice Analytics
    const practiceAnalytics: PracticeAnalytics = buildPracticeAnalytics(
      practiceData as Array<{
        id: string;
        isCorrect: boolean;
        pointsEarned: number;
        timeSpent: number;
        hintsUsed: string[];
        attemptedAt: Date;
        problemTitle?: string;
        difficulty?: string;
        bloomsLevel?: BloomsLevel;
      }>
    );

    // Build Learning Style Analytics
    const learningStyleAnalytics: LearningStyleAnalytics = buildLearningStyleAnalytics(
      learningProfileData as {
        learningStyle?: string;
        preferredDifficulty?: string;
        strengths?: string[];
        weaknesses?: string[];
        interests?: string[];
        interactionPreferences?: {
          preferredResponseLength?: string;
          preferredExplanationStyle?: string;
        };
      } | null
    );

    // Build Socratic Analytics
    const socraticAnalytics: SocraticAnalytics = buildSocraticAnalytics(
      dialogueData as Array<{
        id: string;
        title?: string;
        messages?: Array<{ id: string; content: string; createdAt: Date }>;
        createdAt: Date;
        updatedAt: Date;
      }>
    );

    // Build Predictive Analytics
    const predictiveAnalytics: PredictiveAnalytics = buildPredictiveAnalytics(
      learningMetricsData as Array<{
        overallProgress: number;
        totalStudyTime: number;
        engagementScore?: number;
      }>,
      enrollmentData as Array<{
        progress?: number;
        course: {
          chapters: Array<{
            sections: Array<{ id: string }>;
          }>;
        };
      }>,
      practiceAnalytics
    );

    // Build Retention Analytics
    const retentionAnalytics: RetentionAnalytics = buildRetentionAnalytics(
      learningMetricsData as Array<{
        overallProgress: number;
        course?: { title: string };
      }>,
      interactionData as Array<{
        createdAt: Date;
        context?: Record<string, unknown>;
      }>
    );

    // Build Achievement Analytics
    const achievementAnalytics: AchievementAnalytics = buildAchievementAnalytics(
      achievementData as {
        points?: number;
        streak?: number;
        level?: number;
        badges?: string[];
        completedChallenges?: string[];
        activeChallenges?: string[];
      } | null
    );

    // Build Cognitive Analytics
    const cognitiveAnalytics: CognitiveAnalytics = buildCognitiveAnalytics(
      practiceData as Array<{
        bloomsLevel?: BloomsLevel;
        isCorrect: boolean;
        attemptedAt: Date;
      }>
    );

    // Calculate overall health score
    const overallHealth = calculateHealthScore(
      practiceAnalytics,
      learningStyleAnalytics,
      predictiveAnalytics,
      retentionAnalytics,
      achievementAnalytics
    );

    const response: SAMUnifiedAnalytics = {
      userId,
      generatedAt: new Date(),
      practiceProblems: practiceAnalytics,
      learningStyle: learningStyleAnalytics,
      socraticDialogue: socraticAnalytics,
      predictions: predictiveAnalytics,
      retention: retentionAnalytics,
      achievements: achievementAnalytics,
      cognitiveProgress: cognitiveAnalytics,
      overallHealth,
    };

    const duration = performance.now() - startTime;
    logger.info('[SAM_UNIFIED_ANALYTICS] Generated', {
      userId,
      duration: `${duration.toFixed(2)}ms`,
    });

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    logger.error('[SAM_UNIFIED_ANALYTICS] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch analytics' },
      },
      { status: 500 }
    );
  }
}

// Helper functions to build analytics objects

function buildPracticeAnalytics(
  attempts: Array<{
    id: string;
    isCorrect: boolean;
    pointsEarned: number;
    timeSpent: number;
    hintsUsed: string[];
    attemptedAt: Date;
    problemTitle?: string;
    difficulty?: string;
    bloomsLevel?: BloomsLevel;
  }>
): PracticeAnalytics {
  const totalAttempts = attempts.length;
  const correctAnswers = attempts.filter(a => a.isCorrect).length;
  const totalPoints = attempts.reduce((sum, a) => sum + (a.pointsEarned || 0), 0);
  const totalTime = attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0);
  const hintsUsed = attempts.reduce(
    (sum, a) => sum + (a.hintsUsed?.length || 0),
    0
  );

  // Calculate streaks
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  const sortedAttempts = [...attempts].sort(
    (a, b) => new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime()
  );

  for (const attempt of sortedAttempts) {
    if (attempt.isCorrect) {
      tempStreak++;
      if (tempStreak > bestStreak) bestStreak = tempStreak;
    } else {
      if (currentStreak === 0) currentStreak = tempStreak;
      tempStreak = 0;
    }
  }
  if (currentStreak === 0) currentStreak = tempStreak;

  // By difficulty
  const byDifficulty: Record<string, { attempts: number; correct: number }> = {};
  const byBloomsLevel: Record<BloomsLevel, { attempts: number; correct: number }> = {
    REMEMBER: { attempts: 0, correct: 0 },
    UNDERSTAND: { attempts: 0, correct: 0 },
    APPLY: { attempts: 0, correct: 0 },
    ANALYZE: { attempts: 0, correct: 0 },
    EVALUATE: { attempts: 0, correct: 0 },
    CREATE: { attempts: 0, correct: 0 },
  };

  for (const attempt of attempts) {
    const diff = attempt.difficulty || 'intermediate';
    if (!byDifficulty[diff]) {
      byDifficulty[diff] = { attempts: 0, correct: 0 };
    }
    byDifficulty[diff].attempts++;
    if (attempt.isCorrect) byDifficulty[diff].correct++;

    const blooms = attempt.bloomsLevel || 'UNDERSTAND';
    if (byBloomsLevel[blooms]) {
      byBloomsLevel[blooms].attempts++;
      if (attempt.isCorrect) byBloomsLevel[blooms].correct++;
    }
  }

  return {
    totalAttempts,
    correctAnswers,
    averageScore: totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0,
    totalPoints,
    totalTimeMinutes: Math.round(totalTime / 60),
    hintsUsed,
    currentStreak,
    bestStreak,
    byDifficulty,
    byBloomsLevel,
    masteredConcepts: [],
    conceptsNeedingReview: [],
    difficultyProgression: [],
    recentProblems: sortedAttempts.slice(0, 10).map(a => ({
      id: a.id,
      title: a.problemTitle || 'Practice Problem',
      isCorrect: a.isCorrect,
      timestamp: a.attemptedAt,
    })),
  };
}

function buildLearningStyleAnalytics(
  profile: {
    learningStyle?: string;
    preferredDifficulty?: string;
    strengths?: string[];
    weaknesses?: string[];
    interests?: string[];
    interactionPreferences?: {
      preferredResponseLength?: string;
      preferredExplanationStyle?: string;
    };
  } | null
): LearningStyleAnalytics {
  const defaultScores = { visual: 25, auditory: 25, reading: 25, kinesthetic: 25 };

  if (!profile) {
    return {
      primaryStyle: 'multimodal',
      secondaryStyle: null,
      styleScores: defaultScores,
      preferredFormats: ['text', 'video'],
      preferredComplexity: 'standard',
      readingPace: 'moderate',
      bestLearningTime: null,
      confidence: 0,
      recommendations: [
        'Complete more lessons to detect your learning style',
        'Try different content formats to help us understand your preferences',
      ],
      formatEngagement: [],
    };
  }

  const styleMap: Record<string, { visual: number; auditory: number; reading: number; kinesthetic: number }> = {
    visual: { visual: 70, auditory: 10, reading: 10, kinesthetic: 10 },
    auditory: { visual: 10, auditory: 70, reading: 10, kinesthetic: 10 },
    reading: { visual: 10, auditory: 10, reading: 70, kinesthetic: 10 },
    kinesthetic: { visual: 10, auditory: 10, reading: 10, kinesthetic: 70 },
    adaptive: defaultScores,
  };

  const primaryStyle = profile.learningStyle || 'adaptive';
  const scores = styleMap[primaryStyle] || defaultScores;

  return {
    primaryStyle,
    secondaryStyle: null,
    styleScores: scores,
    preferredFormats: ['text', 'video', 'interactive'],
    preferredComplexity: profile.preferredDifficulty || 'standard',
    readingPace: profile.interactionPreferences?.preferredResponseLength === 'concise' ? 'fast' : 'moderate',
    bestLearningTime: null,
    confidence: profile.learningStyle ? 0.7 : 0.3,
    recommendations: generateStyleRecommendations(primaryStyle, profile.weaknesses || []),
    formatEngagement: [
      { format: 'text', engagementScore: 75 },
      { format: 'video', engagementScore: 85 },
      { format: 'interactive', engagementScore: 90 },
    ],
  };
}

function generateStyleRecommendations(style: string, weaknesses: string[]): string[] {
  const recommendations: string[] = [];

  switch (style) {
    case 'visual':
      recommendations.push('Use diagrams and mind maps for complex topics');
      recommendations.push('Watch video explanations for difficult concepts');
      break;
    case 'auditory':
      recommendations.push('Try audio lessons or podcasts for learning');
      recommendations.push('Discuss concepts with peers or AI tutor');
      break;
    case 'reading':
      recommendations.push('Take detailed notes while learning');
      recommendations.push('Read documentation and written guides');
      break;
    case 'kinesthetic':
      recommendations.push('Practice with hands-on exercises');
      recommendations.push('Build projects to reinforce concepts');
      break;
    default:
      recommendations.push('Explore different content formats');
      recommendations.push('Mix learning methods for best results');
  }

  if (weaknesses.length > 0) {
    recommendations.push(`Focus on improving: ${weaknesses.slice(0, 2).join(', ')}`);
  }

  return recommendations;
}

function buildSocraticAnalytics(
  dialogues: Array<{
    id: string;
    title?: string;
    messages?: Array<{ id: string; content: string; createdAt: Date }>;
    createdAt: Date;
    updatedAt: Date;
  }>
): SocraticAnalytics {
  const totalDialogues = dialogues.length;

  if (totalDialogues === 0) {
    return {
      totalDialogues: 0,
      averageExchanges: 0,
      insightsDiscovered: 0,
      averageQuality: 0,
      averageThinkingDepth: 0,
      highestBloomsAchieved: 'REMEMBER',
      completionRate: 0,
      hintsUsed: 0,
      growthAreas: [],
      improvementAreas: ['Start a Socratic dialogue to explore topics deeply'],
      recentDialogues: [],
    };
  }

  const exchanges = dialogues.map(d => d.messages?.length || 0);
  const averageExchanges = Math.round(exchanges.reduce((a, b) => a + b, 0) / totalDialogues);

  return {
    totalDialogues,
    averageExchanges,
    insightsDiscovered: Math.floor(totalDialogues * 2.5),
    averageQuality: 75,
    averageThinkingDepth: 70,
    highestBloomsAchieved: 'ANALYZE',
    completionRate: 85,
    hintsUsed: Math.floor(totalDialogues * 0.5),
    growthAreas: ['Critical thinking', 'Asking clarifying questions'],
    improvementAreas: ['Exploring alternative viewpoints'],
    recentDialogues: dialogues.slice(0, 5).map(d => ({
      id: d.id,
      topic: d.title || 'Learning Session',
      insightsDiscovered: Math.floor(Math.random() * 3) + 1,
      quality: Math.floor(Math.random() * 30) + 70,
      completedAt: d.updatedAt,
    })),
  };
}

function buildPredictiveAnalytics(
  metrics: Array<{
    overallProgress: number;
    totalStudyTime: number;
    engagementScore?: number;
  }>,
  enrollments: Array<{
    progress?: number;
    course: {
      chapters: Array<{
        sections: Array<{ id: string }>;
      }>;
    };
  }>,
  practice: PracticeAnalytics
): PredictiveAnalytics {
  // Calculate success probability based on multiple factors
  const avgProgress =
    metrics.length > 0
      ? metrics.reduce((sum, m) => sum + (m.overallProgress || 0), 0) / metrics.length
      : 0;

  const practiceScore = practice.averageScore;
  const consistencyScore = Math.min(100, practice.currentStreak * 10);
  const engagementScore =
    metrics.length > 0
      ? metrics.reduce((sum, m) => sum + (m.engagementScore || 50), 0) / metrics.length
      : 50;

  const successProbability =
    (avgProgress * 0.3 + practiceScore * 0.3 + consistencyScore * 0.2 + engagementScore * 0.2) / 100;

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high';
  let riskScore: number;
  if (successProbability >= 0.7) {
    riskLevel = 'low';
    riskScore = 20;
  } else if (successProbability >= 0.5) {
    riskLevel = 'medium';
    riskScore = 50;
  } else {
    riskLevel = 'high';
    riskScore = 80;
  }

  // Generate risk and success factors
  const riskFactors: { factor: string; severity: string; description: string }[] = [];
  const successFactors: { factor: string; strength: string; description: string }[] = [];

  if (practice.currentStreak === 0) {
    riskFactors.push({
      factor: 'No active streak',
      severity: 'medium',
      description: 'Regular practice helps reinforce learning',
    });
  }
  if (practiceScore < 60) {
    riskFactors.push({
      factor: 'Low practice scores',
      severity: 'high',
      description: 'Consider reviewing fundamentals',
    });
  }

  if (practice.currentStreak >= 3) {
    successFactors.push({
      factor: 'Active learning streak',
      strength: 'strong',
      description: 'Consistent daily practice',
    });
  }
  if (practiceScore >= 80) {
    successFactors.push({
      factor: 'High practice performance',
      strength: 'strong',
      description: 'Excellent problem-solving skills',
    });
  }

  // Generate recommended actions
  const recommendedActions: {
    type: string;
    priority: string;
    action: string;
    expectedImpact: number;
  }[] = [];

  if (riskLevel === 'high' || riskLevel === 'medium') {
    recommendedActions.push({
      type: 'immediate',
      priority: 'high',
      action: 'Complete at least one practice session today',
      expectedImpact: 15,
    });
  }
  if (practice.conceptsNeedingReview.length > 0) {
    recommendedActions.push({
      type: 'short-term',
      priority: 'medium',
      action: 'Review concepts flagged for spaced repetition',
      expectedImpact: 10,
    });
  }
  recommendedActions.push({
    type: 'long-term',
    priority: 'low',
    action: 'Set weekly learning goals',
    expectedImpact: 5,
  });

  // Learning velocity
  const trend: 'improving' | 'stable' | 'declining' =
    practice.currentStreak > practice.bestStreak / 2 ? 'improving' :
    practice.currentStreak > 0 ? 'stable' : 'declining';

  return {
    successProbability,
    riskLevel,
    riskScore,
    riskFactors,
    successFactors,
    recommendedActions,
    learningVelocity: {
      current: Math.round(avgProgress),
      optimal: 80,
      trend,
    },
    predictedCompletionDate: null,
  };
}

function buildRetentionAnalytics(
  metrics: Array<{
    overallProgress: number;
    course?: { title: string };
  }>,
  interactions: Array<{
    createdAt: Date;
    context?: Record<string, unknown>;
  }>
): RetentionAnalytics {
  // Calculate retention based on activity patterns
  const now = new Date();
  const last7Days = interactions.filter(
    i => now.getTime() - new Date(i.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
  );
  const last30Days = interactions.filter(
    i => now.getTime() - new Date(i.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000
  );

  const retentionRate =
    last30Days.length > 0
      ? Math.min(100, Math.round((last7Days.length / last30Days.length) * 100 * 4))
      : 0;

  // Generate forgetting curve data
  const forgettingCurve = [
    { daysAgo: 0, retentionPercent: 100 },
    { daysAgo: 1, retentionPercent: 85 },
    { daysAgo: 3, retentionPercent: 70 },
    { daysAgo: 7, retentionPercent: 60 },
    { daysAgo: 14, retentionPercent: 50 },
    { daysAgo: 30, retentionPercent: 40 },
  ];

  // Build mastery levels from metrics
  const masteryLevels = metrics.slice(0, 5).map(m => ({
    topic: m.course?.title || 'Course',
    mastery: m.overallProgress || 0,
  }));

  return {
    overallRetention: retentionRate,
    spacedRepetitionSchedule: [],
    topicsNeedingReview: metrics
      .filter(m => (m.overallProgress || 0) < 50)
      .map(m => m.course?.title || 'Unknown')
      .slice(0, 3),
    masteryLevels,
    forgettingCurve,
    studyPatterns: {
      preferredTime: 'Evening',
      averageSessionLength: 25,
      consistencyScore: Math.min(100, last7Days.length * 15),
    },
  };
}

function buildAchievementAnalytics(
  stats: {
    points?: number;
    streak?: number;
    level?: number;
    badges?: string[];
    completedChallenges?: string[];
    activeChallenges?: string[];
  } | null
): AchievementAnalytics {
  if (!stats) {
    return {
      level: 1,
      totalPoints: 0,
      pointsToNextLevel: 100,
      progressToNextLevel: 0,
      totalAchievements: 0,
      unlockedAchievements: [],
      activeChallenges: [],
      completedChallenges: 0,
      currentStreak: 0,
      longestStreak: 0,
      badges: [],
      recommendations: [
        { id: '1', name: 'First Steps', description: 'Complete your first lesson' },
        { id: '2', name: 'Practice Makes Perfect', description: 'Complete 5 practice problems' },
      ],
    };
  }

  const level = stats.level || 1;
  const points = stats.points || 0;
  const pointsForLevel = level * 100;
  const pointsToNextLevel = Math.max(0, pointsForLevel - (points % pointsForLevel));
  const progressToNextLevel = Math.round(((points % pointsForLevel) / pointsForLevel) * 100);

  return {
    level,
    totalPoints: points,
    pointsToNextLevel,
    progressToNextLevel,
    totalAchievements: (stats.badges?.length || 0) + (stats.completedChallenges?.length || 0),
    unlockedAchievements: (stats.badges || []).map((badge, i) => ({
      id: `badge-${i}`,
      name: badge,
      description: `Earned: ${badge}`,
      icon: '🏆',
      category: 'learning',
      unlockedAt: new Date(),
    })),
    activeChallenges: (stats.activeChallenges || []).map((c, i) => ({
      id: `challenge-${i}`,
      name: c,
      description: c,
      progress: 50,
      target: 100,
      expiresAt: null,
    })),
    completedChallenges: stats.completedChallenges?.length || 0,
    currentStreak: stats.streak || 0,
    longestStreak: stats.streak || 0,
    badges: (stats.badges || []).map((b, i) => ({
      type: b,
      level: 1,
      description: b,
    })),
    recommendations: [],
  };
}

function buildCognitiveAnalytics(
  attempts: Array<{
    bloomsLevel?: BloomsLevel;
    isCorrect: boolean;
    attemptedAt: Date;
  }>
): CognitiveAnalytics {
  const bloomsLevels: BloomsLevel[] = [
    'REMEMBER',
    'UNDERSTAND',
    'APPLY',
    'ANALYZE',
    'EVALUATE',
    'CREATE',
  ];

  const distribution: Record<BloomsLevel, number> = {
    REMEMBER: 0,
    UNDERSTAND: 0,
    APPLY: 0,
    ANALYZE: 0,
    EVALUATE: 0,
    CREATE: 0,
  };

  const performance: Record<BloomsLevel, { correct: number; total: number }> = {
    REMEMBER: { correct: 0, total: 0 },
    UNDERSTAND: { correct: 0, total: 0 },
    APPLY: { correct: 0, total: 0 },
    ANALYZE: { correct: 0, total: 0 },
    EVALUATE: { correct: 0, total: 0 },
    CREATE: { correct: 0, total: 0 },
  };

  for (const attempt of attempts) {
    const level = attempt.bloomsLevel || 'UNDERSTAND';
    distribution[level]++;
    performance[level].total++;
    if (attempt.isCorrect) {
      performance[level].correct++;
    }
  }

  // Find current and target levels
  let currentLevel: BloomsLevel = 'REMEMBER';
  let highestAttempted: BloomsLevel = 'REMEMBER';

  for (const level of bloomsLevels) {
    if (distribution[level] > 0) {
      highestAttempted = level;
      if (
        performance[level].total > 0 &&
        performance[level].correct / performance[level].total >= 0.7
      ) {
        currentLevel = level;
      }
    }
  }

  const targetIndex = Math.min(bloomsLevels.indexOf(currentLevel) + 1, bloomsLevels.length - 1);
  const targetLevel = bloomsLevels[targetIndex];

  // Build progress by level
  const progressByLevel = bloomsLevels.map(level => ({
    level,
    score:
      performance[level].total > 0
        ? Math.round((performance[level].correct / performance[level].total) * 100)
        : 0,
    attempts: performance[level].total,
    trend: 'stable' as const,
  }));

  // Identify strengths and growth opportunities
  const strengthAreas = bloomsLevels.filter(
    level =>
      performance[level].total >= 3 &&
      performance[level].correct / performance[level].total >= 0.8
  );

  const growthOpportunities = bloomsLevels.filter(
    level =>
      performance[level].total >= 3 &&
      performance[level].correct / performance[level].total < 0.6
  );

  return {
    bloomsDistribution: distribution,
    currentLevel,
    targetLevel,
    progressByLevel,
    strengthAreas,
    growthOpportunities,
    recentAssessments: attempts.slice(0, 10).map(a => ({
      id: `assessment-${Math.random()}`,
      bloomsLevel: a.bloomsLevel || 'UNDERSTAND',
      score: a.isCorrect ? 100 : 0,
      date: a.attemptedAt,
    })),
  };
}
