import '@testing-library/jest-dom'
// Import our custom Jest DOM type definitions
import './__tests__/jest-dom.d.ts'

// ===========================
// PERFORMANCE API MOCKS
// ===========================
if (typeof globalThis.performance === 'undefined') {
  globalThis.performance = {
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
  };
} else {
  // Ensure all methods exist
  if (!globalThis.performance.clearMarks) {
    globalThis.performance.clearMarks = jest.fn();
  }
  if (!globalThis.performance.clearMeasures) {
    globalThis.performance.clearMeasures = jest.fn();
  }
  if (!globalThis.performance.mark) {
    globalThis.performance.mark = jest.fn();
  }
  if (!globalThis.performance.measure) {
    globalThis.performance.measure = jest.fn();
  }
}

// ===========================
// NEXT.JS REQUEST/RESPONSE MOCKS
// ===========================
class MockNextRequest {
  constructor(url, options = {}) {
    this._url = url;
    this.method = options.method || 'GET';
    this.headers = new Map(Object.entries(options.headers || {}));
    this.body = options.body;
    this.nextUrl = {
      pathname: new URL(url).pathname,
      searchParams: new URL(url).searchParams,
    };
  }
  
  get url() {
    return this._url;
  }
  
  json() {
    return Promise.resolve(JSON.parse(this.body || '{}'));
  }
  
  text() {
    return Promise.resolve(this.body || '');
  }
}

class MockNextResponse {
  constructor(body, options = {}) {
    this.body = body;
    this.status = options.status || 200;
    this.statusText = options.statusText || 'OK';
    this.headers = new Map(Object.entries(options.headers || {}));
    this.ok = this.status >= 200 && this.status < 300;
  }
  
  json() {
    return Promise.resolve(typeof this.body === 'string' ? JSON.parse(this.body) : this.body);
  }
  
  text() {
    return Promise.resolve(typeof this.body === 'string' ? this.body : JSON.stringify(this.body));
  }
  
  static json(data, init) {
    return new MockNextResponse(JSON.stringify(data), init);
  }
}

// Replace global Request/Response with our mocks
globalThis.Request = MockNextRequest;
globalThis.Response = MockNextResponse;

// ===========================
// OBSERVER API MOCKS
// ===========================
class MockResizeObserver {
  constructor(callback) {
    this.callback = callback;
    this.observations = [];
  }
  
  observe(target) {
    this.observations.push(target);
    // Trigger callback immediately for testing
    if (this.callback) {
      this.callback([{ target, contentRect: { width: 100, height: 100 } }], this);
    }
  }
  
  unobserve(target) {
    this.observations = this.observations.filter(t => t !== target);
  }
  
  disconnect() {
    this.observations = [];
  }
}

class MockIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.observations = [];
  }
  
  observe(target) {
    this.observations.push(target);
    // Trigger callback immediately for testing
    if (this.callback) {
      this.callback([{ target, isIntersecting: true, intersectionRatio: 1 }], this);
    }
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

// ===========================
// NEXT.JS ROUTER MOCKS
// ===========================
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn().mockResolvedValue(true),
      replace: jest.fn().mockResolvedValue(true),
      reload: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
      isReady: true,
      isPreview: false,
    }
  },
}))

jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn().mockResolvedValue(true),
      replace: jest.fn().mockResolvedValue(true),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
    }
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
  useParams() {
    return {};
  },
}))

// ===========================
// AUTH MOCKS
// ===========================
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
    update: jest.fn(),
  })),
  signIn: jest.fn().mockResolvedValue({ error: null, status: 200, ok: true, url: '/' }),
  signOut: jest.fn().mockResolvedValue(undefined),
  getSession: jest.fn().mockResolvedValue(null),
  SessionProvider: ({ children }) => children,
  getCsrfToken: jest.fn().mockResolvedValue('mock-csrf-token'),
  getProviders: jest.fn().mockResolvedValue({}),
}))

jest.mock('next-auth', () => ({
  default: jest.fn(),
  getServerSession: jest.fn().mockResolvedValue(null),
}))

jest.mock('@/auth', () => ({
  auth: jest.fn().mockResolvedValue(null),
  signIn: jest.fn().mockResolvedValue({ error: null }),
  signOut: jest.fn().mockResolvedValue(undefined),
  handlers: {
    GET: jest.fn(),
    POST: jest.fn(),
  },
}))

jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn().mockResolvedValue(null),
  currentRole: jest.fn().mockResolvedValue(null),
}))

// ===========================
// DATABASE MOCKS
// ===========================
const createPrismaMock = () => {
  const createModelMock = () => ({
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
    createMany: jest.fn().mockResolvedValue({ count: 0 }),
    update: jest.fn().mockResolvedValue({}),
    updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    upsert: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    count: jest.fn().mockResolvedValue(0),
    aggregate: jest.fn().mockResolvedValue({}),
    groupBy: jest.fn().mockResolvedValue([]),
  });

  const mock = {
    user: createModelMock(),
    course: createModelMock(),
    enrollment: createModelMock(),
    purchase: createModelMock(),
    chapter: createModelMock(),
    section: createModelMock(),
    category: createModelMock(),
    post: createModelMock(),
    bill: createModelMock(),
    userProgress: createModelMock(),
    sectionProgress: createModelMock(),
    exam: createModelMock(),
    question: createModelMock(),
    answer: createModelMock(),
    submission: createModelMock(),
    submissionAnswer: createModelMock(),
    review: createModelMock(),
    verificationToken: createModelMock(),
    passwordResetToken: createModelMock(),
    twoFactorToken: createModelMock(),
    twoFactorConfirmation: createModelMock(),
    analyticsEvent: createModelMock(),
    courseAnalytics: createModelMock(),
    userAnalytics: createModelMock(),
    platformAnalytics: createModelMock(),
    certificate: createModelMock(),
    notification: createModelMock(),
    badge: createModelMock(),
    userBadge: createModelMock(),
    webhook: createModelMock(),
    webhookEvent: createModelMock(),
    apiLog: createModelMock(),
    auditLog: createModelMock(),
    learningPath: createModelMock(),
    learningPathCourse: createModelMock(),
    discussion: createModelMock(),
    discussionReply: createModelMock(),
    message: createModelMock(),
    subscription: createModelMock(),
    payment: createModelMock(),
    invoice: createModelMock(),
    refund: createModelMock(),
    aiContent: createModelMock(),
    aiPrompt: createModelMock(),
    courseTemplate: createModelMock(),
    quizAttempt: createModelMock(),
    assignment: createModelMock(),
    assignmentSubmission: createModelMock(),
    grade: createModelMock(),
    attendance: createModelMock(),
    announcement: createModelMock(),
    systemSettings: createModelMock(),
    featureFlag: createModelMock(),
    $transaction: jest.fn().mockImplementation(async (fn) => {
      if (typeof fn === 'function') {
        return fn(mock);
      }
      return Promise.all(fn);
    }),
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $executeRaw: jest.fn().mockResolvedValue(0),
    $executeRawUnsafe: jest.fn().mockResolvedValue(0),
    $queryRaw: jest.fn().mockResolvedValue([]),
    $queryRawUnsafe: jest.fn().mockResolvedValue([]),
  };

  return mock;
};

jest.mock('@/lib/db', () => ({
  db: createPrismaMock(),
  default: createPrismaMock(),
}))

// ===========================
// REDIS MOCKS
// ===========================
const redisMock = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue('OK'),
  setex: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1),
  exists: jest.fn().mockResolvedValue(0),
  expire: jest.fn().mockResolvedValue(1),
  ttl: jest.fn().mockResolvedValue(-1),
  keys: jest.fn().mockResolvedValue([]),
  flushall: jest.fn().mockResolvedValue('OK'),
  ping: jest.fn().mockResolvedValue('PONG'),
  quit: jest.fn().mockResolvedValue('OK'),
  on: jest.fn(),
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
};

jest.mock('@/lib/redis', () => ({
  redis: redisMock,
  Redis: jest.fn(() => redisMock),
}))

jest.mock('@/lib/cache/redis-cache', () => ({
  redisCache: {
    get: jest.fn().mockResolvedValue({ hit: false, value: null }),
    set: jest.fn().mockResolvedValue(true),
    delete: jest.fn().mockResolvedValue(true),
    flush: jest.fn().mockResolvedValue(true),
  },
  CACHE_PREFIXES: {
    COURSE: 'course',
    USER: 'user',
    ENROLLMENT: 'enrollment',
  },
  CACHE_TTL: {
    SHORT: 300,
    MEDIUM: 3600,
    LONG: 86400,
  },
}))

// ===========================
// EMAIL MOCKS
// ===========================
jest.mock('@/lib/mail', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendTwoFactorTokenEmail: jest.fn().mockResolvedValue(true),
}))

jest.mock('resend', () => ({
  Resend: jest.fn(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ id: 'test-email-id' })
    }
  }))
}))

// ===========================
// FRAMER MOTION MOCKS
// ===========================
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return require('react').createElement('div', rest, children);
    },
    span: ({ children, ...props }) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return require('react').createElement('span', rest, children);
    },
    button: ({ children, ...props }) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return require('react').createElement('button', rest, children);
    },
    a: ({ children, ...props }) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return require('react').createElement('a', rest, children);
    },
    p: ({ children, ...props }) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return require('react').createElement('p', rest, children);
    },
    h1: ({ children, ...props }) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return require('react').createElement('h1', rest, children);
    },
    h2: ({ children, ...props }) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return require('react').createElement('h2', rest, children);
    },
    h3: ({ children, ...props }) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return require('react').createElement('h3', rest, children);
    },
    section: ({ children, ...props }) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return require('react').createElement('section', rest, children);
    },
    form: ({ children, ...props }) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return require('react').createElement('form', rest, children);
    },
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
  }),
  useMotionValue: () => ({
    get: jest.fn(() => 0),
    set: jest.fn(),
  }),
  useScroll: () => ({
    scrollY: { get: jest.fn(() => 0) },
    scrollX: { get: jest.fn(() => 0) },
  }),
  useTransform: () => ({ get: jest.fn(() => 0) }),
  useSpring: () => ({ get: jest.fn(() => 0) }),
  useInView: () => [null, true],
  useAnimationControls: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
  }),
}))

// ===========================
// UTILITY MOCKS
// ===========================
jest.mock('lodash', () => ({
  ...jest.requireActual('lodash'),
  debounce: (fn) => fn,
  throttle: (fn) => fn,
}))

// Mock console methods
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}

// Mock fetch
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: jest.fn().mockResolvedValue({}),
  text: jest.fn().mockResolvedValue(''),
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock window properties for framer-motion
if (typeof window !== 'undefined') {
  // Ensure window has addEventListener if it doesn't exist
  if (!window.addEventListener) {
    window.addEventListener = jest.fn();
  }
  if (!window.removeEventListener) {
    window.removeEventListener = jest.fn();
  }
  
  // Mock requestAnimationFrame
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = jest.fn((cb) => {
      setTimeout(cb, 0);
      return 0;
    });
  }
  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = jest.fn();
  }

  // Mock getComputedStyle
  if (!window.getComputedStyle) {
    window.getComputedStyle = jest.fn(() => ({
      getPropertyValue: jest.fn(() => ''),
    }));
  }
}

// Mock document properties for framer-motion
if (typeof document !== 'undefined') {
  if (!document.addEventListener) {
    document.addEventListener = jest.fn();
  }
  if (!document.removeEventListener) {
    document.removeEventListener = jest.fn();
  }
  
  // Mock createRange for content-editable components
  if (!document.createRange) {
    document.createRange = () => ({
      setStart: jest.fn(),
      setEnd: jest.fn(),
      commonAncestorContainer: {
        nodeName: 'BODY',
        ownerDocument: document,
      },
    });
  }
}

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn().mockReturnValue(null),
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
  getItem: jest.fn().mockReturnValue(null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

// ===========================
// ADDITIONAL MODULE MOCKS
// ===========================

// Mock uncrypto module
jest.mock('uncrypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9)),
}))

// Mock jose module
jest.mock('jose', () => ({
  SignJWT: jest.fn(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock-jwt-token'),
  })),
  jwtVerify: jest.fn().mockResolvedValue({
    payload: { sub: 'test-user-id' },
  }),
}))

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('salt'),
}))

// Mock @node-rs/argon2
jest.mock('@node-rs/argon2', () => ({
  hash: jest.fn().mockResolvedValue('argon2-hashed'),
  verify: jest.fn().mockResolvedValue(true),
}))

// Mock crypto
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn((size) => Buffer.alloc(size, 'a')),
  randomUUID: jest.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9)),
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => 'hashed-value'),
  })),
}))

// Mock next/headers
jest.mock('next/headers', () => ({
  headers: jest.fn(() => new Map()),
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}))

// Mock next/cache
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
  unstable_cache: jest.fn((fn) => fn),
}))

// Mock @upstash/redis
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(-1),
    incr: jest.fn().mockResolvedValue(1),
    decr: jest.fn().mockResolvedValue(0),
    hget: jest.fn().mockResolvedValue(null),
    hset: jest.fn().mockResolvedValue(1),
    hdel: jest.fn().mockResolvedValue(1),
    hgetall: jest.fn().mockResolvedValue({}),
    pipeline: jest.fn(() => ({
      get: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      del: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    })),
  })),
}))

// Mock @upstash/ratelimit
jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: jest.fn(() => ({
    limit: jest.fn().mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60000,
    }),
  })),
}))

// Mock speakeasy for TOTP
jest.mock('speakeasy', () => ({
  generateSecret: jest.fn(() => ({
    base32: 'JBSWY3DPEHPK3PXP',
    ascii: 'secret',
    otpauth_url: 'otpauth://totp/SecretKey?secret=JBSWY3DPEHPK3PXP',
  })),
  totp: {
    create: jest.fn(() => 'test-token'),
    verify: jest.fn(() => true),
  },
}))

// Mock qrcode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,test'),
}))

// ===========================
// ENVIRONMENT VARIABLES
// ===========================
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
process.env.NODE_ENV = 'test'
process.env.RESEND_API_KEY = 'test-resend-key'
process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:6379'
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'
process.env.OPENAI_API_KEY = 'test-openai-key'
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id'
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret'
process.env.GITHUB_CLIENT_ID = 'test-github-client-id'
process.env.GITHUB_CLIENT_SECRET = 'test-github-client-secret'

// ===========================
// ERROR SUPPRESSION
// ===========================
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
       args[0].includes('Warning: useLayoutEffect') ||
       args[0].includes('Not implemented'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// ===========================
// CLEANUP
// ===========================
afterEach(() => {
  jest.clearAllMocks()
})

// Export mocks for use in tests
export { redisMock, createPrismaMock }
// Additional mocks for failing tests
jest.mock('@/lib/encryption', () => ({
  encrypt: jest.fn((text) => `encrypted_${text}`),
  decrypt: jest.fn((text) => text.replace('encrypted_', '')),
  hashPassword: jest.fn((password) => `hashed_${password}`),
  verifyPassword: jest.fn(() => true),
}));

jest.mock('@/lib/sam-blooms-engine', () => ({
  analyzeBloomLevel: jest.fn(() => ({
    level: 'understanding',
    score: 0.8,
    confidence: 0.9,
  })),
  generateQuestions: jest.fn(() => [
    { question: 'Test question', level: 'understanding' }
  ]),
}));

jest.mock('@/lib/email-queue', () => ({
  EmailQueue: jest.fn(() => ({
    add: jest.fn().mockResolvedValue(true),
    process: jest.fn().mockResolvedValue(true),
    getStatus: jest.fn().mockResolvedValue('idle'),
  })),
  emailQueue: {
    add: jest.fn().mockResolvedValue(true),
    process: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('@/lib/session-fingerprint', () => ({
  generateFingerprint: jest.fn(() => 'test-fingerprint'),
  validateFingerprint: jest.fn(() => true),
}));

jest.mock('@/lib/totp', () => ({
  generateTOTP: jest.fn(() => ({
    secret: 'test-secret',
    qrCode: 'data:image/png;base64,test',
  })),
  verifyTOTP: jest.fn(() => true),
}));

// Export for tests that might need them
export const mockEncryption = jest.requireMock('@/lib/encryption');
export const mockEmailQueue = jest.requireMock('@/lib/email-queue');
