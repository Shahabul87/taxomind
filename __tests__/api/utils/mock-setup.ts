/**
 * Comprehensive Mock Setup for API Testing
 * Sets up all necessary mocks for the Taxomind API test suite
 */

import { jest } from '@jest/globals';

/**
 * Database Mock Setup - Comprehensive Prisma client mocking
 */
export const setupDatabaseMocks = (): void => {
  // Core models that need comprehensive mocking
  const coreModels = [
    'user', 'course', 'chapter', 'section', 'category', 'enrollment', 'purchase',
    'attachment', 'video', 'blog', 'article', 'note', 'exam', 'question', 
    'courseReview', 'group', 'analytics', 'aiContentGeneration', 'aiUsageMetrics',
    'activeSession', 'authAudit', 'stripeCustomer', 'post', 'comment', 'reply',
    'reaction', 'profileLink', 'goal', 'milestone', 'task', 'notification',
    'subscription', 'bill', 'payment', 'organization', 'badge', 'certificate'
  ];

  // Create mock functions for each model
  const modelMocks = coreModels.reduce((mocks, modelName) => {
    mocks[modelName] = {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      createMany: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    };
    return mocks;
  }, {} as Record<string, Record<string, jest.Mock>>);

  // Mock the database instance
  jest.mock('@/lib/db', () => ({
    db: {
      ...modelMocks,
      $transaction: jest.fn(),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      $executeRaw: jest.fn(),
      $queryRaw: jest.fn(),
    },
  }));
};

/**
 * Authentication Mock Setup
 */
export const setupAuthMocks = (): void => {
  jest.mock('@/lib/auth', () => ({
    currentUser: jest.fn(),
    auth: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  }));

  // Mock NextAuth.js
  jest.mock('next-auth', () => ({
    default: jest.fn(),
    getServerSession: jest.fn(),
  }));

  jest.mock('next-auth/providers/google', () => ({
    default: jest.fn(() => ({ id: 'google', name: 'Google' })),
  }));

  jest.mock('next-auth/providers/github', () => ({
    default: jest.fn(() => ({ id: 'github', name: 'GitHub' })),
  }));

  jest.mock('next-auth/providers/credentials', () => ({
    default: jest.fn(() => ({ id: 'credentials', name: 'Credentials' })),
  }));
};

/**
 * Cache and Redis Mock Setup
 */
export const setupCacheMocks = (): void => {
  jest.mock('@/lib/cache/redis-cache', () => ({
    redisCache: {
      get: jest.fn().mockResolvedValue({ hit: false, value: null }),
      set: jest.fn().mockResolvedValue(true),
      del: jest.fn().mockResolvedValue(true),
      invalidatePattern: jest.fn().mockResolvedValue(true),
      flush: jest.fn().mockResolvedValue(true),
      exists: jest.fn().mockResolvedValue(false),
      ttl: jest.fn().mockResolvedValue(-1),
    },
    CACHE_PREFIXES: {
      USER: 'user:',
      COURSE: 'course:',
      CHAPTER: 'chapter:',
      SECTION: 'section:',
      ANALYTICS: 'analytics:',
      AI: 'ai:',
    },
    CACHE_TTL: {
      SHORT: 300,      // 5 minutes
      MEDIUM: 1800,    // 30 minutes
      LONG: 3600,      // 1 hour
      EXTRA_LONG: 86400, // 24 hours
    },
  }));

  jest.mock('@/lib/db/query-optimizer', () => ({
    cacheInvalidation: {
      invalidateUser: jest.fn().mockResolvedValue(true),
      invalidateCourse: jest.fn().mockResolvedValue(true),
      invalidateChapter: jest.fn().mockResolvedValue(true),
      invalidateSection: jest.fn().mockResolvedValue(true),
      invalidateSearch: jest.fn().mockResolvedValue(true),
      invalidateAnalytics: jest.fn().mockResolvedValue(true),
    },
  }));
};

/**
 * AI Services Mock Setup
 */
export const setupAIMocks = (): void => {
  jest.mock('openai', () => ({
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  title: 'AI Generated Course',
                  description: 'AI generated course description',
                  chapters: ['Chapter 1', 'Chapter 2', 'Chapter 3'],
                }),
              },
            }],
            usage: {
              prompt_tokens: 100,
              completion_tokens: 200,
              total_tokens: 300,
            },
          }),
        },
      },
    })),
  }));

  jest.mock('@anthropic-ai/sdk', () => ({
    Anthropic: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{
            type: 'text',
            text: JSON.stringify({
              content: 'AI generated content',
              structure: 'well formatted',
            }),
          }],
          usage: {
            input_tokens: 150,
            output_tokens: 250,
          },
        }),
      },
    })),
  }));
};

/**
 * External Services Mock Setup
 */
export const setupExternalServiceMocks = (): void => {
  // Stripe Mock
  jest.mock('stripe', () => ({
    default: jest.fn().mockImplementation(() => ({
      customers: {
        create: jest.fn().mockResolvedValue({
          id: 'cus_test123',
          email: 'test@example.com',
        }),
        retrieve: jest.fn().mockResolvedValue({
          id: 'cus_test123',
          email: 'test@example.com',
        }),
      },
      paymentIntents: {
        create: jest.fn().mockResolvedValue({
          id: 'pi_test123',
          status: 'succeeded',
          amount: 9999,
          currency: 'usd',
        }),
        retrieve: jest.fn().mockResolvedValue({
          id: 'pi_test123',
          status: 'succeeded',
          amount: 9999,
          currency: 'usd',
        }),
      },
      subscriptions: {
        create: jest.fn().mockResolvedValue({
          id: 'sub_test123',
          status: 'active',
        }),
      },
    })),
  }));

  // Cloudinary Mock
  jest.mock('cloudinary', () => ({
    v2: {
      uploader: {
        upload: jest.fn().mockResolvedValue({
          public_id: 'test_image_id',
          secure_url: 'https://res.cloudinary.com/test/image/upload/test_image.jpg',
          width: 800,
          height: 600,
        }),
        destroy: jest.fn().mockResolvedValue({
          result: 'ok',
        }),
      },
      api: {
        resource: jest.fn().mockResolvedValue({
          public_id: 'test_image_id',
          secure_url: 'https://res.cloudinary.com/test/image/upload/test_image.jpg',
        }),
      },
    },
  }));

  // Email Service Mock
  jest.mock('@/lib/email', () => ({
    sendEmail: jest.fn().mockResolvedValue(true),
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  }));
};

/**
 * Utility and Helper Mock Setup
 */
export const setupUtilityMocks = (): void => {
  // Logger Mock
  jest.mock('@/lib/logger', () => ({
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    },
  }));

  // Validation Mock (Zod)
  jest.mock('zod', () => ({
    z: {
      object: jest.fn(() => ({
        parse: jest.fn((data) => data),
        safeParse: jest.fn((data) => ({ success: true, data })),
        extend: jest.fn(() => ({
          parse: jest.fn((data) => data),
        })),
      })),
      string: jest.fn(() => ({
        min: jest.fn(() => ({
          max: jest.fn(() => ({
            email: jest.fn(() => ({})),
            optional: jest.fn(() => ({})),
          })),
        })),
        email: jest.fn(() => ({
          optional: jest.fn(() => ({})),
        })),
        optional: jest.fn(() => ({})),
      })),
      number: jest.fn(() => ({
        min: jest.fn(() => ({
          max: jest.fn(() => ({
            optional: jest.fn(() => ({})),
          })),
        })),
        optional: jest.fn(() => ({})),
      })),
      boolean: jest.fn(() => ({
        optional: jest.fn(() => ({})),
        default: jest.fn(() => ({})),
      })),
      array: jest.fn(() => ({
        optional: jest.fn(() => ({})),
        default: jest.fn(() => ({})),
      })),
      enum: jest.fn(() => ({
        optional: jest.fn(() => ({})),
      })),
    },
  }));

  // Rate Limiting Mock
  jest.mock('@/lib/rate-limit', () => ({
    rateLimit: jest.fn().mockResolvedValue({ success: true }),
    checkRateLimit: jest.fn().mockResolvedValue(true),
  }));

  // Security Utilities Mock
  jest.mock('@/lib/security/session-fingerprint', () => ({
    generateFingerprint: jest.fn().mockReturnValue('test-fingerprint-hash'),
    validateFingerprint: jest.fn().mockReturnValue(true),
  }));

  jest.mock('@/lib/security/encryption', () => ({
    encrypt: jest.fn().mockReturnValue('encrypted-data'),
    decrypt: jest.fn().mockReturnValue('decrypted-data'),
    hashPassword: jest.fn().mockResolvedValue('hashed-password'),
    verifyPassword: jest.fn().mockResolvedValue(true),
  }));

  // TOTP Mock
  jest.mock('@/lib/totp', () => ({
    generateSecret: jest.fn().mockReturnValue('secret-key'),
    generateToken: jest.fn().mockReturnValue('123456'),
    verifyToken: jest.fn().mockReturnValue(true),
    generateQRCode: jest.fn().mockResolvedValue('data:image/png;base64,...'),
  }));
};

/**
 * Environment and Configuration Mock Setup
 */
export const setupEnvironmentMocks = (): void => {
  // Environment variables
  const originalEnv = process.env;
  
  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
      NEXTAUTH_URL: 'http://localhost:3000',
      NEXTAUTH_SECRET: 'test-secret',
      GOOGLE_CLIENT_ID: 'test-google-id',
      GOOGLE_CLIENT_SECRET: 'test-google-secret',
      GITHUB_CLIENT_ID: 'test-github-id',
      GITHUB_CLIENT_SECRET: 'test-github-secret',
      OPENAI_API_KEY: 'test-openai-key',
      ANTHROPIC_API_KEY: 'test-anthropic-key',
      STRIPE_SECRET_KEY: 'sk_test_123',
      CLOUDINARY_CLOUD_NAME: 'test-cloud',
      CLOUDINARY_API_KEY: 'test-api-key',
      CLOUDINARY_API_SECRET: 'test-api-secret',
      REDIS_URL: 'redis://localhost:6379',
      SMTP_HOST: 'localhost',
      SMTP_PORT: '587',
      SMTP_USER: 'test@example.com',
      SMTP_PASS: 'test-password',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });
};

/**
 * Next.js Framework Mock Setup
 */
export const setupNextJSMocks = (): void => {
  // Next.js Request/Response Mocks
  jest.mock('next/server', () => ({
    NextRequest: jest.fn().mockImplementation((url, options) => ({
      url,
      method: options?.method || 'GET',
      headers: new Map(Object.entries(options?.headers || {})),
      json: jest.fn().mockResolvedValue(JSON.parse(options?.body || '{}')),
      text: jest.fn().mockResolvedValue(options?.body || ''),
      nextUrl: {
        searchParams: new URLSearchParams(),
        pathname: new URL(url).pathname,
      },
    })),
    NextResponse: {
      json: jest.fn().mockImplementation((data, init) => ({
        status: init?.status || 200,
        json: () => Promise.resolve(data),
        text: () => Promise.resolve(JSON.stringify(data)),
        headers: new Map(Object.entries(init?.headers || {})),
      })),
      redirect: jest.fn().mockImplementation((url, status) => ({
        status: status || 302,
        headers: { Location: url },
      })),
    },
    userAgent: jest.fn().mockReturnValue({
      isBot: false,
      browser: { name: 'Chrome' },
      device: { type: 'desktop' },
      os: { name: 'Windows' },
    }),
  }));

  // Next.js Navigation Mock
  jest.mock('next/navigation', () => ({
    useRouter: jest.fn().mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    }),
    usePathname: jest.fn().mockReturnValue('/'),
    useSearchParams: jest.fn().mockReturnValue(new URLSearchParams()),
    redirect: jest.fn(),
    notFound: jest.fn(),
  }));

  // Next.js Image Mock
  jest.mock('next/image', () => ({
    default: jest.fn().mockImplementation(({ src, alt, ...props }) => ({
      type: 'img',
      props: { src, alt, ...props },
    })),
  }));

  // Next.js Headers Mock
  jest.mock('next/headers', () => ({
    headers: jest.fn().mockReturnValue({
      get: jest.fn(),
      has: jest.fn(),
      entries: jest.fn().mockReturnValue([]),
      forEach: jest.fn(),
    }),
    cookies: jest.fn().mockReturnValue({
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      has: jest.fn(),
      getAll: jest.fn().mockReturnValue([]),
    }),
  }));
};

/**
 * Test Performance and Monitoring Mock Setup
 */
export const setupMonitoringMocks = (): void => {
  // Sentry Mock
  jest.mock('@sentry/nextjs', () => ({
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    addBreadcrumb: jest.fn(),
    setUser: jest.fn(),
    setTag: jest.fn(),
    setContext: jest.fn(),
  }));

  // Performance API Mock
  Object.defineProperty(global, 'performance', {
    value: {
      now: jest.fn().mockReturnValue(Date.now()),
      mark: jest.fn(),
      measure: jest.fn(),
      getEntriesByType: jest.fn().mockReturnValue([]),
      getEntriesByName: jest.fn().mockReturnValue([]),
    },
    writable: true,
  });
};

/**
 * Browser APIs Mock Setup
 */
export const setupBrowserAPIMocks = (): void => {
  // Crypto API Mock
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: jest.fn().mockReturnValue('mocked-uuid-1234'),
      getRandomValues: jest.fn().mockImplementation((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      }),
      subtle: {
        digest: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
        encrypt: jest.fn().mockResolvedValue(new ArrayBuffer(16)),
        decrypt: jest.fn().mockResolvedValue(new ArrayBuffer(16)),
        generateKey: jest.fn().mockResolvedValue({}),
        importKey: jest.fn().mockResolvedValue({}),
        exportKey: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
      },
    },
    writable: true,
  });

  // Fetch API Mock
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: jest.fn().mockResolvedValue({}),
    text: jest.fn().mockResolvedValue(''),
    blob: jest.fn().mockResolvedValue(new Blob()),
    headers: new Headers(),
  });

  // URLSearchParams Mock (in case it's not available)
  if (typeof URLSearchParams === 'undefined') {
    global.URLSearchParams = class URLSearchParams {
      private params: Map<string, string> = new Map();

      constructor(init?: string | string[][] | Record<string, string>) {
        if (typeof init === 'string') {
          // Parse query string
          init.replace(/^\?/, '').split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            if (key) this.params.set(decodeURIComponent(key), decodeURIComponent(value || ''));
          });
        } else if (Array.isArray(init)) {
          init.forEach(([key, value]) => this.params.set(key, value));
        } else if (init && typeof init === 'object') {
          Object.entries(init).forEach(([key, value]) => this.params.set(key, value));
        }
      }

      get(name: string): string | null {
        return this.params.get(name);
      }

      set(name: string, value: string): void {
        this.params.set(name, value);
      }

      has(name: string): boolean {
        return this.params.has(name);
      }

      toString(): string {
        const pairs: string[] = [];
        this.params.forEach((value, key) => {
          pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
        });
        return pairs.join('&');
      }
    };
  }
};

/**
 * Complete Mock Setup Function
 * Call this function to set up all mocks for API testing
 */
export const setupAllMocks = (): void => {
  setupDatabaseMocks();
  setupAuthMocks();
  setupCacheMocks();
  setupAIMocks();
  setupExternalServiceMocks();
  setupUtilityMocks();
  setupEnvironmentMocks();
  setupNextJSMocks();
  setupMonitoringMocks();
  setupBrowserAPIMocks();
};

// Export individual setup functions for granular control
export {
  setupDatabaseMocks,
  setupAuthMocks,
  setupCacheMocks,
  setupAIMocks,
  setupExternalServiceMocks,
  setupUtilityMocks,
  setupEnvironmentMocks,
  setupNextJSMocks,
  setupMonitoringMocks,
  setupBrowserAPIMocks,
};