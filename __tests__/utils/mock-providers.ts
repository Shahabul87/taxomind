// @ts-nocheck
import { jest } from '@jest/globals';

/**
 * Mock providers for external services and APIs
 * Enables isolated testing without external dependencies
 */

/**
 * Anthropic AI Service Mock
 */
export const mockAnthropicClient = {
  messages: {
    create: jest.fn().mockImplementation(async ({ messages, model, max_tokens }) => {
      // Simulate different responses based on content
      const lastMessage = messages[messages.length - 1];
      const content = lastMessage.content.toLowerCase();

      if (content.includes('bloom') || content.includes('taxonomy')) {
        return {
          content: [{
            type: 'text',
            text: 'ANALYZE - This content requires students to analyze and compare different concepts.'
          }]
        };
      }

      if (content.includes('course') || content.includes('generate')) {
        return {
          content: [{
            type: 'text',
            text: `{
              "title": "Advanced JavaScript Programming",
              "description": "Master JavaScript concepts and modern development practices",
              "chapters": [
                {"title": "JavaScript Fundamentals", "description": "Core concepts and syntax"},
                {"title": "Asynchronous Programming", "description": "Promises, async/await, and callbacks"},
                {"title": "Modern JavaScript Features", "description": "ES6+ features and best practices"}
              ]
            }`
          }]
        };
      }

      // Default response
      return {
        content: [{
          type: 'text',
          text: 'This is a mock response from Anthropic AI for testing purposes.'
        }]
      };
    })
  }
};

/**
 * OpenAI Service Mock
 */
export const mockOpenAIClient = {
  chat: {
    completions: {
      create: jest.fn().mockImplementation(async ({ messages, model }) => {
        const lastMessage = messages[messages.length - 1];
        const content = lastMessage.content.toLowerCase();

        if (content.includes('exam') || content.includes('question')) {
          return {
            choices: [{
              message: {
                content: `{
                  "questions": [
                    {
                      "question": "What is the correct way to declare a variable in JavaScript?",
                      "options": ["var x = 1", "let x = 1", "const x = 1", "All of the above"],
                      "correctAnswer": "All of the above",
                      "explanation": "JavaScript supports var, let, and const for variable declarations",
                      "bloomsLevel": "REMEMBER"
                    }
                  ]
                }`
              }
            }]
          };
        }

        return {
          choices: [{
            message: {
              content: 'This is a mock response from OpenAI for testing purposes.'
            }
          }]
        };
      })
    }
  }
};

/**
 * Stripe Service Mock
 */
export const mockStripeClient: any = {
  checkout: {
    sessions: {
      create: jest.fn().mockResolvedValue({
        id: 'cs_test_mock_session_id',
        url: 'https://checkout.stripe.com/pay/cs_test_mock_session_id',
        payment_status: 'unpaid',
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'cs_test_mock_session_id',
        payment_status: 'paid',
        customer_email: 'test@example.com',
        metadata: {
          courseId: 'course-123',
          userId: 'user-456',
        },
      }),
    },
  },
  customers: {
    create: jest.fn().mockResolvedValue({
      id: 'cus_test_mock_customer_id',
      email: 'test@example.com',
    }),
  },
  prices: {
    list: jest.fn().mockResolvedValue({
      data: [
        {
          id: 'price_test_123',
          unit_amount: 9999,
          currency: 'usd',
        },
      ],
    }),
  },
  webhooks: {
    constructEvent: jest.fn().mockImplementation((payload, sig, secret) => {
      return {
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test_mock_session_id',
            payment_status: 'paid',
            customer_email: 'test@example.com',
            metadata: {
              courseId: 'course-123',
              userId: 'user-456',
            },
          },
        },
      };
    }),
  },
};

/**
 * Cloudinary Service Mock
 */
export const mockCloudinaryClient: any = {
  uploader: {
    upload: jest.fn().mockResolvedValue({
      secure_url: 'https://res.cloudinary.com/test/image/upload/v123456/test-image.jpg',
      public_id: 'test-image',
      width: 800,
      height: 600,
      format: 'jpg',
      resource_type: 'image',
    } as any),
    destroy: jest.fn().mockResolvedValue({
      result: 'ok',
    } as any),
  },
  api: {
    resources: jest.fn().mockResolvedValue({
      resources: [
        {
          public_id: 'test-image-1',
          secure_url: 'https://res.cloudinary.com/test/image/upload/v123456/test-image-1.jpg',
        },
        {
          public_id: 'test-image-2',
          secure_url: 'https://res.cloudinary.com/test/image/upload/v123456/test-image-2.jpg',
        },
      ],
    } as any),
  },
};

/**
 * NextAuth Service Mock
 */
export const mockNextAuthHandlers = {
  GET: jest.fn().mockImplementation(async (req) => {
    return Response.json({
      providers: {
        google: { id: 'google', name: 'Google' },
        github: { id: 'github', name: 'GitHub' },
      },
    });
  }),
  POST: jest.fn().mockImplementation(async (req: any) => {
    const body = await req.json();
    
    if (body.email && body.password) {
      return Response.json({
        user: {
          id: '1',
          email: body.email,
          name: 'Test User',
          role: 'USER',
        },
        token: 'mock-jwt-token',
      });
    }
    
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }),
};

/**
 * Resend Email Service Mock
 */
export const mockResendClient: any = {
  emails: {
    send: jest.fn().mockResolvedValue({
      id: 'test-email-id',
      from: 'noreply@taxomind.com',
      to: ['test@example.com'],
      subject: 'Test Email',
      created_at: new Date().toISOString(),
    } as any),
  },
};

/**
 * Redis Cache Mock
 */
export const mockRedisClient: any = {
  get: jest.fn().mockImplementation(async (key: string) => {
    // Simulate cached data based on key patterns
    if (key.includes('course-list')) {
      return JSON.stringify([
        { id: '1', title: 'Course 1', isPublished: true },
        { id: '2', title: 'Course 2', isPublished: true },
      ]);
    }
    
    if (key.includes('user-progress')) {
      return JSON.stringify({ progressPercentage: 75, isCompleted: false });
    }
    
    return null; // Cache miss
  }),
  set: jest.fn().mockResolvedValue('OK' as any),
  del: jest.fn().mockResolvedValue(1 as any),
  exists: jest.fn().mockResolvedValue(1 as any),
  expire: jest.fn().mockResolvedValue(1 as any),
  flushall: jest.fn().mockResolvedValue('OK' as any),
  disconnect: jest.fn().mockResolvedValue(undefined as any),
};

/**
 * Database Connection Pool Mock
 */
export const mockDatabasePool: any = {
  connect: jest.fn().mockResolvedValue(undefined as any),
  end: jest.fn().mockResolvedValue(undefined as any),
  query: jest.fn().mockImplementation(async (sql: string, params?: any[]) => {
    // Mock different query responses
    if (sql.includes('SELECT') && sql.includes('users')) {
      return {
        rows: [
          { id: '1', email: 'user1@test.com', name: 'User 1' },
          { id: '2', email: 'user2@test.com', name: 'User 2' },
        ],
      };
    }
    
    if (sql.includes('INSERT') || sql.includes('UPDATE')) {
      return { affectedRows: 1, insertId: '123' };
    }
    
    return { rows: [] };
  }),
};

/**
 * Analytics Service Mock
 */
export const mockAnalyticsProvider: any = {
  track: jest.fn().mockResolvedValue(undefined as any),
  identify: jest.fn().mockResolvedValue(undefined as any),
  page: jest.fn().mockResolvedValue(undefined as any),
  flush: jest.fn().mockResolvedValue(undefined as any),
};

/**
 * WebSocket Mock for real-time features
 */
export const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: WebSocket.OPEN,
};

/**
 * File Upload Service Mock
 */
export const mockUploadService: any = {
  uploadFile: jest.fn().mockResolvedValue({
    url: 'https://example.com/uploads/test-file.pdf',
    filename: 'test-file.pdf',
    size: 1024000,
    type: 'application/pdf',
  } as any),
  deleteFile: jest.fn().mockResolvedValue({ success: true } as any),
  getFileInfo: jest.fn().mockResolvedValue({
    url: 'https://example.com/uploads/test-file.pdf',
    filename: 'test-file.pdf',
    size: 1024000,
    uploadedAt: new Date(),
  } as any),
};

/**
 * Notification Service Mock
 */
export const mockNotificationService: any = {
  send: jest.fn().mockResolvedValue({
    id: 'notification-123',
    status: 'sent',
    timestamp: new Date(),
  } as any),
  sendBulk: jest.fn().mockResolvedValue({
    successful: 5,
    failed: 0,
    details: [],
  } as any),
};

/**
 * External API Mock (for integrations)
 */
export const mockExternalAPI: any = {
  get: jest.fn().mockImplementation(async (url: string) => {
    if (url.includes('/courses')) {
      return {
        data: [
          { id: '1', title: 'External Course 1', provider: 'External Platform' },
          { id: '2', title: 'External Course 2', provider: 'External Platform' },
        ],
        status: 200,
      };
    }
    
    return { data: null, status: 404 };
  }),
  post: jest.fn().mockResolvedValue({
    data: { success: true, id: 'new-resource-id' },
    status: 201,
  } as any),
  put: jest.fn().mockResolvedValue({
    data: { success: true, updated: true },
    status: 200,
  } as any),
  delete: jest.fn().mockResolvedValue({
    data: { success: true, deleted: true },
    status: 200,
  } as any),
};

/**
 * Mock Provider Setup Function
 * Call this in test setup to mock all external services
 */
export const setupMockProviders = () => {
  // Mock Anthropic
  jest.mock('@anthropic-ai/sdk', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockAnthropicClient),
    Anthropic: jest.fn().mockImplementation(() => mockAnthropicClient),
  }));

  // Mock OpenAI
  jest.mock('openai', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockOpenAIClient),
  }));

  // Mock Stripe
  jest.mock('stripe', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockStripeClient),
  }));

  // Mock Cloudinary
  jest.mock('cloudinary', () => ({
    v2: mockCloudinaryClient,
  }));

  // Mock Resend
  jest.mock('resend', () => ({
    Resend: jest.fn().mockImplementation(() => mockResendClient),
  }));

  // Mock Redis
  jest.mock('ioredis', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockRedisClient),
  }));

  // Mock Next Auth
  jest.mock('next-auth', () => mockNextAuthHandlers);

  // Set up environment variables for tests
  process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
  process.env.OPENAI_API_KEY = 'test-openai-key';
  process.env.STRIPE_API_KEY = 'test-stripe-key';
  process.env.STRIPE_WEBHOOK_SECRET = 'test-webhook-secret';
  process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
  process.env.CLOUDINARY_API_KEY = 'test-cloudinary-key';
  process.env.CLOUDINARY_API_SECRET = 'test-cloudinary-secret';
  process.env.RESEND_API_KEY = 'test-resend-key';
  process.env.REDIS_URL = 'redis://localhost:6379';
};

/**
 * Reset all mocks between tests
 */
export const resetMockProviders = () => {
  jest.clearAllMocks();
  
  // Reset mock implementations to default behavior
  Object.values(mockAnthropicClient.messages).forEach(mock => {
    if (jest.isMockFunction(mock)) {
      mock.mockClear();
    }
  });
  
  Object.values(mockStripeClient.checkout.sessions).forEach(mock => {
    if (jest.isMockFunction(mock)) {
      mock.mockClear();
    }
  });
  
  // Add other mock resets as needed
};

const mockProviders = {
  mockAnthropicClient,
  mockOpenAIClient,
  mockStripeClient,
  mockCloudinaryClient,
  mockNextAuthHandlers,
  mockResendClient,
  mockRedisClient,
  mockDatabasePool,
  mockAnalyticsProvider,
  mockWebSocket,
  mockUploadService,
  mockNotificationService,
  mockExternalAPI,
  setupMockProviders,
  resetMockProviders,
};

export default mockProviders;