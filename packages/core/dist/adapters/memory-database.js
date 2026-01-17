/**
 * In-Memory SAM Database Adapter
 *
 * A memory-based implementation of SAMDatabaseAdapter for:
 * - Testing and development
 * - Standalone SAM usage without a database
 * - Prototyping and demos
 */
/**
 * In-memory implementation of SAMDatabaseAdapter
 *
 * Stores all data in memory maps. Useful for:
 * - Unit testing
 * - Local development without database
 * - Standalone SAM demos
 *
 * @example
 * ```typescript
 * const dbAdapter = new InMemoryDatabaseAdapter({
 *   seed: {
 *     users: [{ id: 'user-1', name: 'Test User', email: 'test@example.com' }],
 *   },
 * });
 * ```
 */
export class InMemoryDatabaseAdapter {
    // Data stores
    users = new Map();
    courses = new Map();
    chapters = new Map();
    sections = new Map();
    questions = new Map();
    bloomsProgress = new Map();
    cognitiveProgress = new Map();
    interactions = [];
    courseAnalysis = new Map();
    idCounter = 1;
    options;
    constructor(options = {}) {
        this.options = options;
        // Load seed data
        if (options.seed?.users) {
            options.seed.users.forEach((u) => this.users.set(u.id, u));
        }
        if (options.seed?.courses) {
            options.seed.courses.forEach((c) => {
                this.courses.set(c.id, c);
                c.chapters?.forEach((ch) => {
                    this.chapters.set(ch.id, ch);
                    ch.sections?.forEach((s) => this.sections.set(s.id, s));
                });
            });
        }
        if (options.seed?.questions) {
            options.seed.questions.forEach((q) => this.questions.set(q.id, q));
        }
        // Attempt to load from localStorage if enabled
        if (options.persistToLocalStorage && typeof localStorage !== 'undefined') {
            this.loadFromStorage();
        }
    }
    generateId(prefix) {
        return `${prefix}-${Date.now()}-${this.idCounter++}`;
    }
    // ============================================================================
    // USER OPERATIONS
    // ============================================================================
    async findUser(id) {
        return this.users.get(id) ?? null;
    }
    async findUsers(filter, options) {
        let results = Array.from(this.users.values());
        if (filter.email) {
            results = results.filter((u) => u.email === filter.email);
        }
        if (filter.name) {
            results = results.filter((u) => u.name?.includes(filter.name));
        }
        if (filter.role) {
            results = results.filter((u) => u.role === filter.role);
        }
        return this.applyQueryOptions(results, options);
    }
    async updateUser(id, data) {
        const user = this.users.get(id);
        if (!user) {
            throw new Error(`User ${id} not found`);
        }
        const updated = {
            ...user,
            ...data,
            id, // Preserve ID
            updatedAt: new Date(),
        };
        this.users.set(id, updated);
        this.persist();
        return updated;
    }
    // ============================================================================
    // COURSE OPERATIONS
    // ============================================================================
    async findCourse(id, options) {
        const course = this.courses.get(id);
        if (!course)
            return null;
        // Include chapters if requested
        if (options?.include?.chapters) {
            const chapters = Array.from(this.chapters.values())
                .filter((ch) => ch.courseId === id)
                .sort((a, b) => a.position - b.position);
            // Include sections in chapters if requested
            if (options.include.sections) {
                chapters.forEach((ch) => {
                    ch.sections = Array.from(this.sections.values())
                        .filter((s) => s.chapterId === ch.id)
                        .sort((a, b) => a.position - b.position);
                });
            }
            return { ...course, chapters };
        }
        return course;
    }
    async findCourses(filter, options) {
        let results = Array.from(this.courses.values());
        if (filter.userId) {
            results = results.filter((c) => c.userId === filter.userId);
        }
        if (filter.isPublished !== undefined) {
            results = results.filter((c) => c.isPublished === filter.isPublished);
        }
        if (filter.title) {
            results = results.filter((c) => c.title.toLowerCase().includes(filter.title.toLowerCase()));
        }
        if (filter.categoryId) {
            results = results.filter((c) => c.categoryId === filter.categoryId);
        }
        return this.applyQueryOptions(results, options);
    }
    // ============================================================================
    // CHAPTER/SECTION OPERATIONS
    // ============================================================================
    async findChapter(id, options) {
        const chapter = this.chapters.get(id);
        if (!chapter)
            return null;
        if (options?.include?.sections) {
            const sections = Array.from(this.sections.values())
                .filter((s) => s.chapterId === id)
                .sort((a, b) => a.position - b.position);
            return { ...chapter, sections };
        }
        return chapter;
    }
    async findChaptersByCourse(courseId, options) {
        let results = Array.from(this.chapters.values())
            .filter((ch) => ch.courseId === courseId)
            .sort((a, b) => a.position - b.position);
        if (options?.include?.sections) {
            results = results.map((ch) => ({
                ...ch,
                sections: Array.from(this.sections.values())
                    .filter((s) => s.chapterId === ch.id)
                    .sort((a, b) => a.position - b.position),
            }));
        }
        return this.applyQueryOptions(results, options);
    }
    async findSection(id) {
        return this.sections.get(id) ?? null;
    }
    async findSectionsByChapter(chapterId, options) {
        const results = Array.from(this.sections.values())
            .filter((s) => s.chapterId === chapterId)
            .sort((a, b) => a.position - b.position);
        return this.applyQueryOptions(results, options);
    }
    // ============================================================================
    // QUESTION BANK OPERATIONS
    // ============================================================================
    async findQuestions(filter, options) {
        let results = Array.from(this.questions.values());
        if (filter.courseId) {
            results = results.filter((q) => q.courseId === filter.courseId);
        }
        if (filter.chapterId) {
            results = results.filter((q) => q.chapterId === filter.chapterId);
        }
        if (filter.sectionId) {
            results = results.filter((q) => q.sectionId === filter.sectionId);
        }
        if (filter.bloomsLevel) {
            results = results.filter((q) => q.bloomsLevel === filter.bloomsLevel);
        }
        if (filter.difficulty) {
            results = results.filter((q) => q.difficulty === filter.difficulty);
        }
        if (filter.questionType) {
            results = results.filter((q) => q.questionType === filter.questionType);
        }
        return this.applyQueryOptions(results, options);
    }
    async createQuestion(data) {
        const question = {
            id: this.generateId('question'),
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.questions.set(question.id, question);
        this.persist();
        return question;
    }
    async updateQuestion(id, data) {
        const question = this.questions.get(id);
        if (!question) {
            throw new Error(`Question ${id} not found`);
        }
        const updated = {
            ...question,
            ...data,
            id, // Preserve ID
            updatedAt: new Date(),
        };
        this.questions.set(id, updated);
        this.persist();
        return updated;
    }
    async deleteQuestion(id) {
        this.questions.delete(id);
        this.persist();
    }
    // ============================================================================
    // BLOOM'S PROGRESS OPERATIONS
    // ============================================================================
    async findBloomsProgress(userId, courseId) {
        const key = `${userId}:${courseId}`;
        return this.bloomsProgress.get(key) ?? null;
    }
    async upsertBloomsProgress(userId, courseId, data) {
        const key = `${userId}:${courseId}`;
        const existing = this.bloomsProgress.get(key);
        const progress = {
            id: existing?.id ?? this.generateId('blooms'),
            userId,
            courseId,
            rememberScore: data.rememberScore ?? existing?.rememberScore ?? 0,
            understandScore: data.understandScore ?? existing?.understandScore ?? 0,
            applyScore: data.applyScore ?? existing?.applyScore ?? 0,
            analyzeScore: data.analyzeScore ?? existing?.analyzeScore ?? 0,
            evaluateScore: data.evaluateScore ?? existing?.evaluateScore ?? 0,
            createScore: data.createScore ?? existing?.createScore ?? 0,
            overallScore: data.overallScore ?? existing?.overallScore ?? 0,
            assessmentCount: data.assessmentCount ?? existing?.assessmentCount ?? 0,
            lastAssessedAt: data.lastAssessedAt ?? new Date(),
            updatedAt: new Date(),
        };
        this.bloomsProgress.set(key, progress);
        this.persist();
        return progress;
    }
    // ============================================================================
    // COGNITIVE PROGRESS OPERATIONS
    // ============================================================================
    async findCognitiveProgress(userId, skillType) {
        const key = `${userId}:${skillType}`;
        return this.cognitiveProgress.get(key) ?? null;
    }
    async upsertCognitiveProgress(userId, skillType, data) {
        const key = `${userId}:${skillType}`;
        const existing = this.cognitiveProgress.get(key);
        const progress = {
            id: existing?.id ?? this.generateId('cognitive'),
            userId,
            skillType,
            proficiencyLevel: data.proficiencyLevel ?? existing?.proficiencyLevel ?? 0,
            totalAttempts: data.totalAttempts ?? existing?.totalAttempts ?? 0,
            successfulAttempts: data.successfulAttempts ?? existing?.successfulAttempts ?? 0,
            averageTimeSeconds: data.averageTimeSeconds ?? existing?.averageTimeSeconds ?? 0,
            lastPracticedAt: data.lastPracticedAt ?? new Date(),
            updatedAt: new Date(),
        };
        this.cognitiveProgress.set(key, progress);
        this.persist();
        return progress;
    }
    // ============================================================================
    // INTERACTION LOGGING
    // ============================================================================
    async logInteraction(data) {
        const interaction = {
            id: this.generateId('interaction'),
            ...data,
            createdAt: new Date(),
        };
        this.interactions.push(interaction);
        this.persist();
        return interaction;
    }
    async findInteractions(userId, options) {
        let results = this.interactions
            .filter((i) => i.userId === userId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return this.applyQueryOptions(results, options);
    }
    async countInteractions(filter) {
        let results = [...this.interactions];
        if (filter?.userId) {
            results = results.filter((i) => i.userId === filter.userId);
        }
        if (filter?.pageType) {
            results = results.filter((i) => i.pageType === filter.pageType);
        }
        if (filter?.startDate) {
            results = results.filter((i) => i.createdAt >= filter.startDate);
        }
        if (filter?.endDate) {
            results = results.filter((i) => i.createdAt <= filter.endDate);
        }
        return results.length;
    }
    // ============================================================================
    // COURSE ANALYSIS OPERATIONS
    // ============================================================================
    async findCourseAnalysis(courseId) {
        return this.courseAnalysis.get(courseId) ?? null;
    }
    async upsertCourseAnalysis(courseId, data) {
        const existing = this.courseAnalysis.get(courseId);
        const analysis = {
            id: existing?.id ?? this.generateId('analysis'),
            courseId,
            rememberPercentage: data.rememberPercentage ?? existing?.rememberPercentage ?? 0,
            understandPercentage: data.understandPercentage ?? existing?.understandPercentage ?? 0,
            applyPercentage: data.applyPercentage ?? existing?.applyPercentage ?? 0,
            analyzePercentage: data.analyzePercentage ?? existing?.analyzePercentage ?? 0,
            evaluatePercentage: data.evaluatePercentage ?? existing?.evaluatePercentage ?? 0,
            createPercentage: data.createPercentage ?? existing?.createPercentage ?? 0,
            totalObjectives: data.totalObjectives ?? existing?.totalObjectives ?? 0,
            overallScore: data.overallScore ?? existing?.overallScore ?? 0,
            recommendations: data.recommendations ?? existing?.recommendations,
            gaps: data.gaps ?? existing?.gaps,
            analyzedAt: new Date(),
            updatedAt: new Date(),
        };
        this.courseAnalysis.set(courseId, analysis);
        this.persist();
        return analysis;
    }
    // ============================================================================
    // UTILITY OPERATIONS
    // ============================================================================
    async healthCheck() {
        return true;
    }
    async beginTransaction() {
        return {
            id: `tx-${Date.now()}`,
            startedAt: new Date(),
        };
    }
    async commitTransaction() {
        // In-memory transactions are auto-committed
    }
    async rollbackTransaction() {
        // Not implemented for in-memory adapter
    }
    // ============================================================================
    // DATA MANAGEMENT
    // ============================================================================
    /**
     * Clear all data from memory
     */
    clear() {
        this.users.clear();
        this.courses.clear();
        this.chapters.clear();
        this.sections.clear();
        this.questions.clear();
        this.bloomsProgress.clear();
        this.cognitiveProgress.clear();
        this.interactions = [];
        this.courseAnalysis.clear();
        this.persist();
    }
    /**
     * Add a user to the store
     */
    addUser(user) {
        this.users.set(user.id, user);
        this.persist();
    }
    /**
     * Add a course to the store
     */
    addCourse(course) {
        this.courses.set(course.id, course);
        course.chapters?.forEach((ch) => {
            this.chapters.set(ch.id, ch);
            ch.sections?.forEach((s) => this.sections.set(s.id, s));
        });
        this.persist();
    }
    /**
     * Get all stored data (for debugging/export)
     */
    getData() {
        return {
            users: Array.from(this.users.values()),
            courses: Array.from(this.courses.values()),
            questions: Array.from(this.questions.values()),
            interactions: [...this.interactions],
        };
    }
    // ============================================================================
    // PRIVATE HELPERS
    // ============================================================================
    applyQueryOptions(results, options) {
        if (options?.offset) {
            results = results.slice(options.offset);
        }
        if (options?.limit) {
            results = results.slice(0, options.limit);
        }
        return results;
    }
    persist() {
        if (this.options.persistToLocalStorage && typeof localStorage !== 'undefined') {
            const prefix = this.options.storageKeyPrefix ?? 'sam-db-';
            localStorage.setItem(`${prefix}users`, JSON.stringify(Array.from(this.users.entries())));
            localStorage.setItem(`${prefix}courses`, JSON.stringify(Array.from(this.courses.entries())));
            localStorage.setItem(`${prefix}chapters`, JSON.stringify(Array.from(this.chapters.entries())));
            localStorage.setItem(`${prefix}sections`, JSON.stringify(Array.from(this.sections.entries())));
            localStorage.setItem(`${prefix}questions`, JSON.stringify(Array.from(this.questions.entries())));
            localStorage.setItem(`${prefix}interactions`, JSON.stringify(this.interactions));
        }
    }
    loadFromStorage() {
        if (typeof localStorage === 'undefined')
            return;
        const prefix = this.options.storageKeyPrefix ?? 'sam-db-';
        try {
            const users = localStorage.getItem(`${prefix}users`);
            if (users)
                this.users = new Map(JSON.parse(users));
            const courses = localStorage.getItem(`${prefix}courses`);
            if (courses)
                this.courses = new Map(JSON.parse(courses));
            const chapters = localStorage.getItem(`${prefix}chapters`);
            if (chapters)
                this.chapters = new Map(JSON.parse(chapters));
            const sections = localStorage.getItem(`${prefix}sections`);
            if (sections)
                this.sections = new Map(JSON.parse(sections));
            const questions = localStorage.getItem(`${prefix}questions`);
            if (questions)
                this.questions = new Map(JSON.parse(questions));
            const interactions = localStorage.getItem(`${prefix}interactions`);
            if (interactions)
                this.interactions = JSON.parse(interactions);
        }
        catch {
            // Ignore storage errors
        }
    }
}
// ============================================================================
// FACTORY FUNCTION
// ============================================================================
/**
 * Create an in-memory SAM database adapter
 *
 * @example
 * ```typescript
 * // Simple usage
 * const dbAdapter = createInMemoryDatabase();
 *
 * // With seed data
 * const dbAdapter = createInMemoryDatabase({
 *   seed: {
 *     users: [{ id: 'demo-user', name: 'Demo', email: 'demo@example.com' }],
 *   },
 * });
 *
 * // With localStorage persistence (browser)
 * const dbAdapter = createInMemoryDatabase({
 *   persistToLocalStorage: true,
 * });
 * ```
 */
export function createInMemoryDatabase(options = {}) {
    return new InMemoryDatabaseAdapter(options);
}
export default InMemoryDatabaseAdapter;
//# sourceMappingURL=memory-database.js.map