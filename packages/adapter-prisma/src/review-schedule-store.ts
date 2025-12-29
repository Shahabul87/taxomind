/**
 * Prisma Review Schedule Store
 *
 * Database-backed implementation for spaced repetition review schedules.
 */

export interface ReviewScheduleEntry {
  id: string;
  studentId: string;
  topicId: string;
  nextReviewAt: Date;
  interval: number; // days
  easeFactor: number;
  repetitions: number;
  lastReviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewScheduleStore {
  save(entry: ReviewScheduleEntry): Promise<void>;
  get(studentId: string, topicId: string): Promise<ReviewScheduleEntry | null>;
  getDueReviews(studentId: string, limit?: number): Promise<ReviewScheduleEntry[]>;
  getAllForStudent(studentId: string): Promise<ReviewScheduleEntry[]>;
  delete(studentId: string, topicId: string): Promise<void>;
}

export interface PrismaReviewScheduleStoreConfig {
  prisma: any;
  tableName?: string;
}

export class PrismaReviewScheduleStore implements ReviewScheduleStore {
  private prisma: any;
  private tableName: string;

  constructor(config: PrismaReviewScheduleStoreConfig) {
    this.prisma = config.prisma;
    this.tableName = config.tableName ?? 'reviewSchedule';
  }

  async save(entry: ReviewScheduleEntry): Promise<void> {
    await this.prisma[this.tableName].upsert({
      where: { studentId_topicId: { studentId: entry.studentId, topicId: entry.topicId } },
      create: entry,
      update: { ...entry, updatedAt: new Date() },
    });
  }

  async get(studentId: string, topicId: string): Promise<ReviewScheduleEntry | null> {
    return this.prisma[this.tableName].findUnique({
      where: { studentId_topicId: { studentId, topicId } },
    });
  }

  async getDueReviews(studentId: string, limit?: number): Promise<ReviewScheduleEntry[]> {
    return this.prisma[this.tableName].findMany({
      where: {
        studentId,
        nextReviewAt: { lte: new Date() },
      },
      orderBy: { nextReviewAt: 'asc' },
      take: limit ?? 20,
    });
  }

  async getAllForStudent(studentId: string): Promise<ReviewScheduleEntry[]> {
    return this.prisma[this.tableName].findMany({
      where: { studentId },
      orderBy: { nextReviewAt: 'asc' },
    });
  }

  async delete(studentId: string, topicId: string): Promise<void> {
    await this.prisma[this.tableName].delete({
      where: { studentId_topicId: { studentId, topicId } },
    });
  }
}

export function createPrismaReviewScheduleStore(
  config: PrismaReviewScheduleStoreConfig
): PrismaReviewScheduleStore {
  return new PrismaReviewScheduleStore(config);
}
