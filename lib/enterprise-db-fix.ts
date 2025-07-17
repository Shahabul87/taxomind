// Enterprise DB Build Fix
// This module provides a fix for the production/development environment mismatch during builds

export function isRealProduction(): boolean {
  // Check if we're in a real production environment
  return process.env.NODE_ENV === 'production' && 
         !process.env.IS_BUILD_TIME && 
         (process.env.VERCEL || 
          process.env.RAILWAY_ENVIRONMENT || 
          process.env.RENDER ||
          process.env.NETLIFY ||
          process.env.DATABASE_URL?.includes('railway') ||
          process.env.DATABASE_URL?.includes('amazonaws') ||
          process.env.DATABASE_URL?.includes('supabase'));
}

export function isBuildTime(): boolean {
  // Detect if we're in build time
  return process.env.NODE_ENV === 'production' && 
         (process.env.IS_BUILD_TIME === 'true' ||
          process.env.NEXT_PHASE === 'phase-production-build' ||
          !process.env.DATABASE_URL ||
          process.env.DATABASE_URL?.includes('localhost') ||
          process.env.DATABASE_URL?.includes('127.0.0.1'));
}

export function getEffectiveEnvironment(): 'development' | 'staging' | 'production' {
  if (isBuildTime()) {
    // During build time, treat as development to avoid validation errors
    return 'development';
  }
  
  if (isRealProduction()) {
    return 'production';
  }
  
  if (process.env.NODE_ENV === 'staging' || process.env.STAGING === 'true') {
    return 'staging';
  }
  
  return 'development';
}

export function shouldUseEnterpriseDB(): boolean {
  // Only use EnterpriseDB in real production/staging runtime, not during builds
  return isRealProduction() && process.env.STRICT_ENV_MODE === 'true';
}