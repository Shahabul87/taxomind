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
export declare class PrismaGoldenTestStore implements GoldenTestStore {
    private prisma;
    private tableName;
    constructor(config: PrismaGoldenTestStoreConfig);
    save(testCase: GoldenTestCase): Promise<void>;
    get(id: string): Promise<GoldenTestCase | null>;
    getByCategory(category: string): Promise<GoldenTestCase[]>;
    getActive(): Promise<GoldenTestCase[]>;
    search(query: string): Promise<GoldenTestCase[]>;
    delete(id: string): Promise<void>;
    count(): Promise<number>;
}
export declare function createPrismaGoldenTestStore(config: PrismaGoldenTestStoreConfig): PrismaGoldenTestStore;
//# sourceMappingURL=golden-test-store.d.ts.map