import { logger } from '@/lib/logger';

// Singleton pattern to ensure environment check only runs once
let hasChecked = false;
let checkResult: { missing: string[], present: string[], isComplete: boolean } | null = null;

// Disable logging during build time static generation
const isBuildTime = process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build';
const isStaticGeneration = process.env.__NEXT_PRIVATE_PREBUNDLED_REACT === 'next' || process.env.NEXT_PHASE === 'phase-production-build';

export function checkEnvironmentVariables() {
  // Return cached result if already checked
  if (hasChecked && checkResult) {
    return checkResult;
  }

  const requiredVars = {
    // Auth
    AUTH_SECRET: process.env.AUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    
    // Database
    DATABASE_URL: process.env.DATABASE_URL,
    
    // OAuth
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    
    // Email
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    
    // App URL
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  };

  const missing: string[] = [];
  const present: string[] = [];

  Object.entries(requiredVars).forEach(([key, value]) => {
    if (!value) {
      missing.push(key);
    } else {
      present.push(key);
    }
  });

  // Only log if this is the first time checking AND not during build/static generation
  if (!hasChecked && !isBuildTime && !isStaticGeneration) {

    if (missing.length > 0) {
      logger.warn('⚠️  Missing environment variables:', missing.join(', '));
      
      if (missing.includes('GOOGLE_CLIENT_ID') || missing.includes('GOOGLE_CLIENT_SECRET')) {
        logger.warn('Google OAuth will not work without GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
      }
      
      if (missing.includes('GITHUB_CLIENT_ID') || missing.includes('GITHUB_CLIENT_SECRET')) {
        logger.warn('GitHub OAuth will not work without GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET');
      }
      
      if (missing.includes('RESEND_API_KEY')) {
        logger.warn('Email functionality will not work without RESEND_API_KEY');
      }
      
      if (missing.includes('AUTH_SECRET')) {
        logger.error('AUTH_SECRET is required for NextAuth to work properly');
      }
    } else {
}
  }

  // Cache the result
  checkResult = {
    missing,
    present,
    isComplete: missing.length === 0
  };
  
  hasChecked = true;
  return checkResult;
}

export function getAppUrl() {
  // Check for explicit URL environment variable first
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Check for Vercel deployment URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // SECURITY FIX: Fail fast in production instead of using hard-coded fallback
  // This ensures proper configuration and prevents deployment issues
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    throw new Error(
      'CRITICAL: NEXT_PUBLIC_APP_URL must be set in production environment. ' +
      'Hard-coded fallbacks are not allowed for security and flexibility. ' +
      'Set NEXT_PUBLIC_APP_URL in your environment variables.'
    );
  }

  // Default to localhost for development only
  return 'http://localhost:3000';
} 