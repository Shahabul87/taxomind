/**
 * Comprehensive Jest Setup - Fixes all mocking issues
 */

import '@testing-library/jest-dom';

// ===========================
// ENVIRONMENT SETUP
// ===========================

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.ENCRYPTION_MASTER_KEY = 'test-encryption-key-32-chars-long!!';
process.env.JWT_SECRET = 'test-jwt-secret';

// ===========================
// BROWSER API MOCKS
// ===========================

if (typeof window !== 'undefined') {
  // Performance API
  global.performance = {
    now: () => Date.now(),
    mark: jest.fn(),
    measure: jest.fn(),
  };

  // Crypto API
  global.crypto = {
    getRandomValues: (array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    },
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
  };

  // Window matchMedia
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
  });

  // Observers
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  global.MutationObserver = class MutationObserver {
    constructor() {}
    observe() {}
    disconnect() {}
    takeRecords() { return []; }
  };
}

// Fetch mock
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    headers: new Map(),
  })
);

// Request/Response polyfills for Node.js environment
if (!global.Request) {
  global.Request = class Request {
    constructor(input, init = {}) {
      this.url = typeof input === 'string' ? input : input.url;
      this.method = init.method || 'GET';
      this.headers = new Map(Object.entries(init.headers || {}));
      this.body = init.body;
    }
    
    async json() {
      return JSON.parse(this.body);
    }
    
    async text() {
      return this.body;
    }
  };
}

if (!global.Response) {
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.statusText = init.statusText || '';
      this.headers = new Map(Object.entries(init.headers || {}));
    }
    
    async json() {
      return JSON.parse(this.body);
    }
    
    async text() {
      return this.body;
    }
  };
}

if (!global.Headers) {
  global.Headers = Map;
}

// ===========================
// PRISMA MOCK
// ===========================

// Mock Prisma Client - Fixed with proper module loading
jest.mock('@prisma/client', () => {
  // Use jest.requireActual to avoid hoisting issues
  return jest.requireActual('./__mocks__/prisma.js');
});

jest.mock('@/lib/db', () => {
  const mockPrisma = jest.requireActual('./__mocks__/prisma.js');
  return {
    db: mockPrisma.prisma,
    default: mockPrisma.prisma,
  };
});

// ===========================
// NEXT.JS MOCKS
// ===========================

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: class NextRequest {
    constructor(input, init = {}) {
      this.url = typeof input === 'string' ? input : input.url;
      this.method = init?.method || 'GET';
      this.headers = new Map(Object.entries(init?.headers || {}));
      this.body = init?.body;
      this.nextUrl = new URL(this.url);
    }
    
    async json() {
      if (typeof this.body === 'string') {
        return JSON.parse(this.body);
      }
      return this.body;
    }
    
    async text() {
      if (typeof this.body === 'string') {
        return this.body;
      }
      return JSON.stringify(this.body);
    }
  },
  NextResponse: {
    json: (data, init = {}) => {
      const response = new Response(JSON.stringify(data), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init.headers || {}),
        },
      });
      response.headers.set = jest.fn();
      response.headers.get = jest.fn((key) => {
        const headers = init.headers || {};
        return headers[key] || null;
      });
      return response;
    },
    redirect: (url, status = 302) => {
      const response = new Response(null, {
        status,
        headers: {
          Location: url.toString(),
        },
      });
      return response;
    },
    rewrite: (url) => {
      const response = new Response(null, {
        headers: {
          'x-middleware-rewrite': url.toString(),
        },
      });
      return response;
    },
    next: () => {
      return new Response(null, {
        headers: {
          'x-middleware-next': '1',
        },
      });
    },
  },
}));

// Mock Next.js navigation
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

// Mock Next.js dynamic imports
jest.mock('next/dynamic', () => () => {
  const React = require('react');
  return function DynamicComponent(props) {
    return React.createElement('div', props, props.children);
  };
});

// Mock Next.js Image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    const React = require('react');
    return React.createElement('img', props);
  },
}));

// Mock Next.js Link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }) => {
    const React = require('react');
    return React.createElement('a', { href, ...props }, children);
  },
}));

// ===========================
// AUTHENTICATION MOCKS
// ===========================

// Mock NextAuth
jest.mock('next-auth', () => ({
  default: jest.fn((config) => ({
    auth: jest.fn(() => null),
    signIn: jest.fn(),
    signOut: jest.fn(),
    handlers: {
      GET: jest.fn(),
      POST: jest.fn(),
    },
  })),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
    update: jest.fn(),
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children,
}));

// Mock auth helpers
jest.mock('@/lib/auth', () => ({
  currentUser: jest.fn(() => null),
  currentRole: jest.fn(() => null),
  auth: jest.fn(() => null),
}));

// Mock auth module
jest.mock('@/auth', () => ({
  signOut: jest.fn().mockResolvedValue(undefined),
  signIn: jest.fn().mockResolvedValue({ error: null }),
  auth: jest.fn().mockResolvedValue(null),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock audit helpers
jest.mock('@/lib/audit/auth-audit', () => ({
  authAuditHelpers: {
    logSignIn: jest.fn().mockResolvedValue(undefined),
    logSignOut: jest.fn().mockResolvedValue(undefined),
    logSuspiciousActivity: jest.fn().mockResolvedValue(undefined),
    logPasswordReset: jest.fn().mockResolvedValue(undefined),
    logAccountCreation: jest.fn().mockResolvedValue(undefined),
    logAccountUpdate: jest.fn().mockResolvedValue(undefined),
    logAccountDeletion: jest.fn().mockResolvedValue(undefined),
  },
}));

// ===========================
// EXTERNAL SDK MOCKS
// ===========================

// Mock Anthropic SDK - Fixed constructor issue
jest.mock('@anthropic-ai/sdk', () => {
  const mockClient = {
    messages: {
      create: jest.fn().mockResolvedValue({
        id: 'msg_test',
        content: [{ type: 'text', text: 'AI response' }],
        model: 'claude-3-opus-20240229',
        role: 'assistant',
        usage: { input_tokens: 10, output_tokens: 20 },
      }),
    },
    completions: {
      create: jest.fn().mockResolvedValue({
        completion: 'AI completion response',
        model: 'claude-3-opus-20240229',
      }),
    },
  };
  
  return {
    __esModule: true,
    default: jest.fn(() => mockClient),
    Anthropic: jest.fn(() => mockClient),
  };
});

// Mock OpenAI SDK
jest.mock('openai', () => {
  const mockClient = {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          id: 'chatcmpl-test',
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: 'AI response',
            },
            finish_reason: 'stop',
          }],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        }),
      },
    },
  };
  
  return {
    __esModule: true,
    default: jest.fn(() => mockClient),
    OpenAI: jest.fn(() => mockClient),
  };
});

// Mock Stripe
jest.mock('stripe', () => {
  const mockStripe = {
    customers: {
      create: jest.fn().mockResolvedValue({ id: 'cus_test' }),
      retrieve: jest.fn().mockResolvedValue({ id: 'cus_test' }),
      update: jest.fn().mockResolvedValue({ id: 'cus_test' }),
      del: jest.fn().mockResolvedValue({ id: 'cus_test', deleted: true }),
    },
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({ 
          id: 'cs_test', 
          url: 'https://checkout.stripe.com/test' 
        }),
        retrieve: jest.fn().mockResolvedValue({ id: 'cs_test' }),
      },
    },
    products: {
      create: jest.fn().mockResolvedValue({ id: 'prod_test' }),
      retrieve: jest.fn().mockResolvedValue({ id: 'prod_test' }),
    },
    prices: {
      create: jest.fn().mockResolvedValue({ id: 'price_test' }),
      retrieve: jest.fn().mockResolvedValue({ id: 'price_test' }),
    },
    webhooks: {
      constructEvent: jest.fn((payload) => payload),
    },
  };
  
  return {
    __esModule: true,
    default: jest.fn(() => mockStripe),
    Stripe: jest.fn(() => mockStripe),
  };
});

// ===========================
// REDIS/CACHE MOCKS
// ===========================

// Mock Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(-1),
    keys: jest.fn().mockResolvedValue([]),
    ping: jest.fn().mockResolvedValue('PONG'),
    flushall: jest.fn().mockResolvedValue('OK'),
    quit: jest.fn().mockResolvedValue('OK'),
    on: jest.fn(),
  }));
});

// Mock Upstash Redis
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(1),
    decr: jest.fn().mockResolvedValue(0),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(-1),
    ping: jest.fn().mockResolvedValue('PONG'),
  })),
}));

// Mock Rate Limiter
jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: jest.fn().mockImplementation(() => ({
    limit: jest.fn().mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60000,
    }),
  })),
}));

// ===========================
// EMAIL/QUEUE MOCKS
// ===========================

// Mock Resend
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ 
        id: 'email_test', 
        from: 'test@example.com',
        to: 'recipient@example.com',
      }),
    },
  })),
}));

// Mock BullMQ
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'job_test' }),
    close: jest.fn().mockResolvedValue(undefined),
    getJobs: jest.fn().mockResolvedValue([]),
  })),
  Worker: jest.fn().mockImplementation((name, processor) => ({
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  })),
  QueueEvents: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  })),
}));

// ===========================
// UTILITY MOCKS
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
    sign: jest.fn().mockResolvedValue('mock-jwt-token'),
  })),
  jwtVerify: jest.fn().mockResolvedValue({ 
    payload: { sub: 'user-id', email: 'test@example.com' } 
  }),
}));

// Mock otplib
jest.mock('otplib', () => ({
  authenticator: {
    generate: jest.fn(() => '123456'),
    verify: jest.fn(() => true),
    generateSecret: jest.fn(() => 'JBSWY3DPEHPK3PXP'),
    keyuri: jest.fn(() => 'otpauth://totp/Test:user@example.com?secret=JBSWY3DPEHPK3PXP'),
  },
}));

// Mock QRCode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mock-qr-code'),
  toString: jest.fn().mockResolvedValue('<svg>mock-qr-code</svg>'),
}));

// ===========================
// SERVER ACTION MOCKS
// ===========================

// Mock server action utilities
global.__webpack_require__ = jest.fn();
global.WEBPACK_IMPORTED_MODULE = {};

// Mock action functions with "use server" directive handling
// These are mocked globally but can be overridden in individual test files

// ===========================
// FRAMER MOTION MOCK
// ===========================

jest.mock('framer-motion', () => {
  const React = require('react');
  const motion = {};
  
  ['div', 'span', 'button', 'a', 'section', 'article', 'main', 'header', 'footer'].forEach(tag => {
    motion[tag] = React.forwardRef(({ children, ...props }, ref) => 
      React.createElement(tag, { ...props, ref }, children)
    );
  });
  
  return {
    motion,
    AnimatePresence: ({ children }) => children,
    useAnimation: () => ({ start: jest.fn(), stop: jest.fn() }),
    useMotionValue: (initial) => ({ get: () => initial, set: jest.fn() }),
    useScroll: () => ({ scrollY: { get: () => 0 } }),
  };
});

// ===========================
// CLEANUP
// ===========================

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  jest.restoreAllMocks();
});