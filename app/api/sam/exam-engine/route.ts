import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { createExamEngine } from '@sam-ai/educational';
import type { ExamGenerationConfig, StudentProfile } from '@sam-ai/educational';
import { getUserScopedSAMConfig, getDatabaseAdapter } from '@/lib/adapters';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// Create a user-scoped exam engine instance
async function createExamEngineForUser(userId: string) {
  const samConfig = await getUserScopedSAMConfig(userId, 'analysis');
  return createExamEngine({
    samConfig,
    database: getDatabaseAdapter(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      courseId,
      sectionIds,
      config,
      includeStudentProfile = true,
    } = await request.json();

    // Validate configuration
    if (!config || !config.totalQuestions || !config.timeLimit) {
      return NextResponse.json(
        { error: 'Invalid exam configuration' },
        { status: 400 }
      );
    }

    // Check course access if courseId provided
    if (courseId) {
      const course = await db.course.findUnique({
        where: { id: courseId },
        select: { userId: true, organizationId: true },
      });

      if (!course) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }

      // Check if user is course owner or has organization access
      const hasAccess = course.userId === user.id ||
        (course.organizationId && await checkOrganizationAccess(user.id, course.organizationId));

      if (!hasAccess && user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Check section access if sectionIds provided
    if (sectionIds && sectionIds.length > 0) {
      const sections = await db.section.findMany({
        where: { id: { in: sectionIds } },
        include: {
          chapter: {
            include: {
              course: {
                select: { userId: true, organizationId: true },
              },
            },
          },
        },
      });

      for (const section of sections) {
        const hasAccess = section.chapter.course.userId === user.id ||
          (section.chapter.course.organizationId &&
           await checkOrganizationAccess(user.id, section.chapter.course.organizationId));

        if (!hasAccess && user.role !== 'ADMIN') {
          return NextResponse.json({ error: 'Access denied to section' }, { status: 403 });
        }
      }
    }

    // Build exam generation config for the portable engine
    const examConfig: ExamGenerationConfig = {
      totalQuestions: config.totalQuestions,
      duration: config.timeLimit || config.duration || 60,
      bloomsDistribution: config.bloomsDistribution || {
        REMEMBER: 15,
        UNDERSTAND: 20,
        APPLY: 25,
        ANALYZE: 20,
        EVALUATE: 15,
        CREATE: 5,
      },
      difficultyDistribution: config.difficultyDistribution || {
        EASY: 30,
        MEDIUM: 50,
        HARD: 20,
      },
      questionTypes: config.questionTypes || ['MULTIPLE_CHOICE', 'SHORT_ANSWER'],
      adaptiveMode: config.adaptiveMode ?? false,
    };

    // Get student profile if needed
    const studentProfile: StudentProfile | undefined = includeStudentProfile ? {
      userId: user.id,
      currentLevel: await getStudentLevel(user.id, courseId),
      learningStyle: await getStudentLearningStyle(user.id),
    } : undefined;

    // Generate exam using portable @sam-ai/educational engine
    const engine = await createExamEngineForUser(user.id);
    const examResponse = await engine.generateExam(
      courseId,
      sectionIds,
      examConfig,
      studentProfile
    );

    // Record the generation as a SAM interaction
    await recordSAMInteraction(user.id, courseId, 'EXAM_GENERATED', {
      totalQuestions: config.totalQuestions,
      adaptiveMode: config.adaptiveMode,
      bloomsAlignment: examResponse.bloomsAnalysis.targetVsActual.alignmentScore,
    });

    return NextResponse.json({
      success: true,
      data: examResponse,
      metadata: {
        generatedAt: new Date().toISOString(),
        userId: user.id,
        courseId,
        sectionCount: sectionIds?.length || 0,
        engine: '@sam-ai/educational',
      },
    });

  } catch (error) {
    logger.error('Generate exam error:', error);
    return NextResponse.json(
      { error: 'Failed to generate exam' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');

    if (!examId) {
      return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 });
    }

    // Get exam with Bloom's profile
    const exam = await db.exam.findUnique({
      where: { id: examId },
      include: {
        ExamBloomsProfile: true,
        section: {
          include: {
            chapter: {
              include: {
                course: {
                  select: { userId: true, organizationId: true },
                },
              },
            },
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    // Check access
    const hasAccess = exam.section.chapter.course.userId === user.id ||
      (exam.section.chapter.course.organizationId &&
       await checkOrganizationAccess(user.id, exam.section.chapter.course.organizationId));

    if (!hasAccess && user.role !== 'ADMIN') {
      // Check if user has taken the exam
      const attempt = await db.userExamAttempt.findFirst({
        where: {
          examId,
          userId: user.id,
        },
      });

      if (!attempt) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        exam: {
          id: exam.id,
          title: exam.title,
          timeLimit: exam.timeLimit,
          isActive: exam.isActive,
        },
        bloomsProfile: exam.ExamBloomsProfile ? {
          targetDistribution: exam.ExamBloomsProfile.targetDistribution,
          actualDistribution: exam.ExamBloomsProfile.actualDistribution,
          difficultyMatrix: exam.ExamBloomsProfile.difficultyMatrix,
          skillsAssessed: exam.ExamBloomsProfile.skillsAssessed,
          coverageMap: exam.ExamBloomsProfile.coverageMap,
        } : null,
      },
    });

  } catch (error) {
    logger.error('Get exam error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve exam' },
      { status: 500 }
    );
  }
}

async function checkOrganizationAccess(userId: string, organizationId: string): Promise<boolean> {
  const membership = await db.organizationUser.findFirst({
    where: {
      userId,
      organizationId,
      role: 'ADMIN',
    },
  });

  return !!membership;
}

async function getStudentLevel(userId: string, courseId: string | null): Promise<string> {
  if (courseId) {
    const progress = await db.studentBloomsProgress.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    if (progress) {
      const scores = progress.bloomsScores as Record<string, number>;
      const avgScore = Object.values(scores).reduce((sum, score) => sum + (score ?? 0), 0) / 6;
      return avgScore > 70 ? 'advanced' : avgScore > 40 ? 'intermediate' : 'beginner';
    }
  }

  return 'intermediate';
}

async function getStudentLearningStyle(userId: string): Promise<string> {
  const profile = await db.studentCognitiveProfile.findUnique({
    where: { userId },
  });

  return profile?.optimalLearningStyle || 'mixed';
}

async function recordSAMInteraction(
  userId: string,
  courseId: string | null,
  interactionType: string,
  result: Record<string, unknown>
): Promise<void> {
  try {
    await db.sAMInteraction.create({
      data: {
        userId,
        courseId,
        interactionType: 'CONTENT_GENERATE',
        context: { type: interactionType, result },
      },
    });
  } catch (error) {
    logger.error('Error recording SAM interaction:', error);
  }
}
