import '@testing-library/jest-dom'
// Import polyfills first
import './jest.polyfills.js'

// ===========================
// WINDOW AND GLOBAL SETUP
// ===========================

// Fix for addEventListener issue
if (typeof window !== 'undefined') {
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

global.performance = performanceMock;

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
  default: jest.fn(),
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

// Mock @auth/core
jest.mock('@auth/core/providers/github', () => ({
  default: jest.fn(() => ({
    id: 'github',
    name: 'GitHub',
    type: 'oauth',
  })),
}));

jest.mock('@auth/core/providers/google', () => ({
  default: jest.fn(() => ({
    id: 'google',
    name: 'Google',
    type: 'oauth',
  })),
}));

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

// ===========================
// DATABASE MOCKS
// ===========================

const createMockPrismaClient = () => {
  const models = [
    'user', 'course', 'enrollment', 'purchase', 'chapter', 'section',
    'category', 'attachment', 'userProgress', 'stripeCustomer', 
    'passwordResetToken', 'twoFactorToken', 'twoFactorConfirmation',
    'verificationToken', 'account', 'session', 'aiGeneratedContent',
    'courseReview', 'group', 'question', 'questionOption', 'exam',
    'courseCompletionAnalytics', 'courseBloomsAnalysis',
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
    setex: jest.fn(),
    del: jest.fn(),
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
}));

// Mock bull/bullmq
jest.mock('bull', () => ({
  default: jest.fn().mockImplementation(() => ({
    add: jest.fn(() => Promise.resolve({ id: 'job-id' })),
    process: jest.fn(),
    on: jest.fn(),
    close: jest.fn(),
    getJobs: jest.fn(() => Promise.resolve([])),
    getJob: jest.fn(),
    getCompletedCount: jest.fn(() => Promise.resolve(0)),
    getFailedCount: jest.fn(() => Promise.resolve(0)),
  })),
}));

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
// CLEANUP
// ===========================

afterEach(() => {
  jest.clearAllMocks();
});

// Export for use in tests
export { dbMock, performanceMock };