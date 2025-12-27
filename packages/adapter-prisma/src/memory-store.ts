/**
 * Prisma Memory Store
 *
 * Database-backed implementation for memory entries (long-term storage).
 */

export interface MemoryEntry {
  id: string;
  studentId: string;
  type: 'insight' | 'preference' | 'milestone' | 'feedback' | 'context';
  importance: 'low' | 'medium' | 'high' | 'critical';
  content: string;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryStore {
  save(entry: MemoryEntry): Promise<void>;
  get(id: string): Promise<MemoryEntry | null>;
  getByStudent(studentId: string, options?: { type?: string; limit?: number }): Promise<MemoryEntry[]>;
  search(studentId: string, query: string): Promise<MemoryEntry[]>;
  delete(id: string): Promise<void>;
  pruneExpired(): Promise<number>;
}

export interface PrismaMemoryStoreConfig {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any;
  tableName?: string;
}

export class PrismaMemoryStore implements MemoryStore {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private prisma: any;
  private tableName: string;

  constructor(config: PrismaMemoryStoreConfig) {
    this.prisma = config.prisma;
    this.tableName = config.tableName ?? 'memoryEntry';
  }

  async save(entry: MemoryEntry): Promise<void> {
    await this.prisma[this.tableName].upsert({
      where: { id: entry.id },
      create: entry,
      update: { ...entry, updatedAt: new Date() },
    });
  }

  async get(id: string): Promise<MemoryEntry | null> {
    return this.prisma[this.tableName].findUnique({ where: { id } });
  }

  async getByStudent(
    studentId: string,
    options?: { type?: string; limit?: number }
  ): Promise<MemoryEntry[]> {
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

  async search(studentId: string, query: string): Promise<MemoryEntry[]> {
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

  async delete(id: string): Promise<void> {
    await this.prisma[this.tableName].delete({ where: { id } });
  }

  async pruneExpired(): Promise<number> {
    const result = await this.prisma[this.tableName].deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}

export function createPrismaMemoryStore(config: PrismaMemoryStoreConfig): PrismaMemoryStore {
  return new PrismaMemoryStore(config);
}
