/**
 * Prisma Golden Test Store
 *
 * Database-backed implementation for golden test cases (version control).
 */
export class PrismaGoldenTestStore {
    prisma;
    tableName;
    constructor(config) {
        this.prisma = config.prisma;
        this.tableName = config.tableName ?? 'goldenTestCase';
    }
    async save(testCase) {
        await this.prisma[this.tableName].upsert({
            where: { id: testCase.id },
            create: testCase,
            update: { ...testCase, updatedAt: new Date() },
        });
    }
    async get(id) {
        return this.prisma[this.tableName].findUnique({ where: { id } });
    }
    async getByCategory(category) {
        return this.prisma[this.tableName].findMany({
            where: { category, isActive: true },
            orderBy: { name: 'asc' },
        });
    }
    async getActive() {
        return this.prisma[this.tableName].findMany({
            where: { isActive: true },
            orderBy: { category: 'asc' },
        });
    }
    async search(query) {
        return this.prisma[this.tableName].findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                    { tags: { has: query } },
                ],
            },
            take: 50,
        });
    }
    async delete(id) {
        await this.prisma[this.tableName].delete({ where: { id } });
    }
    async count() {
        return this.prisma[this.tableName].count({ where: { isActive: true } });
    }
}
export function createPrismaGoldenTestStore(config) {
    return new PrismaGoldenTestStore(config);
}
//# sourceMappingURL=golden-test-store.js.map