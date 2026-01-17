/**
 * Prisma SAM Database Adapter
 *
 * Generic implementation of SAMDatabaseAdapter using Prisma Client.
 * Works with any Prisma schema that includes the required SAM models.
 */
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
export class PrismaSAMAdapter {
    prisma;
    debug;
    constructor(config) {
        // Cast the external Prisma client to our internal type
        // This is safe because PrismaClientLike is a structural subtype that accepts any Prisma client
        this.prisma = config.prisma;
        this.debug = config.debug ?? false;
    }
    // ============================================================================
    // USER OPERATIONS
    // ============================================================================
    async findUser(id, options) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: options?.select ? this.mapSelectFields(options.select) : undefined,
        });
        if (!user)
            return null;
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
    async findUsers(filter, options) {
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
    async updateUser(id, data) {
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
    async findCourse(id, options) {
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
        if (!course)
            return null;
        return this.mapCourse(course);
    }
    async findCourses(filter, options) {
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
    async findChapter(id, options) {
        const includeRelations = options?.include ?? {};
        const chapter = await this.prisma.chapter.findUnique({
            where: { id },
            include: {
                sections: includeRelations.sections ? { orderBy: { position: 'asc' } } : false,
            },
        });
        if (!chapter)
            return null;
        return this.mapChapter(chapter);
    }
    async findChaptersByCourse(courseId, options) {
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
    async findSection(id) {
        const section = await this.prisma.section.findUnique({
            where: { id },
        });
        if (!section)
            return null;
        return this.mapSection(section);
    }
    async findSectionsByChapter(chapterId, options) {
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
    async findQuestions(filter, options) {
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
    async createQuestion(data) {
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
    async updateQuestion(id, data) {
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
    async deleteQuestion(id) {
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
    async findBloomsProgress(userId, courseId) {
        if (!this.prisma.studentBloomsProgress) {
            this.logDebug('StudentBloomsProgress model not available');
            return null;
        }
        const progress = await this.prisma.studentBloomsProgress.findUnique({
            where: {
                userId_courseId: { userId, courseId },
            },
        });
        if (!progress)
            return null;
        return this.mapBloomsProgress(progress);
    }
    async upsertBloomsProgress(userId, courseId, data) {
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
    async findCognitiveProgress(userId, skillType) {
        if (!this.prisma.cognitiveSkillProgress) {
            this.logDebug('CognitiveSkillProgress model not available');
            return null;
        }
        const progress = await this.prisma.cognitiveSkillProgress.findUnique({
            where: {
                userId_conceptId: { userId, conceptId: skillType },
            },
        });
        if (!progress)
            return null;
        return this.mapCognitiveProgress(progress);
    }
    async upsertCognitiveProgress(userId, skillType, data) {
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
    async logInteraction(data) {
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
                    ...(data.metadata ?? {}),
                },
                duration: data.responseTimeMs,
                success: true,
            },
        });
        return this.mapInteractionLog(interaction);
    }
    async findInteractions(userId, options) {
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
    async countInteractions(filter) {
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
    async findCourseAnalysis(courseId) {
        if (!this.prisma.courseBloomsAnalysis) {
            return null;
        }
        const analysis = await this.prisma.courseBloomsAnalysis.findUnique({
            where: { courseId },
        });
        if (!analysis)
            return null;
        return this.mapCourseAnalysis(analysis);
    }
    async upsertCourseAnalysis(courseId, data) {
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
    async healthCheck() {
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            return true;
        }
        catch {
            return false;
        }
    }
    async beginTransaction() {
        return {
            id: `tx-${Date.now()}`,
            startedAt: new Date(),
        };
    }
    async commitTransaction() {
        // Prisma transactions are auto-committed
    }
    async rollbackTransaction() {
        // Prisma transactions auto-rollback on error
    }
    // ============================================================================
    // PRIVATE HELPERS
    // ============================================================================
    logDebug(message) {
        if (this.debug) {
            console.log(`[PrismaSAMAdapter] ${message}`);
        }
    }
    mapCourse(course) {
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
    mapChapter(chapter) {
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
    mapSection(section) {
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
    mapQuestion(question) {
        const answer = question.correctAnswer;
        const opts = question.options;
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
    mapBloomsProgress(progress) {
        const scores = progress.bloomsScores;
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
            overallScore: ((scores.remember ?? 0) +
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
    mapCognitiveProgress(progress) {
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
    mapInteractionLog(interaction) {
        const ctx = interaction.context;
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
    mapCourseAnalysis(analysis) {
        const dist = analysis.bloomsDistribution;
        const recs = analysis.recommendations;
        const gaps = analysis.gapAnalysis;
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
    buildUserFilter(filter) {
        return {
            id: filter.id,
            email: filter.email ?? undefined,
            name: filter.name ?? undefined,
        };
    }
    buildCourseFilter(filter) {
        return {
            id: filter.id,
            title: filter.title ? { contains: filter.title, mode: 'insensitive' } : undefined,
            userId: filter.userId,
            isPublished: filter.isPublished,
            categoryId: filter.categoryId ?? undefined,
        };
    }
    buildQuestionFilter(filter) {
        return {
            id: filter.id,
            courseId: filter.courseId ?? undefined,
            bloomsLevel: filter.bloomsLevel ? this.mapBloomsLevel(filter.bloomsLevel) : undefined,
            difficulty: filter.difficulty ? this.mapDifficulty(filter.difficulty) : undefined,
            questionType: filter.questionType ? this.mapQuestionType(filter.questionType) : undefined,
        };
    }
    mapSelectFields(select) {
        return Object.fromEntries(Object.entries(select).filter(([, v]) => v));
    }
    mapOrderBy(orderBy) {
        return Object.entries(orderBy).map(([field, direction]) => ({
            [field]: direction,
        }))[0];
    }
    mapQuestionType(type) {
        const map = {
            multiple_choice: 'MULTIPLE_CHOICE',
            true_false: 'TRUE_FALSE',
            short_answer: 'SHORT_ANSWER',
            essay: 'ESSAY',
            fill_blank: 'FILL_IN_BLANK',
        };
        return map[type] ?? 'MULTIPLE_CHOICE';
    }
    reverseQuestionType(type) {
        const map = {
            MULTIPLE_CHOICE: 'multiple_choice',
            TRUE_FALSE: 'true_false',
            SHORT_ANSWER: 'short_answer',
            ESSAY: 'essay',
            FILL_IN_BLANK: 'fill_blank',
        };
        return map[type] ?? 'multiple_choice';
    }
    mapBloomsLevel(level) {
        return level.toUpperCase();
    }
    reverseBloomsLevel(level) {
        return level.toLowerCase();
    }
    mapDifficulty(difficulty) {
        return difficulty.toUpperCase();
    }
    reverseDifficulty(difficulty) {
        return difficulty.toLowerCase();
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
export function createPrismaSAMAdapter(config) {
    return new PrismaSAMAdapter(config);
}
//# sourceMappingURL=database-adapter.js.map