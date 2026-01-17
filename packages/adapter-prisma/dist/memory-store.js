/**
 * Prisma Memory Store
 *
 * Database-backed implementation for memory entries (long-term storage).
 */
export class PrismaMemoryStore {
    prisma;
    tableName;
    constructor(config) {
        this.prisma = config.prisma;
        this.tableName = config.tableName ?? 'memoryEntry';
    }
    async save(entry) {
        await this.prisma[this.tableName].upsert({
            where: { id: entry.id },
            create: entry,
            update: { ...entry, updatedAt: new Date() },
        });
    }
    async get(id) {
        return this.prisma[this.tableName].findUnique({ where: { id } });
    }
    async getByStudent(studentId, options) {
        return this.prisma[this.tableName].findMany({
            where: {
                studentId,
                type: options?.type,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
            orderBy: { createdAt: 'desc' },
            take: options?.limit ?? 100,
        });
    }
    async search(studentId, query) {
        return this.prisma[this.tableName].findMany({
            where: {
                studentId,
                content: { contains: query, mode: 'insensitive' },
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
            orderBy: { importance: 'desc' },
            take: 20,
        });
    }
    async delete(id) {
        await this.prisma[this.tableName].delete({ where: { id } });
    }
    async pruneExpired() {
        const result = await this.prisma[this.tableName].deleteMany({
            where: { expiresAt: { lt: new Date() } },
        });
        return result.count;
    }
}
export function createPrismaMemoryStore(config) {
    return new PrismaMemoryStore(config);
}
//# sourceMappingURL=memory-store.js.map