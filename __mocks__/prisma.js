/**
 * Comprehensive Prisma Mock for Unit Tests
 * This mock provides all Prisma models and methods
 */

const mockPrismaClient = () => {
  const models = [
    'user', 'course', 'enrollment', 'purchase', 'chapter', 'section',
    'category', 'attachment', 'userProgress', 'stripeCustomer',
    'passwordResetToken', 'twoFactorToken', 'twoFactorConfirmation',
    'verificationToken', 'account', 'session', 'aiGeneratedContent',
    'courseReview', 'group', 'question', 'questionOption', 'exam',
    'courseCompletionAnalytics', 'courseBloomsAnalysis', 'notification',
    'userPreference', 'bill', 'payment', 'auditLog', 'blooms',
    'bloomsQuestionAnalysis', 'bloomsLevelAnalysis', 'userCapability',
    'securityEvent', 'samAI', 'courseAnalytics', 'performanceMetric',
    'cacheEntry', 'rateLimitEntry', 'webSocketSession', 'eventLog',
    'systemHealth', 'circuitBreakerState', 'message', 'emailQueue',
    'courseProgress', 'moduleProgress', 'userAnswer', 'examResult',
    'certificate', 'badge', 'achievement', 'learningPath',
    'discussionThread', 'discussionPost', 'annotation', 'bookmark',
    'flashcard', 'studyGroup', 'assignment', 'submission',
    // Auth-related models
    'adminAccount', 'loginAttempt', 'userSession', 'trustedDevice',
    // SAM-related models
    'samGoal', 'samSubGoal', 'samPlan', 'samToolExecution', 'samMemory',
    'samBehaviorEvent', 'samPattern', 'samIntervention', 'samCheckIn',
    // Study plan models
    'studyPlan', 'studyPlanTask', 'coursePlan', 'post', 'courseCategory'
  ];
  
  const client = {};
  
  // Create mock methods for each model
  models.forEach(model => {
    client[model] = {
      findUnique: jest.fn().mockImplementation((args) => {
        if (args?.where?.id === 'not-found') return Promise.resolve(null);
        return Promise.resolve({
          id: args?.where?.id || `${model}-id`,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }),
      
      findFirst: jest.fn().mockImplementation((args) => {
        if (args?.where?.id === 'not-found') return Promise.resolve(null);
        return Promise.resolve({
          id: `${model}-first`,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }),
      
      findMany: jest.fn().mockImplementation(() => 
        Promise.resolve([
          { id: `${model}-1`, createdAt: new Date(), updatedAt: new Date() },
          { id: `${model}-2`, createdAt: new Date(), updatedAt: new Date() },
        ])
      ),
      
      create: jest.fn().mockImplementation((args) => 
        Promise.resolve({
          id: `${model}-created`,
          ...args?.data,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ),
      
      createMany: jest.fn().mockImplementation((args) => 
        Promise.resolve({ count: args?.data?.length || 1 })
      ),
      
      update: jest.fn().mockImplementation((args) => 
        Promise.resolve({
          id: args?.where?.id || `${model}-updated`,
          ...args?.data,
          updatedAt: new Date(),
        })
      ),
      
      updateMany: jest.fn().mockImplementation(() => 
        Promise.resolve({ count: 2 })
      ),
      
      upsert: jest.fn().mockImplementation((args) => 
        Promise.resolve({
          id: args?.where?.id || `${model}-upserted`,
          ...args?.create,
          ...args?.update,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      ),
      
      delete: jest.fn().mockImplementation((args) => 
        Promise.resolve({
          id: args?.where?.id || `${model}-deleted`,
        })
      ),
      
      deleteMany: jest.fn().mockImplementation(() => 
        Promise.resolve({ count: 1 })
      ),
      
      count: jest.fn().mockImplementation(() => Promise.resolve(10)),
      
      aggregate: jest.fn().mockImplementation(() => 
        Promise.resolve({
          _count: 10,
          _sum: { amount: 1000 },
          _avg: { rating: 4.5 },
          _min: { createdAt: new Date('2024-01-01') },
          _max: { createdAt: new Date() },
        })
      ),
      
      groupBy: jest.fn().mockImplementation(() => 
        Promise.resolve([
          { status: 'active', _count: 5 },
          { status: 'inactive', _count: 3 },
        ])
      ),
    };
  });
  
  // Add transaction support
  client.$transaction = jest.fn().mockImplementation((fn) => {
    if (typeof fn === 'function') {
      return Promise.resolve(fn(client));
    }
    return Promise.all(fn);
  });
  
  // Add connection methods
  client.$connect = jest.fn().mockResolvedValue(undefined);
  client.$disconnect = jest.fn().mockResolvedValue(undefined);
  
  // Add raw query methods
  client.$queryRaw = jest.fn().mockResolvedValue([]);
  client.$executeRaw = jest.fn().mockResolvedValue(1);
  client.$queryRawUnsafe = jest.fn().mockResolvedValue([]);
  client.$executeRawUnsafe = jest.fn().mockResolvedValue(1);
  
  // Add middleware support
  client.$use = jest.fn();
  client.$on = jest.fn();
  client.$extends = jest.fn().mockReturnValue(client);
  
  return client;
};

// Create the mock instance
const mockClient = mockPrismaClient();

// Export both PrismaClient constructor and instance
module.exports = {
  PrismaClient: jest.fn(() => mockClient),
  prisma: mockClient,
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
      constructor(message, code, meta) {
        super(message);
        this.code = code;
        this.meta = meta;
      }
    },
    PrismaClientUnknownRequestError: class PrismaClientUnknownRequestError extends Error {},
    PrismaClientRustPanicError: class PrismaClientRustPanicError extends Error {},
    PrismaClientInitializationError: class PrismaClientInitializationError extends Error {},
    PrismaClientValidationError: class PrismaClientValidationError extends Error {},
    NotFoundError: class NotFoundError extends Error {},
    sql: jest.fn((strings, ...values) => ({ strings, values })),
    join: jest.fn((...args) => args.join(', ')),
    raw: jest.fn((value) => value),
    validator: jest.fn(() => ({})),
    DbNull: Symbol('DbNull'),
    JsonNull: Symbol('JsonNull'),
    AnyNull: Symbol('AnyNull'),
  },
};

// Add UserRole enum
module.exports.UserRole = {
  USER: 'USER',
  ADMIN: 'ADMIN',
};

// Add other common enums
module.exports.CourseStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
};

module.exports.PaymentStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
};

// Also export default for different import styles
module.exports.default = module.exports;