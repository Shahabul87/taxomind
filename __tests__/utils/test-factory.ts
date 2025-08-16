import { faker } from '@faker-js/faker';
import { User, Course, Chapter, Section, Category, BloomsLevel } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import * as crypto from 'crypto';

/**
 * Factory functions for creating test data
 * Provides consistent, realistic test data generation
 */

export interface CreateUserOptions {
  role?: 'ADMIN' | 'USER';
  name?: string;
  email?: string;
  emailVerified?: Date | null;
  image?: string | null;
}

export interface CreateCourseOptions {
  userId?: string;
  categoryId?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  isPublished?: boolean;
}

export interface CreateChapterOptions {
  courseId?: string;
  title?: string;
  description?: string;
  videoUrl?: string;
  position?: number;
  isPublished?: boolean;
  isFree?: boolean;
}

export interface CreateSectionOptions {
  chapterId?: string;
  title?: string;
  description?: string;
  videoUrl?: string;
  position?: number;
  isPublished?: boolean;
  isFree?: boolean;
  duration?: number;
}

export class TestDataFactory {
  /**
   * Generate a unique test ID
   */
  static generateId(prefix = 'test'): string {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }

  /**
   * Create test user data
   */
  static createUser(options: CreateUserOptions = {}): any {
    return {
      id: this.generateId('user'),
      name: options.name || faker.person.fullName(),
      email: options.email || faker.internet.email(),
      emailVerified: options.emailVerified || new Date(),
      image: options.image || faker.image.avatar(),
      password: null,
      confirmPassword: null,
      role: options.role || 'USER',
      isTwoFactorEnabled: false,
      totpSecret: null,
      totpEnabled: false,
      totpVerified: false,
      recoveryCodes: [],
      phone: null,
      isAccountLocked: false,
      lockReason: null,
      lastLoginAt: null,
      lastLoginIp: null,
      failedLoginAttempts: 0,
      passwordChangedAt: null,
      stripeAccountId: null,
      paypalAccountId: null,
      walletBalance: new Decimal(0),
      totalCoursesCreated: 0,
      totalCoursesSold: 0,
      totalRevenue: new Decimal(0),
      instructorRating: null,
      learningStyle: null,
      bloomsProgress: null,
      instructorRatingCount: 0,
      instructorTotalStudents: 0,
      instructorTotalCourses: 0,
      totalStudentsReached: 0,
      marketingOptIn: false,
      newsletterOptIn: false,
      researchOptIn: false,
      dataProcessingConsent: false,
      privacyPolicyAccepted: false,
      termsOfServiceAccepted: false,
      cookieConsent: false,
      pushNotifications: false,
      emailNotifications: true,
      smsNotifications: false,
      weeklyDigest: false,
      courseRecommendations: true,
      achievementAlerts: true,
      discussionNotifications: true,
      achievementNotifications: true,
      courseUpdateNotifications: true,
      systemNotifications: true,
      onboardingCompleted: false,
      onboardingStep: 0,
      subscriptionActive: false,
      subscriptionTier: null,
      subscriptionStartDate: null,
      subscriptionEndDate: null,
      trialUsed: false,
      trialStartDate: null,
      trialEndDate: null,
      referralCode: null,
      referredBy: null,
      totalReferrals: 0,
      referralEarnings: 0,
      isDevelopmentAccount: false,
      isTestAccount: false,
      lastSeenAt: null,
      isOnline: false,
      onlineStatus: null,
      customStatus: null,
      profileCompleteness: 0,
      profileVisibility: null,
      twoFactorBackupCodes: [],
      securitySettings: null,
      featureFlags: null,
      experimentGroups: null,
      migrationStatus: null,
      legacyUserId: null,
      syncedAt: null,
      teacherActivatedAt: null,
    };
  }

  /**
   * Create multiple test users
   */
  static createUsers(count: number, options: CreateUserOptions = {}): any[] {
    return Array.from({ length: count }, () => this.createUser(options));
  }

  /**
   * Create test category data
   */
  static createCategory(name?: string): Omit<Category, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      name: name || faker.helpers.arrayElement([
        'Programming',
        'Data Science',
        'Design',
        'Business',
        'Marketing',
        'Photography',
        'Music',
        'Languages',
      ]),
    };
  }

  /**
   * Create multiple test categories
   */
  static createCategories(count: number): Array<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>> {
    return Array.from({ length: count }, () => this.createCategory());
  }

  /**
   * Create test course data
   */
  static createCourse(options: CreateCourseOptions = {}): any {
    const techTopics = [
      'React', 'Python', 'JavaScript', 'TypeScript', 'Next.js',
      'Node.js', 'PostgreSQL', 'MongoDB', 'AWS', 'Docker'
    ];
    
    const topic = faker.helpers.arrayElement(techTopics);
    
    return {
      userId: options.userId || this.generateId('user'),
      title: options.title || `${faker.helpers.arrayElement(['Complete', 'Advanced', 'Beginner', 'Master'])} ${topic} Course`,
      description: options.description || `Learn ${topic} from scratch to advanced level. ${faker.lorem.sentences(2)}`,
      cleanDescription: options.description || `Learn ${topic} from scratch to advanced level.`,
      imageUrl: options.imageUrl || faker.image.url({ width: 400, height: 300 }),
      price: options.price !== undefined ? options.price : faker.number.float({ min: 29.99, max: 299.99, fractionDigits: 2 }),
      isPublished: options.isPublished !== undefined ? options.isPublished : true,
      categoryId: options.categoryId || this.generateId('category'),
      courseGoals: `Master ${topic} concepts and best practices`,
      courseRatings: '4.5',
      activeLearners: faker.number.int({ min: 10, max: 1000 }),
      organizationId: 'default-org',
      publishedAt: options.isPublished ? new Date() : null,
    };
  }

  /**
   * Create multiple test courses
   */
  static createCourses(count: number, options: CreateCourseOptions = {}): any[] {
    return Array.from({ length: count }, () => this.createCourse(options));
  }

  /**
   * Create test chapter data
   */
  static createChapter(options: CreateChapterOptions = {}): any {
    const chapterTopics = [
      'Introduction', 'Fundamentals', 'Advanced Concepts', 'Best Practices',
      'Real-world Applications', 'Testing', 'Deployment', 'Performance'
    ];

    return {
      title: options.title || `Chapter: ${faker.helpers.arrayElement(chapterTopics)}`,
      description: options.description || faker.lorem.paragraph(),
      position: options.position || faker.number.int({ min: 1, max: 10 }),
      isPublished: options.isPublished !== undefined ? options.isPublished : true,
      isFree: options.isFree !== undefined ? options.isFree : false,
      courseId: options.courseId || this.generateId('course'),
      courseGoals: faker.lorem.sentence(),
      learningOutcomes: faker.lorem.sentences(3),
      difficulty: faker.helpers.arrayElement(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
      resources: '',
      status: 'ACTIVE',
    };
  }

  /**
   * Create multiple test chapters
   */
  static createChapters(count: number, options: CreateChapterOptions = {}): any[] {
    return Array.from({ length: count }, (_, index) => 
      this.createChapter({ ...options, position: options.position || index + 1 })
    );
  }

  /**
   * Create test section data
   */
  static createSection(options: CreateSectionOptions = {}): any {
    return {
      title: options.title || `Section: ${faker.lorem.words(3)}`,
      position: options.position || faker.number.int({ min: 1, max: 10 }),
      isPublished: options.isPublished !== undefined ? options.isPublished : true,
      isFree: options.isFree !== undefined ? options.isFree : faker.datatype.boolean(),
      chapterId: options.chapterId || this.generateId('chapter'),
      duration: options.duration || faker.number.int({ min: 5, max: 60 }),
      videoUrl: options.videoUrl || faker.internet.url(),
      type: 'VIDEO',
      isPreview: options.isFree || false,
      completionStatus: 'NOT_STARTED',
      resourceUrls: '',
    };
  }

  /**
   * Create multiple test sections
   */
  static createSections(count: number, options: CreateSectionOptions = {}): any[] {
    return Array.from({ length: count }, (_, index) => 
      this.createSection({ ...options, position: options.position || index + 1 })
    );
  }

  /**
   * Create test exam data
   */
  static createExam(sectionId?: string) {
    return {
      title: faker.lorem.words(4),
      description: faker.lorem.paragraph(),
      timeLimit: faker.number.int({ min: 30, max: 180 }),
      passingScore: faker.number.int({ min: 60, max: 90 }),
      isPublished: true,
      sectionId: sectionId || this.generateId('section'),
    };
  }

  /**
   * Create test exam question data
   */
  static createExamQuestion(examId?: string, bloomsLevel?: BloomsLevel) {
    const questionTypes = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY'];
    const bloomsLevels: BloomsLevel[] = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
    
    return {
      examId: examId || this.generateId('exam'),
      question: faker.lorem.sentence() + '?',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 'Option A',
      explanation: faker.lorem.paragraph(),
      points: faker.number.int({ min: 1, max: 10 }),
      bloomsLevel: bloomsLevel || faker.helpers.arrayElement(bloomsLevels),
      questionType: faker.helpers.arrayElement(questionTypes),
      position: faker.number.int({ min: 1, max: 20 }),
    };
  }

  /**
   * Create test enrollment data
   */
  static createEnrollment(userId?: string, courseId?: string) {
    return {
      userId: userId || this.generateId('user'),
      courseId: courseId || this.generateId('course'),
    };
  }

  /**
   * Create test purchase data
   */
  static createPurchase(userId?: string, courseId?: string) {
    return {
      userId: userId || this.generateId('user'),
      courseId: courseId || this.generateId('course'),
    };
  }

  /**
   * Create test user progress data
   */
  static createUserProgress(userId?: string, chapterId?: string) {
    return {
      userId: userId || this.generateId('user'),
      chapterId: chapterId || this.generateId('chapter'),
      isCompleted: faker.datatype.boolean(),
      progressPercent: faker.number.float({ min: 0, max: 100, fractionDigits: 1 }),
    };
  }

  /**
   * Create complete course structure with chapters and sections
   */
  static createCompleteCourse(options: {
    userId?: string;
    categoryId?: string;
    chaptersCount?: number;
    sectionsPerChapter?: number;
  } = {}) {
    const {
      userId = this.generateId('user'),
      categoryId = this.generateId('category'),
      chaptersCount = 3,
      sectionsPerChapter = 4,
    } = options;

    const course = this.createCourse({ userId, categoryId });
    const chapters = this.createChapters(chaptersCount, { courseId: 'course-id' });
    
    const sectionsData = chapters.flatMap((chapter, chapterIndex) =>
      this.createSections(sectionsPerChapter, { chapterId: `chapter-${chapterIndex}` })
    );

    return {
      course,
      chapters,
      sections: sectionsData,
    };
  }

  /**
   * Create realistic learning analytics data
   */
  static createAnalyticsData(userId?: string, courseId?: string) {
    return {
      userId: userId || this.generateId('user'),
      courseId: courseId || this.generateId('course'),
      totalTimeSpent: faker.number.int({ min: 60, max: 7200 }), // 1 minute to 2 hours
      completionRate: faker.number.float({ min: 0, max: 100, fractionDigits: 1 }),
      averageScore: faker.number.float({ min: 60, max: 100, fractionDigits: 1 }),
      lastAccessed: faker.date.recent({ days: 30 }),
      streakDays: faker.number.int({ min: 0, max: 30 }),
      badgesEarned: faker.number.int({ min: 0, max: 10 }),
    };
  }

  /**
   * Create test AI analysis response
   */
  static createBloomsAnalysisResponse() {
    return {
      courseLevel: {
        distribution: {
          REMEMBER: faker.number.float({ min: 10, max: 30, fractionDigits: 1 }),
          UNDERSTAND: faker.number.float({ min: 15, max: 35, fractionDigits: 1 }),
          APPLY: faker.number.float({ min: 15, max: 30, fractionDigits: 1 }),
          ANALYZE: faker.number.float({ min: 10, max: 25, fractionDigits: 1 }),
          EVALUATE: faker.number.float({ min: 5, max: 20, fractionDigits: 1 }),
          CREATE: faker.number.float({ min: 5, max: 15, fractionDigits: 1 }),
        },
        cognitiveDepth: faker.number.float({ min: 40, max: 90, fractionDigits: 1 }),
        balance: faker.helpers.arrayElement(['well-balanced', 'bottom-heavy', 'top-heavy']),
      },
      chapterAnalysis: [],
      learningPathway: {
        current: { stages: [], currentStage: 0, completionPercentage: 0 },
        recommended: { stages: [], currentStage: 0, completionPercentage: 0 },
        gaps: [],
      },
      recommendations: {
        contentAdjustments: [],
        assessmentChanges: [],
        activitySuggestions: [],
      },
      studentImpact: {
        skillsDeveloped: [],
        cognitiveGrowth: {
          currentLevel: faker.number.float({ min: 30, max: 70, fractionDigits: 1 }),
          projectedLevel: faker.number.float({ min: 60, max: 95, fractionDigits: 1 }),
          timeframe: '3-6 months',
          keyMilestones: [],
        },
        careerAlignment: [],
      },
    };
  }

  /**
   * Create test session data for auth tests
   */
  static createSession(userId?: string) {
    return {
      userId: userId || this.generateId('user'),
      sessionToken: crypto.randomUUID(),
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };
  }

  /**
   * Create realistic error data for testing error handling
   */
  static createError(type: 'validation' | 'database' | 'auth' | 'external' = 'validation') {
    const errorMessages = {
      validation: ['Invalid email format', 'Password too short', 'Required field missing'],
      database: ['Connection timeout', 'Unique constraint violation', 'Record not found'],
      auth: ['Invalid credentials', 'Session expired', 'Insufficient permissions'],
      external: ['API rate limit exceeded', 'Service unavailable', 'Network timeout'],
    };

    return {
      type,
      message: faker.helpers.arrayElement(errorMessages[type]),
      code: faker.string.alphanumeric(6).toUpperCase(),
      timestamp: new Date(),
      details: faker.lorem.sentence(),
    };
  }
}

/**
 * Test data presets for common scenarios
 */
export const TestDataPresets = {
  /**
   * Complete learning environment setup
   */
  completeEnvironment: () => ({
    admin: TestDataFactory.createUser({ role: 'ADMIN', email: 'admin@test.com' }),
    teacher: TestDataFactory.createUser({ role: 'USER', email: 'teacher@test.com' }),
    students: TestDataFactory.createUsers(5, { role: 'USER' }),
    categories: TestDataFactory.createCategories(5),
    courses: TestDataFactory.createCourses(10),
  }),

  /**
   * Course with complete structure
   */
  courseWithContent: () => {
    const course = TestDataFactory.createCompleteCourse({
      chaptersCount: 5,
      sectionsPerChapter: 3,
    });
    return course;
  },

  /**
   * Analytics testing data
   */
  analyticsScenario: () => ({
    users: TestDataFactory.createUsers(20),
    courses: TestDataFactory.createCourses(5),
    analyticsData: Array.from({ length: 100 }, () => TestDataFactory.createAnalyticsData()),
  }),

  /**
   * Assessment testing data
   */
  assessmentScenario: () => ({
    exam: TestDataFactory.createExam(),
    questions: Array.from({ length: 15 }, () => TestDataFactory.createExamQuestion()),
  }),
};

export default TestDataFactory;