import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as crypto from 'crypto';

/**
 * Test database utilities for transactional testing
 * Ensures isolated test environments with automatic cleanup
 */

export class TestDatabase {
  private prisma: PrismaClient;
  private testId: string;
  private transactionId: string | null = null;

  constructor() {
    // Create unique test database identifier
    this.testId = crypto.randomUUID().slice(0, 8);
    
    // Initialize Prisma client for tests
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
        },
      },
      log: process.env.DEBUG_TESTS ? ['query', 'error'] : ['error'],
    });
  }

  /**
   * Initialize test database connection
   */
  async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      console.log(`Test DB connected: ${this.testId}`);
    } catch (error: any) {
      console.error('Failed to connect to test database:', error);
      throw error;
    }
  }

  /**
   * Disconnect from test database
   */
  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      console.log(`Test DB disconnected: ${this.testId}`);
    } catch (error: any) {
      console.error('Failed to disconnect from test database:', error);
      throw error;
    }
  }

  /**
   * Begin a database transaction for test isolation
   */
  async beginTransaction(): Promise<any> {
    return this.prisma.$transaction(async (tx) => {
      this.transactionId = crypto.randomUUID();
      return tx;
    });
  }

  /**
   * Clean all test data from database
   */
  async cleanup(): Promise<void> {
    const tableNames = [
      'Account',
      'Session',
      'VerificationToken',
      'PasswordResetToken',
      'TwoFactorToken',
      'TwoFactorConfirmation',
      'Purchase',
      'StripeCustomer',
      'Enrollment',
      'UserProgress',
      'ExamAttempt',
      'ExamQuestion',
      'Exam',
      'Question',
      'MathEquation',
      'CodeExplanation',
      'Explanation',
      'Video',
      'Blog',
      'Section',
      'Chapter',
      'LearningOutcome',
      'Attachment',
      'Course',
      'Category',
      'User',
    ];

    for (const tableName of tableNames) {
      try {
        await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE;`);
      } catch (error: any) {
        // Some tables might not exist, continue cleanup
        console.warn(`Warning: Could not truncate table ${tableName}`);
      }
    }
  }

  /**
   * Reset database to clean state
   */
  async reset(): Promise<void> {
    try {
      // Run database migrations
      execSync('npx prisma migrate reset --force --skip-generate', {
        stdio: 'ignore',
        env: {
          ...process.env,
          DATABASE_URL: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
        },
      });
    } catch (error: any) {
      console.warn('Database reset failed, attempting cleanup instead');
      await this.cleanup();
    }
  }

  /**
   * Seed database with test data
   */
  async seed(): Promise<TestDataSet> {
    // Create test categories
    const categories = await Promise.all([
      this.prisma.category.create({
        data: {
          name: 'Programming',
        },
      }),
      this.prisma.category.create({
        data: {
          name: 'Data Science',
        },
      }),
      this.prisma.category.create({
        data: {
          name: 'Design',
        },
      }),
    ]);

    // Create test users
    const testUsers = await Promise.all([
      this.prisma.user.create({
        data: {
          id: 'test-admin-user',
          name: 'Test Admin',
          email: 'admin@test.com',
          role: 'ADMIN',
          emailVerified: new Date(),
        },
      }),
      this.prisma.user.create({
        data: {
          id: 'test-teacher-user',
          name: 'Test Teacher',
          email: 'teacher@test.com',
          role: 'USER',
          emailVerified: new Date(),
        },
      }),
      this.prisma.user.create({
        data: {
          id: 'test-student-user',
          name: 'Test Student',
          email: 'student@test.com',
          role: 'USER',
          emailVerified: new Date(),
        },
      }),
    ]);

    // Create test courses
    const courses = await Promise.all([
      this.prisma.course.create({
        data: {
          id: 'test-course-1',
          userId: testUsers[1].id, // Teacher
          title: 'Introduction to React',
          description: 'Learn React fundamentals',
          imageUrl: 'https://example.com/react.jpg',
          price: 99.99,
          isPublished: true,
          categoryId: categories[0].id,
        },
      }),
      this.prisma.course.create({
        data: {
          id: 'test-course-2',
          userId: testUsers[1].id, // Teacher
          title: 'Advanced Python',
          description: 'Master Python programming',
          imageUrl: 'https://example.com/python.jpg',
          price: 149.99,
          isPublished: true,
          categoryId: categories[1].id,
        },
      }),
      this.prisma.course.create({
        data: {
          id: 'test-course-unpublished',
          userId: testUsers[1].id, // Teacher
          title: 'Draft Course',
          description: 'This course is not published',
          price: 199.99,
          isPublished: false,
          categoryId: categories[0].id,
        },
      }),
    ]);

    // Create test chapters and sections
    const chapters = [];
    const sections = [];

    for (const course of courses.slice(0, 2)) { // Only for published courses
      for (let i = 1; i <= 3; i++) {
        const chapter = await this.prisma.chapter.create({
          data: {
            id: `${course.id}-chapter-${i}`,
            title: `Chapter ${i}: ${course.title.split(' ')[0]} Basics`,
            description: `Learn the basics of ${course.title}`,
            courseId: course.id,
            position: i,
            isPublished: true,
          },
        });
        chapters.push(chapter);

        // Create 2-3 sections per chapter
        for (let j = 1; j <= 2; j++) {
          const section = await this.prisma.section.create({
            data: {
              id: `${chapter.id}-section-${j}`,
              title: `Section ${i}.${j}: Fundamentals`,
              videoUrl: `https://example.com/video-${i}-${j}.mp4`,
              position: j,
              isPublished: true,
              chapterId: chapter.id,
              isFree: j === 1, // First section is free
            },
          });
          sections.push(section);
        }
      }
    }

    // Create test enrollments
    await this.prisma.enrollment.create({
      data: {
        id: `enrollment-${crypto.randomUUID()}`,
        userId: testUsers[2].id, // Student
        courseId: courses[0].id,
        updatedAt: new Date(),
      },
    });

    // Create test purchases
    await this.prisma.purchase.create({
      data: {
        userId: testUsers[2].id, // Student
        courseId: courses[0].id,
      },
    });

    return {
      users: {
        admin: testUsers[0],
        teacher: testUsers[1],
        student: testUsers[2],
      },
      categories,
      courses,
      chapters,
      sections,
    };
  }

  /**
   * Get Prisma client instance
   */
  getClient(): PrismaClient {
    return this.prisma;
  }

  /**
   * Execute raw SQL for complex test scenarios
   */
  async executeRaw(sql: string, params?: any[]): Promise<any> {
    return this.prisma.$executeRawUnsafe(sql, ...(params || []));
  }

  /**
   * Query raw SQL for test data verification
   */
  async queryRaw<T = any>(sql: string, params?: any[]): Promise<T[]> {
    return this.prisma.$queryRawUnsafe(sql, ...(params || []));
  }
}

export interface TestDataSet {
  users: {
    admin: any;
    teacher: any;
    student: any;
  };
  categories: any[];
  courses: any[];
  chapters: any[];
  sections: any[];
}

/**
 * Global test database instance
 */
export const testDb = new TestDatabase();

/**
 * Test database lifecycle hooks for Jest
 */
export const setupTestDatabase = async (): Promise<TestDataSet> => {
  await testDb.connect();
  await testDb.cleanup();
  return await testDb.seed();
};

export const teardownTestDatabase = async (): Promise<void> => {
  await testDb.cleanup();
  await testDb.disconnect();
};

/**
 * Database transaction helper for test isolation
 */
export const withTransaction = async <T>(
  callback: (client: any) => Promise<T>
): Promise<T> => {
  return testDb.getClient().$transaction(async (tx) => {
    return callback(tx);
  });
};

/**
 * Mock database connection for unit tests
 */
export const createMockDatabase = () => ({
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  course: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  chapter: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
  },
  muxData: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  attachment: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  section: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
  },
  enrollment: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
  },
  purchase: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  category: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  post: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  userProgress: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
  },
  user_progress: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
  },
  auditLog: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
  },
  courseBloomsAnalysis: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
  },
  sectionBloomsMapping: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
  },
  passwordResetToken: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
  },
  verificationToken: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
  },
  twoFactorToken: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
  },
  twoFactorConfirmation: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
  },
  $transaction: jest.fn(),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $executeRaw: jest.fn(),
  $queryRaw: jest.fn(),
});

// Export mock database for unit tests
export const prismaMock = createMockDatabase();