/**
 * Prisma SAM Database Adapter
 *
 * Generic implementation of SAMDatabaseAdapter using Prisma Client.
 * Works with any Prisma schema that includes the required SAM models.
 */

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
// PRISMA CLIENT TYPE
// ============================================================================

/**
 * Minimal Prisma client interface required by SAM adapters.
 * Your Prisma client must implement these methods for the required models.
 */
export interface PrismaClientLike {
  user: PrismaModelLike<UserRecord>;
  course: PrismaModelLike<CourseRecord>;
  chapter: PrismaModelLike<ChapterRecord>;
  section: PrismaModelLike<SectionRecord>;
  questionBank?: PrismaModelLike<QuestionRecord>;
  studentBloomsProgress?: PrismaModelLike<BloomsProgressRecord>;
  cognitiveSkillProgress?: PrismaModelLike<CognitiveProgressRecord>;
  sAMInteraction?: PrismaModelLike<InteractionRecord>;
  courseBloomsAnalysis?: PrismaModelLike<CourseAnalysisRecord>;
  $queryRaw: <T>(query: TemplateStringsArray) => Promise<T>;
}

interface PrismaModelLike<T> {
  findUnique: (args: FindUniqueArgs) => Promise<T | null>;
  findMany: (args: FindManyArgs) => Promise<T[]>;
  create: (args: CreateArgs) => Promise<T>;
  update: (args: UpdateArgs) => Promise<T>;
  upsert: (args: UpsertArgs) => Promise<T>;
  delete: (args: DeleteArgs) => Promise<T>;
  count: (args?: CountArgs) => Promise<number>;
}

interface FindUniqueArgs {
  where: Record<string, unknown>;
  select?: Record<string, boolean>;
  include?: Record<string, boolean | object>;
}

interface FindManyArgs {
  where?: Record<string, unknown>;
  take?: number;
  skip?: number;
  orderBy?: Record<string, 'asc' | 'desc'> | Array<Record<string, 'asc' | 'desc'>>;
  select?: Record<string, boolean>;
  include?: Record<string, boolean | object>;
}

interface CreateArgs {
  data: Record<string, unknown>;
}

interface UpdateArgs {
  where: Record<string, unknown>;
  data: Record<string, unknown>;
}

interface UpsertArgs {
  where: Record<string, unknown>;
  create: Record<string, unknown>;
  update: Record<string, unknown>;
}

interface DeleteArgs {
  where: Record<string, unknown>;
}

interface CountArgs {
  where?: Record<string, unknown>;
}

// ============================================================================
// RECORD TYPES (Expected from Prisma)
// ============================================================================

interface UserRecord {
  id: string;
  name: string | null;
  email: string | null;
  role?: string;
  createdAt: Date;
}

interface CourseRecord {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  userId: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  chapters?: ChapterRecord[];
}

interface ChapterRecord {
  id: string;
  title: string;
  description: string | null;
  position: number;
  isPublished: boolean;
  courseId: string;
  createdAt: Date;
  updatedAt: Date;
  sections?: SectionRecord[];
}

interface SectionRecord {
  id: string;
  title: string;
  description: string | null;
  position: number;
  isPublished: boolean;
  chapterId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface QuestionRecord {
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
}

interface BloomsProgressRecord {
  id: string;
  userId: string;
  courseId: string | null;
  bloomsScores: unknown;
  lastAssessedAt: Date;
  updatedAt: Date;
}

interface CognitiveProgressRecord {
  id: string;
  userId: string;
  conceptId: string;
  overallMastery: number;
  totalAttempts: number;
  lastAttemptDate: Date | null;
  updatedAt: Date;
}

interface InteractionRecord {
  id: string;
  userId: string;
  context: unknown;
  duration: number | null;
  createdAt: Date;
}

interface CourseAnalysisRecord {
  id: string;
  courseId: string;
  bloomsDistribution: unknown;
  cognitiveDepth: number;
  recommendations: unknown;
  gapAnalysis: unknown;
  analyzedAt: Date;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Configuration for PrismaSAMAdapter
 */
export interface PrismaSAMAdapterConfig {
  /**
   * Prisma client instance
   */
  prisma: PrismaClientLike;

  /**
   * Enable debug logging
   */
  debug?: boolean;

  /**
   * Model name overrides (if your schema uses different names)
   */
  modelNames?: {
    user?: string;
    course?: string;
    chapter?: string;
    section?: string;
    questionBank?: string;
    studentBloomsProgress?: string;
    cognitiveSkillProgress?: string;
    samInteraction?: string;
    courseBloomsAnalysis?: string;
  };
}

// ============================================================================
// PRISMA SAM ADAPTER IMPLEMENTATION
// ============================================================================

/**
 * Prisma implementation of SAMDatabaseAdapter
 *
 * @example
 * ```typescript
 * import { PrismaClient } from '@prisma/client';
 * import { PrismaSAMAdapter } from '@sam-ai/adapter-prisma';
 *
 * const prisma = new PrismaClient();
 * const dbAdapter = new PrismaSAMAdapter({ prisma });
 * ```
 */
export class PrismaSAMAdapter implements SAMDatabaseAdapter {
  private prisma: PrismaClientLike;
  private debug: boolean;

  constructor(config: PrismaSAMAdapterConfig) {
    this.prisma = config.prisma;
    this.debug = config.debug ?? false;
  }

  // ============================================================================
  // USER OPERATIONS
  // ============================================================================

  async findUser(id: string, options?: QueryOptions): Promise<SAMUser | null> {
    const user = await this.prisma.user.findUnique({
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
      updatedAt: user.createdAt,
    };
  }

  async findUsers(filter: Partial<SAMUser>, options?: QueryOptions): Promise<SAMUser[]> {
    const users = await this.prisma.user.findMany({
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
      updatedAt: user.createdAt,
    }));
  }

  async updateUser(id: string, data: Partial<SAMUser>): Promise<SAMUser> {
    const user = await this.prisma.user.update({
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
      updatedAt: user.createdAt,
    };
  }

  // ============================================================================
  // COURSE OPERATIONS
  // ============================================================================

  async findCourse(id: string, options?: QueryOptions): Promise<SAMCourse | null> {
    const includeRelations = options?.include ?? {};

    const course = await this.prisma.course.findUnique({
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
    const courses = await this.prisma.course.findMany({
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

    const chapter = await this.prisma.chapter.findUnique({
      where: { id },
      include: {
        sections: includeRelations.sections ? { orderBy: { position: 'asc' } } : false,
      },
    });

    if (!chapter) return null;

    return this.mapChapter(chapter);
  }

  async findChaptersByCourse(courseId: string, options?: QueryOptions): Promise<SAMChapter[]> {
    const chapters = await this.prisma.chapter.findMany({
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
    const section = await this.prisma.section.findUnique({
      where: { id },
    });

    if (!section) return null;

    return this.mapSection(section);
  }

  async findSectionsByChapter(chapterId: string, options?: QueryOptions): Promise<SAMSection[]> {
    const sections = await this.prisma.section.findMany({
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
    if (!this.prisma.questionBank) {
      this.logDebug('QuestionBank model not available');
      return [];
    }

    const questions = await this.prisma.questionBank.findMany({
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
    if (!this.prisma.questionBank) {
      throw new Error('QuestionBank model not available in Prisma schema');
    }

    const question = await this.prisma.questionBank.create({
      data: {
        courseId: data.courseId,
        subject: 'Course Content',
        topic: 'General',
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
    if (!this.prisma.questionBank) {
      throw new Error('QuestionBank model not available in Prisma schema');
    }

    const question = await this.prisma.questionBank.update({
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
    if (!this.prisma.questionBank) {
      throw new Error('QuestionBank model not available in Prisma schema');
    }

    await this.prisma.questionBank.delete({
      where: { id },
    });
  }

  // ============================================================================
  // BLOOM'S PROGRESS OPERATIONS
  // ============================================================================

  async findBloomsProgress(userId: string, courseId: string): Promise<SAMBloomsProgress | null> {
    if (!this.prisma.studentBloomsProgress) {
      this.logDebug('StudentBloomsProgress model not available');
      return null;
    }

    const progress = await this.prisma.studentBloomsProgress.findUnique({
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
    if (!this.prisma.studentBloomsProgress) {
      throw new Error('StudentBloomsProgress model not available in Prisma schema');
    }

    const bloomsScores = {
      remember: data.rememberScore ?? 0,
      understand: data.understandScore ?? 0,
      apply: data.applyScore ?? 0,
      analyze: data.analyzeScore ?? 0,
      evaluate: data.evaluateScore ?? 0,
      create: data.createScore ?? 0,
    };

    const progress = await this.prisma.studentBloomsProgress.upsert({
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
    if (!this.prisma.cognitiveSkillProgress) {
      this.logDebug('CognitiveSkillProgress model not available');
      return null;
    }

    const progress = await this.prisma.cognitiveSkillProgress.findUnique({
      where: {
        userId_conceptId: { userId, conceptId: skillType },
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
    if (!this.prisma.cognitiveSkillProgress) {
      throw new Error('CognitiveSkillProgress model not available in Prisma schema');
    }

    const progress = await this.prisma.cognitiveSkillProgress.upsert({
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
    if (!this.prisma.sAMInteraction) {
      this.logDebug('SAMInteraction model not available - returning mock');
      return {
        id: `mock-${Date.now()}`,
        createdAt: new Date(),
        ...data,
      };
    }

    const interaction = await this.prisma.sAMInteraction.create({
      data: {
        userId: data.userId,
        interactionType: 'CHAT_MESSAGE',
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
    if (!this.prisma.sAMInteraction) {
      return [];
    }

    const interactions = await this.prisma.sAMInteraction.findMany({
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
    if (!this.prisma.sAMInteraction) {
      return 0;
    }

    return this.prisma.sAMInteraction.count({
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
    if (!this.prisma.courseBloomsAnalysis) {
      return null;
    }

    const analysis = await this.prisma.courseBloomsAnalysis.findUnique({
      where: { courseId },
    });

    if (!analysis) return null;

    return this.mapCourseAnalysis(analysis);
  }

  async upsertCourseAnalysis(
    courseId: string,
    data: Partial<SAMCourseAnalysis>
  ): Promise<SAMCourseAnalysis> {
    if (!this.prisma.courseBloomsAnalysis) {
      throw new Error('CourseBloomsAnalysis model not available in Prisma schema');
    }

    const bloomsDistribution = {
      remember: data.rememberPercentage ?? 0,
      understand: data.understandPercentage ?? 0,
      apply: data.applyPercentage ?? 0,
      analyze: data.analyzePercentage ?? 0,
      evaluate: data.evaluatePercentage ?? 0,
      create: data.createPercentage ?? 0,
    };

    const analysis = await this.prisma.courseBloomsAnalysis.upsert({
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
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  async beginTransaction(): Promise<TransactionContext> {
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
  // PRIVATE HELPERS
  // ============================================================================

  private logDebug(message: string): void {
    if (this.debug) {
      console.log(`[PrismaSAMAdapter] ${message}`);
    }
  }

  private mapCourse(course: CourseRecord): SAMCourse {
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

  private mapChapter(chapter: ChapterRecord): SAMChapter {
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

  private mapSection(section: SectionRecord): SAMSection {
    return {
      id: section.id,
      title: section.title,
      description: section.description,
      content: null,
      position: section.position,
      isPublished: section.isPublished,
      chapterId: section.chapterId,
      createdAt: section.createdAt,
      updatedAt: section.updatedAt,
    };
  }

  private mapQuestion(question: QuestionRecord): SAMQuestion {
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
      points: 1,
      courseId: question.courseId ?? '',
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    };
  }

  private mapBloomsProgress(progress: BloomsProgressRecord): SAMBloomsProgress {
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
      assessmentCount: 0,
      lastAssessedAt: progress.lastAssessedAt,
      updatedAt: progress.updatedAt,
    };
  }

  private mapCognitiveProgress(progress: CognitiveProgressRecord): SAMCognitiveProgress {
    return {
      id: progress.id,
      userId: progress.userId,
      skillType: progress.conceptId,
      proficiencyLevel: progress.overallMastery,
      totalAttempts: progress.totalAttempts,
      successfulAttempts: 0,
      averageTimeSeconds: 0,
      lastPracticedAt: progress.lastAttemptDate ?? undefined,
      updatedAt: progress.updatedAt,
    };
  }

  private mapInteractionLog(interaction: InteractionRecord): SAMInteractionLog {
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

  private mapCourseAnalysis(analysis: CourseAnalysisRecord): SAMCourseAnalysis {
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
      totalObjectives: 0,
      overallScore: analysis.cognitiveDepth,
      recommendations: recs.items,
      gaps: gaps.gaps,
      analyzedAt: analysis.analyzedAt,
    };
  }

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

  private mapQuestionType(
    type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'fill_blank'
  ): string {
    const map: Record<string, string> = {
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
  ): string {
    return level.toUpperCase();
  }

  private reverseBloomsLevel(
    level: string
  ): 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create' {
    return level.toLowerCase() as 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  }

  private mapDifficulty(difficulty: 'easy' | 'medium' | 'hard'): string {
    return difficulty.toUpperCase();
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
 * import { PrismaClient } from '@prisma/client';
 * import { createPrismaSAMAdapter } from '@sam-ai/adapter-prisma';
 *
 * const prisma = new PrismaClient();
 * const dbAdapter = createPrismaSAMAdapter({ prisma });
 * ```
 */
export function createPrismaSAMAdapter(config: PrismaSAMAdapterConfig): SAMDatabaseAdapter {
  return new PrismaSAMAdapter(config);
}
