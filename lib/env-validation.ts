/**
 * Comprehensive Environment Variables Validation System
 * Enforces required variables in production and provides detailed error messages
 */

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    environment: string;
    database: string;
    auth: string;
    ai: string;
    media: string;
    caching: string;
    monitoring: string;
  };
}

interface EnvConfig {
  name: string;
  required: boolean;
  production?: boolean; // Only required in production
  staging?: boolean;    // Only required in staging
  description: string;
  validator?: (value: string) => boolean;
  errorMessage?: string;
}

// Environment variable configurations
const ENV_CONFIGS: EnvConfig[] = [
  // Core Application
  {
    name: 'NODE_ENV',
    required: true,
    description: 'Application environment (development, staging, production)',
    validator: (value) => ['development', 'staging', 'production'].includes(value),
    errorMessage: 'NODE_ENV must be one of: development, staging, production'
  },
  {
    name: 'NEXT_PUBLIC_APP_URL',
    required: true,
    description: 'Public URL of the application',
    validator: (value) => value.startsWith('http'),
    errorMessage: 'NEXT_PUBLIC_APP_URL must be a valid URL starting with http/https'
  },

  // Database
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL database connection URL',
    validator: (value) => value.startsWith('postgres'),
    errorMessage: 'DATABASE_URL must be a valid PostgreSQL connection string'
  },

  // Authentication (NextAuth.js)
  {
    name: 'AUTH_SECRET',
    required: true,
    production: true,
    description: 'Secret key for NextAuth.js JWT signing and encryption',
    validator: (value) => value.length >= 32,
    errorMessage: 'AUTH_SECRET must be at least 32 characters long'
  },
  {
    name: 'NEXTAUTH_SECRET',
    required: true,
    production: true,
    description: 'Legacy NextAuth.js secret (fallback for AUTH_SECRET)',
    validator: (value) => value.length >= 32,
    errorMessage: 'NEXTAUTH_SECRET must be at least 32 characters long'
  },
  {
    name: 'NEXTAUTH_URL',
    required: true,
    production: true,
    description: 'Canonical URL of your site for NextAuth.js',
    validator: (value) => value.startsWith('http'),
    errorMessage: 'NEXTAUTH_URL must be a valid URL starting with http/https'
  },

  // OAuth Providers (optional but validated if present)
  {
    name: 'GOOGLE_CLIENT_ID',
    required: false,
    description: 'Google OAuth 2.0 Client ID for authentication',
  },
  {
    name: 'GOOGLE_CLIENT_SECRET',
    required: false,
    description: 'Google OAuth 2.0 Client Secret for authentication',
  },
  {
    name: 'GITHUB_CLIENT_ID',
    required: false,
    description: 'GitHub OAuth App Client ID for authentication',
  },
  {
    name: 'GITHUB_CLIENT_SECRET',
    required: false,
    description: 'GitHub OAuth App Client Secret for authentication',
  },

  // AI Services
  {
    name: 'OPENAI_API_KEY',
    required: false,
    description: 'OpenAI API key for GPT models and AI features',
    validator: (value) => value.startsWith('sk-'),
    errorMessage: 'OPENAI_API_KEY must start with sk-'
  },
  {
    name: 'ANTHROPIC_API_KEY',
    required: false,
    description: 'Anthropic API key for Claude AI models',
    validator: (value) => value.startsWith('sk-ant-'),
    errorMessage: 'ANTHROPIC_API_KEY must start with sk-ant-'
  },

  // Media Storage (Cloudinary)
  {
    name: 'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
    required: false,
    description: 'Cloudinary cloud name for media uploads',
  },
  {
    name: 'CLOUDINARY_API_KEY',
    required: false,
    description: 'Cloudinary API key for server-side operations',
  },
  {
    name: 'CLOUDINARY_API_SECRET',
    required: false,
    description: 'Cloudinary API secret for server-side operations',
  },

  // Caching and Performance (Redis/Upstash)
  {
    name: 'UPSTASH_REDIS_REST_URL',
    required: false,
    production: true,
    staging: true,
    description: 'Upstash Redis REST URL for caching and rate limiting',
    validator: (value) => value.startsWith('https://'),
    errorMessage: 'UPSTASH_REDIS_REST_URL must be a valid HTTPS URL'
  },
  {
    name: 'UPSTASH_REDIS_REST_TOKEN',
    required: false,
    production: true,
    staging: true,
    description: 'Upstash Redis REST API token',
  },

  // Email (optional)
  {
    name: 'RESEND_API_KEY',
    required: false,
    description: 'Resend API key for transactional emails',
    validator: (value) => value.startsWith('re_') || value.includes('your_resend_api_key'),
    errorMessage: 'RESEND_API_KEY must start with re_'
  },

  // Payment Processing (optional)
  {
    name: 'STRIPE_SECRET_KEY',
    required: false,
    description: 'Stripe secret key for payment processing',
    validator: (value) => value.startsWith('sk_'),
    errorMessage: 'STRIPE_SECRET_KEY must start with sk_'
  },
  {
    name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    required: false,
    description: 'Stripe publishable key for client-side operations',
    validator: (value) => value.startsWith('pk_'),
    errorMessage: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with pk_'
  },

  // Monitoring and Observability
  {
    name: 'SENTRY_DSN',
    required: false,
    description: 'Sentry DSN for error tracking and performance monitoring',
    validator: (value) => value.includes('@sentry.io') || value.includes('ingest.sentry.io'),
    errorMessage: 'SENTRY_DSN must be a valid Sentry DSN URL'
  },
  {
    name: 'NEXT_PUBLIC_SENTRY_DSN',
    required: false,
    description: 'Public Sentry DSN for client-side error tracking',
  },

  // News APIs (optional)
  {
    name: 'NEWS_API_KEY',
    required: false,
    description: 'NewsAPI.org API key for fetching news articles',
  },
  {
    name: 'BING_API_KEY',
    required: false,
    description: 'Microsoft Bing News Search API key',
  },

  // Enterprise Features
  {
    name: 'STRICT_ENV_MODE',
    required: false,
    production: true,
    staging: true,
    description: 'Enable strict environment mode for production safety',
    validator: (value) => value === 'true',
    errorMessage: 'STRICT_ENV_MODE must be set to "true" in production/staging'
  },
];

/**
 * Check if a value is a placeholder from .env.example
 */
function isPlaceholderValue(value: string, varName: string): boolean {
  const placeholderPatterns = [
    'your_',
    '_here',
    'your-',
    'localhost',
    'example.com',
    'test_your_',
    'sk_test_your_',
    'pk_test_your_',
  ];
  
  return placeholderPatterns.some(pattern => value.includes(pattern));
}

/**
 * Validate environment variables based on current environment
 */
export function validateEnvironmentVariables(throwOnError: boolean = true): ValidationResult {
  const environment = process.env.NODE_ENV || 'development';
  const isProduction = environment === 'production';
  const isStaging = environment === 'staging';
  const isProductionLike = isProduction || isStaging;

  const errors: string[] = [];
  const warnings: string[] = [];

  // Track configured services
  let hasDatabase = false;
  let hasAuth = false;
  let hasAI = false;
  let hasMedia = false;
  let hasCaching = false;
  let hasMonitoring = false;

  // Validate each environment variable
  for (const config of ENV_CONFIGS) {
    const value = process.env[config.name];
    const isRequired = config.required || 
      (isProduction && config.production) || 
      (isStaging && config.staging);

    // Check if variable is set
    if (isRequired && !value) {
      errors.push(`Missing required environment variable: ${config.name} - ${config.description}`);
      continue;
    }

    // Skip validation if not set and not required
    if (!value) {
      if (!isRequired) {
        warnings.push(`Optional environment variable not set: ${config.name} - ${config.description}`);
      }
      continue;
    }

    // Validate value format if validator provided (skip validation for placeholder values)
    if (config.validator && !isPlaceholderValue(value, config.name) && !config.validator(value)) {
      errors.push(config.errorMessage || `Invalid format for ${config.name}`);
      continue;
    }

    // Track configured services
    if (config.name === 'DATABASE_URL') hasDatabase = true;
    if (config.name.includes('AUTH') || config.name.includes('NEXTAUTH')) hasAuth = true;
    if (config.name.includes('OPENAI') || config.name.includes('ANTHROPIC')) hasAI = true;
    if (config.name.includes('CLOUDINARY')) hasMedia = true;
    if (config.name.includes('REDIS') || config.name.includes('UPSTASH')) hasCaching = true;
    if (config.name.includes('SENTRY')) hasMonitoring = true;
  }

  // OAuth provider validation - if one is set, both must be set
  const oauthProviders = ['GOOGLE', 'GITHUB'];
  for (const provider of oauthProviders) {
    const clientId = process.env[`${provider}_CLIENT_ID`];
    const clientSecret = process.env[`${provider}_CLIENT_SECRET`];
    
    if (clientId && !clientSecret) {
      errors.push(`${provider}_CLIENT_SECRET is required when ${provider}_CLIENT_ID is set`);
    }
    if (clientSecret && !clientId) {
      errors.push(`${provider}_CLIENT_ID is required when ${provider}_CLIENT_SECRET is set`);
    }
  }

  // Cloudinary validation - all or none
  const cloudinaryVars = ['NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const cloudinarySet = cloudinaryVars.filter(name => process.env[name]);
  if (cloudinarySet.length > 0 && cloudinarySet.length < 3) {
    errors.push('Cloudinary configuration incomplete - all three variables required: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
  }
  if (cloudinarySet.length === 3) hasMedia = true;

  // Stripe validation - both keys should be set together
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const stripePublic = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  
  // Skip validation if using placeholder values from .env.example
  const isStripePlaceholder = stripeSecret && (
    stripeSecret.includes('your_stripe_secret_key') || 
    stripeSecret === 'sk_test_your_stripe_secret_key_here' ||
    stripeSecret.startsWith('sk_test_your_stripe_secret_key')
  );
  const isStripePublicPlaceholder = stripePublic && (
    stripePublic.includes('your_stripe_publishable_key') ||
    stripePublic === 'pk_test_your_stripe_publishable_key_here' ||
    stripePublic.startsWith('pk_test_your_stripe_publishable_key')
  );
  
  if (stripeSecret && !isStripePlaceholder && !stripePublic) {
    errors.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required when STRIPE_SECRET_KEY is set');
  }
  if (stripePublic && !isStripePublicPlaceholder && !stripeSecret) {
    errors.push('STRIPE_SECRET_KEY is required when NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set');
  }

  // Production-specific validations
  if (isProductionLike) {
    // Check for localhost in production URLs
    const urlVars = ['NEXT_PUBLIC_APP_URL', 'NEXTAUTH_URL', 'DATABASE_URL'];
    for (const varName of urlVars) {
      const value = process.env[varName];
      if (value && (value.includes('localhost') || value.includes('127.0.0.1'))) {
        errors.push(`${varName} contains localhost/127.0.0.1 in ${environment} environment`);
      }
    }

    // Check for test keys in production
    if (stripeSecret && stripeSecret.includes('sk_test_')) {
      warnings.push('Using Stripe test keys in production environment');
    }

    // Require caching in production
    if (!process.env.UPSTASH_REDIS_REST_URL && !process.env.DISABLE_REDIS) {
      warnings.push('Redis caching not configured for production - performance may be degraded');
    }

    // Recommend monitoring in production
    if (!process.env.SENTRY_DSN) {
      warnings.push('Error monitoring (Sentry) not configured for production');
    }
  }

  // Cross-environment contamination check for development
  if (environment === 'development') {
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl && (
      dbUrl.includes('railway') || 
      dbUrl.includes('neon') ||
      dbUrl.includes('supabase') ||
      dbUrl.includes('planetscale')
    )) {
      warnings.push('Using production/cloud database in development environment');
    }
  }

  const summary = {
    environment,
    database: hasDatabase ? 'Configured' : 'Not configured',
    auth: hasAuth ? 'Configured' : 'Not configured',
    ai: hasAI ? 'Configured' : 'Not configured',
    media: hasMedia ? 'Configured' : 'Not configured',
    caching: hasCaching ? 'Configured' : 'Not configured',
    monitoring: hasMonitoring ? 'Configured' : 'Not configured',
  };

  const result: ValidationResult = {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary
  };

  // Throw error if validation failed and throwOnError is true
  if (!result.isValid && throwOnError) {
    const errorMessage = `Environment validation failed:\n${errors.join('\n')}`;
    throw new Error(errorMessage);
  }

  return result;
}

/**
 * Validate and return a required environment variable
 */
export function getRequiredEnv(name: string, description?: string): string {
  const value = process.env[name];
  if (!value) {
    const message = description 
      ? `Missing required environment variable: ${name} - ${description}`
      : `Missing required environment variable: ${name}`;
    throw new Error(message);
  }
  return value;
}

/**
 * Validate and return an optional environment variable
 */
export function getOptionalEnv(name: string, defaultValue?: string): string | undefined {
  return process.env[name] || defaultValue;
}

/**
 * Check if AI features are properly configured
 */
export function validateAIConfiguration(): { hasOpenAI: boolean; hasAnthropic: boolean; hasAnyAI: boolean } {
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  const hasOpenAI = Boolean(openaiKey && openaiKey.startsWith('sk-'));
  const hasAnthropic = Boolean(anthropicKey && anthropicKey.startsWith('sk-ant-'));

  return {
    hasOpenAI,
    hasAnthropic,
    hasAnyAI: hasOpenAI || hasAnthropic
  };
}

/**
 * Check if OAuth providers are properly configured
 */
export function validateOAuthConfiguration(): { google: boolean; github: boolean; hasAnyOAuth: boolean } {
  const google = Boolean(
    process.env.GOOGLE_CLIENT_ID && 
    process.env.GOOGLE_CLIENT_SECRET
  );
  
  const github = Boolean(
    process.env.GITHUB_CLIENT_ID && 
    process.env.GITHUB_CLIENT_SECRET
  );

  return {
    google,
    github,
    hasAnyOAuth: google || github
  };
}

/**
 * Runtime environment validation - call this at application startup
 */
export function validateRuntimeEnvironment(): void {
  const result = validateEnvironmentVariables(false);
  
  console.log(`\n🔍 Environment Validation: ${result.summary.environment.toUpperCase()}\n`);
  
  // Show configuration summary
  console.log('📋 Service Configuration:');
  Object.entries(result.summary).forEach(([service, status]) => {
    const icon = status === 'Configured' ? '✅' : '❌';
    console.log(`   ${icon} ${service}: ${status}`);
  });
  
  // Show warnings
  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    result.warnings.forEach(warning => console.warn(`   - ${warning}`));
  }
  
  // Show errors
  if (result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach(error => console.error(`   - ${error}`));
    console.log('\nEnvironment validation failed! Please fix the above errors.\n');
    process.exit(1);
  }
  
  console.log('\n✅ Environment validation passed!\n');
}

// Legacy compatibility exports
export const ENV_VARS = {
  DATABASE_URL: 'DATABASE_URL',
  NEXTAUTH_SECRET: 'NEXTAUTH_SECRET',
  NEXTAUTH_URL: 'NEXTAUTH_URL',
  AUTH_SECRET: 'AUTH_SECRET',
  ANTHROPIC_API_KEY: 'ANTHROPIC_API_KEY',
  OPENAI_API_KEY: 'OPENAI_API_KEY',
  STRIPE_API_KEY: 'STRIPE_SECRET_KEY',
  CLOUDINARY_CLOUD_NAME: 'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
  REDIS_URL: 'UPSTASH_REDIS_REST_URL',
} as const;

export function validateEnvVar(varName: string, required: boolean = true): string | undefined {
  if (required) {
    return getRequiredEnv(varName);
  } else {
    return getOptionalEnv(varName);
  }
}

export function validateRequiredEnvVars(varNames: string[]): void {
  const missing: string[] = [];
  
  for (const varName of varNames) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  if (missing.length > 0) {
    const errorMsg = `Missing required environment variables: ${missing.join(', ')}`;
    throw new Error(errorMsg);
  }
}

export function validateCoreEnvVars(): void {
  validateRequiredEnvVars([
    ENV_VARS.DATABASE_URL,
    ENV_VARS.NEXTAUTH_SECRET,
  ]);
}