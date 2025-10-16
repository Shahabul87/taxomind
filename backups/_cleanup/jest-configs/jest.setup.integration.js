/**
 * Integration Test Setup - For tests that need real database connections
 */

// ===========================
// ENVIRONMENT SETUP
// ===========================

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.ENCRYPTION_MASTER_KEY = 'test-encryption-key-32-chars-long!!';
process.env.JWT_SECRET = 'test-jwt-secret';

// ===========================
// GLOBAL MOCKS FOR NODE ENVIRONMENT
// ===========================

// Crypto for Node
const crypto = require('crypto');
global.crypto = {
  getRandomValues: (array) => crypto.randomFillSync(array),
  randomUUID: () => crypto.randomUUID(),
};

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

// ===========================
// EXTERNAL SDK MOCKS (Keep these even for integration tests)
// ===========================

// Mock Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  const mockClient = {
    messages: {
      create: jest.fn().mockResolvedValue({
        id: 'msg_test',
        content: [{ type: 'text', text: 'AI response' }],
        model: 'claude-3-opus-20240229',
        role: 'assistant',
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
            message: { role: 'assistant', content: 'AI response' },
          }],
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

// Mock Stripe for integration tests
jest.mock('stripe', () => {
  const mockStripe = {
    customers: {
      create: jest.fn().mockResolvedValue({ id: 'cus_test' }),
      retrieve: jest.fn().mockResolvedValue({ id: 'cus_test' }),
    },
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({ 
          id: 'cs_test', 
          url: 'https://checkout.stripe.com/test' 
        }),
      },
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

// Mock email service
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ id: 'email_test' }),
    },
  })),
}));

// ===========================
// CLEANUP
// ===========================

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(async () => {
  // Clean up database connections if needed
  const { db } = require('@/lib/db');
  if (db && db.$disconnect) {
    await db.$disconnect();
  }
  jest.restoreAllMocks();
});