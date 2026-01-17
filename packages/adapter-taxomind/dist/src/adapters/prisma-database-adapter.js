/**
 * @sam-ai/adapter-taxomind - Prisma Database Adapter
 * Implements DatabaseAdapter using Prisma Client
 */
// ============================================================================
// PRISMA REPOSITORY IMPLEMENTATION
// ============================================================================
/**
 * Generic Prisma repository implementation
 */
class PrismaEntityRepository {
    prisma;
    modelName;
    constructor(prisma, modelName) {
        this.prisma = prisma;
        this.modelName = modelName;
    }
    get model() {
        return this.prisma[this.modelName.charAt(0).toLowerCase() + this.modelName.slice(1)];
    }
    filterConditionsToPrismaWhere(conditions) {
        if (!conditions || conditions.length === 0) {
            return {};
        }
        const where = {};
        for (const condition of conditions) {
            const { field, operator, value } = condition;
            switch (operator) {
                case 'eq':
                    where[field] = value;
                    break;
                case 'neq':
                    where[field] = { not: value };
                    break;
                case 'gt':
                    where[field] = { gt: value };
                    break;
                case 'gte':
                    where[field] = { gte: value };
                    break;
                case 'lt':
                    where[field] = { lt: value };
                    break;
                case 'lte':
                    where[field] = { lte: value };
                    break;
                case 'contains':
                    where[field] = { contains: value };
                    break;
                case 'startsWith':
                    where[field] = { startsWith: value };
                    break;
                case 'endsWith':
                    where[field] = { endsWith: value };
                    break;
                case 'in':
                    where[field] = { in: value };
                    break;
                case 'notIn':
                    where[field] = { notIn: value };
                    break;
                default:
                    where[field] = value;
            }
        }
        return where;
    }
    async findById(id) {
        const model = this.model;
        return model.findUnique({
            where: { id },
        });
    }
    async findOne(options) {
        const model = this.model;
        return model.findFirst({
            where: this.filterConditionsToPrismaWhere(options.where),
            orderBy: options.orderBy?.map((o) => ({ [o.field]: o.direction })),
        });
    }
    async findMany(options) {
        const model = this.model;
        return model.findMany({
            where: this.filterConditionsToPrismaWhere(options?.where),
            orderBy: options?.orderBy?.map((o) => ({ [o.field]: o.direction })),
            take: options?.limit,
            skip: options?.offset,
        });
    }
    async findPaginated(page, pageSize, options) {
        const skip = (page - 1) * pageSize;
        const [data, total] = await Promise.all([
            this.findMany({
                ...options,
                offset: skip,
                limit: pageSize,
            }),
            this.count(options),
        ]);
        return {
            data,
            total,
            page,
            pageSize,
            hasMore: page * pageSize < total,
        };
    }
    async count(options) {
        const model = this.model;
        return model.count({
            where: this.filterConditionsToPrismaWhere(options?.where),
        });
    }
    async exists(id) {
        const result = await this.findById(id);
        return result !== null;
    }
    async create(data) {
        const model = this.model;
        return model.create({
            data,
        });
    }
    async createMany(data) {
        const results = [];
        for (const item of data) {
            const created = await this.create(item);
            results.push(created);
        }
        return results;
    }
    async update(id, data) {
        const model = this.model;
        return model.update({
            where: { id },
            data,
        });
    }
    async updateMany(where, data) {
        const model = this.model;
        const result = await model.updateMany({
            where: this.filterConditionsToPrismaWhere(where),
            data,
        });
        return result.count;
    }
    async upsert(where, create, update) {
        const model = this.model;
        return model.upsert({
            where: this.filterConditionsToPrismaWhere(where),
            create,
            update,
        });
    }
    async delete(id) {
        const model = this.model;
        try {
            await model.delete({
                where: { id },
            });
            return true;
        }
        catch {
            return false;
        }
    }
    async deleteMany(where) {
        const model = this.model;
        const result = await model.deleteMany({
            where: this.filterConditionsToPrismaWhere(where),
        });
        return result.count;
    }
}
/**
 * Prisma-based database adapter for Taxomind
 */
export class PrismaDatabaseAdapter {
    prisma;
    _isConnected = false;
    repositories = new Map();
    constructor(prisma) {
        this.prisma = prisma;
    }
    // ============================================================================
    // CLIENT ACCESS
    // ============================================================================
    getClient() {
        return this.prisma;
    }
    executeRaw(query, params) {
        return this.prisma.$queryRawUnsafe(query, ...(params ?? []));
    }
    // ============================================================================
    // CONNECTION MANAGEMENT
    // ============================================================================
    async connect() {
        await this.prisma.$connect();
        this._isConnected = true;
    }
    async disconnect() {
        await this.prisma.$disconnect();
        this._isConnected = false;
    }
    async isConnected() {
        return this._isConnected;
    }
    // ============================================================================
    // TRANSACTIONS
    // ============================================================================
    async transaction(fn, options) {
        const txId = crypto.randomUUID();
        const startedAt = new Date();
        const timeout = options?.timeout ?? 5000;
        return this.prisma.$transaction(async () => {
            const ctx = {
                id: txId,
                startedAt,
                timeout,
            };
            return fn(ctx);
        }, {
            timeout,
        });
    }
    // ============================================================================
    // ENTITY REPOSITORIES
    // ============================================================================
    getGoalRepository() {
        if (!this.repositories.has('SAMGoal')) {
            this.repositories.set('SAMGoal', new PrismaEntityRepository(this.prisma, 'SAMGoal'));
        }
        return this.repositories.get('SAMGoal');
    }
    getPlanRepository() {
        if (!this.repositories.has('SAMPlan')) {
            this.repositories.set('SAMPlan', new PrismaEntityRepository(this.prisma, 'SAMPlan'));
        }
        return this.repositories.get('SAMPlan');
    }
    getMemoryRepository() {
        if (!this.repositories.has('SAMMemory')) {
            this.repositories.set('SAMMemory', new PrismaEntityRepository(this.prisma, 'SAMMemory'));
        }
        return this.repositories.get('SAMMemory');
    }
    getSessionRepository() {
        if (!this.repositories.has('SAMSession')) {
            this.repositories.set('SAMSession', new PrismaEntityRepository(this.prisma, 'SAMSession'));
        }
        return this.repositories.get('SAMSession');
    }
    // ============================================================================
    // RAW QUERIES
    // ============================================================================
    async rawQuery(sql, params) {
        return this.prisma.$queryRawUnsafe(sql, ...(params ?? []));
    }
    async rawExecute(sql, params) {
        const result = await this.prisma.$executeRawUnsafe(sql, ...(params ?? []));
        return result;
    }
    // ============================================================================
    // HEALTH CHECK
    // ============================================================================
    async healthCheck() {
        const startTime = Date.now();
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            const latency = Date.now() - startTime;
            return {
                healthy: true,
                latencyMs: latency,
            };
        }
        catch (error) {
            return {
                healthy: false,
                latencyMs: Date.now() - startTime,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}
// ============================================================================
// REPOSITORY FACTORY
// ============================================================================
/**
 * Prisma-based repository factory
 */
export class PrismaRepositoryFactory {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    createGoalRepository() {
        return new PrismaEntityRepository(this.prisma, 'SAMGoal');
    }
    createPlanRepository() {
        return new PrismaEntityRepository(this.prisma, 'SAMPlan');
    }
    createMemoryRepository() {
        return new PrismaEntityRepository(this.prisma, 'SAMMemory');
    }
    createSessionRepository() {
        return new PrismaEntityRepository(this.prisma, 'SAMSession');
    }
    createRepository(entityName) {
        return new PrismaEntityRepository(this.prisma, entityName);
    }
}
// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================
/**
 * Create a Prisma database adapter
 */
export function createPrismaDatabaseAdapter(prisma) {
    return new PrismaDatabaseAdapter(prisma);
}
/**
 * Create a Prisma repository factory
 */
export function createPrismaRepositoryFactory(prisma) {
    return new PrismaRepositoryFactory(prisma);
}
//# sourceMappingURL=prisma-database-adapter.js.map