import { logger } from '@/lib/logger';

// lib/db-environment.ts
export const getEnvironmentConfig = () => {
  const env = (process.env.APP_ENV ?? process.env.NODE_ENV ?? 'development') as
    | 'development'
    | 'production'
    | 'test'
    | 'staging';
  
  return {
    isDevelopment: env === 'development',
    isStaging: env === 'staging',
    isProduction: env === 'production',
    
    // Database configuration
    database: {
      url: process.env.DATABASE_URL!,
      canReset: env === 'development', // Only allow DB reset in development
      canSeed: env !== 'production',   // Allow seeding in dev/staging
      migrations: {
        autoRun: env === 'development', // Auto-run migrations only in dev
        allowDrop: env === 'development' // Allow destructive operations only in dev
      }
    },
    
    // Email configuration
    email: {
      provider: env === 'development' ? 'console' : 'resend',
      from: `noreply@${env === 'development' ? 'localhost' : 'taxomind.com'}`,
      logToConsole: env === 'development'
    },
    
    // Feature flags
    features: {
      analytics: env !== 'development',
      realPayments: env === 'production',
      debugMode: env === 'development',
      redis: env !== 'development' && !process.env.DISABLE_REDIS
    }
  };
};

// Environment-safe database operations
export const safeDBOperation = async <T>(
  operation: () => Promise<T>,
  operationType: 'read' | 'write' | 'destructive' = 'read'
): Promise<T> => {
  const config = getEnvironmentConfig();
  
  if (operationType === 'destructive' && config.isProduction) {
    throw new Error('🚨 Destructive database operations are not allowed in production!');
  }
  
  if (operationType === 'destructive' && config.isDevelopment) {
    logger.warn('⚠️  Performing destructive operation in development');
  }
  
  return await operation();
};

// Logging helper for development
export const devLog = (message: string, data?: any) => {
  const config = getEnvironmentConfig();
  if (config.isDevelopment) {
    logger.debug(message, data);
  }
};

// Environment validation
export const validateEnvironment = () => {
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'AUTH_SECRET'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const config = getEnvironmentConfig();

  // Warn if using production database in development
  if (config.isDevelopment && 
      (process.env.DATABASE_URL?.includes('railway') || 
       process.env.DATABASE_URL?.includes('postgres.railway.internal'))) {
    console.warn('WARNING: Using production database in development environment!');
    console.warn('Consider using local PostgreSQL for safety.');
  }

  console.log(`✅ Database: ${process.env.DATABASE_URL?.includes('localhost') ? 'Local' : 'Remote'}`);
};

// Get database environment details
export const getDbEnvironment = () => {
  const config = getEnvironmentConfig();
  const strictMode = process.env.STRICT_ENV_MODE === 'true';
  
  return {
    ...config,
    strictMode,
    environment: config.isProduction ? 'production' : config.isStaging ? 'staging' : 'development',
  };
};

// Check if destructive operation is allowed
export const canPerformDestructiveOperation = (operation: string): boolean => {
  const config = getEnvironmentConfig();
  
  if (config.isDevelopment) {
    logger.debug(`Allowing destructive operation in development: ${operation}`);
    return true;
  }
  
  logger.warn(`Blocking destructive operation in ${config.isProduction ? 'production' : 'staging'}: ${operation}`);
  return false;
};