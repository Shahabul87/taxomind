/**
 * Prisma Golden Test Store
 *
 * Database-backed implementation for golden test cases (version control).
 */

export interface GoldenTestCase {
  id: string;
  name: string;
  description?: string;
  category: string;
  input: {
    question: string;
    studentResponse: string;
    rubric?: unknown;
    context?: Record<string, unknown>;
  };
  expectedResult: {
    score: number;
    scoreTolerance?: number;
    feedbackContains?: string[];
    feedbackExcludes?: string[];
    bloomsLevel?: string;
  };
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoldenTestStore {
  save(testCase: GoldenTestCase): Promise<void>;
  get(id: string): Promise<GoldenTestCase | null>;
  getByCategory(category: string): Promise<GoldenTestCase[]>;
  getActive(): Promise<GoldenTestCase[]>;
  search(query: string): Promise<GoldenTestCase[]>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
}

export interface PrismaGoldenTestStoreConfig {
  prisma: any;
  tableName?: string;
}

export class PrismaGoldenTestStore implements GoldenTestStore {
  private prisma: any;
  private tableName: string;

  constructor(config: PrismaGoldenTestStoreConfig) {
    this.prisma = config.prisma;
    this.tableName = config.tableName ?? 'goldenTestCase';
  }

  async save(testCase: GoldenTestCase): Promise<void> {
    await this.prisma[this.tableName].upsert({
      where: { id: testCase.id },
      create: testCase,
      update: { ...testCase, updatedAt: new Date() },
    });
  }

  async get(id: string): Promise<GoldenTestCase | null> {
    return this.prisma[this.tableName].findUnique({ where: { id } });
  }

  async getByCategory(category: string): Promise<GoldenTestCase[]> {
    return this.prisma[this.tableName].findMany({
      where: { category, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getActive(): Promise<GoldenTestCase[]> {
    return this.prisma[this.tableName].findMany({
      where: { isActive: true },
      orderBy: { category: 'asc' },
    });
  }

  async search(query: string): Promise<GoldenTestCase[]> {
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

  async delete(id: string): Promise<void> {
    await this.prisma[this.tableName].delete({ where: { id } });
  }

  async count(): Promise<number> {
    return this.prisma[this.tableName].count({ where: { isActive: true } });
  }
}

export function createPrismaGoldenTestStore(
  config: PrismaGoldenTestStoreConfig
): PrismaGoldenTestStore {
  return new PrismaGoldenTestStore(config);
}
