/**
 * Prisma SAM Database Adapter
 *
 * Maps the SAMDatabaseAdapter interface from @sam-ai/core to the Taxomind Prisma schema.
 * This enables the portable @sam-ai/educational package to work with the Prisma database.
 */

import type { PrismaClient, SAMInteractionType } from '@prisma/client';
import type {
  SAMDatabaseAdapter,
  SAMUser,
  SAMCourse,
  SAMChapter,
  SAMSection,
  SAMQuestion,
  SAMBloomsProgress,
  SAMCognitiveProgress,
  SAMInteractionLog,
  SAMCourseAnalysis,
  QueryOptions,
} from '@sam-ai/core';

// ============================================================================
// TYPE MAPPERS
// ============================================================================

/**
 * Maps Prisma QuestionType enum to SAMQuestion questionType
 */
const mapQuestionType = (
  prismaType: string
): SAMQuestion['questionType'] => {
  const mapping: Record<string, SAMQuestion['questionType']> = {
    MULTIPLE_CHOICE: 'multiple_choice',
    TRUE_FALSE: 'true_false',
    SHORT_ANSWER: 'short_answer',
    ESSAY: 'essay',
    FILL_IN_BLANK: 'fill_blank',
    MATCHING: 'multiple_choice', // Fallback
    ORDERING: 'multiple_choice', // Fallback
  };
  return mapping[prismaType] ?? 'multiple_choice';
};

/**
 * Maps SAMQuestion questionType to Prisma QuestionType enum
 */
const mapQuestionTypeToPrisma = (
  samType: SAMQuestion['questionType']
): string => {
  const mapping: Record<SAMQuestion['questionType'], string> = {
    multiple_choice: 'MULTIPLE_CHOICE',
    true_false: 'TRUE_FALSE',
    short_answer: 'SHORT_ANSWER',
    essay: 'ESSAY',
    fill_blank: 'FILL_IN_BLANK',
  };
  return mapping[samType] ?? 'MULTIPLE_CHOICE';
};

/**
 * Maps Prisma BloomsLevel enum to SAMQuestion bloomsLevel
 */
const mapBloomsLevel = (
  prismaLevel: string
): SAMQuestion['bloomsLevel'] => {
  const mapping: Record<string, SAMQuestion['bloomsLevel']> = {
    REMEMBER: 'remember',
    UNDERSTAND: 'understand',
    APPLY: 'apply',
    ANALYZE: 'analyze',
    EVALUATE: 'evaluate',
    CREATE: 'create',
  };
  return mapping[prismaLevel] ?? 'remember';
};

/**
 * Maps SAMQuestion bloomsLevel to Prisma BloomsLevel enum
 */
const mapBloomsLevelToPrisma = (
  samLevel: SAMQuestion['bloomsLevel']
): string => {
  const mapping: Record<SAMQuestion['bloomsLevel'], string> = {
    remember: 'REMEMBER',
    understand: 'UNDERSTAND',
    apply: 'APPLY',
    analyze: 'ANALYZE',
    evaluate: 'EVALUATE',
    create: 'CREATE',
  };
  return mapping[samLevel] ?? 'REMEMBER';
};

/**
 * Maps Prisma QuestionDifficulty enum to SAMQuestion difficulty
 */
const mapDifficulty = (
  prismaDifficulty: string
): SAMQuestion['difficulty'] => {
  const mapping: Record<string, SAMQuestion['difficulty']> = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard',
  };
  return mapping[prismaDifficulty] ?? 'medium';
};

/**
 * Maps SAMQuestion difficulty to Prisma QuestionDifficulty enum
 */
const mapDifficultyToPrisma = (
  samDifficulty: SAMQuestion['difficulty']
): string => {
  const mapping: Record<SAMQuestion['difficulty'], string> = {
    easy: 'EASY',
    medium: 'MEDIUM',
    hard: 'HARD',
  };
  return mapping[samDifficulty] ?? 'MEDIUM';
};

// ============================================================================
// BLOOMS SCORES HELPERS
// ============================================================================

interface BloomsScoresJson {
  REMEMBER?: number;
  UNDERSTAND?: number;
  APPLY?: number;
  ANALYZE?: number;
  EVALUATE?: number;
  CREATE?: number;
  [key: string]: number | undefined;
}

/**
 * Extracts individual Bloom's scores from JSON
 */
const extractBloomsScores = (bloomsScores: unknown): {
  rememberScore: number;
  understandScore: number;
  applyScore: number;
  analyzeScore: number;
  evaluateScore: number;
  createScore: number;
  overallScore: number;
} => {
  const scores = (bloomsScores as BloomsScoresJson) ?? {};
  const rememberScore = scores.REMEMBER ?? 0;
  const understandScore = scores.UNDERSTAND ?? 0;
  const applyScore = scores.APPLY ?? 0;
  const analyzeScore = scores.ANALYZE ?? 0;
  const evaluateScore = scores.EVALUATE ?? 0;
  const createScore = scores.CREATE ?? 0;

  const overallScore =
    (rememberScore + understandScore + applyScore + analyzeScore + evaluateScore + createScore) / 6;

  return {
    rememberScore,
    understandScore,
    applyScore,
    analyzeScore,
    evaluateScore,
    createScore,
    overallScore,
  };
};

/**
 * Creates Bloom's scores JSON from individual scores
 */
const createBloomsScoresJson = (
  data: Partial<SAMBloomsProgress>
): BloomsScoresJson => {
  return {
    REMEMBER: data.rememberScore ?? 0,
    UNDERSTAND: data.understandScore ?? 0,
    APPLY: data.applyScore ?? 0,
    ANALYZE: data.analyzeScore ?? 0,
    EVALUATE: data.evaluateScore ?? 0,
    CREATE: data.createScore ?? 0,
  };
};

// ============================================================================
// PRISMA SAM DATABASE ADAPTER
// ============================================================================

/**
 * Prisma implementation of SAMDatabaseAdapter
 */
export class PrismaSAMDatabaseAdapter implements SAMDatabaseAdapter {
  constructor(private prisma: PrismaClient) {}

  // ============================================================================
  // USER OPERATIONS
  // ============================================================================

  async findUser(id: string, _options?: QueryOptions): Promise<SAMUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role ?? undefined,
      createdAt: user.createdAt ?? undefined,
    };
  }

  async findUsers(filter: Partial<SAMUser>, options?: QueryOptions): Promise<SAMUser[]> {
    const users = await this.prisma.user.findMany({
      where: {
        ...(filter.id && { id: filter.id }),
        ...(filter.name && { name: filter.name }),
        ...(filter.email && { email: filter.email }),
      },
      take: options?.limit,
      skip: options?.offset,
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role ?? undefined,
      createdAt: user.createdAt ?? undefined,
    }));
  }

  async updateUser(id: string, data: Partial<SAMUser>): Promise<SAMUser> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role ?? undefined,
      createdAt: user.createdAt ?? undefined,
    };
  }

  // ============================================================================
  // COURSE OPERATIONS
  // ============================================================================

  async findCourse(id: string, options?: QueryOptions): Promise<SAMCourse | null> {
    const includeChapters = options?.include?.chapters === true;
    const includeSections = options?.include?.sections === true;

    const course = await this.prisma.course.findUnique({
      where: { id },
      include: includeChapters
        ? {
            chapters: {
              orderBy: { position: 'asc' },
              include: includeSections
                ? {
                    sections: {
                      orderBy: { position: 'asc' },
                    },
                  }
                : undefined,
            },
          }
        : undefined,
    });

    if (!course) return null;

    type ChapterWithSections = {
      id: string;
      title: string;
      description: string | null;
      position: number;
      isPublished: boolean;
      courseId: string;
      createdAt: Date;
      updatedAt: Date;
      sections?: Array<{
        id: string;
        title: string;
        description: string | null;
        learningObjectives: string | null;
        position: number;
        isPublished: boolean;
        chapterId: string;
        createdAt: Date;
        updatedAt: Date;
      }>;
    };

    const courseWithChapters = course as typeof course & { chapters?: ChapterWithSections[] };

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      imageUrl: course.imageUrl,
      categoryId: course.categoryId,
      userId: course.userId,
      isPublished: course.isPublished,
      chapters: courseWithChapters.chapters?.map((ch) => ({
        id: ch.id,
        title: ch.title,
        description: ch.description,
        position: ch.position,
        isPublished: ch.isPublished,
        courseId: ch.courseId,
        createdAt: ch.createdAt,
        updatedAt: ch.updatedAt,
        sections: ch.sections?.map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          content: s.learningObjectives, // Map learningObjectives to content
          position: s.position,
          isPublished: s.isPublished,
          chapterId: s.chapterId,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        })),
      })),
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };
  }

  async findCourses(filter: Partial<SAMCourse>, options?: QueryOptions): Promise<SAMCourse[]> {
    const courses = await this.prisma.course.findMany({
      where: {
        ...(filter.id && { id: filter.id }),
        ...(filter.title && { title: { contains: filter.title, mode: 'insensitive' as const } }),
        ...(filter.userId && { userId: filter.userId }),
        ...(filter.isPublished !== undefined && { isPublished: filter.isPublished }),
        ...(filter.categoryId && { categoryId: filter.categoryId }),
      },
      take: options?.limit,
      skip: options?.offset,
      orderBy: options?.orderBy,
    });

    return courses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      imageUrl: course.imageUrl,
      categoryId: course.categoryId,
      userId: course.userId,
      isPublished: course.isPublished,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    }));
  }

  // ============================================================================
  // CHAPTER/SECTION OPERATIONS
  // ============================================================================

  async findChapter(id: string, options?: QueryOptions): Promise<SAMChapter | null> {
    const includeSections = options?.include?.sections === true;

    const chapter = await this.prisma.chapter.findUnique({
      where: { id },
      include: includeSections
        ? {
            sections: {
              orderBy: { position: 'asc' },
            },
          }
        : undefined,
    });

    if (!chapter) return null;

    type ChapterWithSections = typeof chapter & {
      sections?: Array<{
        id: string;
        title: string;
        description: string | null;
        learningObjectives: string | null;
        position: number;
        isPublished: boolean;
        chapterId: string;
        createdAt: Date;
        updatedAt: Date;
      }>;
    };

    const chapterWithSections = chapter as ChapterWithSections;

    return {
      id: chapter.id,
      title: chapter.title,
      description: chapter.description,
      position: chapter.position,
      isPublished: chapter.isPublished,
      courseId: chapter.courseId,
      sections: chapterWithSections.sections?.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        content: s.learningObjectives, // Map learningObjectives to content
        position: s.position,
        isPublished: s.isPublished,
        chapterId: s.chapterId,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      createdAt: chapter.createdAt,
      updatedAt: chapter.updatedAt,
    };
  }

  async findChaptersByCourse(courseId: string, options?: QueryOptions): Promise<SAMChapter[]> {
    const chapters = await this.prisma.chapter.findMany({
      where: { courseId },
      take: options?.limit,
      skip: options?.offset,
      orderBy: { position: 'asc' },
    });

    return chapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      description: chapter.description,
      position: chapter.position,
      isPublished: chapter.isPublished,
      courseId: chapter.courseId,
      createdAt: chapter.createdAt,
      updatedAt: chapter.updatedAt,
    }));
  }

  async findSection(id: string, _options?: QueryOptions): Promise<SAMSection | null> {
    const section = await this.prisma.section.findUnique({
      where: { id },
    });

    if (!section) return null;

    return {
      id: section.id,
      title: section.title,
      description: section.description,
      content: section.learningObjectives, // Map learningObjectives to content
      position: section.position,
      isPublished: section.isPublished,
      chapterId: section.chapterId,
      createdAt: section.createdAt,
      updatedAt: section.updatedAt,
    };
  }

  async findSectionsByChapter(chapterId: string, options?: QueryOptions): Promise<SAMSection[]> {
    const sections = await this.prisma.section.findMany({
      where: { chapterId },
      take: options?.limit,
      skip: options?.offset,
      orderBy: { position: 'asc' },
    });

    return sections.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      content: section.learningObjectives, // Map learningObjectives to content
      position: section.position,
      isPublished: section.isPublished,
      chapterId: section.chapterId,
      createdAt: section.createdAt,
      updatedAt: section.updatedAt,
    }));
  }

  // ============================================================================
  // QUESTION BANK OPERATIONS
  // ============================================================================

  async findQuestions(filter: Partial<SAMQuestion>, options?: QueryOptions): Promise<SAMQuestion[]> {
    const questions = await this.prisma.questionBank.findMany({
      where: {
        ...(filter.courseId && { courseId: filter.courseId }),
        ...(filter.sectionId && { topic: filter.sectionId }), // Map sectionId to topic
        ...(filter.questionType && { questionType: mapQuestionTypeToPrisma(filter.questionType) as never }),
        ...(filter.bloomsLevel && { bloomsLevel: mapBloomsLevelToPrisma(filter.bloomsLevel) as never }),
        ...(filter.difficulty && { difficulty: mapDifficultyToPrisma(filter.difficulty) as never }),
      },
      take: options?.limit,
      skip: options?.offset,
    });

    return questions.map((q) => ({
      id: q.id,
      question: q.question,
      answer: typeof q.correctAnswer === 'string' ? q.correctAnswer : JSON.stringify(q.correctAnswer),
      options: Array.isArray(q.options) ? (q.options as string[]) : null,
      questionType: mapQuestionType(q.questionType),
      bloomsLevel: mapBloomsLevel(q.bloomsLevel),
      difficulty: mapDifficulty(q.difficulty),
      points: 1, // QuestionBank doesn't have points, default to 1
      courseId: q.courseId ?? '',
      chapterId: q.subject, // Map subject to chapterId
      sectionId: q.topic, // Map topic to sectionId
      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
    }));
  }

  async createQuestion(
    data: Omit<SAMQuestion, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SAMQuestion> {
    const question = await this.prisma.questionBank.create({
      data: {
        courseId: data.courseId || null,
        subject: data.chapterId ?? 'General',
        topic: data.sectionId ?? 'General',
        question: data.question,
        questionType: mapQuestionTypeToPrisma(data.questionType) as never,
        bloomsLevel: mapBloomsLevelToPrisma(data.bloomsLevel) as never,
        difficulty: mapDifficultyToPrisma(data.difficulty) as never,
        options: data.options ?? [],
        correctAnswer: data.answer ?? '',
        explanation: '',
        tags: [],
      },
    });

    return {
      id: question.id,
      question: question.question,
      answer: typeof question.correctAnswer === 'string'
        ? question.correctAnswer
        : JSON.stringify(question.correctAnswer),
      options: Array.isArray(question.options) ? (question.options as string[]) : null,
      questionType: mapQuestionType(question.questionType),
      bloomsLevel: mapBloomsLevel(question.bloomsLevel),
      difficulty: mapDifficulty(question.difficulty),
      points: data.points,
      courseId: question.courseId ?? '',
      chapterId: question.subject,
      sectionId: question.topic,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    };
  }

  async updateQuestion(id: string, data: Partial<SAMQuestion>): Promise<SAMQuestion> {
    const question = await this.prisma.questionBank.update({
      where: { id },
      data: {
        ...(data.question && { question: data.question }),
        ...(data.questionType && { questionType: mapQuestionTypeToPrisma(data.questionType) as never }),
        ...(data.bloomsLevel && { bloomsLevel: mapBloomsLevelToPrisma(data.bloomsLevel) as never }),
        ...(data.difficulty && { difficulty: mapDifficultyToPrisma(data.difficulty) as never }),
        ...(data.options && { options: data.options }),
        ...(data.answer && { correctAnswer: data.answer }),
      },
    });

    return {
      id: question.id,
      question: question.question,
      answer: typeof question.correctAnswer === 'string'
        ? question.correctAnswer
        : JSON.stringify(question.correctAnswer),
      options: Array.isArray(question.options) ? (question.options as string[]) : null,
      questionType: mapQuestionType(question.questionType),
      bloomsLevel: mapBloomsLevel(question.bloomsLevel),
      difficulty: mapDifficulty(question.difficulty),
      points: 1,
      courseId: question.courseId ?? '',
      chapterId: question.subject,
      sectionId: question.topic,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    };
  }

  async deleteQuestion(id: string): Promise<void> {
    await this.prisma.questionBank.delete({
      where: { id },
    });
  }

  // ============================================================================
  // BLOOM'S PROGRESS OPERATIONS
  // ============================================================================

  async findBloomsProgress(userId: string, courseId: string): Promise<SAMBloomsProgress | null> {
    const progress = await this.prisma.studentBloomsProgress.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    if (!progress) return null;

    const scores = extractBloomsScores(progress.bloomsScores);

    return {
      id: progress.id,
      userId: progress.userId,
      courseId: progress.courseId ?? '',
      ...scores,
      assessmentCount: 1, // Not tracked in current schema
      lastAssessedAt: progress.lastAssessedAt,
      updatedAt: progress.updatedAt,
    };
  }

  async upsertBloomsProgress(
    userId: string,
    courseId: string,
    data: Partial<SAMBloomsProgress>
  ): Promise<SAMBloomsProgress> {
    const bloomsScores = createBloomsScoresJson(data);

    const progress = await this.prisma.studentBloomsProgress.upsert({
      where: {
        userId_courseId: { userId, courseId },
      },
      create: {
        userId,
        courseId,
        bloomsScores,
        strengthAreas: [],
        weaknessAreas: [],
        progressHistory: [],
        lastAssessedAt: new Date(),
      },
      update: {
        bloomsScores,
        lastAssessedAt: new Date(),
      },
    });

    const scores = extractBloomsScores(progress.bloomsScores);

    return {
      id: progress.id,
      userId: progress.userId,
      courseId: progress.courseId ?? '',
      ...scores,
      assessmentCount: 1,
      lastAssessedAt: progress.lastAssessedAt,
      updatedAt: progress.updatedAt,
    };
  }

  // ============================================================================
  // COGNITIVE PROGRESS OPERATIONS
  // ============================================================================

  async findCognitiveProgress(
    userId: string,
    skillType: string
  ): Promise<SAMCognitiveProgress | null> {
    // The current schema uses UserLearningPattern with different fields
    const pattern = await this.prisma.userLearningPattern.findUnique({
      where: { userId },
    });

    if (!pattern) return null;

    // Map learning pattern to cognitive progress
    return {
      id: pattern.id,
      userId: pattern.userId,
      skillType,
      proficiencyLevel: pattern.confidence ?? 0,
      totalAttempts: 0,
      successfulAttempts: 0,
      averageTimeSeconds: 0,
      lastPracticedAt: pattern.lastAnalyzed,
      updatedAt: pattern.updatedAt,
    };
  }

  async upsertCognitiveProgress(
    userId: string,
    skillType: string,
    data: Partial<SAMCognitiveProgress>
  ): Promise<SAMCognitiveProgress> {
    // Map to UserLearningPattern model
    const pattern = await this.prisma.userLearningPattern.upsert({
      where: { userId },
      create: {
        userId,
        patternType: skillType,
        patterns: {},
        confidence: data.proficiencyLevel ?? 0,
        effectiveness: 0,
        lastAnalyzed: new Date(),
      },
      update: {
        confidence: data.proficiencyLevel,
        lastAnalyzed: new Date(),
      },
    });

    return {
      id: pattern.id,
      userId: pattern.userId,
      skillType,
      proficiencyLevel: pattern.confidence ?? 0,
      totalAttempts: data.totalAttempts ?? 0,
      successfulAttempts: data.successfulAttempts ?? 0,
      averageTimeSeconds: data.averageTimeSeconds ?? 0,
      lastPracticedAt: pattern.lastAnalyzed,
      updatedAt: pattern.updatedAt,
    };
  }

  // ============================================================================
  // INTERACTION LOGGING
  // ============================================================================

  async logInteraction(
    data: Omit<SAMInteractionLog, 'id' | 'createdAt'>
  ): Promise<SAMInteractionLog> {
    // Map SAMInteractionLog to SAMInteraction model
    // Use LEARNING_ASSISTANCE as the default interaction type
    const interactionType: SAMInteractionType = 'LEARNING_ASSISTANCE';

    const interaction = await this.prisma.sAMInteraction.create({
      data: {
        userId: data.userId,
        interactionType,
        context: {
          pageType: data.pageType,
          pagePath: data.pagePath,
          query: data.query,
          response: data.response,
          enginesUsed: data.enginesUsed,
          responseTimeMs: data.responseTimeMs,
          tokenCount: data.tokenCount,
          sessionId: data.sessionId,
          ...((data.metadata as Record<string, unknown>) ?? {}),
        },
        success: true,
        duration: data.responseTimeMs,
      },
    });

    return {
      id: interaction.id,
      userId: interaction.userId,
      sessionId: data.sessionId ?? null,
      pageType: data.pageType,
      pagePath: data.pagePath,
      query: data.query,
      response: data.response,
      enginesUsed: data.enginesUsed,
      responseTimeMs: data.responseTimeMs,
      tokenCount: data.tokenCount,
      metadata: data.metadata,
      createdAt: interaction.createdAt,
    };
  }

  async findInteractions(userId: string, options?: QueryOptions): Promise<SAMInteractionLog[]> {
    const interactions = await this.prisma.sAMInteraction.findMany({
      where: { userId },
      take: options?.limit,
      skip: options?.offset,
      orderBy: { createdAt: 'desc' },
    });

    return interactions.map((i) => {
      const context = i.context as Record<string, unknown>;
      return {
        id: i.id,
        userId: i.userId,
        sessionId: (context.sessionId as string) ?? null,
        pageType: (context.pageType as string) ?? 'GENERAL',
        pagePath: (context.pagePath as string) ?? '/',
        query: (context.query as string) ?? '',
        response: (context.response as string) ?? '',
        enginesUsed: (context.enginesUsed as string[]) ?? [],
        responseTimeMs: i.duration ?? 0,
        tokenCount: context.tokenCount as number | undefined,
        metadata: context,
        createdAt: i.createdAt,
      };
    });
  }

  async countInteractions(filter?: {
    userId?: string;
    pageType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<number> {
    return this.prisma.sAMInteraction.count({
      where: {
        ...(filter?.userId && { userId: filter.userId }),
        ...(filter?.startDate && { createdAt: { gte: filter.startDate } }),
        ...(filter?.endDate && { createdAt: { lte: filter.endDate } }),
      },
    });
  }

  // ============================================================================
  // COURSE ANALYSIS OPERATIONS
  // ============================================================================

  async findCourseAnalysis(courseId: string): Promise<SAMCourseAnalysis | null> {
    const analysis = await this.prisma.courseBloomsAnalysis.findUnique({
      where: { courseId },
    });

    if (!analysis) return null;

    const distribution = analysis.bloomsDistribution as Record<string, number>;
    const gapAnalysis = analysis.gapAnalysis as { gaps?: string[] } | null;
    const recommendations = analysis.recommendations as string[] | null;

    // Calculate total and overall from distribution
    const total = Object.values(distribution).reduce((sum, v) => sum + (v ?? 0), 0);

    return {
      id: analysis.id,
      courseId: analysis.courseId,
      rememberPercentage: distribution.REMEMBER ?? 0,
      understandPercentage: distribution.UNDERSTAND ?? 0,
      applyPercentage: distribution.APPLY ?? 0,
      analyzePercentage: distribution.ANALYZE ?? 0,
      evaluatePercentage: distribution.EVALUATE ?? 0,
      createPercentage: distribution.CREATE ?? 0,
      totalObjectives: total,
      overallScore: analysis.cognitiveDepth ?? 0,
      recommendations: Array.isArray(recommendations) ? recommendations : undefined,
      gaps: gapAnalysis?.gaps,
      analyzedAt: analysis.analyzedAt,
    };
  }

  async upsertCourseAnalysis(
    courseId: string,
    data: Partial<SAMCourseAnalysis>
  ): Promise<SAMCourseAnalysis> {
    const bloomsDistribution = {
      REMEMBER: data.rememberPercentage ?? 0,
      UNDERSTAND: data.understandPercentage ?? 0,
      APPLY: data.applyPercentage ?? 0,
      ANALYZE: data.analyzePercentage ?? 0,
      EVALUATE: data.evaluatePercentage ?? 0,
      CREATE: data.createPercentage ?? 0,
    };

    const analysis = await this.prisma.courseBloomsAnalysis.upsert({
      where: { courseId },
      create: {
        courseId,
        bloomsDistribution,
        cognitiveDepth: data.overallScore ?? 0,
        learningPathway: {},
        skillsMatrix: {},
        gapAnalysis: { gaps: data.gaps ?? [] },
        recommendations: data.recommendations ?? [],
        analyzedAt: new Date(),
      },
      update: {
        bloomsDistribution,
        cognitiveDepth: data.overallScore,
        gapAnalysis: data.gaps ? { gaps: data.gaps } : undefined,
        recommendations: data.recommendations,
        analyzedAt: new Date(),
      },
    });

    const distribution = analysis.bloomsDistribution as Record<string, number>;
    const gapAnalysis = analysis.gapAnalysis as { gaps?: string[] } | null;
    const recommendations = analysis.recommendations as string[] | null;
    const total = Object.values(distribution).reduce((sum, v) => sum + (v ?? 0), 0);

    return {
      id: analysis.id,
      courseId: analysis.courseId,
      rememberPercentage: distribution.REMEMBER ?? 0,
      understandPercentage: distribution.UNDERSTAND ?? 0,
      applyPercentage: distribution.APPLY ?? 0,
      analyzePercentage: distribution.ANALYZE ?? 0,
      evaluatePercentage: distribution.EVALUATE ?? 0,
      createPercentage: distribution.CREATE ?? 0,
      totalObjectives: total,
      overallScore: analysis.cognitiveDepth ?? 0,
      recommendations: Array.isArray(recommendations) ? recommendations : undefined,
      gaps: gapAnalysis?.gaps,
      analyzedAt: analysis.analyzedAt,
    };
  }

  // ============================================================================
  // UTILITY OPERATIONS
  // ============================================================================

  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Create a Prisma SAM database adapter
 */
export function createPrismaSAMAdapter(prisma: PrismaClient): SAMDatabaseAdapter {
  return new PrismaSAMDatabaseAdapter(prisma);
}
