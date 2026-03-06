import {
  validateEnvironmentVariables,
  getRequiredEnv,
  getOptionalEnv,
  validateAIConfiguration,
  validateOAuthConfiguration,
  validateRuntimeEnvironment,
  validateEnvVar,
  validateRequiredEnvVars,
  validateCoreEnvVars,
  ENV_VARS,
} from '@/lib/env-validation';

/**
 * Comprehensive test suite for the Environment Validation system.
 *
 * Strategy:
 * - Replace process.env with a CLEAN object per test to prevent leakage
 *   from the host machine (e.g. real ANTHROPIC_API_KEY, STRIPE keys).
 * - Restore the original process.env in afterAll.
 * - Each describe block covers a single exported function.
 * - Both positive (happy path) and negative (error) scenarios are exercised.
 */

const originalEnv = process.env;

/**
 * Builds a minimal set of env vars that satisfies all "required: true" configs
 * in development mode so validateEnvironmentVariables does not fail by default.
 *
 * IMPORTANT: This returns ONLY the vars needed -- no spreading of originalEnv --
 * so that real host env vars (ANTHROPIC_API_KEY, STRIPE_SECRET_KEY, etc.) never
 * leak into validation and cause spurious failures.
 */
function buildMinimalValidEnv(): Record<string, string> {
  return {
    NODE_ENV: 'development',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    DATABASE_URL: 'postgresql://user:pass@localhost:5433/db',
    AUTH_SECRET: 'a'.repeat(32),
    NEXTAUTH_SECRET: 'b'.repeat(32),
    NEXTAUTH_URL: 'http://localhost:3000',
  };
}

beforeEach(() => {
  // Replace with a clean object so NO host env vars leak through
  process.env = { ...buildMinimalValidEnv() };
});

afterAll(() => {
  process.env = originalEnv;
});

// ---------------------------------------------------------------------------
// getRequiredEnv
// ---------------------------------------------------------------------------
describe('getRequiredEnv', () => {
  it('returns the value when the environment variable is present', () => {
    process.env.MY_REQUIRED_VAR = 'hello';
    expect(getRequiredEnv('MY_REQUIRED_VAR')).toBe('hello');
  });

  it('throws when the environment variable is missing', () => {
    delete process.env.MY_REQUIRED_VAR;
    expect(() => getRequiredEnv('MY_REQUIRED_VAR')).toThrow(
      'Missing required environment variable: MY_REQUIRED_VAR'
    );
  });

  it('includes custom description in the thrown error message', () => {
    delete process.env.MY_REQUIRED_VAR;
    expect(() => getRequiredEnv('MY_REQUIRED_VAR', 'Important key')).toThrow(
      'Missing required environment variable: MY_REQUIRED_VAR - Important key'
    );
  });

  it('throws when the variable is set to an empty string', () => {
    process.env.EMPTY_VAR = '';
    expect(() => getRequiredEnv('EMPTY_VAR')).toThrow(
      'Missing required environment variable: EMPTY_VAR'
    );
  });
});

// ---------------------------------------------------------------------------
// getOptionalEnv
// ---------------------------------------------------------------------------
describe('getOptionalEnv', () => {
  it('returns the value when the environment variable is present', () => {
    process.env.OPT_VAR = 'present';
    expect(getOptionalEnv('OPT_VAR')).toBe('present');
  });

  it('returns the default value when the variable is missing', () => {
    delete process.env.OPT_VAR;
    expect(getOptionalEnv('OPT_VAR', 'fallback')).toBe('fallback');
  });

  it('returns undefined when the variable is missing and no default is provided', () => {
    delete process.env.OPT_VAR;
    expect(getOptionalEnv('OPT_VAR')).toBeUndefined();
  });

  it('returns the default when the variable is an empty string', () => {
    // Empty string is falsy, so the implementation falls through to defaultValue
    process.env.OPT_VAR = '';
    expect(getOptionalEnv('OPT_VAR', 'fallback')).toBe('fallback');
  });
});

// ---------------------------------------------------------------------------
// validateAIConfiguration
// ---------------------------------------------------------------------------
describe('validateAIConfiguration', () => {
  it('detects OpenAI when a valid key is present', () => {
    process.env.OPENAI_API_KEY = 'sk-abc123';
    delete process.env.ANTHROPIC_API_KEY;

    const result = validateAIConfiguration();
    expect(result.hasOpenAI).toBe(true);
    expect(result.hasAnthropic).toBe(false);
    expect(result.hasAnyAI).toBe(true);
  });

  it('detects Anthropic when a valid key is present', () => {
    delete process.env.OPENAI_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'sk-ant-xyz789';

    const result = validateAIConfiguration();
    expect(result.hasOpenAI).toBe(false);
    expect(result.hasAnthropic).toBe(true);
    expect(result.hasAnyAI).toBe(true);
  });

  it('detects both providers when both keys are present', () => {
    process.env.OPENAI_API_KEY = 'sk-abc123';
    process.env.ANTHROPIC_API_KEY = 'sk-ant-xyz789';

    const result = validateAIConfiguration();
    expect(result.hasOpenAI).toBe(true);
    expect(result.hasAnthropic).toBe(true);
    expect(result.hasAnyAI).toBe(true);
  });

  it('returns all false when no AI keys are present', () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    const result = validateAIConfiguration();
    expect(result.hasOpenAI).toBe(false);
    expect(result.hasAnthropic).toBe(false);
    expect(result.hasAnyAI).toBe(false);
  });

  it('rejects OpenAI key with wrong prefix', () => {
    process.env.OPENAI_API_KEY = 'not-valid-key';
    const result = validateAIConfiguration();
    expect(result.hasOpenAI).toBe(false);
  });

  it('rejects Anthropic key with wrong prefix', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-wrong-prefix';
    const result = validateAIConfiguration();
    expect(result.hasAnthropic).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateOAuthConfiguration
// ---------------------------------------------------------------------------
describe('validateOAuthConfiguration', () => {
  it('detects Google OAuth when both ID and secret are present', () => {
    process.env.GOOGLE_CLIENT_ID = 'goog-id';
    process.env.GOOGLE_CLIENT_SECRET = 'goog-secret';
    delete process.env.GITHUB_CLIENT_ID;
    delete process.env.GITHUB_CLIENT_SECRET;

    const result = validateOAuthConfiguration();
    expect(result.google).toBe(true);
    expect(result.github).toBe(false);
    expect(result.hasAnyOAuth).toBe(true);
  });

  it('detects GitHub OAuth when both ID and secret are present', () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    process.env.GITHUB_CLIENT_ID = 'gh-id';
    process.env.GITHUB_CLIENT_SECRET = 'gh-secret';

    const result = validateOAuthConfiguration();
    expect(result.google).toBe(false);
    expect(result.github).toBe(true);
    expect(result.hasAnyOAuth).toBe(true);
  });

  it('detects both providers when fully configured', () => {
    process.env.GOOGLE_CLIENT_ID = 'goog-id';
    process.env.GOOGLE_CLIENT_SECRET = 'goog-secret';
    process.env.GITHUB_CLIENT_ID = 'gh-id';
    process.env.GITHUB_CLIENT_SECRET = 'gh-secret';

    const result = validateOAuthConfiguration();
    expect(result.google).toBe(true);
    expect(result.github).toBe(true);
    expect(result.hasAnyOAuth).toBe(true);
  });

  it('returns all false when no OAuth is configured', () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GITHUB_CLIENT_ID;
    delete process.env.GITHUB_CLIENT_SECRET;

    const result = validateOAuthConfiguration();
    expect(result.google).toBe(false);
    expect(result.github).toBe(false);
    expect(result.hasAnyOAuth).toBe(false);
  });

  it('returns false for Google when only the ID is set (partial)', () => {
    process.env.GOOGLE_CLIENT_ID = 'goog-id';
    delete process.env.GOOGLE_CLIENT_SECRET;

    const result = validateOAuthConfiguration();
    expect(result.google).toBe(false);
  });

  it('returns false for GitHub when only the secret is set (partial)', () => {
    delete process.env.GITHUB_CLIENT_ID;
    process.env.GITHUB_CLIENT_SECRET = 'gh-secret';

    const result = validateOAuthConfiguration();
    expect(result.github).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateEnvironmentVariables - development mode
// ---------------------------------------------------------------------------
describe('validateEnvironmentVariables (development)', () => {
  it('passes with a minimal valid configuration', () => {
    const result = validateEnvironmentVariables(false);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns summary fields for a valid config', () => {
    const result = validateEnvironmentVariables(false);
    expect(result.summary.environment).toBe('Configured');
    expect(result.summary.database).toBe('Configured');
    expect(result.summary.auth).toBe('Configured');
  });

  it('reports error when NODE_ENV is missing', () => {
    delete process.env.NODE_ENV;
    const result = validateEnvironmentVariables(false);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('NODE_ENV'))).toBe(true);
  });

  it('reports error when DATABASE_URL is missing', () => {
    delete process.env.DATABASE_URL;
    const result = validateEnvironmentVariables(false);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('DATABASE_URL'))).toBe(true);
  });

  it('reports error when NEXT_PUBLIC_APP_URL is missing', () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    const result = validateEnvironmentVariables(false);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('NEXT_PUBLIC_APP_URL'))).toBe(true);
  });

  it('validates NODE_ENV format - rejects invalid values', () => {
    process.env.NODE_ENV = 'invalid';
    const result = validateEnvironmentVariables(false);
    expect(result.isValid).toBe(false);
    expect(
      result.errors.some((e) =>
        e.includes('NODE_ENV must be one of: development, staging, production')
      )
    ).toBe(true);
  });

  it('validates DATABASE_URL format - must start with "postgres"', () => {
    process.env.DATABASE_URL = 'mysql://bad';
    const result = validateEnvironmentVariables(false);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('DATABASE_URL must be a valid PostgreSQL'))).toBe(
      true
    );
  });

  it('validates NEXT_PUBLIC_APP_URL format - must start with http', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'ftp://invalid';
    const result = validateEnvironmentVariables(false);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('NEXT_PUBLIC_APP_URL must be a valid URL'))).toBe(
      true
    );
  });

  it('validates AUTH_SECRET minimum length', () => {
    process.env.AUTH_SECRET = 'short';
    const result = validateEnvironmentVariables(false);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('AUTH_SECRET must be at least 32'))).toBe(true);
  });

  it('validates NEXTAUTH_SECRET minimum length', () => {
    process.env.NEXTAUTH_SECRET = 'short';
    const result = validateEnvironmentVariables(false);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('NEXTAUTH_SECRET must be at least 32'))).toBe(true);
  });

  it('validates OPENAI_API_KEY format when present', () => {
    process.env.OPENAI_API_KEY = 'bad-key';
    const result = validateEnvironmentVariables(false);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('OPENAI_API_KEY must start with sk-'))).toBe(true);
  });

  it('validates ANTHROPIC_API_KEY format when present', () => {
    process.env.ANTHROPIC_API_KEY = 'bad-key';
    const result = validateEnvironmentVariables(false);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.includes('ANTHROPIC_API_KEY must start with sk-ant-'))).toBe(
      true
    );
  });

  it('accepts valid OPENAI_API_KEY', () => {
    process.env.OPENAI_API_KEY = 'sk-valid-key-123';
    const result = validateEnvironmentVariables(false);
    expect(result.errors.some((e) => e.includes('OPENAI_API_KEY'))).toBe(false);
  });

  // OAuth pairing validation
  it('errors when GOOGLE_CLIENT_ID is set but GOOGLE_CLIENT_SECRET is missing', () => {
    process.env.GOOGLE_CLIENT_ID = 'goog-id';
    delete process.env.GOOGLE_CLIENT_SECRET;

    const result = validateEnvironmentVariables(false);
    expect(result.isValid).toBe(false);
    expect(
      result.errors.some((e) =>
        e.includes('GOOGLE_CLIENT_SECRET is required when GOOGLE_CLIENT_ID is set')
      )
    ).toBe(true);
  });

  it('errors when GOOGLE_CLIENT_SECRET is set but GOOGLE_CLIENT_ID is missing', () => {
    delete process.env.GOOGLE_CLIENT_ID;
    process.env.GOOGLE_CLIENT_SECRET = 'goog-secret';

    const result = validateEnvironmentVariables(false);
    expect(result.isValid).toBe(false);
    expect(
      result.errors.some((e) =>
        e.includes('GOOGLE_CLIENT_ID is required when GOOGLE_CLIENT_SECRET is set')
      )
    ).toBe(true);
  });

  it('errors when GITHUB_CLIENT_ID is set but GITHUB_CLIENT_SECRET is missing', () => {
    process.env.GITHUB_CLIENT_ID = 'gh-id';
    delete process.env.GITHUB_CLIENT_SECRET;

    const result = validateEnvironmentVariables(false);
    expect(result.isValid).toBe(false);
    expect(
      result.errors.some((e) =>
        e.includes('GITHUB_CLIENT_SECRET is required when GITHUB_CLIENT_ID is set')
      )
    ).toBe(true);
  });

  it('passes when both OAuth ID and secret are provided', () => {
    process.env.GOOGLE_CLIENT_ID = 'goog-id';
    process.env.GOOGLE_CLIENT_SECRET = 'goog-secret';

    const result = validateEnvironmentVariables(false);
    expect(result.errors.some((e) => e.includes('GOOGLE_'))).toBe(false);
  });

  // Cloudinary all-or-none validation
  it('errors when only some Cloudinary variables are set', () => {
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'my-cloud';
    process.env.CLOUDINARY_API_KEY = 'key123';
    delete process.env.CLOUDINARY_API_SECRET;

    const result = validateEnvironmentVariables(false);
    expect(result.isValid).toBe(false);
    expect(
      result.errors.some((e) => e.includes('Cloudinary configuration incomplete'))
    ).toBe(true);
  });

  it('passes when all three Cloudinary variables are set', () => {
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'my-cloud';
    process.env.CLOUDINARY_API_KEY = 'key123';
    process.env.CLOUDINARY_API_SECRET = 'secret456';

    const result = validateEnvironmentVariables(false);
    expect(result.errors.some((e) => e.includes('Cloudinary'))).toBe(false);
    expect(result.summary.media).toBe('Configured');
  });

  it('passes when no Cloudinary variables are set', () => {
    delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;

    const result = validateEnvironmentVariables(false);
    expect(result.errors.some((e) => e.includes('Cloudinary'))).toBe(false);
  });

  // Stripe pairing validation
  it('errors when STRIPE_SECRET_KEY is set without publishable key (non-placeholder)', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_live_real_key';
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    const result = validateEnvironmentVariables(false);
    expect(result.isValid).toBe(false);
    expect(
      result.errors.some((e) =>
        e.includes(
          'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required when STRIPE_SECRET_KEY is set'
        )
      )
    ).toBe(true);
  });

  it('errors when NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set without secret key (non-placeholder)', () => {
    delete process.env.STRIPE_SECRET_KEY;
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_live_real_key';

    const result = validateEnvironmentVariables(false);
    expect(result.isValid).toBe(false);
    expect(
      result.errors.some((e) =>
        e.includes(
          'STRIPE_SECRET_KEY is required when NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set'
        )
      )
    ).toBe(true);
  });

  it('skips Stripe pairing error when secret is a placeholder value', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_your_stripe_secret_key_here';
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

    const result = validateEnvironmentVariables(false);
    expect(
      result.errors.some((e) =>
        e.includes(
          'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required when STRIPE_SECRET_KEY is set'
        )
      )
    ).toBe(false);
  });

  it('skips Stripe pairing error when publishable key is a placeholder value', () => {
    delete process.env.STRIPE_SECRET_KEY;
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY =
      'pk_test_your_stripe_publishable_key_here';

    const result = validateEnvironmentVariables(false);
    expect(
      result.errors.some((e) =>
        e.includes(
          'STRIPE_SECRET_KEY is required when NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set'
        )
      )
    ).toBe(false);
  });

  it('passes when both Stripe keys are set', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_live_real_key';
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_live_real_key';

    const result = validateEnvironmentVariables(false);
    expect(
      result.errors.some((e) => e.includes('Stripe') || e.includes('STRIPE'))
    ).toBe(false);
  });

  // Development-specific warnings
  it('warns about cloud database usage in development', () => {
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URL = 'postgresql://user:pass@db.railway.app:5432/db';

    const result = validateEnvironmentVariables(false);
    expect(
      result.warnings.some((w) =>
        w.includes('production/cloud database in development')
      )
    ).toBe(true);
  });

  it('warns about neon database in development', () => {
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URL =
      'postgresql://user:pass@ep-cool-name.neon.tech:5432/db';

    const result = validateEnvironmentVariables(false);
    expect(
      result.warnings.some((w) =>
        w.includes('production/cloud database in development')
      )
    ).toBe(true);
  });

  it('does not warn about localhost database in development', () => {
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5433/db';

    const result = validateEnvironmentVariables(false);
    expect(
      result.warnings.some((w) =>
        w.includes('production/cloud database in development')
      )
    ).toBe(false);
  });

  // Summary tracking: AI
  it('marks AI as configured when OPENAI_API_KEY is valid', () => {
    process.env.OPENAI_API_KEY = 'sk-valid-key';
    const result = validateEnvironmentVariables(false);
    expect(result.summary.ai).toBe('Configured');
  });

  it('marks AI as not configured when no AI keys are present', () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    const result = validateEnvironmentVariables(false);
    expect(result.summary.ai).toBe('Not configured');
  });

  // Summary tracking: caching with DISABLE_REDIS
  it('marks caching as configured when DISABLE_REDIS is true', () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    process.env.DISABLE_REDIS = 'true';
    const result = validateEnvironmentVariables(false);
    expect(result.summary.caching).toBe('Configured');
  });

  // Summary tracking: monitoring in development is always configured
  it('marks monitoring as configured in development even without SENTRY_DSN', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.SENTRY_DSN;
    const result = validateEnvironmentVariables(false);
    expect(result.summary.monitoring).toBe('Configured');
  });

  // Placeholder values bypass format validation
  it('skips format validation for placeholder values', () => {
    process.env.OPENAI_API_KEY = 'your_openai_api_key_here';
    const result = validateEnvironmentVariables(false);
    // Should NOT error because placeholder detection skips the validator
    expect(
      result.errors.some((e) => e.includes('OPENAI_API_KEY must start with sk-'))
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateEnvironmentVariables - production mode
// ---------------------------------------------------------------------------
describe('validateEnvironmentVariables (production)', () => {
  beforeEach(() => {
    // Build a clean production env -- no spreading of originalEnv
    process.env = {
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_URL: 'https://taxomind.com',
      DATABASE_URL: 'postgresql://user:pass@db.railway.app:5432/db',
      AUTH_SECRET: 'a'.repeat(32),
      NEXTAUTH_SECRET: 'b'.repeat(32),
      NEXTAUTH_URL: 'https://taxomind.com',
      UPSTASH_REDIS_REST_URL: 'https://redis.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'token123',
      STRICT_ENV_MODE: 'true',
    };
  });

  it('passes with a fully configured production environment', () => {
    const result = validateEnvironmentVariables(false);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('errors when NEXT_PUBLIC_APP_URL contains localhost', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    const result = validateEnvironmentVariables(false);
    expect(result.isValid).toBe(false);
    expect(
      result.errors.some((e) =>
        e.includes('NEXT_PUBLIC_APP_URL contains localhost')
      )
    ).toBe(true);
  });

  it('errors when NEXTAUTH_URL contains 127.0.0.1', () => {
    process.env.NEXTAUTH_URL = 'http://127.0.0.1:3000';
    const result = validateEnvironmentVariables(false);
    expect(result.isValid).toBe(false);
    expect(
      result.errors.some((e) =>
        e.includes('NEXTAUTH_URL contains localhost/127.0.0.1')
      )
    ).toBe(true);
  });

  it('errors when DATABASE_URL contains localhost in production', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5433/db';
    const result = validateEnvironmentVariables(false);
    expect(result.isValid).toBe(false);
    expect(
      result.errors.some((e) => e.includes('DATABASE_URL contains localhost'))
    ).toBe(true);
  });

  it('warns when using Stripe test keys in production', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_abc123';
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_abc123';

    const result = validateEnvironmentVariables(false);
    expect(
      result.warnings.some((w) =>
        w.includes('Using Stripe test keys in production')
      )
    ).toBe(true);
  });

  it('warns about missing Redis caching in production', () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.DISABLE_REDIS;

    const result = validateEnvironmentVariables(false);
    expect(
      result.warnings.some((w) =>
        w.includes('Redis caching not configured for production')
      )
    ).toBe(true);
  });

  it('does not warn about Redis when DISABLE_REDIS is true', () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    process.env.DISABLE_REDIS = 'true';

    const result = validateEnvironmentVariables(false);
    expect(
      result.warnings.some((w) =>
        w.includes('Redis caching not configured for production')
      )
    ).toBe(false);
  });

  it('warns about missing Sentry in production', () => {
    delete process.env.SENTRY_DSN;

    const result = validateEnvironmentVariables(false);
    expect(
      result.warnings.some((w) =>
        w.includes('Error monitoring (Sentry) not configured for production')
      )
    ).toBe(true);
  });

  it('requires UPSTASH_REDIS_REST_URL in production (production flag)', () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    const result = validateEnvironmentVariables(false);
    expect(result.errors.some((e) => e.includes('UPSTASH_REDIS_REST_URL'))).toBe(
      true
    );
  });

  it('requires UPSTASH_REDIS_REST_TOKEN in production (production flag)', () => {
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const result = validateEnvironmentVariables(false);
    expect(result.errors.some((e) => e.includes('UPSTASH_REDIS_REST_TOKEN'))).toBe(
      true
    );
  });

  it('requires STRICT_ENV_MODE in production', () => {
    delete process.env.STRICT_ENV_MODE;
    const result = validateEnvironmentVariables(false);
    expect(result.errors.some((e) => e.includes('STRICT_ENV_MODE'))).toBe(true);
  });

  it('validates UPSTASH_REDIS_REST_URL format - must start with https://', () => {
    process.env.UPSTASH_REDIS_REST_URL = 'http://redis.upstash.io';
    const result = validateEnvironmentVariables(false);
    expect(result.isValid).toBe(false);
    expect(
      result.errors.some((e) =>
        e.includes('UPSTASH_REDIS_REST_URL must be a valid HTTPS URL')
      )
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateEnvironmentVariables - staging mode
// ---------------------------------------------------------------------------
describe('validateEnvironmentVariables (staging)', () => {
  beforeEach(() => {
    // Build a clean staging env
    process.env = {
      NODE_ENV: 'staging',
      NEXT_PUBLIC_APP_URL: 'https://staging.taxomind.com',
      DATABASE_URL:
        'postgresql://user:pass@staging-db.railway.app:5432/db',
      AUTH_SECRET: 'a'.repeat(32),
      NEXTAUTH_SECRET: 'b'.repeat(32),
      NEXTAUTH_URL: 'https://staging.taxomind.com',
      UPSTASH_REDIS_REST_URL: 'https://redis.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'token123',
      STRICT_ENV_MODE: 'true',
    };
  });

  it('requires staging-flagged variables', () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    const result = validateEnvironmentVariables(false);
    expect(result.errors.some((e) => e.includes('UPSTASH_REDIS_REST_URL'))).toBe(
      true
    );
  });

  it('applies production-like localhost check in staging', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    const result = validateEnvironmentVariables(false);
    expect(
      result.errors.some((e) =>
        e.includes('NEXT_PUBLIC_APP_URL contains localhost')
      )
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// throwOnError parameter
// ---------------------------------------------------------------------------
describe('throwOnError parameter', () => {
  it('throws an Error when throwOnError is true and validation fails', () => {
    delete process.env.DATABASE_URL;
    expect(() => validateEnvironmentVariables(true)).toThrow(
      'Environment validation failed'
    );
  });

  it('throws by default (throwOnError defaults to true)', () => {
    delete process.env.DATABASE_URL;
    expect(() => validateEnvironmentVariables()).toThrow(
      'Environment validation failed'
    );
  });

  it('returns the result without throwing when throwOnError is false', () => {
    delete process.env.DATABASE_URL;
    const result = validateEnvironmentVariables(false);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('includes all error messages in the thrown error', () => {
    delete process.env.DATABASE_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;

    try {
      validateEnvironmentVariables(true);
      // Should never reach here
      expect(true).toBe(false);
    } catch (err) {
      const error = err as Error;
      expect(error.message).toContain('DATABASE_URL');
      expect(error.message).toContain('NEXT_PUBLIC_APP_URL');
    }
  });

  it('does not throw when validation passes even with throwOnError true', () => {
    // Clean env from beforeEach satisfies all required dev vars
    expect(() => validateEnvironmentVariables(true)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// validateRequiredEnvVars
// ---------------------------------------------------------------------------
describe('validateRequiredEnvVars', () => {
  it('passes when all specified variables are present', () => {
    process.env.VAR_A = 'a';
    process.env.VAR_B = 'b';
    expect(() => validateRequiredEnvVars(['VAR_A', 'VAR_B'])).not.toThrow();
  });

  it('throws when some variables are missing', () => {
    process.env.VAR_A = 'a';
    delete process.env.VAR_B;
    delete process.env.VAR_C;

    expect(() =>
      validateRequiredEnvVars(['VAR_A', 'VAR_B', 'VAR_C'])
    ).toThrow('Missing required environment variables: VAR_B, VAR_C');
  });

  it('throws when all specified variables are missing', () => {
    delete process.env.VAR_X;
    delete process.env.VAR_Y;

    expect(() => validateRequiredEnvVars(['VAR_X', 'VAR_Y'])).toThrow(
      'Missing required environment variables: VAR_X, VAR_Y'
    );
  });

  it('passes with an empty array (no requirements)', () => {
    expect(() => validateRequiredEnvVars([])).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// validateCoreEnvVars
// ---------------------------------------------------------------------------
describe('validateCoreEnvVars', () => {
  it('passes when DATABASE_URL and NEXTAUTH_SECRET are set', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5433/db';
    process.env.NEXTAUTH_SECRET = 'b'.repeat(32);

    expect(() => validateCoreEnvVars()).not.toThrow();
  });

  it('throws when DATABASE_URL is missing', () => {
    delete process.env.DATABASE_URL;
    process.env.NEXTAUTH_SECRET = 'b'.repeat(32);

    expect(() => validateCoreEnvVars()).toThrow('DATABASE_URL');
  });

  it('throws when NEXTAUTH_SECRET is missing', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5433/db';
    delete process.env.NEXTAUTH_SECRET;

    expect(() => validateCoreEnvVars()).toThrow('NEXTAUTH_SECRET');
  });

  it('throws when both are missing', () => {
    delete process.env.DATABASE_URL;
    delete process.env.NEXTAUTH_SECRET;

    expect(() => validateCoreEnvVars()).toThrow(
      'Missing required environment variables'
    );
  });
});

// ---------------------------------------------------------------------------
// validateEnvVar (legacy wrapper)
// ---------------------------------------------------------------------------
describe('validateEnvVar', () => {
  it('returns the value for a required variable that exists', () => {
    process.env.LEGACY_VAR = 'legacy_value';
    expect(validateEnvVar('LEGACY_VAR', true)).toBe('legacy_value');
  });

  it('throws for a required variable that is missing', () => {
    delete process.env.LEGACY_VAR;
    expect(() => validateEnvVar('LEGACY_VAR', true)).toThrow(
      'Missing required environment variable: LEGACY_VAR'
    );
  });

  it('returns undefined for an optional variable that is missing', () => {
    delete process.env.LEGACY_VAR;
    expect(validateEnvVar('LEGACY_VAR', false)).toBeUndefined();
  });

  it('returns the value for an optional variable that exists', () => {
    process.env.LEGACY_VAR = 'exists';
    expect(validateEnvVar('LEGACY_VAR', false)).toBe('exists');
  });

  it('defaults to required=true', () => {
    delete process.env.LEGACY_VAR;
    expect(() => validateEnvVar('LEGACY_VAR')).toThrow(
      'Missing required environment variable: LEGACY_VAR'
    );
  });
});

// ---------------------------------------------------------------------------
// ENV_VARS constant
// ---------------------------------------------------------------------------
describe('ENV_VARS', () => {
  it('contains correct legacy name mappings', () => {
    expect(ENV_VARS.DATABASE_URL).toBe('DATABASE_URL');
    expect(ENV_VARS.NEXTAUTH_SECRET).toBe('NEXTAUTH_SECRET');
    expect(ENV_VARS.NEXTAUTH_URL).toBe('NEXTAUTH_URL');
    expect(ENV_VARS.AUTH_SECRET).toBe('AUTH_SECRET');
    expect(ENV_VARS.ANTHROPIC_API_KEY).toBe('ANTHROPIC_API_KEY');
    expect(ENV_VARS.OPENAI_API_KEY).toBe('OPENAI_API_KEY');
    expect(ENV_VARS.STRIPE_API_KEY).toBe('STRIPE_SECRET_KEY');
    expect(ENV_VARS.CLOUDINARY_CLOUD_NAME).toBe(
      'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME'
    );
    expect(ENV_VARS.REDIS_URL).toBe('UPSTASH_REDIS_REST_URL');
  });
});

// ---------------------------------------------------------------------------
// validateRuntimeEnvironment
// ---------------------------------------------------------------------------
describe('validateRuntimeEnvironment', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest
      .spyOn(console, 'log')
      .mockImplementation(() => {});
    consoleWarnSpy = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    processExitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation(
        (() => {}) as unknown as (code?: number) => never
      );
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('logs success and does not exit when validation passes', () => {
    validateRuntimeEnvironment();

    expect(processExitSpy).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Environment validation passed')
    );
  });

  it('logs errors and calls process.exit(1) when validation fails', () => {
    delete process.env.DATABASE_URL;

    validateRuntimeEnvironment();

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('logs the environment summary in uppercase', () => {
    // The source code logs: result.summary.environment.toUpperCase()
    // When NODE_ENV is valid (e.g. "development"), summary.environment = "Configured"
    // So the log will contain "CONFIGURED", not "DEVELOPMENT"
    process.env.NODE_ENV = 'development';
    validateRuntimeEnvironment();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('CONFIGURED')
    );
  });

  it('logs service configuration summary', () => {
    validateRuntimeEnvironment();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Service Configuration')
    );
  });

  it('logs warnings when present', () => {
    // Remove optional vars to generate warnings, but keep required ones
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    validateRuntimeEnvironment();

    // Warnings are logged via console.warn
    expect(consoleWarnSpy).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Edge cases: SENTRY_DSN validation
// ---------------------------------------------------------------------------
describe('SENTRY_DSN format validation', () => {
  it('accepts a valid Sentry DSN with sentry.io', () => {
    process.env.SENTRY_DSN =
      'https://abc123@o123.ingest.sentry.io/456';
    const result = validateEnvironmentVariables(false);
    expect(result.errors.some((e) => e.includes('SENTRY_DSN'))).toBe(false);
  });

  it('rejects an invalid Sentry DSN that is not a placeholder', () => {
    // Use a domain that does NOT match any placeholder pattern
    // (placeholder patterns include: your_, _here, localhost, example.com, etc.)
    // A non-placeholder, non-sentry domain will trigger the validator
    process.env.SENTRY_DSN = 'https://invalid-dsn.notarealdomain.io/123';
    const result = validateEnvironmentVariables(false);
    expect(result.isValid).toBe(false);
    expect(
      result.errors.some((e) =>
        e.includes('SENTRY_DSN must be a valid Sentry DSN URL')
      )
    ).toBe(true);
  });

  it('skips validation when SENTRY_DSN is a placeholder value', () => {
    // example.com is in the placeholder patterns list, so validation is skipped
    process.env.SENTRY_DSN = 'https://invalid-dsn.example.com';
    const result = validateEnvironmentVariables(false);
    expect(
      result.errors.some((e) => e.includes('SENTRY_DSN'))
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Edge cases: RESEND_API_KEY validation
// ---------------------------------------------------------------------------
describe('RESEND_API_KEY format validation', () => {
  it('accepts a valid Resend API key starting with re_', () => {
    process.env.RESEND_API_KEY = 're_abc123';
    const result = validateEnvironmentVariables(false);
    expect(result.errors.some((e) => e.includes('RESEND_API_KEY'))).toBe(
      false
    );
  });

  it('rejects an invalid Resend API key', () => {
    process.env.RESEND_API_KEY = 'invalid-key';
    const result = validateEnvironmentVariables(false);
    expect(result.isValid).toBe(false);
    expect(
      result.errors.some((e) =>
        e.includes('RESEND_API_KEY must start with re_')
      )
    ).toBe(true);
  });

  it('accepts placeholder value for Resend API key', () => {
    process.env.RESEND_API_KEY = 'your_resend_api_key';
    const result = validateEnvironmentVariables(false);
    // The validator itself accepts values containing 'your_resend_api_key'
    // AND isPlaceholderValue returns true for 'your_' prefix -- either way no error
    expect(result.errors.some((e) => e.includes('RESEND_API_KEY'))).toBe(
      false
    );
  });
});

// ---------------------------------------------------------------------------
// Edge cases: STRICT_ENV_MODE validation
// ---------------------------------------------------------------------------
describe('STRICT_ENV_MODE validation', () => {
  it('errors when STRICT_ENV_MODE is not "true" in production', () => {
    process.env = {
      NODE_ENV: 'production',
      NEXT_PUBLIC_APP_URL: 'https://taxomind.com',
      DATABASE_URL: 'postgresql://user:pass@db.railway.app:5432/db',
      AUTH_SECRET: 'a'.repeat(32),
      NEXTAUTH_SECRET: 'b'.repeat(32),
      NEXTAUTH_URL: 'https://taxomind.com',
      UPSTASH_REDIS_REST_URL: 'https://redis.upstash.io',
      UPSTASH_REDIS_REST_TOKEN: 'token123',
      STRICT_ENV_MODE: 'false',
    };

    const result = validateEnvironmentVariables(false);
    expect(result.isValid).toBe(false);
    expect(
      result.errors.some((e) =>
        e.includes('STRICT_ENV_MODE must be set to "true"')
      )
    ).toBe(true);
  });
});
