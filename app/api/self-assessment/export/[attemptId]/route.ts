/**
 * Self-Assessment Result Export
 *
 * Export a single graded self-assessment attempt as a structured report.
 * Includes overall score, Bloom's distribution, per-question performance,
 * AI evaluation summary, and learning recommendations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

const ExportParamsSchema = z.object({
  format: z.enum(['csv', 'json']).default('json'),
});

interface RouteParams {
  params: Promise<{ attemptId: string }>;
}

interface BloomsBreakdownEntry {
  questionsCount: number;
  correctCount: number;
  scorePercentage: number;
}

interface CognitiveProfile {
  overallMastery: number;
  strengths: string[];
  weaknesses: string[];
  recommendedFocus: string[];
}

interface LearningRecommendation {
  type: string;
  title: string;
  description: string;
  priority: string;
  bloomsLevel?: string;
}

interface QuestionPerformance {
  position: number;
  question: string;
  questionType: string;
  bloomsLevel: string;
  difficulty: string;
  points: number;
  userAnswer: string | null;
  correctAnswer: string | null;
  isCorrect: boolean | null;
  pointsEarned: number;
  feedback: string | null;
  demonstratedLevel: string | null;
  timeSpentSeconds: number | null;
}

/**
 * GET /api/self-assessment/export/[attemptId]?format=json|csv
 *
 * Export a graded self-assessment attempt as a downloadable report.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await currentUser();
    const { attemptId } = await params;

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query params
    let exportParams: z.infer<typeof ExportParamsSchema>;
    try {
      const url = new URL(request.url);
      exportParams = ExportParamsSchema.parse({
        format: url.searchParams.get('format') ?? 'json',
      });
    } catch {
      return NextResponse.json(
        { error: 'Invalid parameters. format must be "json" or "csv".' },
        { status: 400 }
      );
    }

    // Fetch attempt with all related data
    const attempt = await db.selfAssessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            description: true,
            topic: true,
            subtopics: true,
            passingScore: true,
            timeLimit: true,
            totalQuestions: true,
            totalPoints: true,
            targetBloomsDistribution: true,
          },
        },
        answers: {
          include: {
            question: {
              select: {
                id: true,
                question: true,
                questionType: true,
                correctAnswer: true,
                bloomsLevel: true,
                difficulty: true,
                points: true,
                explanation: true,
                order: true,
              },
            },
          },
          orderBy: { question: { order: 'asc' } },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (attempt.status !== 'GRADED' && attempt.status !== 'SUBMITTED') {
      return NextResponse.json(
        { error: 'Only submitted or graded attempts can be exported' },
        { status: 400 }
      );
    }

    // Build per-question performance
    const questionPerformance: QuestionPerformance[] = attempt.answers.map((answer, idx) => ({
      position: answer.question.order ?? idx + 1,
      question: answer.question.question,
      questionType: answer.question.questionType,
      bloomsLevel: answer.question.bloomsLevel ?? 'REMEMBER',
      difficulty: answer.question.difficulty ?? 'MEDIUM',
      points: answer.question.points,
      userAnswer: answer.answer,
      correctAnswer: answer.question.correctAnswer,
      isCorrect: answer.isCorrect,
      pointsEarned: answer.pointsEarned ?? 0,
      feedback: answer.feedback,
      demonstratedLevel: answer.demonstratedLevel,
      timeSpentSeconds: answer.timeSpent,
    }));

    // Parse Bloom's breakdown from stored JSON
    const bloomsBreakdown = parseBloomsBreakdown(attempt.bloomsBreakdown);

    // Parse cognitive profile
    const cognitiveProfile = parseCognitiveProfile(attempt.cognitiveProfile);

    // Parse learning recommendations
    const learningRecommendations = parseLearningRecommendations(
      attempt.learningRecommendations
    );

    // Parse AI evaluation summary
    const aiEvaluationSummary = attempt.aiEvaluationSummary as Record<string, unknown> | null;

    // Compute summary statistics
    const totalAnswered = attempt.answers.filter((a) => a.answer !== null).length;
    const totalCorrect = attempt.answers.filter((a) => a.isCorrect === true).length;
    const totalIncorrect = attempt.answers.filter((a) => a.isCorrect === false).length;
    const unanswered = (attempt.totalQuestions ?? 0) - totalAnswered;

    const timeSpentMinutes = attempt.timeSpent
      ? Math.round(attempt.timeSpent / 60)
      : null;

    logger.info('[SELF_ASSESSMENT_EXPORT] Export generated', {
      userId: user.id,
      attemptId,
      format: exportParams.format,
      questionCount: questionPerformance.length,
    });

    if (exportParams.format === 'csv') {
      return buildCSVResponse(
        attempt,
        questionPerformance,
        bloomsBreakdown,
        cognitiveProfile,
        learningRecommendations,
        { totalAnswered, totalCorrect, totalIncorrect, unanswered, timeSpentMinutes }
      );
    }

    // JSON report
    const report = {
      exportDate: new Date().toISOString(),
      exam: {
        id: attempt.exam.id,
        title: attempt.exam.title,
        description: attempt.exam.description,
        topic: attempt.exam.topic,
        subtopics: attempt.exam.subtopics,
        passingScore: attempt.exam.passingScore,
        timeLimit: attempt.exam.timeLimit,
        totalQuestions: attempt.exam.totalQuestions,
        totalPoints: attempt.exam.totalPoints,
      },
      attempt: {
        id: attempt.id,
        attemptNumber: attempt.attemptNumber,
        status: attempt.status,
        startedAt: attempt.startedAt?.toISOString() ?? null,
        submittedAt: attempt.submittedAt?.toISOString() ?? null,
        timeSpentSeconds: attempt.timeSpent,
        timeSpentMinutes,
      },
      score: {
        scorePercentage: attempt.scorePercentage ?? 0,
        isPassed: attempt.isPassed ?? false,
        passingScore: attempt.exam.passingScore ?? 70,
        earnedPoints: attempt.earnedPoints ?? 0,
        totalPoints: attempt.totalPoints ?? 0,
        correctAnswers: totalCorrect,
        incorrectAnswers: totalIncorrect,
        unanswered,
        totalQuestions: attempt.totalQuestions ?? 0,
      },
      bloomsDistribution: bloomsBreakdown,
      cognitiveProfile,
      questionPerformance,
      aiEvaluationSummary,
      learningRecommendations,
    };

    const timestamp = new Date().toISOString().split('T')[0];
    const safeTitle = (attempt.exam.title ?? 'assessment')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .slice(0, 40);

    return new NextResponse(JSON.stringify(report, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="self-assessment-${safeTitle}-${timestamp}.json"`,
      },
    });
  } catch (error) {
    logger.error('[SELF_ASSESSMENT_EXPORT] Export failed:', error);
    return NextResponse.json(
      { error: 'Failed to export assessment results' },
      { status: 500 }
    );
  }
}

// ============================================================================
// Helpers
// ============================================================================

function parseBloomsBreakdown(
  raw: unknown
): Record<string, BloomsBreakdownEntry> {
  if (!raw || typeof raw !== 'object') return {};
  const parsed: Record<string, BloomsBreakdownEntry> = {};
  for (const [level, data] of Object.entries(raw as Record<string, unknown>)) {
    if (data && typeof data === 'object') {
      const d = data as Record<string, unknown>;
      parsed[level] = {
        questionsCount: (d.questionsCount as number) ?? 0,
        correctCount: (d.correctCount as number) ?? 0,
        scorePercentage: (d.scorePercentage as number) ?? 0,
      };
    }
  }
  return parsed;
}

function parseCognitiveProfile(raw: unknown): CognitiveProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Record<string, unknown>;
  return {
    overallMastery: (d.overallMastery as number) ?? 0,
    strengths: Array.isArray(d.strengths) ? (d.strengths as string[]) : [],
    weaknesses: Array.isArray(d.weaknesses) ? (d.weaknesses as string[]) : [],
    recommendedFocus: Array.isArray(d.recommendedFocus)
      ? (d.recommendedFocus as string[])
      : [],
  };
}

function parseLearningRecommendations(raw: unknown): LearningRecommendation[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r): r is Record<string, unknown> => r !== null && typeof r === 'object')
    .map((r) => ({
      type: (r.type as string) ?? 'practice',
      title: (r.title as string) ?? '',
      description: (r.description as string) ?? '',
      priority: (r.priority as string) ?? 'MEDIUM',
      bloomsLevel: (r.bloomsLevel as string) ?? undefined,
    }));
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildCSVResponse(
  attempt: {
    id: string;
    attemptNumber: number;
    status: string;
    startedAt: Date | null;
    submittedAt: Date | null;
    timeSpent: number | null;
    scorePercentage: number | null;
    isPassed: boolean | null;
    earnedPoints: number | null;
    totalPoints: number | null;
    totalQuestions: number | null;
    exam: {
      title: string;
      passingScore: number | null;
    };
  },
  questions: QuestionPerformance[],
  bloomsBreakdown: Record<string, BloomsBreakdownEntry>,
  cognitiveProfile: CognitiveProfile | null,
  recommendations: LearningRecommendation[],
  summary: {
    totalAnswered: number;
    totalCorrect: number;
    totalIncorrect: number;
    unanswered: number;
    timeSpentMinutes: number | null;
  }
): NextResponse {
  const lines: string[] = [];

  // Summary section
  lines.push('=== Assessment Summary ===');
  lines.push('Field,Value');
  lines.push(`Exam,${csvEscape(attempt.exam.title)}`);
  lines.push(`Attempt #,${attempt.attemptNumber}`);
  lines.push(`Status,${attempt.status}`);
  lines.push(`Score,${attempt.scorePercentage ?? 0}%`);
  lines.push(`Result,${attempt.isPassed ? 'PASSED' : 'FAILED'}`);
  lines.push(`Passing Score,${attempt.exam.passingScore ?? 70}%`);
  lines.push(`Points,${attempt.earnedPoints ?? 0}/${attempt.totalPoints ?? 0}`);
  lines.push(`Questions Correct,${summary.totalCorrect}/${attempt.totalQuestions ?? 0}`);
  lines.push(`Unanswered,${summary.unanswered}`);
  lines.push(`Time Spent,${summary.timeSpentMinutes ?? 'N/A'} minutes`);
  lines.push(`Started,${attempt.startedAt?.toISOString() ?? 'N/A'}`);
  lines.push(`Submitted,${attempt.submittedAt?.toISOString() ?? 'N/A'}`);

  // Bloom's distribution section
  lines.push('');
  lines.push('=== Cognitive Level Performance ===');
  lines.push('Bloom Level,Questions,Correct,Accuracy %');
  for (const [level, data] of Object.entries(bloomsBreakdown)) {
    lines.push(`${level},${data.questionsCount},${data.correctCount},${data.scorePercentage}`);
  }

  // Cognitive profile section
  if (cognitiveProfile) {
    lines.push('');
    lines.push('=== Cognitive Profile ===');
    lines.push(`Overall Mastery,${cognitiveProfile.overallMastery}%`);
    if (cognitiveProfile.strengths.length > 0) {
      lines.push(`Strengths,${csvEscape(cognitiveProfile.strengths.join('; '))}`);
    }
    if (cognitiveProfile.weaknesses.length > 0) {
      lines.push(`Weaknesses,${csvEscape(cognitiveProfile.weaknesses.join('; '))}`);
    }
    if (cognitiveProfile.recommendedFocus.length > 0) {
      lines.push(`Recommended Focus,${csvEscape(cognitiveProfile.recommendedFocus.join('; '))}`);
    }
  }

  // Per-question performance
  lines.push('');
  lines.push('=== Question Performance ===');
  lines.push(
    '#,Question,Type,Bloom Level,Difficulty,Points,Earned,Correct,Your Answer,Correct Answer,Feedback'
  );
  for (const q of questions) {
    lines.push(
      [
        q.position,
        csvEscape(q.question.slice(0, 200)),
        q.questionType,
        q.bloomsLevel,
        q.difficulty,
        q.points,
        q.pointsEarned,
        q.isCorrect === null ? 'N/A' : q.isCorrect ? 'Yes' : 'No',
        csvEscape(q.userAnswer ?? ''),
        csvEscape(q.correctAnswer ?? ''),
        csvEscape(q.feedback ?? ''),
      ].join(',')
    );
  }

  // Recommendations
  if (recommendations.length > 0) {
    lines.push('');
    lines.push('=== Learning Recommendations ===');
    lines.push('Priority,Type,Title,Description,Bloom Level');
    for (const rec of recommendations) {
      lines.push(
        [
          rec.priority,
          rec.type,
          csvEscape(rec.title),
          csvEscape(rec.description),
          rec.bloomsLevel ?? '',
        ].join(',')
      );
    }
  }

  const csvContent = lines.join('\n');
  const timestamp = new Date().toISOString().split('T')[0];
  const safeTitle = (attempt.exam.title ?? 'assessment')
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .slice(0, 40);

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="self-assessment-${safeTitle}-${timestamp}.csv"`,
    },
  });
}
