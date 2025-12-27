/**
 * Prisma SAM Database Adapter for Taxomind
 *
 * Implements SAMDatabaseAdapter interface using Prisma Client
 * to connect SAM AI to the Taxomind database.
 */

import { db } from '@/lib/db';
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
  TransactionContext,
} from '@sam-ai/core';

// ============================================================================
// PRISMA SAM ADAPTER IMPLEMENTATION
// ============================================================================

/**
 * Prisma implementation of SAMDatabaseAdapter for Taxomind LMS
 *
 * @example
 * ```typescript
 * import { PrismaSAMAdapter } from '@/lib/sam/adapters/prisma-adapter';
 * import { createSAMConfig } from '@sam-ai/core';
 *
 * const dbAdapter = new PrismaSAMAdapter();
 * const samConfig = createSAMConfig({
 *   ai: aiAdapter,
 *   cache: cacheAdapter,
 *   database: dbAdapter,
 *   // ...
 * });
 * ```
 */
export class PrismaSAMAdapter implements SAMDatabaseAdapter {
  // ============================================================================
  // USER OPERATIONS
  // ============================================================================

  async findUser(id: string, options?: QueryOptions): Promise<SAMUser | null> {
    const user = await db.user.findUnique({
      where: { id },
      select: options?.select ? this.mapSelectFields(options.select) : undefined,
    });

    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      preferences: {},
      createdAt: user.createdAt,
      updatedAt: user.createdAt, // User model uses createdAt only
    };
  }

  async findUsers(filter: Partial<SAMUser>, options?: QueryOptions): Promise<SAMUser[]> {
    const users = await db.user.findMany({
      where: this.buildUserFilter(filter),
      take: options?.limit,
      skip: options?.offset,
      orderBy: options?.orderBy ? this.mapOrderBy(options.orderBy) : undefined,
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      preferences: {},
      createdAt: user.createdAt,
      updatedAt: user.createdAt, // User model uses createdAt only
    }));
  }

  async updateUser(id: string, data: Partial<SAMUser>): Promise<SAMUser> {
    const user = await db.user.update({
      where: { id },
      data: {
        name: data.name ?? undefined,
        email: data.email ?? undefined,
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      preferences: {},
      createdAt: user.createdAt,
      updatedAt: user.createdAt, // User model uses createdAt only
    };
  }

  // ============================================================================
  // COURSE OPERATIONS
  // ============================================================================

  async findCourse(id: string, options?: QueryOptions): Promise<SAMCourse | null> {
    const includeRelations = options?.include ?? {};

    const course = await db.course.findUnique({
      where: { id },
      include: {
        chapters: includeRelations.chapters
          ? {
              orderBy: { position: 'asc' },
              include: {
                sections: includeRelations.sections ? { orderBy: { position: 'asc' } } : false,
              },
            }
          : false,
      },
    });

    if (!course) return null;

    return this.mapCourse(course);
  }

  async findCourses(filter: Partial<SAMCourse>, options?: QueryOptions): Promise<SAMCourse[]> {
    const courses = await db.course.findMany({
      where: this.buildCourseFilter(filter),
      take: options?.limit,
      skip: options?.offset,
      orderBy: options?.orderBy ? this.mapOrderBy(options.orderBy) : undefined,
    });

    return courses.map((course) => this.mapCourse(course));
  }

  // ============================================================================
  // CHAPTER/SECTION OPERATIONS
  // ============================================================================

  async findChapter(id: string, options?: QueryOptions): Promise<SAMChapter | null> {
    const includeRelations = options?.include ?? {};

    const chapter = await db.chapter.findUnique({
      where: { id },
      include: {
        sections: includeRelations.sections ? { orderBy: { position: 'asc' } } : false,
      },
    });

    if (!chapter) return null;

    return this.mapChapter(chapter);
  }

  async findChaptersByCourse(courseId: string, options?: QueryOptions): Promise<SAMChapter[]> {
    const chapters = await db.chapter.findMany({
      where: { courseId },
      take: options?.limit,
      skip: options?.offset,
      orderBy: { position: 'asc' },
      include: options?.include?.sections
        ? { sections: { orderBy: { position: 'asc' } } }
        : undefined,
    });

    return chapters.map((chapter) => this.mapChapter(chapter));
  }

  async findSection(id: string): Promise<SAMSection | null> {
    const section = await db.section.findUnique({
      where: { id },
    });

    if (!section) return null;

    return this.mapSection(section);
  }

  async findSectionsByChapter(chapterId: string, options?: QueryOptions): Promise<SAMSection[]> {
    const sections = await db.section.findMany({
      where: { chapterId },
      take: options?.limit,
      skip: options?.offset,
      orderBy: { position: 'asc' },
    });

    return sections.map((section) => this.mapSection(section));
  }

  // ============================================================================
  // QUESTION BANK OPERATIONS
  // ============================================================================

  async findQuestions(filter: Partial<SAMQuestion>, options?: QueryOptions): Promise<SAMQuestion[]> {
    const questions = await db.questionBank.findMany({
      where: this.buildQuestionFilter(filter),
      take: options?.limit,
      skip: options?.offset,
      orderBy: options?.orderBy ? this.mapOrderBy(options.orderBy) : { createdAt: 'desc' },
    });

    return questions.map((q) => this.mapQuestion(q));
  }

  async createQuestion(
    data: Omit<SAMQuestion, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<SAMQuestion> {
    const question = await db.questionBank.create({
      data: {
        courseId: data.courseId,
        subject: 'Course Content', // Default subject
        topic: 'General', // Default topic
        question: data.question,
        questionType: this.mapQuestionType(data.questionType),
        bloomsLevel: this.mapBloomsLevel(data.bloomsLevel),
        difficulty: this.mapDifficulty(data.difficulty),
        correctAnswer: data.answer ? { answer: data.answer } : { answer: '' },
        options: data.options ? { options: data.options } : undefined,
        explanation: '',
        tags: [],
        metadata: { points: data.points },
      },
    });

    return this.mapQuestion(question);
  }

  async updateQuestion(id: string, data: Partial<SAMQuestion>): Promise<SAMQuestion> {
    const question = await db.questionBank.update({
      where: { id },
      data: {
        question: data.question,
        questionType: data.questionType ? this.mapQuestionType(data.questionType) : undefined,
        bloomsLevel: data.bloomsLevel ? this.mapBloomsLevel(data.bloomsLevel) : undefined,
        difficulty: data.difficulty ? this.mapDifficulty(data.difficulty) : undefined,
        correctAnswer: data.answer ? { answer: data.answer } : undefined,
        options: data.options ? { options: data.options } : undefined,
      },
    });

    return this.mapQuestion(question);
  }

  async deleteQuestion(id: string): Promise<void> {
    await db.questionBank.delete({
      where: { id },
    });
  }

  // ============================================================================
  // BLOOM'S PROGRESS OPERATIONS
  // ============================================================================

  async findBloomsProgress(userId: string, courseId: string): Promise<SAMBloomsProgress | null> {
    const progress = await db.studentBloomsProgress.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    if (!progress) return null;

    return this.mapBloomsProgress(progress);
  }

  async upsertBloomsProgress(
    userId: string,
    courseId: string,
    data: Partial<SAMBloomsProgress>
  ): Promise<SAMBloomsProgress> {
    const bloomsScores = {
      remember: data.rememberScore ?? 0,
      understand: data.understandScore ?? 0,
      apply: data.applyScore ?? 0,
      analyze: data.analyzeScore ?? 0,
      evaluate: data.evaluateScore ?? 0,
      create: data.createScore ?? 0,
    };

    const progress = await db.studentBloomsProgress.upsert({
      where: {
        userId_courseId: { userId, courseId },
      },
      create: {
        userId,
        courseId,
        bloomsScores,
        strengthAreas: { areas: [] },
        weaknessAreas: { areas: [] },
        progressHistory: { history: [] },
        lastAssessedAt: new Date(),
      },
      update: {
        bloomsScores,
        lastAssessedAt: data.lastAssessedAt ?? new Date(),
      },
    });

    return this.mapBloomsProgress(progress);
  }

  // ============================================================================
  // COGNITIVE PROGRESS OPERATIONS
  // ============================================================================

  async findCognitiveProgress(
    userId: string,
    skillType: string
  ): Promise<SAMCognitiveProgress | null> {
    const progress = await db.cognitiveSkillProgress.findFirst({
      where: {
        userId,
        conceptId: skillType, // Using conceptId as skillType
      },
    });

    if (!progress) return null;

    return this.mapCognitiveProgress(progress);
  }

  async upsertCognitiveProgress(
    userId: string,
    skillType: string,
    data: Partial<SAMCognitiveProgress>
  ): Promise<SAMCognitiveProgress> {
    const progress = await db.cognitiveSkillProgress.upsert({
      where: {
        userId_conceptId: { userId, conceptId: skillType },
      },
      create: {
        userId,
        conceptId: skillType,
        overallMastery: data.proficiencyLevel ?? 0,
        totalAttempts: data.totalAttempts ?? 0,
        lastAttemptDate: data.lastPracticedAt ?? new Date(),
      },
      update: {
        overallMastery: data.proficiencyLevel,
        totalAttempts: data.totalAttempts,
        lastAttemptDate: data.lastPracticedAt ?? new Date(),
      },
    });

    return this.mapCognitiveProgress(progress);
  }

  // ============================================================================
  // INTERACTION LOGGING
  // ============================================================================

  async logInteraction(
    data: Omit<SAMInteractionLog, 'id' | 'createdAt'>
  ): Promise<SAMInteractionLog> {
    const interaction = await db.sAMInteraction.create({
      data: {
        userId: data.userId,
        interactionType: 'CHAT_MESSAGE', // SAM conversation interaction
        context: {
          pageType: data.pageType,
          pagePath: data.pagePath,
          query: data.query,
          response: data.response,
          enginesUsed: data.enginesUsed,
          responseTimeMs: data.responseTimeMs,
          tokenCount: data.tokenCount,
          ...((data.metadata as object) ?? {}),
        },
        duration: data.responseTimeMs,
        success: true,
      },
    });

    return this.mapInteractionLog(interaction);
  }

  async findInteractions(userId: string, options?: QueryOptions): Promise<SAMInteractionLog[]> {
    const interactions = await db.sAMInteraction.findMany({
      where: { userId },
      take: options?.limit,
      skip: options?.offset,
      orderBy: { createdAt: 'desc' },
    });

    return interactions.map((i) => this.mapInteractionLog(i));
  }

  async countInteractions(filter?: {
    userId?: string;
    pageType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<number> {
    return db.sAMInteraction.count({
      where: {
        userId: filter?.userId,
        createdAt: {
          gte: filter?.startDate,
          lte: filter?.endDate,
        },
      },
    });
  }

  // ============================================================================
  // COURSE ANALYSIS OPERATIONS
  // ============================================================================

  async findCourseAnalysis(courseId: string): Promise<SAMCourseAnalysis | null> {
    const analysis = await db.courseBloomsAnalysis.findUnique({
      where: { courseId },
    });

    if (!analysis) return null;

    return this.mapCourseAnalysis(analysis);
  }

  async upsertCourseAnalysis(
    courseId: string,
    data: Partial<SAMCourseAnalysis>
  ): Promise<SAMCourseAnalysis> {
    const bloomsDistribution = {
      remember: data.rememberPercentage ?? 0,
      understand: data.understandPercentage ?? 0,
      apply: data.applyPercentage ?? 0,
      analyze: data.analyzePercentage ?? 0,
      evaluate: data.evaluatePercentage ?? 0,
      create: data.createPercentage ?? 0,
    };

    const analysis = await db.courseBloomsAnalysis.upsert({
      where: { courseId },
      create: {
        courseId,
        bloomsDistribution,
        cognitiveDepth: data.overallScore ?? 0,
        learningPathway: { pathway: [] },
        skillsMatrix: { skills: [] },
        gapAnalysis: { gaps: data.gaps ?? [] },
        recommendations: { items: data.recommendations ?? [] },
      },
      update: {
        bloomsDistribution,
        cognitiveDepth: data.overallScore ?? undefined,
        gapAnalysis: data.gaps ? { gaps: data.gaps } : undefined,
        recommendations: data.recommendations ? { items: data.recommendations } : undefined,
        analyzedAt: new Date(),
      },
    });

    return this.mapCourseAnalysis(analysis);
  }

  // ============================================================================
  // UTILITY OPERATIONS
  // ============================================================================

  async healthCheck(): Promise<boolean> {
    try {
      await db.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  async beginTransaction(): Promise<TransactionContext> {
    // Prisma handles transactions differently - we return a context for tracking
    return {
      id: `tx-${Date.now()}`,
      startedAt: new Date(),
    };
  }

  async commitTransaction(): Promise<void> {
    // Prisma transactions are auto-committed
  }

  async rollbackTransaction(): Promise<void> {
    // Prisma transactions auto-rollback on error
  }

  // ============================================================================
  // PRIVATE MAPPING HELPERS
  // ============================================================================

  private mapCourse(course: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    categoryId: string | null;
    userId: string;
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
    chapters?: Array<{
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
        position: number;
        isPublished: boolean;
        chapterId: string;
        createdAt: Date;
        updatedAt: Date;
      }>;
    }>;
  }): SAMCourse {
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      imageUrl: course.imageUrl,
      categoryId: course.categoryId,
      userId: course.userId,
      isPublished: course.isPublished,
      chapters: course.chapters?.map((c) => this.mapChapter(c)),
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };
  }

  private mapChapter(chapter: {
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
      position: number;
      isPublished: boolean;
      chapterId: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
  }): SAMChapter {
    return {
      id: chapter.id,
      title: chapter.title,
      description: chapter.description,
      position: chapter.position,
      isPublished: chapter.isPublished,
      courseId: chapter.courseId,
      sections: chapter.sections?.map((s) => this.mapSection(s)),
      createdAt: chapter.createdAt,
      updatedAt: chapter.updatedAt,
    };
  }

  private mapSection(section: {
    id: string;
    title: string;
    description: string | null;
    position: number;
    isPublished: boolean;
    chapterId: string;
    createdAt: Date;
    updatedAt: Date;
  }): SAMSection {
    return {
      id: section.id,
      title: section.title,
      description: section.description,
      content: null, // Section content is in related entities
      position: section.position,
      isPublished: section.isPublished,
      chapterId: section.chapterId,
      createdAt: section.createdAt,
      updatedAt: section.updatedAt,
    };
  }

  private mapQuestion(question: {
    id: string;
    question: string;
    questionType: string;
    bloomsLevel: string;
    difficulty: string;
    correctAnswer: unknown;
    options: unknown;
    courseId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): SAMQuestion {
    const answer = question.correctAnswer as { answer?: string } | null;
    const opts = question.options as { options?: string[] } | null;

    return {
      id: question.id,
      question: question.question,
      answer: answer?.answer ?? null,
      options: opts?.options ?? null,
      questionType: this.reverseQuestionType(question.questionType),
      bloomsLevel: this.reverseBloomsLevel(question.bloomsLevel),
      difficulty: this.reverseDifficulty(question.difficulty),
      points: 1, // Default points
      courseId: question.courseId ?? '',
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    };
  }

  private mapBloomsProgress(progress: {
    id: string;
    userId: string;
    courseId: string | null;
    bloomsScores: unknown;
    lastAssessedAt: Date;
    updatedAt: Date;
  }): SAMBloomsProgress {
    const scores = progress.bloomsScores as {
      remember?: number;
      understand?: number;
      apply?: number;
      analyze?: number;
      evaluate?: number;
      create?: number;
    };

    return {
      id: progress.id,
      userId: progress.userId,
      courseId: progress.courseId ?? '',
      rememberScore: scores.remember ?? 0,
      understandScore: scores.understand ?? 0,
      applyScore: scores.apply ?? 0,
      analyzeScore: scores.analyze ?? 0,
      evaluateScore: scores.evaluate ?? 0,
      createScore: scores.create ?? 0,
      overallScore:
        ((scores.remember ?? 0) +
          (scores.understand ?? 0) +
          (scores.apply ?? 0) +
          (scores.analyze ?? 0) +
          (scores.evaluate ?? 0) +
          (scores.create ?? 0)) /
        6,
      assessmentCount: 0, // Not tracked in this model
      lastAssessedAt: progress.lastAssessedAt,
      updatedAt: progress.updatedAt,
    };
  }

  private mapCognitiveProgress(progress: {
    id: string;
    userId: string;
    conceptId: string;
    overallMastery: number;
    totalAttempts: number;
    lastAttemptDate: Date | null;
    updatedAt: Date;
  }): SAMCognitiveProgress {
    return {
      id: progress.id,
      userId: progress.userId,
      skillType: progress.conceptId,
      proficiencyLevel: progress.overallMastery,
      totalAttempts: progress.totalAttempts,
      successfulAttempts: 0, // Not directly tracked
      averageTimeSeconds: 0, // Not directly tracked
      lastPracticedAt: progress.lastAttemptDate ?? undefined,
      updatedAt: progress.updatedAt,
    };
  }

  private mapInteractionLog(interaction: {
    id: string;
    userId: string;
    context: unknown;
    duration: number | null;
    createdAt: Date;
  }): SAMInteractionLog {
    const ctx = interaction.context as {
      pageType?: string;
      pagePath?: string;
      query?: string;
      response?: string;
      enginesUsed?: string[];
      responseTimeMs?: number;
      tokenCount?: number;
    };

    return {
      id: interaction.id,
      userId: interaction.userId,
      sessionId: null,
      pageType: ctx.pageType ?? 'unknown',
      pagePath: ctx.pagePath ?? '',
      query: ctx.query ?? '',
      response: ctx.response ?? '',
      enginesUsed: ctx.enginesUsed ?? [],
      responseTimeMs: ctx.responseTimeMs ?? interaction.duration ?? 0,
      tokenCount: ctx.tokenCount,
      metadata: ctx,
      createdAt: interaction.createdAt,
    };
  }

  private mapCourseAnalysis(analysis: {
    id: string;
    courseId: string;
    bloomsDistribution: unknown;
    cognitiveDepth: number;
    recommendations: unknown;
    gapAnalysis: unknown;
    analyzedAt: Date;
  }): SAMCourseAnalysis {
    const dist = analysis.bloomsDistribution as {
      remember?: number;
      understand?: number;
      apply?: number;
      analyze?: number;
      evaluate?: number;
      create?: number;
    };
    const recs = analysis.recommendations as { items?: string[] };
    const gaps = analysis.gapAnalysis as { gaps?: string[] };

    return {
      id: analysis.id,
      courseId: analysis.courseId,
      rememberPercentage: dist.remember ?? 0,
      understandPercentage: dist.understand ?? 0,
      applyPercentage: dist.apply ?? 0,
      analyzePercentage: dist.analyze ?? 0,
      evaluatePercentage: dist.evaluate ?? 0,
      createPercentage: dist.create ?? 0,
      totalObjectives: 0, // Not directly tracked
      overallScore: analysis.cognitiveDepth,
      recommendations: recs.items,
      gaps: gaps.gaps,
      analyzedAt: analysis.analyzedAt,
    };
  }

  // ============================================================================
  // FILTER BUILDERS
  // ============================================================================

  private buildUserFilter(filter: Partial<SAMUser>) {
    return {
      id: filter.id,
      email: filter.email ?? undefined,
      name: filter.name ?? undefined,
    };
  }

  private buildCourseFilter(filter: Partial<SAMCourse>) {
    return {
      id: filter.id,
      title: filter.title ? { contains: filter.title, mode: 'insensitive' as const } : undefined,
      userId: filter.userId,
      isPublished: filter.isPublished,
      categoryId: filter.categoryId ?? undefined,
    };
  }

  private buildQuestionFilter(filter: Partial<SAMQuestion>) {
    return {
      id: filter.id,
      courseId: filter.courseId ?? undefined,
      bloomsLevel: filter.bloomsLevel ? this.mapBloomsLevel(filter.bloomsLevel) : undefined,
      difficulty: filter.difficulty ? this.mapDifficulty(filter.difficulty) : undefined,
      questionType: filter.questionType ? this.mapQuestionType(filter.questionType) : undefined,
    };
  }

  private mapSelectFields(select: Record<string, boolean>) {
    return Object.fromEntries(
      Object.entries(select).filter(([, v]) => v)
    ) as Record<string, true>;
  }

  private mapOrderBy(orderBy: Record<string, 'asc' | 'desc'>) {
    return Object.entries(orderBy).map(([field, direction]) => ({
      [field]: direction,
    }))[0];
  }

  // ============================================================================
  // TYPE MAPPERS
  // ============================================================================

  private mapQuestionType(
    type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'fill_blank'
  ): 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY' | 'FILL_IN_BLANK' {
    const map: Record<string, 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY' | 'FILL_IN_BLANK'> = {
      multiple_choice: 'MULTIPLE_CHOICE',
      true_false: 'TRUE_FALSE',
      short_answer: 'SHORT_ANSWER',
      essay: 'ESSAY',
      fill_blank: 'FILL_IN_BLANK',
    };
    return map[type] ?? 'MULTIPLE_CHOICE';
  }

  private reverseQuestionType(
    type: string
  ): 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'fill_blank' {
    const map: Record<string, 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'fill_blank'> = {
      MULTIPLE_CHOICE: 'multiple_choice',
      TRUE_FALSE: 'true_false',
      SHORT_ANSWER: 'short_answer',
      ESSAY: 'essay',
      FILL_IN_BLANK: 'fill_blank',
    };
    return map[type] ?? 'multiple_choice';
  }

  private mapBloomsLevel(
    level: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create'
  ): 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE' {
    return level.toUpperCase() as 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';
  }

  private reverseBloomsLevel(
    level: string
  ): 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create' {
    return level.toLowerCase() as 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  }

  private mapDifficulty(
    difficulty: 'easy' | 'medium' | 'hard'
  ): 'EASY' | 'MEDIUM' | 'HARD' {
    return difficulty.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD';
  }

  private reverseDifficulty(difficulty: string): 'easy' | 'medium' | 'hard' {
    return difficulty.toLowerCase() as 'easy' | 'medium' | 'hard';
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a Prisma SAM Database Adapter
 *
 * @example
 * ```typescript
 * const dbAdapter = createPrismaSAMAdapter();
 * ```
 */
export function createPrismaSAMAdapter(): SAMDatabaseAdapter {
  return new PrismaSAMAdapter();
}

export default PrismaSAMAdapter;
