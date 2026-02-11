import '@testing-library/jest-dom'
// Import polyfills first
import './jest.polyfills.js'

// ===========================
// WINDOW AND GLOBAL SETUP
// ===========================

// Ensure window is properly initialized for framer-motion
if (typeof window !== 'undefined') {
  // Ensure window has addEventListener and removeEventListener
  if (!window.addEventListener) {
    window.addEventListener = jest.fn();
  }
  if (!window.removeEventListener) {
    window.removeEventListener = jest.fn();
  }
  
  // Ensure window.matchMedia exists with all methods
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Fix for ResizeObserver
  class MockResizeObserver {
    constructor(callback) {
      this.callback = callback;
      this.observations = [];
    }
    observe(target) {
      this.observations.push(target);
    }
    unobserve(target) {
      this.observations = this.observations.filter(t => t !== target);
    }
    disconnect() {
      this.observations = [];
    }
  }
  
  // Fix for IntersectionObserver
  class MockIntersectionObserver {
    constructor(callback, options) {
      this.callback = callback;
      this.options = options;
      this.observations = [];
    }
    observe(target) {
      this.observations.push(target);
    }
    unobserve(target) {
      this.observations = this.observations.filter(t => t !== target);
    }
    disconnect() {
      this.observations = [];
    }
  }

  globalThis.ResizeObserver = MockResizeObserver;
  globalThis.IntersectionObserver = MockIntersectionObserver;

  // Fix for MutationObserver
  class MockMutationObserver {
    constructor(callback) {
      this.callback = callback;
    }
    observe() { return null; }
    disconnect() { return null; }
    takeRecords() { return []; }
  }
  globalThis.MutationObserver = MockMutationObserver;
}

// ===========================
// PERFORMANCE API - COMPLETE
// ===========================
const performanceMock = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
  getEntries: jest.fn(() => []),
  navigation: {
    type: 0,
    redirectCount: 0,
  },
  timing: {
    navigationStart: Date.now(),
    unloadEventStart: 0,
    unloadEventEnd: 0,
    redirectStart: 0,
    redirectEnd: 0,
    fetchStart: Date.now(),
    domainLookupStart: Date.now(),
    domainLookupEnd: Date.now(),
    connectStart: Date.now(),
    connectEnd: Date.now(),
    secureConnectionStart: Date.now(),
    requestStart: Date.now(),
    responseStart: Date.now(),
    responseEnd: Date.now(),
    domLoading: Date.now(),
    domInteractive: Date.now(),
    domContentLoadedEventStart: Date.now(),
    domContentLoadedEventEnd: Date.now(),
    domComplete: Date.now(),
    loadEventStart: Date.now(),
    loadEventEnd: Date.now(),
  },
  timeOrigin: Date.now(),
};

// Ensure performance is set globally and not overridden
Object.defineProperty(global, 'performance', {
  value: performanceMock,
  writable: true,
  configurable: true,
});

// ===========================
// CRYPTO API
// ===========================
const crypto = require('crypto');
global.crypto = {
  getRandomValues: (array) => crypto.randomFillSync(array),
  randomUUID: () => crypto.randomUUID(),
  subtle: {
    digest: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
    sign: jest.fn(),
    verify: jest.fn(),
  },
};

// ===========================
// REACT MOCKS
// ===========================

// Mock React cache function
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    cache: jest.fn((fn) => fn), // Simply return the function without caching in tests
  };
});

// ===========================
// NEXT.JS MOCKS
// ===========================

// Mock Next.js Response properly
jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server');
  return {
    ...actual,
    NextRequest: class NextRequest {
      constructor(url, init = {}) {
        this.url = url;
        this.method = init.method || 'GET';
        this.headers = new Map(Object.entries(init.headers || {}));
        this.body = init.body;
        this.nextUrl = {
          pathname: new URL(url).pathname,
          searchParams: new URL(url).searchParams,
          href: url,
        };
      }
      
      json() {
        return Promise.resolve(this.body ? JSON.parse(this.body) : {});
      }
      
      text() {
        return Promise.resolve(this.body || '');
      }
      
      formData() {
        return Promise.resolve(new FormData());
      }
      
      clone() {
        return new NextRequest(this.url, {
          method: this.method,
          headers: Object.fromEntries(this.headers),
          body: this.body,
        });
      }
    },
    NextResponse: class NextResponse {
      constructor(body, init = {}) {
        this.body = body;
        this.status = init.status || 200;
        this.statusText = init.statusText || 'OK';
        this.headers = new Map(Object.entries(init.headers || {}));
        this.ok = this.status >= 200 && this.status < 300;
      }
      
      static json(data, init) {
        const response = new NextResponse(JSON.stringify(data), init);
        response.headers.set('content-type', 'application/json');
        return response;
      }
      
      static redirect(url, status = 302) {
        const response = new NextResponse(null, { status });
        response.headers.set('location', url);
        return response;
      }
      
      static next() {
        return new NextResponse(null, { status: 200 });
      }
      
      json() {
        return Promise.resolve(typeof this.body === 'string' ? JSON.parse(this.body) : this.body);
      }
      
      text() {
        return Promise.resolve(typeof this.body === 'string' ? this.body : JSON.stringify(this.body));
      }
    },
  };
});

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  })),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  usePathname: jest.fn(() => '/'),
  useParams: jest.fn(() => ({})),
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    isFallback: false,
    isReady: true,
    isPreview: false,
  })),
}));

// ===========================
// AUTHENTICATION MOCKS
// ===========================

// Mock NextAuth
jest.mock('next-auth', () => ({
  default: jest.fn((config) => ({
    auth: jest.fn((handler) => {
      // Return a middleware function
      return async (req) => {
        // Create a mock authenticated request
        const authenticatedReq = Object.assign(req, {
          auth: null, // or mock session data
        });
        if (handler) {
          return handler(authenticatedReq);
        }
        return authenticatedReq;
      };
    }),
    signIn: jest.fn(),
    signOut: jest.fn(),
    handlers: {
      GET: jest.fn(),
      POST: jest.fn(),
    },
  })),
  getServerSession: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
    update: jest.fn(),
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
  getCsrfToken: jest.fn(),
  getProviders: jest.fn(),
  SessionProvider: ({ children }) => children,
}));

// Mock auth providers
jest.mock('next-auth/providers/github', () => ({
  default: jest.fn(() => ({
    id: 'github',
    name: 'GitHub',
    type: 'oauth',
  })),
}));

jest.mock('next-auth/providers/google', () => ({
  default: jest.fn(() => ({
    id: 'google',
    name: 'Google',
    type: 'oauth',
  })),
}));

jest.mock('next-auth/providers/credentials', () => ({
  default: jest.fn(() => ({
    id: 'credentials',
    name: 'Credentials',
    type: 'credentials',
  })),
}));

// Mock @auth/core - Commented out due to module resolution issues
// jest.mock('@auth/core/providers/github', () => ({
//   default: jest.fn(() => ({
//     id: 'github',
//     name: 'GitHub',
//     type: 'oauth',
//   })),
// }));

// jest.mock('@auth/core/providers/google', () => ({
//   default: jest.fn(() => ({
//     id: 'google',
//     name: 'Google',
//     type: 'oauth',
//   })),
// }));

// Mock auth.js
jest.mock('@/auth', () => ({
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
  handlers: {
    GET: jest.fn(),
    POST: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(),
  currentRole: jest.fn(),
}));

// Mock auth.config.edge.ts
jest.mock('@/auth.config.edge', () => ({
  default: {
    providers: [],
    useSecureCookies: false,
  },
}));

// ===========================
// DATABASE MOCKS
// ===========================

// Mock Prisma Decimal type
jest.mock('@prisma/client/runtime/library', () => ({
  Decimal: jest.fn().mockImplementation((value) => ({
    value: value || 0,
    toString: () => String(value || 0),
    toNumber: () => Number(value || 0),
    toFixed: (digits) => Number(value || 0).toFixed(digits),
    valueOf: () => Number(value || 0),
  })),
}));

const createMockPrismaClient = () => {
  const models = [
    'user', 'course', 'enrollment', 'purchase', 'chapter', 'section',
    'category', 'attachment', 'userProgress', 'stripeCustomer',
    'passwordResetToken', 'twoFactorToken', 'twoFactorConfirmation',
    'verificationToken', 'account', 'session', 'aiGeneratedContent',
    'courseReview', 'group', 'question', 'questionOption', 'exam',
    'courseCompletionAnalytics', 'courseBloomsAnalysis',
    // Auth-related models
    'adminAccount', 'auditLog', 'loginAttempt', 'userSession', 'trustedDevice',
    // SAM-related models
    'samGoal', 'samSubGoal', 'samPlan', 'samToolExecution', 'samMemory',
    'samBehaviorEvent', 'samPattern', 'samIntervention', 'samCheckIn',
    // Additional models
    'post', 'notification', 'studyPlan', 'studyPlanTask', 'courseCategory',
    'coursePlan',
    // SAM Conversation models
    'sAMConversation', 'sAMMessage',
    // Enterprise/Compliance models
    'complianceEvent', 'organization', 'sectionBloomsMapping',
    // Additional Blooms/SAM models
    'chapterBloomsAnalysis', 'samInteraction',
    // Platform AI settings & usage tracking
    'platformAISettings', 'userAIPreferences', 'aIUsageMetrics', 'platformAIUsageSummary',
  ];
  
  const mockClient = {};
  
  models.forEach(model => {
    mockClient[model] = {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(() => Promise.resolve([])),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(() => Promise.resolve(0)),
      aggregate: jest.fn(),
      groupBy: jest.fn(() => Promise.resolve([])),
    };
  });
  
  mockClient.$transaction = jest.fn((fn) => {
    if (typeof fn === 'function') {
      return Promise.resolve(fn(mockClient));
    }
    return Promise.all(fn);
  });
  
  mockClient.$connect = jest.fn(() => Promise.resolve());
  mockClient.$disconnect = jest.fn(() => Promise.resolve());
  mockClient.$queryRaw = jest.fn(() => Promise.resolve([]));
  mockClient.$executeRaw = jest.fn(() => Promise.resolve(0));
  
  return mockClient;
};

const dbMock = createMockPrismaClient();

jest.mock('@/lib/db', () => ({
  db: dbMock,
  default: dbMock,
}));

jest.mock('@/lib/db-pooled', () => ({
  db: dbMock,
  getDb: () => dbMock,
  getDbMetrics: jest.fn(() => ({
    totalQueries: 0, cacheHits: 0, cacheMisses: 0,
    averageQueryTime: 0, activeConnections: 1,
  })),
  checkDatabaseHealth: jest.fn(() => Promise.resolve({
    healthy: true, latency: 5, connectionCount: 1,
  })),
  getBasePrismaClient: () => dbMock,
}));

// Also mock the test-db prismaMock to use the same instance
jest.mock('./__tests__/utils/test-db', () => ({
  prismaMock: dbMock,
  testDb: { connect: jest.fn(), disconnect: jest.fn(), seed: jest.fn(), cleanup: jest.fn(), getClient: () => dbMock },
  createMockDatabase: () => dbMock,
  TestDatabase: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    seed: jest.fn(),
    cleanup: jest.fn(),
  })),
  setupTestDatabase: jest.fn().mockResolvedValue({
    users: {
      teacher: { id: 'teacher-1', email: 'teacher@test.com', name: 'Test Teacher', role: 'USER' },
      student: { id: 'student-1', email: 'student@test.com', name: 'Test Student', role: 'USER' },
      admin: { id: 'admin-1', email: 'admin@test.com', name: 'Test Admin', role: 'ADMIN' },
    },
    courses: [
      { id: 'course-1', title: 'Test Course', userId: 'teacher-1', isPublished: true },
      { id: 'course-2', title: 'Test Course 2', userId: 'teacher-1', isPublished: true },
      { id: 'course-3', title: 'Unpublished Course', userId: 'teacher-1', isPublished: false },
    ],
    categories: [{ id: 'cat-1', name: 'Programming' }],
  }),
  teardownTestDatabase: jest.fn().mockResolvedValue(undefined),
}));

// ===========================
// TEST UTILITY MOCKS
// ===========================

jest.mock('./__tests__/utils/test-helpers', () => {
  // Build a mock NextRequest class that matches our next/server mock
  const { NextRequest, NextResponse } = jest.requireMock('next/server');

  return {
    ApiTestHelpers: {
      createMockRequest: jest.fn((options = {}) => {
        const {
          method = 'GET',
          url = 'http://localhost:3000/api/test',
          body,
          headers = {},
          searchParams = {},
        } = options;
        const request = new NextRequest(url, {
          method,
          headers: { 'content-type': 'application/json', ...headers },
          body: body ? JSON.stringify(body) : undefined,
        });
        // Add search params
        if (request.nextUrl && request.nextUrl.searchParams) {
          Object.entries(searchParams).forEach(([key, value]) => {
            request.nextUrl.searchParams.set(key, value);
          });
        }
        return request;
      }),
      createMockResponse: jest.fn((data, status = 200) => {
        return NextResponse.json(data, { status });
      }),
      testEndpoint: jest.fn(),
      createAuthenticatedRequest: jest.fn(),
      createUnauthenticatedRequest: jest.fn(),
      expectJsonResponse: jest.fn(),
      expectErrorResponse: jest.fn(),
    },
    AuthTestHelpers: {
      createMockSession: jest.fn((options = {}) => ({
        user: {
          id: options.userId || 'user-1',
          name: options.name || 'Test User',
          email: options.email || 'test@test.com',
          role: options.role || 'USER',
        },
        expires: new Date(Date.now() + 86400000).toISOString(),
      })),
      mockUseSession: jest.fn(),
      createAuthContext: jest.fn(),
    },
    DatabaseTestHelpers: {
      mockDatabaseOperation: jest.fn((result) => Promise.resolve(result)),
      mockDatabaseError: jest.fn((msg) => Promise.reject(new Error(msg || 'Database error'))),
      createMockPrismaClient: jest.fn(() => ({})),
    },
    ComponentTestHelpers: {
      renderWithProviders: jest.fn(),
      waitForLoading: jest.fn(),
      fillAndSubmitForm: jest.fn(),
      testFormValidation: jest.fn(),
    },
    PerformanceTestHelpers: {
      measureExecutionTime: jest.fn(async (fn) => {
        const start = Date.now();
        const result = await fn();
        return { result, timeMs: Date.now() - start };
      }),
      measureMemoryUsage: jest.fn(() => ({ finish: jest.fn(() => ({})) })),
      benchmark: jest.fn(async () => []),
    },
    ErrorTestHelpers: {
      testErrorBoundary: jest.fn(),
      mockConsole: jest.fn(() => ({ mockConsole: {}, restore: jest.fn() })),
      testAsyncError: jest.fn(),
    },
    AccessibilityTestHelpers: {
      testKeyboardNavigation: jest.fn(),
      testAriaAttributes: jest.fn(),
      testScreenReaderContent: jest.fn(),
    },
    WaitUtils: {
      waitForElement: jest.fn(),
      waitForCondition: jest.fn(),
      waitForNetwork: jest.fn(),
    },
    TestEnvironmentHelpers: {
      setupTestEnv: jest.fn(),
      cleanupTestEnv: jest.fn(),
      mockExternalServices: jest.fn(),
    },
  };
});

jest.mock('./__tests__/utils/test-factory', () => ({
  TestDataFactory: {
    createUser: jest.fn(),
    createCourse: jest.fn(),
    createEnrollment: jest.fn(),
  },
}));

jest.mock('./__tests__/utils/mock-providers', () => ({
  setupMockProviders: jest.fn(),
  resetMockProviders: jest.fn(),
  mockAnthropicClient: {
    messages: { create: jest.fn() },
  },
}));

// ===========================
// REDIS AND CACHE MOCKS
// ===========================

// Mock IORedis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    keys: jest.fn(() => Promise.resolve([])),
    mget: jest.fn(() => Promise.resolve([])),
    mset: jest.fn(),
    flushall: jest.fn(),
    ping: jest.fn(() => Promise.resolve('PONG')),
    quit: jest.fn(),
    on: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  }));
});

// Mock Upstash Redis
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    keys: jest.fn(() => Promise.resolve([])),
    mget: jest.fn(() => Promise.resolve([])),
    mset: jest.fn(),
    incr: jest.fn(() => Promise.resolve(1)),
    decr: jest.fn(() => Promise.resolve(0)),
    hget: jest.fn(),
    hset: jest.fn(),
    hdel: jest.fn(),
    hgetall: jest.fn(() => Promise.resolve({})),
    zadd: jest.fn(),
    zrange: jest.fn(() => Promise.resolve([])),
    zrem: jest.fn(),
    flushall: jest.fn(),
    ping: jest.fn(() => Promise.resolve('PONG')),
  })),
}));

// Mock Redis module
jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(() => Promise.resolve('OK')),
    del: jest.fn(() => Promise.resolve(0)),
    exists: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    keys: jest.fn(() => Promise.resolve([])),
    flushall: jest.fn(),
    ping: jest.fn(() => Promise.resolve('PONG')),
    quit: jest.fn(),
    on: jest.fn(),
  },
}));

// Mock Redis cache
jest.mock('@/lib/cache/redis-cache', () => ({
  redisCache: {
    get: jest.fn(() => Promise.resolve({ hit: false, value: null })),
    set: jest.fn(() => Promise.resolve(true)),
    delete: jest.fn(() => Promise.resolve(true)),
    flush: jest.fn(() => Promise.resolve(true)),
    invalidateByTags: jest.fn(() => Promise.resolve(1)),
    invalidatePattern: jest.fn(() => Promise.resolve(1)),
  },
  CACHE_PREFIXES: {
    COURSE: 'course:',
    USER: 'user:',
    ENROLLMENT: 'enrollment:',
    SESSION: 'session:',
    ANALYTICS: 'analytics:',
    LEADERBOARD: 'leaderboard:',
  },
  CACHE_TTL: {
    SHORT: 300,
    MEDIUM: 900,
    LONG: 3600,
    VERY_LONG: 86400,
  },
}));

// Mock bull/bullmq - Commented out due to module resolution issues
// jest.mock('bull', () => ({
//   default: jest.fn().mockImplementation(() => ({
//     add: jest.fn(() => Promise.resolve({ id: 'job-id' })),
//     process: jest.fn(),
//     on: jest.fn(),
//     close: jest.fn(),
//     getJobs: jest.fn(() => Promise.resolve([])),
//     getJob: jest.fn(),
//     getCompletedCount: jest.fn(() => Promise.resolve(0)),
//     getFailedCount: jest.fn(() => Promise.resolve(0)),
//   })),
// }));

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn(() => Promise.resolve({ id: 'job-id' })),
    close: jest.fn(),
  })),
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn(),
  })),
}));

// ===========================
// EMAIL MOCKS
// ===========================

jest.mock('@/lib/mail', () => ({
  sendVerificationEmail: jest.fn(() => Promise.resolve()),
  sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
  sendTwoFactorTokenEmail: jest.fn(() => Promise.resolve()),
}));

// Mock email queue
jest.mock('@/lib/email-queue', () => ({
  EmailQueue: {
    getInstance: jest.fn(() => ({
      addEmailJob: jest.fn(() => Promise.resolve('job-id')),
      processEmailJobData: jest.fn(() => Promise.resolve()),
      getQueueStatus: jest.fn(() => Promise.resolve({
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
      })),
    })),
  },
}));

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn(() => Promise.resolve({ id: 'email-id' })),
    },
  })),
}));

// ===========================
// EXTERNAL LIBRARIES
// ===========================

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn((password) => Promise.resolve(`hashed_${password}`)),
  compare: jest.fn((password, hash) => Promise.resolve(hash === `hashed_${password}`)),
  hashSync: jest.fn((password) => `hashed_${password}`),
  compareSync: jest.fn((password, hash) => hash === `hashed_${password}`),
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-v4'),
  v1: jest.fn(() => 'mock-uuid-v1'),
}));

// Mock jose
jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn(() => Promise.resolve('mock-jwt-token')),
  })),
  jwtVerify: jest.fn(() => Promise.resolve({ payload: {} })),
}));

// Mock openai
jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(() => Promise.resolve({
          choices: [{ message: { content: 'AI response' } }],
        })),
      },
    },
  })),
}));

// Mock anthropic
jest.mock('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn(() => Promise.resolve({
        content: [{ text: 'AI response' }],
      })),
    },
  })),
}));

// Mock stripe
jest.mock('stripe', () => ({
  default: jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn(() => Promise.resolve({ id: 'cus_test' })),
      retrieve: jest.fn(() => Promise.resolve({ id: 'cus_test' })),
    },
    checkout: {
      sessions: {
        create: jest.fn(() => Promise.resolve({ id: 'cs_test', url: 'http://stripe.com' })),
      },
    },
    webhooks: {
      constructEvent: jest.fn((payload, sig, secret) => payload),
    },
  })),
}));

// Mock cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn(() => Promise.resolve({ secure_url: 'http://cloudinary.com/image.jpg' })),
      destroy: jest.fn(() => Promise.resolve({ result: 'ok' })),
    },
  },
}));


// Mock additional libraries - only if they exist
// These mocks will be conditionally added based on test requirements

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock enterprise data API
jest.mock('@/lib/data-fetching/enterprise-data-api', () => ({
  enterpriseDataAPI: {
    fetchCourses: jest.fn(() => Promise.resolve([])),
    fetchCourse: jest.fn(() => Promise.resolve(null)),
    fetchUserCourses: jest.fn(() => Promise.resolve([])),
    fetchCategories: jest.fn(() => Promise.resolve([])),
    searchCourses: jest.fn(() => Promise.resolve([])),
  },
}));

// Mock commonly used action functions
jest.mock('@/actions/login', () => ({
  login: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock new-verification action
jest.mock('@/actions/new-verification', () => ({
  newVerification: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock logout action
jest.mock('@/actions/logout', () => ({
  logout: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock auth audit helpers
jest.mock('@/lib/audit/auth-audit', () => ({
  authAuditHelpers: {
    logSignIn: jest.fn().mockResolvedValue(undefined),
    logSignOut: jest.fn().mockResolvedValue(undefined),
    logFailedLogin: jest.fn().mockResolvedValue(undefined),
    logSignInFailed: jest.fn().mockResolvedValue(undefined),
    logSignInSuccess: jest.fn().mockResolvedValue(undefined),
    logTwoFactorFailed: jest.fn().mockResolvedValue(undefined),
    logTwoFactorVerified: jest.fn().mockResolvedValue(undefined),
    logSuspiciousActivity: jest.fn().mockResolvedValue(undefined),
    logPasswordChange: jest.fn().mockResolvedValue(undefined),
    logAccountLock: jest.fn().mockResolvedValue(undefined),
  },
}));

// Register action will be mocked in individual tests as needed

jest.mock('@/actions/settings', () => ({
  settings: jest.fn().mockResolvedValue({ success: true }),
  updateProfile: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/actions/new-password', () => ({
  newPassword: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/actions/reset', () => ({
  reset: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/actions/get-courses', () => ({
  getCourses: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/actions/get-all-courses', () => ({
  getAllCourses: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/actions/get-all-search-courses', () => ({
  getAllSearchCourses: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/actions/get-analytics', () => ({
  getAnalytics: jest.fn().mockResolvedValue({ data: [], totalRevenue: 0, totalSales: 0 }),
}));

// Mock additional course-related actions
jest.mock('@/actions/get-user-courses', () => ({
  getUserCourses: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/actions/get-user-posts', () => ({
  getUserPosts: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/actions/get-all-posts', () => ({
  getAllPosts: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/actions/get-all-posts-optimized', () => ({
  getAllPostsOptimized: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/actions/get-simple-posts', () => ({
  getSimplePosts: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/actions/get-courses-optimized', () => ({
  getCoursesOptimized: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/actions/get-all-courses-optimized', () => ({
  getAllCoursesOptimized: jest.fn().mockResolvedValue([]),
}));

jest.mock('@/actions/get-section', () => ({
  getSection: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/actions/get-course', () => ({
  getCourse: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/actions/get-chapter', () => ({
  getChapter: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/actions/admin-secure', () => ({
  isAdminSecure: jest.fn().mockResolvedValue({ isAdmin: false, user: null }),
}));

// Mock tokens functions
jest.mock('@/lib/tokens', () => ({
  generatePasswordResetToken: jest.fn().mockResolvedValue({ token: 'reset-token', expires: new Date() }),
  generateVerificationToken: jest.fn().mockResolvedValue({ token: 'verify-token', expires: new Date() }),
  generateTwoFactorToken: jest.fn().mockResolvedValue({ token: '123456', expires: new Date() }),
  getPasswordResetTokenByToken: jest.fn(),
  getVerificationTokenByEmail: jest.fn(),
  getTwoFactorTokenByEmail: jest.fn(),
  getPasswordResetTokenByEmail: jest.fn(),
}));

// Mock user queries
jest.mock('@/data/user', () => ({
  getUserByEmail: jest.fn(),
  getUserById: jest.fn(),
}));

jest.mock('@/data/two-factor-token', () => ({
  getTwoFactorTokenByEmail: jest.fn(),
}));

jest.mock('@/data/two-factor-confirmation', () => ({
  getTwoFactorConfirmationByUserId: jest.fn(),
}));

// Mock encryption utilities
jest.mock('@/lib/encryption', () => ({
  encrypt: jest.fn((data) => `encrypted_${JSON.stringify(data)}`),
  decrypt: jest.fn((data) => {
    if (typeof data === 'string' && data.startsWith('encrypted_')) {
      return JSON.parse(data.replace('encrypted_', ''));
    }
    return data;
  }),
  hashPassword: jest.fn((password) => `hashed_${password}`),
  verifyPassword: jest.fn((password, hash) => hash === `hashed_${password}`),
}));

// Mock TOTP utilities - removed, using lib/auth/totp below

// Mock auth/totp (alias for lib/totp)
jest.mock('@/lib/auth/totp', () => ({
  generateTOTPSecret: jest.fn(() => 'JBSWY3DPEHPK3PXP'),
  encryptTOTPSecret: jest.fn(async () => ({ encryptedData: 'encrypted', iv: 'iv', tag: 'tag', salt: 'salt' })),
  decryptTOTPSecret: jest.fn(async () => 'JBSWY3DPEHPK3PXP'),
  generateQRCode: jest.fn(async () => 'data:image/png;base64,test'),
  verifyTOTPToken: jest.fn(() => true),
  generateRecoveryCodes: jest.fn(() => ['1234-5678-ABCD-EF01']),
  encryptRecoveryCodes: jest.fn(async () => 'encrypted-codes'),
  decryptRecoveryCodes: jest.fn(async () => ['1234-5678-ABCD-EF01']),
  verifyRecoveryCode: jest.fn(() => true),
  validateTOTPSetup: jest.fn(async () => true),
  createTOTPSetup: jest.fn(async () => ({
    secret: 'JBSWY3DPEHPK3PXP',
    qrCode: 'data:image/png;base64,test',
    recoveryCodes: ['1234-5678-ABCD-EF01'],
  })),
  getCurrentTOTPToken: jest.fn(() => '123456'),
  isTOTPConfigured: jest.fn(() => true),
  totpConfig: {
    issuer: 'Taxomind LMS',
    window: 2,
    step: 30,
  },
}));

// Mock security/encryption
jest.mock('@/lib/security/encryption', () => ({
  dataEncryption: {
    encrypt: jest.fn(async (data) => ({ encryptedData: 'encrypted', iv: 'iv', tag: 'tag', salt: 'salt' })),
    decrypt: jest.fn(async () => 'decrypted-data'),
  },
}));

// Mock session fingerprint
jest.mock('@/lib/session-fingerprint', () => ({
  generateFingerprint: jest.fn(() => 'test-fingerprint'),
  validateFingerprint: jest.fn(() => true),
}));

// Mock with-api-auth
jest.mock('@/lib/with-api-auth', () => ({
  withApiAuth: jest.fn((handler) => handler),
  requireApiAuth: jest.fn((handler) => handler),
}));

// ===========================
// UTILITIES AND HELPERS
// ===========================

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    headers: new Map(),
  })
);

// Mock console to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

// ===========================
// ENVIRONMENT VARIABLES
// ===========================

process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.NODE_ENV = 'test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
process.env.ENCRYPTION_MASTER_KEY = 'test-encryption-key-32-chars-long!!';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.STRIPE_SECRET_KEY = 'sk_test_123456789';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123456789';
process.env.OPENAI_API_KEY = 'sk-test-openai-key';
process.env.ANTHROPIC_API_KEY = 'sk-test-anthropic-key';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.GITHUB_CLIENT_ID = 'test-github-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-github-client-secret';
process.env.RESEND_API_KEY = 'test-resend-api-key';

// ===========================
// ERROR SUPPRESSION
// ===========================

const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
       args[0].includes('Warning: useLayoutEffect') ||
       args[0].includes('Not implemented') ||
       args[0].includes('Cannot log after tests are done'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// ===========================
// FRAMER MOTION MOCKS
// ===========================

// Mock framer-motion
jest.mock('framer-motion', () => {
  const React = require('react');
  
  // Create motion components
  const motionComponents = {};
  const htmlElements = [
    'div', 'span', 'button', 'a', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'section', 'article', 'main', 'header', 'footer', 'nav', 'aside',
    'form', 'input', 'textarea', 'select', 'option', 'label',
    'ul', 'ol', 'li', 'img', 'svg', 'path', 'circle', 'rect', 'line',
    'table', 'thead', 'tbody', 'tr', 'td', 'th'
  ];

  htmlElements.forEach(element => {
    // eslint-disable-next-line react/display-name
    motionComponents[element] = React.forwardRef(({ children, ...props }, ref) => {
      // Filter out motion-specific props
      const {
        initial, animate, exit, transition, variants, whileHover, whileTap,
        whileInView, viewport, drag, dragConstraints, dragElastic,
        onAnimationStart, onAnimationComplete, layout, layoutId,
        ...htmlProps
      } = props;

      return React.createElement(element, { ...htmlProps, ref }, children);
    });
    motionComponents[element].displayName = `motion.${element}`;
  });

  return {
    motion: motionComponents,
    AnimatePresence: ({ children }) => children,
    useAnimation: () => ({
      start: jest.fn(),
      stop: jest.fn(),
      set: jest.fn(),
    }),
    useMotionValue: (initial) => ({
      get: () => initial,
      set: jest.fn(),
      subscribe: jest.fn(),
    }),
    useScroll: () => ({
      scrollY: { get: () => 0 },
      scrollX: { get: () => 0 },
      scrollYProgress: { get: () => 0 },
      scrollXProgress: { get: () => 0 },
    }),
    useTransform: (value, input, output) => ({
      get: () => output ? output[0] : 0,
      set: jest.fn(),
    }),
    useSpring: (value) => ({
      get: () => value,
      set: jest.fn(),
    }),
    useInView: () => [null, true],
    useAnimationControls: () => ({
      start: jest.fn(),
      stop: jest.fn(),
      set: jest.fn(),
    }),
    useReducedMotion: () => false,
    useIsPresent: () => true,
    usePresence: () => [true, jest.fn()],
    useVelocity: (value) => ({
      get: () => 0,
      set: jest.fn(),
    }),
    useDragControls: () => ({
      start: jest.fn(),
    }),
    LayoutGroup: ({ children }) => children,
    LazyMotion: ({ children }) => children,
    domAnimation: {},
    m: motionComponents,
  };
});

// ===========================
// SAM AGENTIC MOCKS
// ===========================

// @sam-ai/agentic is mocked via moduleNameMapper in jest.config.working.js
// pointing to __mocks__/@sam-ai/agentic/index.js
// This allows tests to control mock behavior via globalThis.__mockBehaviorMonitor

// ===========================
// CLEANUP
// ===========================

afterEach(() => {
  jest.clearAllMocks();
});

// Export for use in tests
export { dbMock, performanceMock };