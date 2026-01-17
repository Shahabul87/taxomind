/**
 * SAM Database Adapter Interface
 *
 * This adapter abstracts database operations to make @sam-ai/core portable.
 * Implement this interface to connect SAM to any database system.
 */
// ============================================================================
// NULL/NOOP ADAPTER FOR TESTING
// ============================================================================
/**
 * No-operation database adapter for testing or when no database is available.
 * All read operations return null/empty, all write operations are no-ops.
 */
export class NoopDatabaseAdapter {
    async findUser() {
        return null;
    }
    async findUsers() {
        return [];
    }
    async updateUser(_id, data) {
        return { id: _id, name: null, email: null, ...data };
    }
    async findCourse() {
        return null;
    }
    async findCourses() {
        return [];
    }
    async findChapter() {
        return null;
    }
    async findChaptersByCourse() {
        return [];
    }
    async findSection() {
        return null;
    }
    async findSectionsByChapter() {
        return [];
    }
    async findQuestions() {
        return [];
    }
    async createQuestion(data) {
        return {
            id: `temp-${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
        };
    }
    async updateQuestion(id, data) {
        return {
            id,
            question: '',
            questionType: 'multiple_choice',
            bloomsLevel: 'remember',
            difficulty: 'medium',
            points: 1,
            courseId: '',
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data,
        };
    }
    async deleteQuestion() {
        // No-op
    }
    async findBloomsProgress() {
        return null;
    }
    async upsertBloomsProgress(userId, courseId, data) {
        return {
            id: `temp-${Date.now()}`,
            userId,
            courseId,
            rememberScore: 0,
            understandScore: 0,
            applyScore: 0,
            analyzeScore: 0,
            evaluateScore: 0,
            createScore: 0,
            overallScore: 0,
            assessmentCount: 0,
            updatedAt: new Date(),
            ...data,
        };
    }
    async findCognitiveProgress() {
        return null;
    }
    async upsertCognitiveProgress(userId, skillType, data) {
        return {
            id: `temp-${Date.now()}`,
            userId,
            skillType,
            proficiencyLevel: 0,
            totalAttempts: 0,
            successfulAttempts: 0,
            averageTimeSeconds: 0,
            updatedAt: new Date(),
            ...data,
        };
    }
    async logInteraction(data) {
        return {
            id: `temp-${Date.now()}`,
            createdAt: new Date(),
            ...data,
        };
    }
    async findInteractions() {
        return [];
    }
    async countInteractions() {
        return 0;
    }
    async findCourseAnalysis() {
        return null;
    }
    async upsertCourseAnalysis(courseId, data) {
        return {
            id: `temp-${Date.now()}`,
            courseId,
            rememberPercentage: 0,
            understandPercentage: 0,
            applyPercentage: 0,
            analyzePercentage: 0,
            evaluatePercentage: 0,
            createPercentage: 0,
            totalObjectives: 0,
            overallScore: 0,
            analyzedAt: new Date(),
            ...data,
        };
    }
    async healthCheck() {
        return true;
    }
}
/**
 * Create a no-operation database adapter
 */
export function createNoopDatabaseAdapter() {
    return new NoopDatabaseAdapter();
}
//# sourceMappingURL=database.js.map