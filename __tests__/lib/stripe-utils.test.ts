/**
 * Tests for lib/stripe.ts - Stripe singleton utilities
 *
 * Covers: isStripeConfigured, validateStripeConfiguration, lazy init
 */

// Must mock server-only before import
jest.mock('server-only', () => ({}));

// Mock the Stripe constructor to track instantiation
const mockStripeInstance = {
  accounts: {
    retrieve: jest.fn(),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
  customers: {
    create: jest.fn(),
  },
};

jest.mock('stripe', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockStripeInstance),
}));

// @/lib/logger is globally mocked

describe('lib/stripe utilities', () => {
  const originalEnv = process.env.STRIPE_SECRET_KEY;

  afterEach(() => {
    // Restore env
    process.env.STRIPE_SECRET_KEY = originalEnv;
    // Reset module cache so we get fresh singleton each test
    jest.resetModules();
  });

  describe('isStripeConfigured', () => {
    it('returns true when STRIPE_SECRET_KEY is set', () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      // Re-require to get fresh module
      jest.isolateModules(() => {
        jest.mock('server-only', () => ({}));
        const { isStripeConfigured } = require('@/lib/stripe');
        expect(isStripeConfigured()).toBe(true);
      });
    });

    it('returns false when STRIPE_SECRET_KEY is not set', () => {
      delete process.env.STRIPE_SECRET_KEY;
      jest.isolateModules(() => {
        jest.mock('server-only', () => ({}));
        const { isStripeConfigured } = require('@/lib/stripe');
        expect(isStripeConfigured()).toBe(false);
      });
    });
  });

  describe('validateStripeConfiguration', () => {
    it('returns false when secret key is not configured', async () => {
      delete process.env.STRIPE_SECRET_KEY;
      jest.isolateModules(async () => {
        jest.mock('server-only', () => ({}));
        const { validateStripeConfiguration } = require('@/lib/stripe');
        const result = await validateStripeConfiguration();
        expect(result).toBe(false);
      });
    });

    it('returns true when Stripe API responds successfully', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      mockStripeInstance.accounts.retrieve.mockResolvedValue({ id: 'acct_test' });

      jest.isolateModules(async () => {
        jest.mock('server-only', () => ({}));
        const { validateStripeConfiguration } = require('@/lib/stripe');
        const result = await validateStripeConfiguration();
        expect(result).toBe(true);
      });
    });

    it('returns false when Stripe API call fails', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';
      mockStripeInstance.accounts.retrieve.mockRejectedValue(new Error('Invalid key'));

      jest.isolateModules(async () => {
        jest.mock('server-only', () => ({}));
        const { validateStripeConfiguration } = require('@/lib/stripe');
        const result = await validateStripeConfiguration();
        expect(result).toBe(false);
      });
    });
  });

  describe('stripe proxy', () => {
    it('throws when STRIPE_SECRET_KEY is missing on first access', () => {
      delete process.env.STRIPE_SECRET_KEY;

      jest.isolateModules(() => {
        jest.mock('server-only', () => ({}));
        const { stripe } = require('@/lib/stripe');
        expect(() => stripe.customers).toThrow('STRIPE_SECRET_KEY is not configured');
      });
    });

    it('provides access to Stripe SDK methods when configured', () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123';

      jest.isolateModules(() => {
        jest.mock('server-only', () => ({}));
        const { stripe } = require('@/lib/stripe');
        // Accessing a property should work via the Proxy
        expect(stripe.accounts).toBeDefined();
      });
    });
  });
});
