import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

// Force Node.js runtime
export const runtime = 'nodejs';

interface CognitiveLevelAnalysis {
  bloomsLevel: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  averageTime: number;
  difficulty: {
    easy: { correct: number; total: number };
    medium: { correct: number; total: number };
    hard: { correct: number; total: number };
  };
}

interface AdaptiveRecommendation {
  type: 'strength' | 'improvement' | 'challenge' | 'practice';
  title: string;
  description: string;
  bloomsLevel?: string;
  difficulty?: string;
  priority: 'high' | 'medium' | 'low';
  actionItems: string[];
}

// POST endpoint to analyze student performance and provide adaptive recommendations
export async function POST(
  req: NextRequest
) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { sectionId, examId } = await req.json();

    if (!sectionId) {
      return NextResponse.json(
        { error: 'Section ID is required' },
        { status: 400 }
      );
    }

    // Fetch all user attempts for the section (or specific exam if provided)
    const whereClause: any = {
      userId: user.id,
      exam: {
        sectionId: sectionId
      }
    };

    if (examId) {
      whereClause.examId = examId;
    }

    const attempts = await db.userExamAttempt.findMany({
      where: whereClause,
      include: {
        Exam: {
          select: {
            title: true,
            sectionId: true,
          }
        },
        UserAnswer: {
          include: {
            ExamQuestion: {
              select: {
                questionType: true,
                difficulty: true,
                bloomsLevel: true,
                points: true,
              }
            }
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    });

    if (attempts.length === 0) {
      return NextResponse.json({
        success: true,
        analysis: {
          overallPerformance: {
            totalAttempts: 0,
            averageScore: 0,
            improvement: 0,
            consistency: 0
          },
          cognitiveLevels: [],
          recommendations: [{
            type: 'practice',
            title: 'Start Your Learning Journey',
            description: 'Take your first exam to begin receiving personalized recommendations.',
            priority: 'high',
            actionItems: ['Complete an assessment to analyze your learning patterns']
          }]
        }
      });
    }

    // Analyze cognitive levels (Bloom's taxonomy)
    const cognitiveLevels = analyzeCognitiveLevels(attempts);
    
    // Analyze overall performance trends
    const overallPerformance = analyzeOverallPerformance(attempts);
    
    // Generate adaptive recommendations
    const recommendations = generateAdaptiveRecommendations(cognitiveLevels, overallPerformance, attempts);

    // Calculate learning velocity and retention
    const learningMetrics = calculateLearningMetrics(attempts);

    return NextResponse.json({
      success: true,
      analysis: {
        overallPerformance,
        cognitiveLevels,
        recommendations,
        learningMetrics,
        metadata: {
          totalAttempts: attempts.length,
          analysisDate: new Date().toISOString(),
          sectionId,
          examId
        }
      }
    });

  } catch (error) {
    logger.error('[ADAPTIVE_ASSESSMENT_ANALYZE]', { error: error instanceof Error ? error.message : 'Unknown error' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function analyzeCognitiveLevels(attempts: any[]): CognitiveLevelAnalysis[] {
  const bloomsLevels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  const analysis: { [key: string]: CognitiveLevelAnalysis } = {};

  // Initialize analysis for each Bloom's level
  bloomsLevels.forEach(level => {
    analysis[level] = {
      bloomsLevel: level,
      totalQuestions: 0,
      correctAnswers: 0,
      accuracy: 0,
      averageTime: 0,
      difficulty: {
        easy: { correct: 0, total: 0 },
        medium: { correct: 0, total: 0 },
        hard: { correct: 0, total: 0 }
      }
    };
  });

  let totalTime: { [key: string]: number } = {};
  let timeCount: { [key: string]: number } = {};

  // Analyze each attempt's answers
  attempts.forEach(attempt => {
    const timePerQuestion = attempt.timeSpent ? attempt.timeSpent / attempt.totalQuestions : 0;
    
    attempt.UserAnswer.forEach((answer: any) => {
      const bloomsLevel = answer.ExamQuestion.bloomsLevel || 'REMEMBER';
      const difficulty = answer.ExamQuestion.difficulty?.toLowerCase() || 'medium';
      
      if (analysis[bloomsLevel]) {
        analysis[bloomsLevel].totalQuestions++;
        
        if (answer.isCorrect) {
          analysis[bloomsLevel].correctAnswers++;
          analysis[bloomsLevel].difficulty[difficulty as keyof typeof analysis[typeof bloomsLevel]['difficulty']].correct++;
        }
        
        analysis[bloomsLevel].difficulty[difficulty as keyof typeof analysis[typeof bloomsLevel]['difficulty']].total++;
        
        // Track time
        if (!totalTime[bloomsLevel]) totalTime[bloomsLevel] = 0;
        if (!timeCount[bloomsLevel]) timeCount[bloomsLevel] = 0;
        
        totalTime[bloomsLevel] += timePerQuestion;
        timeCount[bloomsLevel]++;
      }
    });
  });

  // Calculate final metrics
  return bloomsLevels.map(level => {
    const data = analysis[level];
    data.accuracy = data.totalQuestions > 0 ? (data.correctAnswers / data.totalQuestions) * 100 : 0;
    data.averageTime = timeCount[level] > 0 ? totalTime[level] / timeCount[level] : 0;
    return data;
  }).filter(level => level.totalQuestions > 0);
}

function analyzeOverallPerformance(attempts: any[]) {
  const scores = attempts.map(attempt => attempt.scorePercentage || 0);
  const totalAttempts = attempts.length;
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / totalAttempts;
  
  // Calculate improvement trend
  let improvement = 0;
  if (scores.length >= 2) {
    const recentScores = scores.slice(0, Math.min(3, scores.length));
    const olderScores = scores.slice(-Math.min(3, scores.length));
    const recentAvg = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
    const olderAvg = olderScores.reduce((sum, score) => sum + score, 0) / olderScores.length;
    improvement = recentAvg - olderAvg;
  }
  
  // Calculate consistency (lower standard deviation = higher consistency)
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / totalAttempts;
  const standardDeviation = Math.sqrt(variance);
  const consistency = Math.max(0, 100 - standardDeviation);

  return {
    totalAttempts,
    averageScore: Math.round(averageScore * 10) / 10,
    improvement: Math.round(improvement * 10) / 10,
    consistency: Math.round(consistency * 10) / 10,
    trend: improvement > 5 ? 'improving' : improvement < -5 ? 'declining' : 'stable'
  };
}

function generateAdaptiveRecommendations(
  cognitiveLevels: CognitiveLevelAnalysis[], 
  overallPerformance: any, 
  attempts: any[]
): AdaptiveRecommendation[] {
  const recommendations: AdaptiveRecommendation[] = [];

  // Analyze strengths and weaknesses
  const sortedLevels = [...cognitiveLevels].sort((a, b) => b.accuracy - a.accuracy);
  const strongest = sortedLevels[0];
  const weakest = sortedLevels[sortedLevels.length - 1];

  // Strength recognition
  if (strongest && strongest.accuracy > 80) {
    recommendations.push({
      type: 'strength',
      title: `Strong ${strongest.bloomsLevel.toLowerCase()} Skills`,
      description: `You excel at ${strongest.bloomsLevel.toLowerCase()} level questions with ${strongest.accuracy.toFixed(1)}% accuracy.`,
      bloomsLevel: strongest.bloomsLevel,
      priority: 'low',
      actionItems: [
        'Continue practicing at this level to maintain proficiency',
        'Try more challenging questions to push your boundaries'
      ]
    });
  }

  // Improvement areas
  if (weakest && weakest.accuracy < 60) {
    recommendations.push({
      type: 'improvement',
      title: `Focus on ${weakest.bloomsLevel.toLowerCase()} Skills`,
      description: `Your ${weakest.bloomsLevel.toLowerCase()} level accuracy is ${weakest.accuracy.toFixed(1)}%. This area needs attention.`,
      bloomsLevel: weakest.bloomsLevel,
      priority: 'high',
      actionItems: [
        `Study concepts related to ${weakest.bloomsLevel.toLowerCase()} thinking`,
        'Practice more questions at this cognitive level',
        'Review explanations for questions you got wrong'
      ]
    });
  }

  // Difficulty-based recommendations
  cognitiveLevels.forEach(level => {
    const { easy, medium, hard } = level.difficulty;
    
    if (easy.total > 0 && (easy.correct / easy.total) < 0.7) {
      recommendations.push({
        type: 'practice',
        title: 'Master the Fundamentals',
        description: `You're struggling with easy ${level.bloomsLevel.toLowerCase()} questions. Focus on building a solid foundation.`,
        bloomsLevel: level.bloomsLevel,
        difficulty: 'easy',
        priority: 'high',
        actionItems: [
          'Review basic concepts and definitions',
          'Practice more fundamental questions',
          'Seek additional study materials or help'
        ]
      });
    } else if (medium.total > 0 && (medium.correct / medium.total) > 0.8 && hard.total > 0 && (hard.correct / hard.total) < 0.5) {
      recommendations.push({
        type: 'challenge',
        title: 'Ready for Advanced Challenges',
        description: `You're doing well with medium difficulty. Time to tackle more challenging ${level.bloomsLevel.toLowerCase()} questions.`,
        bloomsLevel: level.bloomsLevel,
        difficulty: 'hard',
        priority: 'medium',
        actionItems: [
          'Attempt more complex problems',
          'Study advanced applications of concepts',
          'Practice under time pressure'
        ]
      });
    }
  });

  // Performance trend recommendations
  if (overallPerformance.trend === 'declining') {
    recommendations.push({
      type: 'improvement',
      title: 'Address Performance Decline',
      description: `Your scores have decreased by ${Math.abs(overallPerformance.improvement).toFixed(1)}% recently.`,
      priority: 'high',
      actionItems: [
        'Review recent mistakes and learn from them',
        'Adjust your study schedule and methods',
        'Consider getting additional help or tutoring'
      ]
    });
  } else if (overallPerformance.trend === 'improving') {
    recommendations.push({
      type: 'strength',
      title: 'Great Progress!',
      description: `Your scores have improved by ${overallPerformance.improvement.toFixed(1)}% recently. Keep it up!`,
      priority: 'low',
      actionItems: [
        'Continue with your current study approach',
        'Gradually increase the difficulty level',
        'Help others to reinforce your own learning'
      ]
    });
  }

  // Consistency recommendations
  if (overallPerformance.consistency < 70) {
    recommendations.push({
      type: 'improvement',
      title: 'Improve Consistency',
      description: 'Your performance varies significantly between attempts. Focus on building stable knowledge.',
      priority: 'medium',
      actionItems: [
        'Establish a regular study routine',
        'Review all topics systematically',
        'Practice under similar conditions each time'
      ]
    });
  }

  return recommendations.slice(0, 6); // Limit to most important recommendations
}

function calculateLearningMetrics(attempts: any[]) {
  // Calculate learning velocity (improvement rate)
  const timeSpans = attempts.slice(1).map((attempt, index) => {
    const current = new Date(attempt.startedAt);
    const previous = new Date(attempts[index].startedAt);
    return Math.abs(current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24); // days
  });

  const avgTimeBetweenAttempts = timeSpans.length > 0 
    ? timeSpans.reduce((sum, span) => sum + span, 0) / timeSpans.length 
    : 0;

  // Calculate knowledge retention (comparing performance on repeated topics)
  const topics: { [key: string]: number[] } = {};
  attempts.forEach(attempt => {
    const sectionId = attempt.exam.sectionId;
    if (!topics[sectionId]) topics[sectionId] = [];
    topics[sectionId].push(attempt.scorePercentage || 0);
  });

  const retentionScores = Object.values(topics)
    .filter(scores => scores.length > 1)
    .map(scores => {
      const latest = scores[0];
      const earliest = scores[scores.length - 1];
      return Math.max(0, (latest - earliest + 100) / 2); // Retention score
    });

  const avgRetention = retentionScores.length > 0
    ? retentionScores.reduce((sum, score) => sum + score, 0) / retentionScores.length
    : 0;

  return {
    learningVelocity: Math.round(avgTimeBetweenAttempts * 10) / 10,
    knowledgeRetention: Math.round(avgRetention * 10) / 10,
    studyFrequency: avgTimeBetweenAttempts < 2 ? 'high' : avgTimeBetweenAttempts < 7 ? 'moderate' : 'low'
  };
}