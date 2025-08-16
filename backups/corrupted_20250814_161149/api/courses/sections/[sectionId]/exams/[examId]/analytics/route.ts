import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sectionId: string; examId: string }> }
) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { examId } = await params;

    if (!examId) {
      return new NextResponse("Exam ID is required", { status: 400 });
    }

    // Get user's attempts with detailed analytics
    const attempts = await db.userExamAttempt.findMany({
      where: {
        examId,
        userId: user.id,
        status: {
          in: ['SUBMITTED', 'GRADED'],
        },
      },
      include: {
        UserAnswer: {
          include: {
            ExamQuestion: {
              select: {
                id: true,
                question: true,
                questionType: true,
                points: true,
                order: true,
              },
            },
          },
        },
        ExamAnalytics: true,
        Exam: {
          select: {
            id: true,
            title: true,
            description: true,
            passingScore: true,
            timeLimit: true,
          },
        },
      },
      orderBy: {
        attemptNumber: 'asc',
      },
    });

    if (attempts.length === 0) {
      return NextResponse.json({
        attempts: [],
        summary: null,
        trends: null,
        questionAnalysis: null,
      });
    }

    // Calculate performance trends
    const performanceTrends = attempts.map((attempt, index) => ({
      attemptNumber: attempt.attemptNumber,
      score: attempt.scorePercentage || 0,
      isPassed: attempt.isPassed,
      timeSpent: attempt.timeSpent || 0,
      correctAnswers: attempt.correctAnswers,
      totalQuestions: attempt.totalQuestions,
      date: attempt.submittedAt,
      improvement: index > 0 
        ? (attempt.scorePercentage || 0) - (attempts[index - 1].scorePercentage || 0)
        : 0,
    }));

    // Question-level analysis
    const questionAnalysis = new Map();
    attempts.forEach(attempt => {
      attempt.UserAnswer.forEach(answer => {
        const questionId = answer.ExamQuestion.id;
        if (!questionAnalysis.has(questionId)) {
          questionAnalysis.set(questionId, {
            question: answer.ExamQuestion,
            attempts: [],
            correctCount: 0,
            totalAttempts: 0,
            averageTime: 0,
            totalTime: 0,
          });
        }
        
        const analysis = questionAnalysis.get(questionId);
        analysis.attempts.push({
          attemptNumber: attempt.attemptNumber,
          isCorrect: answer.isCorrect,
          timeSpent: answer.timeSpent || 0,
          pointsEarned: answer.pointsEarned,
        });
        
        if (answer.isCorrect) analysis.correctCount++;
        analysis.totalAttempts++;
        analysis.totalTime += answer.timeSpent || 0;
        analysis.averageTime = analysis.totalTime / analysis.totalAttempts;
      });
    });

    // Convert to array and add success rate
    const questionAnalysisArray = Array.from(questionAnalysis.values()).map(q => ({
      ...q,
      successRate: q.totalAttempts > 0 ? (q.correctCount / q.totalAttempts) * 100 : 0,
    }));

    // Overall performance summary
    const latestAttempt = attempts[attempts.length - 1];
    const bestAttempt = attempts.reduce((best, current) => 
      (current.scorePercentage || 0) > (best.scorePercentage || 0) ? current : best
    );

    const summary = {
      totalAttempts: attempts.length,
      latestScore: latestAttempt.scorePercentage || 0,
      bestScore: bestAttempt.scorePercentage || 0,
      averageScore: attempts.reduce((sum, attempt) => sum + (attempt.scorePercentage || 0), 0) / attempts.length,
      isPassed: latestAttempt.isPassed,
      hasImproved: attempts.length > 1 && 
        (latestAttempt.scorePercentage || 0) > (attempts[0].scorePercentage || 0),
      averageTime: attempts.reduce((sum, attempt) => sum + (attempt.timeSpent || 0), 0) / attempts.length,
      passingScore: latestAttempt.Exam.passingScore,
    };

    // Time distribution analysis
    const timeDistribution = attempts.map(attempt => ({
      attemptNumber: attempt.attemptNumber,
      totalTime: attempt.timeSpent || 0,
      averageTimePerQuestion: attempt.totalQuestions > 0 
        ? (attempt.timeSpent || 0) / attempt.totalQuestions 
        : 0,
      timeLimit: attempt.Exam.timeLimit,
      timeUtilization: attempt.Exam.timeLimit 
        ? ((attempt.timeSpent || 0) / (attempt.Exam.timeLimit * 60)) * 100 
        : 0,
    }));

    // Difficulty analysis - questions with low success rates
    const difficultQuestions = questionAnalysisArray
      .filter(q => q.successRate < 50)
      .sort((a, b) => a.successRate - b.successRate)
      .slice(0, 5);

    // Strength analysis - consistently correct questions
    const strongQuestions = questionAnalysisArray
      .filter(q => q.successRate >= 80)
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5);

    return NextResponse.json({
      attempts: performanceTrends,
      summary,
      trends: {
        performance: performanceTrends,
        timeDistribution,
      },
      questionAnalysis: {
        all: questionAnalysisArray,
        difficult: difficultQuestions,
        strong: strongQuestions,
      },
      recommendations: generateRecommendations(summary, questionAnalysisArray, performanceTrends),
    });
  } catch (error: any) {
    logger.error("[EXAM_ANALYTICS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

function generateRecommendations(
  summary: any,
  questionAnalysis: any[],
  trends: any[]
) {
  const recommendations = [];

  // Score-based recommendations
  if (summary.latestScore < summary.passingScore) {
    recommendations.push({
      type: 'improvement',
      title: 'Focus on Weak Areas',
      description: `Your latest score is ${summary.latestScore.toFixed(1)}%. Review questions you've answered incorrectly.`,
      priority: 'high',
    });
  }

  // Trend-based recommendations
  if (trends.length > 1) {
    const lastTrend = trends[trends.length - 1];
    if (lastTrend.improvement < 0) {
      recommendations.push({
        type: 'warning',
        title: 'Performance Decline',
        description: 'Your recent performance has declined. Consider taking a break or reviewing fundamentals.',
        priority: 'medium',
      });
    } else if (lastTrend.improvement > 10) {
      recommendations.push({
        type: 'success',
        title: 'Great Improvement!',
        description: `You've improved by ${lastTrend.improvement.toFixed(1)}% since your last attempt.`,
        priority: 'low',
      });
    }
  }

  // Question-type recommendations
  const difficultQuestions = questionAnalysis.filter(q => q.successRate < 50);
  if (difficultQuestions.length > 0) {
    const questionTypes = Array.from(new Set(difficultQuestions.map(q => q.question.questionType)));
    recommendations.push({
      type: 'study',
      title: 'Practice Question Types',
      description: `Focus on ${questionTypes.join(', ')} type questions where you have lower success rates.`,
      priority: 'medium',
    });
  }

  // Time management recommendations
  if (summary.averageTime > 0) {
    const avgTimePerQuestion = summary.averageTime / (trends[0]?.totalQuestions || 1);
    if (avgTimePerQuestion > 120) { // More than 2 minutes per question
      recommendations.push({
        type: 'time',
        title: 'Improve Time Management',
        description: 'You\'re spending a lot of time per question. Practice with time constraints.',
        priority: 'medium',
      });
    }
  }

  return recommendations;
} 