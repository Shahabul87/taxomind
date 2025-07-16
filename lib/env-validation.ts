/**
 * Environment Variable Validation Utility
 * Provides centralized validation for required environment variables
 */

export function validateEnvVar(varName: string, required: boolean = true): string | undefined {
  const value = process.env[varName];
  
  if (required && !value) {
    console.error(`❌ Required environment variable ${varName} is not set`);
    throw new Error(`Missing required environment variable: ${varName}`);
  }
  
  if (!value && !required) {
    console.warn(`⚠️  Optional environment variable ${varName} is not set`);
  }
  
  return value;
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
    console.error(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }
}

// Common environment variables used across the application
export const ENV_VARS = {
  // Database
  DATABASE_URL: 'DATABASE_URL',
  
  // Authentication
  NEXTAUTH_SECRET: 'NEXTAUTH_SECRET',
  NEXTAUTH_URL: 'NEXTAUTH_URL',
  
  // AI Services
  ANTHROPIC_API_KEY: 'ANTHROPIC_API_KEY',
  OPENAI_API_KEY: 'OPENAI_API_KEY',
  
  // External Services
  STRIPE_API_KEY: 'STRIPE_API_KEY',
  CLOUDINARY_CLOUD_NAME: 'CLOUDINARY_CLOUD_NAME',
  
  // Redis (optional)
  REDIS_URL: 'REDIS_URL',
} as const;

// Validate core application environment variables
export function validateCoreEnvVars(): void {
  validateRequiredEnvVars([
    ENV_VARS.DATABASE_URL,
    ENV_VARS.NEXTAUTH_SECRET,
  ]);
}