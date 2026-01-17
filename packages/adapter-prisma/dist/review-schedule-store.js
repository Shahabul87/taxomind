/**
 * Prisma Review Schedule Store
 *
 * Database-backed implementation for spaced repetition review schedules.
 */
export class PrismaReviewScheduleStore {
    prisma;
    tableName;
    constructor(config) {
        this.prisma = config.prisma;
        this.tableName = config.tableName ?? 'reviewSchedule';
    }
    async save(entry) {
        await this.prisma[this.tableName].upsert({
            where: { studentId_topicId: { studentId: entry.studentId, topicId: entry.topicId } },
            create: entry,
            update: { ...entry, updatedAt: new Date() },
        });
    }
    async get(studentId, topicId) {
        return this.prisma[this.tableName].findUnique({
            where: { studentId_topicId: { studentId, topicId } },
        });
    }
    async getDueReviews(studentId, limit) {
        return this.prisma[this.tableName].findMany({
            where: {
                studentId,
                nextReviewAt: { lte: new Date() },
            },
            orderBy: { nextReviewAt: 'asc' },
            take: limit ?? 20,
        });
    }
    async getAllForStudent(studentId) {
        return this.prisma[this.tableName].findMany({
            where: { studentId },
            orderBy: { nextReviewAt: 'asc' },
        });
    }
    async delete(studentId, topicId) {
        await this.prisma[this.tableName].delete({
            where: { studentId_topicId: { studentId, topicId } },
        });
    }
}
export function createPrismaReviewScheduleStore(config) {
    return new PrismaReviewScheduleStore(config);
}
//# sourceMappingURL=review-schedule-store.js.map