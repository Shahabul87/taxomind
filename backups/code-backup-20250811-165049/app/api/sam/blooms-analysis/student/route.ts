import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { BloomsLevel } from '@prisma/client';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const studentId = searchParams.get('studentId') || user.id;

    // Check if requesting user has permission to view student data
    if (studentId !== user.id && user.role !== 'ADMIN') {
      // Check if user is the teacher of the course
      if (courseId) {
        const course = await db.course.findUnique({
          where: { id: courseId },
          select: { userId: true },
        });
        
        if (course?.userId !== user.id) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Get student's Bloom's progress
    const progressQuery = courseId 
      ? { userId: studentId, courseId }
      : { userId: studentId, courseId: null };

    const studentProgress = await db.studentBloomsProgress.findUnique({
      where: {
        userId_courseId: progressQuery as any,
      },
    });

    // Get cognitive profile
    const cognitiveProfile = await db.studentCognitiveProfile.findUnique({
      where: { userId: studentId },
    });

    // Get performance metrics
    const performanceMetrics = await db.bloomsPerformanceMetric.findMany({
      where: {
        userId: studentId,
        ...(courseId && { courseId }),
      },
      orderBy: { recordedAt: 'desc' },
      take: 50,
    });

    // Calculate aggregated metrics
    const aggregatedMetrics = calculateAggregatedMetrics(performanceMetrics);

    return NextResponse.json({
      success: true,
      data: {
        studentProgress: studentProgress ? {
          bloomsScores: studentProgress.bloomsScores,
          strengthAreas: studentProgress.strengthAreas,
          weaknessAreas: studentProgress.weaknessAreas,
          progressHistory: studentProgress.progressHistory,
          lastAssessedAt: studentProgress.lastAssessedAt,
        } : null,
        cognitiveProfile: cognitiveProfile ? {
          overallCognitiveLevel: cognitiveProfile.overallCognitiveLevel,
          bloomsMastery: cognitiveProfile.bloomsMastery,
          learningTrajectory: cognitiveProfile.learningTrajectory,
          skillsInventory: cognitiveProfile.skillsInventory,
          performancePatterns: cognitiveProfile.performancePatterns,
          optimalLearningStyle: cognitiveProfile.optimalLearningStyle,
        } : null,
        performanceMetrics: aggregatedMetrics,
        recentPerformance: performanceMetrics.map(metric => ({
          bloomsLevel: metric.bloomsLevel,
          accuracy: metric.accuracy,
          avgResponseTime: metric.avgResponseTime,
          totalAttempts: metric.totalAttempts,
          improvementRate: metric.improvementRate,
          recordedAt: metric.recordedAt,
        })),
      },
      metadata: {
        studentId,
        courseId,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    logger.error('Get student Blooms progress error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve student progress' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      courseId,
      bloomsLevel,
      accuracy,
      responseTime,
      questionId,
      isCorrect,
    } = await request.json();

    // Update or create student progress
    const progressData = {
      userId: user.id,
      courseId,
    };

    const existingProgress = await db.studentBloomsProgress.findUnique({
      where: {
        userId_courseId: progressData as any,
      },
    });

    const bloomsScores = existingProgress?.bloomsScores as any || {
      REMEMBER: 0,
      UNDERSTAND: 0,
      APPLY: 0,
      ANALYZE: 0,
      EVALUATE: 0,
      CREATE: 0,
    };

    // Update scores based on performance
    const currentScore = bloomsScores[bloomsLevel] || 0;
    const newScore = updateBloomsScore(currentScore, isCorrect, accuracy);
    bloomsScores[bloomsLevel] = newScore;

    // Identify strengths and weaknesses
    const { strengthAreas, weaknessAreas } = identifyStrengthsAndWeaknesses(bloomsScores);

    // Update progress history
    const progressHistory = existingProgress?.progressHistory as any[] || [];
    progressHistory.push({
      timestamp: new Date(),
      bloomsLevel,
      score: newScore,
      accuracy,
      responseTime,
    });

    // Update or create progress record
    await db.studentBloomsProgress.upsert({
      where: {
        userId_courseId: progressData as any,
      },
      update: {
        bloomsScores,
        strengthAreas,
        weaknessAreas,
        progressHistory,
        lastAssessedAt: new Date(),
      },
      create: {
        ...progressData,
        bloomsScores,
        strengthAreas,
        weaknessAreas,
        progressHistory,
        lastAssessedAt: new Date(),
      },
    });

    // Record performance metric
    await recordPerformanceMetric(user.id, courseId, bloomsLevel, accuracy, responseTime, isCorrect);

    // Update cognitive profile
    await updateCognitiveProfile(user.id, bloomsScores);

    return NextResponse.json({
      success: true,
      data: {
        bloomsLevel,
        newScore,
        bloomsScores,
        strengthAreas,
        weaknessAreas,
      },
    });

  } catch (error) {
    logger.error('Update student Blooms progress error:', error);
    return NextResponse.json(
      { error: 'Failed to update student progress' },
      { status: 500 }
    );
  }
}

function calculateAggregatedMetrics(metrics: any[]) {
  const bloomsLevels: BloomsLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  const aggregated: any = {};

  bloomsLevels.forEach(level => {
    const levelMetrics = metrics.filter(m => m.bloomsLevel === level);
    
    if (levelMetrics.length > 0) {
      aggregated[level] = {
        avgAccuracy: levelMetrics.reduce((sum, m) => sum + m.accuracy, 0) / levelMetrics.length,
        avgResponseTime: levelMetrics.reduce((sum, m) => sum + m.avgResponseTime, 0) / levelMetrics.length,
        totalAttempts: levelMetrics.reduce((sum, m) => sum + m.totalAttempts, 0),
        successRate: levelMetrics.reduce((sum, m) => sum + (m.successfulAttempts / m.totalAttempts), 0) / levelMetrics.length,
        improvementTrend: calculateImprovementTrend(levelMetrics),
      };
    } else {
      aggregated[level] = {
        avgAccuracy: 0,
        avgResponseTime: 0,
        totalAttempts: 0,
        successRate: 0,
        improvementTrend: 'stable',
      };
    }
  });

  return aggregated;
}

function calculateImprovementTrend(metrics: any[]): 'improving' | 'stable' | 'declining' {
  if (metrics.length < 2) return 'stable';
  
  const recent = metrics.slice(0, Math.min(5, metrics.length));
  const older = metrics.slice(Math.min(5, metrics.length));
  
  const recentAvg = recent.reduce((sum, m) => sum + m.accuracy, 0) / recent.length;
  const olderAvg = older.length > 0 
    ? older.reduce((sum, m) => sum + m.accuracy, 0) / older.length 
    : recentAvg;
  
  if (recentAvg > olderAvg + 5) return 'improving';
  if (recentAvg < olderAvg - 5) return 'declining';
  return 'stable';
}

function updateBloomsScore(currentScore: number, isCorrect: boolean, accuracy: number): number {
  // Weighted update based on performance
  const weight = 0.1; // Learning rate
  const performanceScore = isCorrect ? accuracy : accuracy * 0.5;
  
  return Math.min(100, currentScore * (1 - weight) + performanceScore * weight);
}

function identifyStrengthsAndWeaknesses(bloomsScores: any): {
  strengthAreas: string[];
  weaknessAreas: string[];
} {
  const entries = Object.entries(bloomsScores);
  const sortedEntries = entries.sort(([, a], [, b]) => (b as number) - (a as number));
  
  const strengthAreas = sortedEntries
    .slice(0, 2)
    .filter(([, score]) => (score as number) > 70)
    .map(([level]) => level);
  
  const weaknessAreas = sortedEntries
    .slice(-2)
    .filter(([, score]) => (score as number) < 50)
    .map(([level]) => level);
  
  return { strengthAreas, weaknessAreas };
}

async function recordPerformanceMetric(
  userId: string,
  courseId: string | null,
  bloomsLevel: BloomsLevel,
  accuracy: number,
  responseTime: number,
  isCorrect: boolean
): Promise<void> {
  // Get existing metrics for this level
  const existingMetric = await db.bloomsPerformanceMetric.findFirst({
    where: {
      userId,
      courseId,
      bloomsLevel,
      recordedAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
  });

  if (existingMetric) {
    // Update existing metric
    const totalAttempts = existingMetric.totalAttempts + 1;
    const successfulAttempts = existingMetric.successfulAttempts + (isCorrect ? 1 : 0);
    const newAccuracy = (existingMetric.accuracy * existingMetric.totalAttempts + accuracy) / totalAttempts;
    const newAvgResponseTime = (existingMetric.avgResponseTime * existingMetric.totalAttempts + responseTime) / totalAttempts;
    
    await db.bloomsPerformanceMetric.update({
      where: { id: existingMetric.id },
      data: {
        accuracy: newAccuracy,
        avgResponseTime: newAvgResponseTime,
        totalAttempts,
        successfulAttempts,
        improvementRate: calculateImprovementRate(existingMetric.accuracy, newAccuracy),
      },
    });
  } else {
    // Create new metric
    await db.bloomsPerformanceMetric.create({
      data: {
        userId,
        courseId,
        bloomsLevel,
        accuracy,
        avgResponseTime: responseTime,
        totalAttempts: 1,
        successfulAttempts: isCorrect ? 1 : 0,
        improvementRate: 0,
        challengeAreas: [],
      },
    });
  }
}

function calculateImprovementRate(oldAccuracy: number, newAccuracy: number): number {
  return ((newAccuracy - oldAccuracy) / oldAccuracy) * 100;
}

async function updateCognitiveProfile(userId: string, bloomsScores: any): Promise<void> {
  const overallCognitiveLevel = Object.values(bloomsScores).reduce((sum: number, score: any) => sum + score, 0) / 6;
  
  const existingProfile = await db.studentCognitiveProfile.findUnique({
    where: { userId },
  });

  const learningTrajectory = existingProfile?.learningTrajectory as any[] || [];
  learningTrajectory.push({
    timestamp: new Date(),
    cognitiveLevel: overallCognitiveLevel,
    bloomsScores,
  });

  const profileData = {
    overallCognitiveLevel,
    bloomsMastery: bloomsScores,
    learningTrajectory,
    skillsInventory: generateSkillsInventory(bloomsScores),
    performancePatterns: analyzePerformancePatterns(learningTrajectory),
    optimalLearningStyle: determineOptimalLearningStyle(bloomsScores),
  };

  await db.studentCognitiveProfile.upsert({
    where: { userId },
    update: profileData,
    create: {
      userId,
      ...profileData,
    },
  });
}

function generateSkillsInventory(bloomsScores: any): any {
  return {
    criticalThinking: (bloomsScores.ANALYZE + bloomsScores.EVALUATE) / 2,
    creativity: bloomsScores.CREATE,
    problemSolving: (bloomsScores.APPLY + bloomsScores.ANALYZE) / 2,
    comprehension: bloomsScores.UNDERSTAND,
    retention: bloomsScores.REMEMBER,
  };
}

function analyzePerformancePatterns(trajectory: any[]): any {
  if (trajectory.length < 2) return { trend: 'insufficient_data' };
  
  const recent = trajectory.slice(-10);
  const trend = recent.length > 1 
    ? recent[recent.length - 1].cognitiveLevel > recent[0].cognitiveLevel ? 'improving' : 'stable'
    : 'stable';
  
  return {
    trend,
    consistency: calculateConsistency(recent),
    growthRate: calculateGrowthRate(recent),
  };
}

function calculateConsistency(data: any[]): number {
  if (data.length < 2) return 100;
  
  const values = data.map(d => d.cognitiveLevel);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  return Math.max(0, 100 - (stdDev / mean) * 100);
}

function calculateGrowthRate(data: any[]): number {
  if (data.length < 2) return 0;
  
  const first = data[0].cognitiveLevel;
  const last = data[data.length - 1].cognitiveLevel;
  
  return ((last - first) / first) * 100;
}

function determineOptimalLearningStyle(bloomsScores: any): string {
  const highestLevel = Object.entries(bloomsScores)
    .sort(([, a], [, b]) => (b as number) - (a as number))[0][0];
  
  const styleMap: Record<string, string> = {
    REMEMBER: 'visual',
    UNDERSTAND: 'auditory',
    APPLY: 'kinesthetic',
    ANALYZE: 'logical',
    EVALUATE: 'social',
    CREATE: 'solitary',
  };
  
  return styleMap[highestLevel] || 'mixed';
}