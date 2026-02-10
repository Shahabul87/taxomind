import { NextRequest, NextResponse } from 'next/server';

import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

interface BloomsPerformance {
  level: string;
  attempts: number;
  totalQuestions: number;
  correctAnswers: number;
  avgScore: number;
}

interface ExamAttemptSummary {
  id: string;
  examId: string;
  examTitle: string;
  courseTitle: string;
  attemptNumber: number;
  score: number;
  isPassed: boolean;
  timeSpent: number;
  totalQuestions: number;
  correctAnswers: number;
  submittedAt: Date | null;
}

interface WeakArea {
  topic: string;
  examTitle: string;
  score: number;
  attempts: number;
  recommendation: string;
}

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();

    if (!user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const sectionId = searchParams.get('sectionId');
    const period = searchParams.get('period') || 'all';

    // Calculate date filter based on period
    let dateFilter: Date | undefined;
    const now = new Date();
    switch (period) {
      case 'week':
        dateFilter = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        dateFilter = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'quarter':
        dateFilter = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case 'year':
        dateFilter = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        dateFilter = undefined;
    }

    // Build where clause
    const whereClause: Record<string, unknown> = {
      userId: user.id,
      status: {
        in: ['SUBMITTED', 'GRADED'],
      },
    };

    if (dateFilter) {
      whereClause.submittedAt = { gte: dateFilter };
    }

    if (courseId || sectionId) {
      const examFilter: Record<string, unknown> = {};
      if (sectionId) {
        examFilter.sectionId = sectionId;
      }
      if (courseId) {
        examFilter.section = {
          chapter: {
            courseId,
          },
        };
      }
      whereClause.Exam = examFilter;
    }

    // Fetch all exam attempts with related data
    const attempts = await db.userExamAttempt.findMany({
      where: whereClause,
      include: {
        Exam: {
          select: {
            id: true,
            title: true,
            passingScore: true,
            timeLimit: true,
            section: {
              select: {
                title: true,
                chapter: {
                  select: {
                    title: true,
                    course: {
                      select: {
                        id: true,
                        title: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        UserAnswer: {
          include: {
            ExamQuestion: {
              select: {
                id: true,
                question: true,
                questionType: true,
                bloomsLevel: true,
                points: true,
              },
            },
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    if (attempts.length === 0) {
      return NextResponse.json({
        summary: {
          totalAttempts: 0,
          totalExams: 0,
          passRate: 0,
          failRate: 0,
          averageScore: 0,
          bestScore: 0,
          worstScore: 0,
          averageTimePerExam: 0,
          averageTimePerQuestion: 0,
        },
        trends: {
          scoreOverTime: [],
          attemptsOverTime: [],
          improvementRate: 0,
        },
        bloomsAnalysis: [],
        weakAreas: [],
        recentAttempts: [],
        recommendations: [],
      });
    }

    // Calculate summary statistics
    const passedAttempts = attempts.filter((a) => a.isPassed === true);
    const totalQuestions = attempts.reduce((sum, a) => sum + a.totalQuestions, 0);
    const totalTime = attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0);
    const scores = attempts.map((a) => a.scorePercentage || 0);
    const uniqueExams = new Set(attempts.map((a) => a.examId));

    const summary = {
      totalAttempts: attempts.length,
      totalExams: uniqueExams.size,
      passRate: Math.round((passedAttempts.length / attempts.length) * 100),
      failRate: Math.round(((attempts.length - passedAttempts.length) / attempts.length) * 100),
      averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      bestScore: Math.round(Math.max(...scores)),
      worstScore: Math.round(Math.min(...scores)),
      averageTimePerExam: Math.round(totalTime / attempts.length),
      averageTimePerQuestion: totalQuestions > 0 ? Math.round(totalTime / totalQuestions) : 0,
    };

    // Calculate score trends over time
    const scoresByDate = new Map<string, number[]>();
    const attemptsByDate = new Map<string, number>();

    attempts.forEach((attempt) => {
      if (attempt.submittedAt) {
        const dateKey = attempt.submittedAt.toISOString().split('T')[0];
        if (!scoresByDate.has(dateKey)) {
          scoresByDate.set(dateKey, []);
        }
        scoresByDate.get(dateKey)!.push(attempt.scorePercentage || 0);
        attemptsByDate.set(dateKey, (attemptsByDate.get(dateKey) || 0) + 1);
      }
    });

    const scoreOverTime = Array.from(scoresByDate.entries())
      .map(([date, scores]) => ({
        date,
        score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        attempts: scores.length,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const attemptsOverTime = Array.from(attemptsByDate.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate improvement rate (first attempt vs recent attempts)
    const sortedByTime = [...attempts].sort(
      (a, b) => (a.submittedAt?.getTime() || 0) - (b.submittedAt?.getTime() || 0)
    );
    const firstAttemptScore = sortedByTime[0]?.scorePercentage || 0;
    const recentScores = sortedByTime.slice(-3).map((a) => a.scorePercentage || 0);
    const recentAvg = recentScores.length > 0
      ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length
      : 0;
    const improvementRate = Math.round(recentAvg - firstAttemptScore);

    const trends = {
      scoreOverTime,
      attemptsOverTime,
      improvementRate,
    };

    // Calculate Bloom's taxonomy performance
    const bloomsMap = new Map<string, BloomsPerformance>();
    const bloomsLevels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];

    bloomsLevels.forEach((level) => {
      bloomsMap.set(level, {
        level,
        attempts: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        avgScore: 0,
      });
    });

    attempts.forEach((attempt) => {
      attempt.UserAnswer.forEach((answer) => {
        const bloomsLevel = answer.ExamQuestion?.bloomsLevel || 'REMEMBER';
        const performance = bloomsMap.get(bloomsLevel);
        if (performance) {
          performance.totalQuestions++;
          if (answer.isCorrect) {
            performance.correctAnswers++;
          }
        }
      });
    });

    const bloomsAnalysis = Array.from(bloomsMap.values()).map((perf) => ({
      ...perf,
      avgScore: perf.totalQuestions > 0
        ? Math.round((perf.correctAnswers / perf.totalQuestions) * 100)
        : 0,
    }));

    // Identify weak areas (exams with low scores)
    const examPerformance = new Map<string, { scores: number[]; title: string; sectionTitle: string }>();

    attempts.forEach((attempt) => {
      const key = attempt.examId;
      if (!examPerformance.has(key)) {
        examPerformance.set(key, {
          scores: [],
          title: attempt.Exam.title,
          sectionTitle: attempt.Exam.section?.title || 'Unknown Section',
        });
      }
      examPerformance.get(key)!.scores.push(attempt.scorePercentage || 0);
    });

    const weakAreas: WeakArea[] = Array.from(examPerformance.entries())
      .map(([examId, data]) => {
        const avgScore = Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length);
        return {
          topic: data.sectionTitle,
          examTitle: data.title,
          score: avgScore,
          attempts: data.scores.length,
          recommendation: generateRecommendation(avgScore, data.title),
        };
      })
      .filter((area) => area.score < 70)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5);

    // Format recent attempts
    const recentAttempts: ExamAttemptSummary[] = attempts.slice(0, 10).map((attempt) => ({
      id: attempt.id,
      examId: attempt.examId,
      examTitle: attempt.Exam.title,
      courseTitle: attempt.Exam.section?.chapter?.course?.title || 'Unknown Course',
      attemptNumber: attempt.attemptNumber,
      score: Math.round(attempt.scorePercentage || 0),
      isPassed: attempt.isPassed || false,
      timeSpent: attempt.timeSpent || 0,
      totalQuestions: attempt.totalQuestions,
      correctAnswers: attempt.correctAnswers,
      submittedAt: attempt.submittedAt,
    }));

    // Generate AI recommendations
    const recommendations = generateAIRecommendations(summary, bloomsAnalysis, weakAreas, trends);

    return NextResponse.json({
      summary,
      trends,
      bloomsAnalysis,
      weakAreas,
      recentAttempts,
      recommendations,
    });
  } catch (error) {
    logger.error('[USER_EXAM_ANALYTICS_GET]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

function generateRecommendation(score: number, examTitle: string): string {
  if (score < 40) {
    return `Review the fundamentals of ${examTitle}. Consider re-watching lectures and taking notes.`;
  } else if (score < 60) {
    return `Practice more questions on ${examTitle}. Focus on understanding concepts, not memorization.`;
  } else if (score < 70) {
    return `You're close to passing! Review your incorrect answers in ${examTitle} and try again.`;
  }
  return `Good progress on ${examTitle}. Keep practicing to improve further.`;
}

function generateAIRecommendations(
  summary: { averageScore: number; passRate: number; improvementRate?: number; averageTimePerQuestion: number },
  bloomsAnalysis: BloomsPerformance[],
  weakAreas: WeakArea[],
  trends: { improvementRate: number }
): Array<{ type: string; title: string; description: string; priority: string }> {
  const recommendations = [];

  // Score-based recommendations
  if (summary.averageScore < 60) {
    recommendations.push({
      type: 'improvement',
      title: 'Focus on Core Concepts',
      description: `Your average score is ${summary.averageScore}%. Review the fundamental concepts before attempting more exams.`,
      priority: 'high',
    });
  } else if (summary.averageScore < 70) {
    recommendations.push({
      type: 'improvement',
      title: 'Almost There!',
      description: `Your average score is ${summary.averageScore}%. A little more practice will help you reach the passing threshold.`,
      priority: 'medium',
    });
  }

  // Pass rate recommendations
  if (summary.passRate < 50) {
    recommendations.push({
      type: 'warning',
      title: 'Review Study Strategy',
      description: `Your pass rate is ${summary.passRate}%. Consider spending more time on study materials before taking exams.`,
      priority: 'high',
    });
  }

  // Bloom's taxonomy recommendations
  const weakBlooms = bloomsAnalysis.filter((b) => b.avgScore < 60 && b.totalQuestions > 0);
  if (weakBlooms.length > 0) {
    const weakLevels = weakBlooms.map((b) => b.level.toLowerCase()).join(', ');
    recommendations.push({
      type: 'study',
      title: 'Strengthen Cognitive Skills',
      description: `Focus on ${weakLevels} level questions. Practice with exercises that challenge these thinking skills.`,
      priority: 'medium',
    });
  }

  // Trend-based recommendations
  if (trends.improvementRate > 10) {
    recommendations.push({
      type: 'success',
      title: 'Great Progress!',
      description: `You've improved by ${trends.improvementRate}% from your first attempts. Keep up the momentum!`,
      priority: 'low',
    });
  } else if (trends.improvementRate < -5) {
    recommendations.push({
      type: 'warning',
      title: 'Performance Decline',
      description: 'Your recent scores have decreased. Consider taking a break or reviewing fundamentals.',
      priority: 'medium',
    });
  }

  // Time management recommendations
  if (summary.averageTimePerQuestion > 120) {
    recommendations.push({
      type: 'time',
      title: 'Improve Time Management',
      description: `You spend an average of ${Math.round(summary.averageTimePerQuestion / 60)} minutes per question. Practice with timed quizzes.`,
      priority: 'low',
    });
  }

  // Weak areas recommendations
  if (weakAreas.length > 0) {
    recommendations.push({
      type: 'focus',
      title: 'Address Weak Areas',
      description: `Focus on improving: ${weakAreas.slice(0, 3).map((w) => w.examTitle).join(', ')}`,
      priority: 'high',
    });
  }

  return recommendations;
}
