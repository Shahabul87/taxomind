/**
 * Comprehensive API Testing Utilities
 * TypeScript-safe helpers for systematic API testing
 */

import {
  MockUser,
  MockCourse,
  MockChapter,
  MockSection,
  MockCategory,
  MockEnrollment,
  MockPurchase,
  MockReview,
  MockAnalytics,
  MockApiResponse,
  TestDataGenerator,
  TestContext,
  CourseWithRelations,
  ChapterWithRelations,
  SectionWithRelations,
  ApiResponse,
} from '../types/api-test-types';

/**
 * Test Data Generator - Creates consistent mock data
 * All functions return properly typed objects with no any/unknown
 */
export const createTestDataGenerator = (): TestDataGenerator => {
  const baseDate = new Date('2024-01-01T00:00:00Z');

  return {
    user: (overrides: Partial<MockUser> = {}): MockUser => ({
      id: `user-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Test User',
      email: 'test@example.com',
      image: null,
      role: 'USER',
      isTwoFactorEnabled: false,
      isTeacher: false,
      isAffiliate: false,
      createdAt: baseDate,
      ...overrides,
    }),

    course: (overrides: Partial<MockCourse> = {}): MockCourse => ({
      id: `course-${Math.random().toString(36).substr(2, 9)}`,
      title: 'Test Course',
      description: 'A comprehensive test course description',
      cleanDescription: 'A comprehensive test course description',
      subtitle: 'Learn testing fundamentals',
      imageUrl: 'https://example.com/course-image.jpg',
      price: 99.99,
      isPublished: true,
      isFeatured: false,
      categoryId: 'category-1',
      userId: 'user-1',
      createdAt: baseDate,
      updatedAt: baseDate,
      whatYouWillLearn: ['Skill 1', 'Skill 2', 'Skill 3'],
      courseGoals: 'Master the fundamentals of testing',
      slug: 'test-course',
      organizationId: null,
      ...overrides,
    }),

    chapter: (overrides: Partial<MockChapter> = {}): MockChapter => ({
      id: `chapter-${Math.random().toString(36).substr(2, 9)}`,
      title: 'Test Chapter',
      description: 'A test chapter description',
      position: 1,
      isPublished: true,
      isFree: false,
      courseId: 'course-1',
      createdAt: baseDate,
      updatedAt: baseDate,
      courseGoals: 'Learn chapter fundamentals',
      learningOutcomes: 'Students will be able to...',
      sectionCount: 3,
      totalDuration: 3600, // 1 hour in seconds
      estimatedTime: '1 hour',
      difficulty: 'Beginner',
      prerequisites: 'None',
      resources: 'Additional reading materials',
      status: 'active',
      ...overrides,
    }),

    section: (overrides: Partial<MockSection> = {}): MockSection => ({
      id: `section-${Math.random().toString(36).substr(2, 9)}`,
      title: 'Test Section',
      description: 'A test section description',
      position: 1,
      isPublished: true,
      isFree: false,
      chapterId: 'chapter-1',
      createdAt: baseDate,
      updatedAt: baseDate,
      videoUrl: 'https://example.com/video.mp4',
      blogContent: 'Section blog content goes here...',
      duration: 1200, // 20 minutes
      resources: 'Section resources and links',
      ...overrides,
    }),

    category: (overrides: Partial<MockCategory> = {}): MockCategory => ({
      id: `category-${Math.random().toString(36).substr(2, 9)}`,
      name: 'Test Category',
      imageUrl: 'https://example.com/category-image.jpg',
      createdAt: baseDate,
      updatedAt: baseDate,
      ...overrides,
    }),

    enrollment: (overrides: Partial<MockEnrollment> = {}): MockEnrollment => ({
      id: `enrollment-${Math.random().toString(36).substr(2, 9)}`,
      userId: 'user-1',
      courseId: 'course-1',
      createdAt: baseDate,
      updatedAt: baseDate,
      ...overrides,
    }),

    purchase: (overrides: Partial<MockPurchase> = {}): MockPurchase => ({
      id: `purchase-${Math.random().toString(36).substr(2, 9)}`,
      userId: 'user-1',
      courseId: 'course-1',
      createdAt: baseDate,
      updatedAt: baseDate,
      ...overrides,
    }),

    review: (overrides: Partial<MockReview> = {}): MockReview => ({
      id: `review-${Math.random().toString(36).substr(2, 9)}`,
      rating: 5,
      comment: 'Excellent course! Highly recommended.',
      userId: 'user-1',
      courseId: 'course-1',
      createdAt: baseDate,
      updatedAt: baseDate,
      ...overrides,
    }),

    analytics: (overrides: Partial<MockAnalytics> = {}): MockAnalytics => ({
      id: `analytics-${Math.random().toString(36).substr(2, 9)}`,
      userId: 'user-1',
      courseId: 'course-1',
      chapterId: null,
      sectionId: null,
      eventType: 'course_view',
      eventData: {
        duration: 300,
        completionRate: 0.75,
        interactionCount: 12,
      },
      timestamp: baseDate,
      ...overrides,
    }),
  };
};

/**
 * Mock Response Creator - Creates consistent API responses
 */
export class MockResponseBuilder {
  static success<T>(data: T, status: number = 200): MockApiResponse {
    return {
      status,
      json: async () => ({ success: true, data }) as ApiResponse<T>,
      text: async () => JSON.stringify({ success: true, data }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  static error(message: string, status: number = 500, code?: string): MockApiResponse {
    return {
      status,
      json: async () => ({
        success: false,
        error: { message, code: code || 'INTERNAL_ERROR' },
      }),
      text: async () => JSON.stringify({
        success: false,
        error: { message, code: code || 'INTERNAL_ERROR' },
      }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  static validation(field: string, message: string): MockApiResponse {
    return {
      status: 400,
      json: async () => ({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message,
          details: { field, constraint: message },
        },
      }),
      text: async () => JSON.stringify({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message,
          details: { field, constraint: message },
        },
      }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  static unauthorized(): MockApiResponse {
    return this.error('Unauthorized', 401, 'UNAUTHORIZED');
  }

  static forbidden(message: string = 'Forbidden'): MockApiResponse {
    return this.error(message, 403, 'FORBIDDEN');
  }

  static notFound(resource: string = 'Resource'): MockApiResponse {
    return this.error(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

/**
 * Course Data Builder - Creates courses with proper relationships
 */
export class CourseDataBuilder {
  private testData: TestDataGenerator;

  constructor() {
    this.testData = createTestDataGenerator();
  }

  createCourseWithRelations(overrides: Partial<MockCourse> = {}): CourseWithRelations {
    const course = this.testData.course(overrides);
    const category = this.testData.category({ id: course.categoryId || 'category-1' });
    const user = this.testData.user({ id: course.userId });

    return {
      ...course,
      category: course.categoryId ? category : null,
      user: {
        id: user.id,
        name: user.name,
        image: user.image,
      },
      Enrollment: [],
      Purchase: [],
      _count: {
        Enrollment: 0,
        Purchase: 0,
        reviews: 0,
        chapters: 0,
      },
      reviews: [],
      chapters: [],
    };
  }

  createChapterWithRelations(overrides: Partial<MockChapter> = {}): ChapterWithRelations {
    const chapter = this.testData.chapter(overrides);
    const course = this.testData.course({ id: chapter.courseId });

    return {
      ...chapter,
      course,
      sections: [],
      _count: {
        sections: 0,
      },
    };
  }

  createSectionWithRelations(overrides: Partial<MockSection> = {}): SectionWithRelations {
    const section = this.testData.section(overrides);
    const chapter = this.testData.chapter({ id: section.chapterId });

    return {
      ...section,
      chapter,
      videos: [],
      blogs: [],
      exams: [],
    };
  }
}

/**
 * Database Mock Manager - Manages Prisma mock implementations
 */
export class DatabaseMockManager {
  private mocks: Record<string, Record<string, jest.Mock>>;

  constructor() {
    this.mocks = {};
  }

  setupModel(modelName: string): Record<string, jest.Mock> {
    this.mocks[modelName] = {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
    };
    return this.mocks[modelName];
  }

  getModel(modelName: string): Record<string, jest.Mock> {
    if (!this.mocks[modelName]) {
      return this.setupModel(modelName);
    }
    return this.mocks[modelName];
  }

  resetAll(): void {
    Object.values(this.mocks).forEach(model => {
      Object.values(model).forEach(mock => mock.mockReset());
    });
  }

  clearAll(): void {
    Object.values(this.mocks).forEach(model => {
      Object.values(model).forEach(mock => mock.mockClear());
    });
  }
}

/**
 * Authentication Mock Helper
 */
export class AuthMockHelper {
  private currentUserMock: jest.Mock;
  private userFindUniqueMock: jest.Mock;

  constructor(currentUserMock: jest.Mock, userFindUniqueMock: jest.Mock) {
    this.currentUserMock = currentUserMock;
    this.userFindUniqueMock = userFindUniqueMock;
  }

  mockUser(user: MockUser | null): void {
    this.currentUserMock.mockResolvedValue(user);
    if (user) {
      this.userFindUniqueMock.mockResolvedValue(user);
    } else {
      this.userFindUniqueMock.mockResolvedValue(null);
    }
  }

  mockAdmin(overrides: Partial<MockUser> = {}): MockUser {
    const testData = createTestDataGenerator();
    const adminUser = testData.user({ role: 'ADMIN', ...overrides });
    this.mockUser(adminUser);
    return adminUser;
  }

  mockRegularUser(overrides: Partial<MockUser> = {}): MockUser {
    const testData = createTestDataGenerator();
    const regularUser = testData.user({ role: 'USER', ...overrides });
    this.mockUser(regularUser);
    return regularUser;
  }

  mockUnauthenticated(): void {
    this.mockUser(null);
  }
}

/**
 * Test Context Builder - Creates complete test scenarios
 */
export class TestContextBuilder {
  private testData: TestDataGenerator;
  private courseBuilder: CourseDataBuilder;

  constructor() {
    this.testData = createTestDataGenerator();
    this.courseBuilder = new CourseDataBuilder();
  }

  createFullContext(): TestContext {
    const user = this.testData.user();
    const course = this.testData.course({ userId: user.id });
    const chapter = this.testData.chapter({ courseId: course.id });
    const section = this.testData.section({ chapterId: chapter.id });
    const category = this.testData.category({ id: course.categoryId || 'category-1' });
    const enrollment = this.testData.enrollment({
      userId: user.id,
      courseId: course.id,
    });
    const purchase = this.testData.purchase({
      userId: user.id,
      courseId: course.id,
    });

    return {
      user,
      course,
      chapter,
      section,
      category,
      enrollment,
      purchase,
    };
  }

  createInstructorContext(): TestContext {
    const instructor = this.testData.user({
      role: 'USER',
      isTeacher: true,
    });
    const course = this.testData.course({ userId: instructor.id });

    return {
      user: instructor,
      course,
    };
  }

  createStudentContext(): TestContext {
    const student = this.testData.user({ role: 'USER' });
    const instructor = this.testData.user({ role: 'USER', isTeacher: true });
    const course = this.testData.course({ userId: instructor.id });
    const enrollment = this.testData.enrollment({
      userId: student.id,
      courseId: course.id,
    });

    return {
      user: student,
      course,
      enrollment,
    };
  }

  createAdminContext(): TestContext {
    const admin = this.testData.user({ role: 'ADMIN' });

    return {
      user: admin,
    };
  }
}

/**
 * Validation Helper - Validates API responses and data structures
 */
export class ValidationHelper {
  static isValidUser(user: unknown): user is MockUser {
    return typeof user === 'object' && user !== null &&
           typeof (user as MockUser).id === 'string' &&
           typeof (user as MockUser).email === 'string' &&
           ['ADMIN', 'USER'].includes((user as MockUser).role);
  }

  static isValidCourse(course: unknown): course is MockCourse {
    return typeof course === 'object' && course !== null &&
           typeof (course as MockCourse).id === 'string' &&
           typeof (course as MockCourse).title === 'string' &&
           typeof (course as MockCourse).userId === 'string';
  }

  static isValidApiResponse<T>(response: unknown): response is ApiResponse<T> {
    return typeof response === 'object' && response !== null &&
           typeof (response as ApiResponse<T>).success === 'boolean';
  }

  static hasRequiredFields<T extends Record<string, unknown>>(
    obj: unknown,
    fields: (keyof T)[]
  ): obj is T {
    if (typeof obj !== 'object' || obj === null) return false;
    
    return fields.every(field => 
      Object.prototype.hasOwnProperty.call(obj, field)
    );
  }
}

/**
 * Error Testing Helper - Tests error scenarios systematically
 */
export class ErrorTestingHelper {
  static async testUnauthorized(
    handler: () => Promise<MockApiResponse>,
    authMock: AuthMockHelper
  ): Promise<void> {
    authMock.mockUnauthenticated();
    const response = await handler();
    expect(response.status).toBe(401);
  }

  static async testForbidden(
    handler: () => Promise<MockApiResponse>,
    authMock: AuthMockHelper,
    user: MockUser
  ): Promise<void> {
    authMock.mockUser(user);
    const response = await handler();
    expect(response.status).toBe(403);
  }

  static async testNotFound(
    handler: () => Promise<MockApiResponse>,
    mockFn: jest.Mock
  ): Promise<void> {
    mockFn.mockResolvedValue(null);
    const response = await handler();
    expect(response.status).toBe(404);
  }

  static async testValidationError(
    handler: (data: Record<string, unknown>) => Promise<MockApiResponse>,
    invalidData: Record<string, unknown>
  ): Promise<void> {
    const response = await handler(invalidData);
    expect(response.status).toBe(400);
  }

  static async testDatabaseError(
    handler: () => Promise<MockApiResponse>,
    mockFn: jest.Mock,
    errorMessage: string = 'Database error'
  ): Promise<void> {
    mockFn.mockRejectedValue(new Error(errorMessage));
    const response = await handler();
    expect(response.status).toBe(500);
  }
}

/**
 * Performance Testing Helper
 */
export class PerformanceTestingHelper {
  static async measureExecutionTime<T>(
    operation: () => Promise<T>
  ): Promise<{ result: T; executionTime: number }> {
    const startTime = performance.now();
    const result = await operation();
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    
    return { result, executionTime };
  }

  static expectFastExecution<T>(
    operation: () => Promise<T>,
    maxTimeMs: number = 100
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Operation took longer than ${maxTimeMs}ms`));
      }, maxTimeMs * 2); // Allow some buffer

      try {
        const { result, executionTime } = await this.measureExecutionTime(operation);
        clearTimeout(timeout);
        
        if (executionTime > maxTimeMs) {
          reject(new Error(`Operation took ${executionTime}ms, expected <${maxTimeMs}ms`));
        } else {
          resolve(result);
        }
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }
}

// Export singleton instances for convenience
export const testDataGenerator = createTestDataGenerator();
export const courseDataBuilder = new CourseDataBuilder();
export const databaseMockManager = new DatabaseMockManager();
export const testContextBuilder = new TestContextBuilder();
export const validationHelper = ValidationHelper;
export const errorTestingHelper = ErrorTestingHelper;
export const performanceTestingHelper = PerformanceTestingHelper;