#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Uses the comprehensive validation system from lib/env-validation.ts
 * This script runs at build time and application startup
 */

const fs = require('fs');
const path = require('path');

// Skip validation if SKIP_ENV_VALIDATION is set (e.g., during Docker builds)
if (process.env.SKIP_ENV_VALIDATION === 'true') {
  console.log('⏭️  Skipping environment validation (SKIP_ENV_VALIDATION=true)');
  console.log('   Environment variables will be validated at runtime');
  process.exit(0);
}

// Load environment variables based on NODE_ENV
try {
  const { loadEnvironment } = require('./load-env');
  loadEnvironment();
} catch (error) {
  // If load-env doesn't exist or fails, continue with process.env
  console.warn('⚠️  Could not load load-env script, using process.env directly');
}

/**
 * Import and run the TypeScript validation
 * We need to transpile TypeScript on the fly for Node.js
 */
async function runValidation() {
  try {
    // Try to require the compiled JS version first (if it exists)
    let validationModule;
    try {
      // First try the root directory where the compiled version actually is
      validationModule = require('../env-validation.js');
    } catch (error) {
      try {
        // Try lib directory as fallback
        validationModule = require('../lib/env-validation.js');
      } catch (error2) {
        // If compiled JS doesn't exist, use ts-node or fall back to JavaScript implementation
        try {
          require('ts-node').register({
            compilerOptions: {
              module: 'commonjs',
              target: 'es2020',
              esModuleInterop: true,
              allowSyntheticDefaultImports: true,
              skipLibCheck: true
            }
          });
          validationModule = require('../lib/env-validation.ts');
        } catch (tsError) {
          console.error('❌ Could not load TypeScript validation module');
          console.error('Make sure to run "npm run build" or install ts-node');
          // Fall back to JavaScript implementation below
          fallbackValidation();
          return;
        }
      }
    }

    // Run the comprehensive validation
    const result = validationModule.validateEnvironmentVariables(false);
    const environment = process.env.NODE_ENV || 'development';
    
    console.log(`\n🔍 Environment Validation: ${environment.toUpperCase()}\n`);
    
    // Show service configuration summary
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
    }

    // Additional feature checks
    const aiConfig = validationModule.validateAIConfiguration();
    const oauthConfig = validationModule.validateOAuthConfiguration();
    
    console.log('\n🔧 Feature Status:');
    console.log(`   - AI Services: ${aiConfig.hasAnyAI ? '✅ Configured' : '❌ Not configured'}`);
    if (aiConfig.hasOpenAI) console.log('     • OpenAI: Configured');
    if (aiConfig.hasAnthropic) console.log('     • Anthropic: Configured');
    
    console.log(`   - OAuth Providers: ${oauthConfig.hasAnyOAuth ? '✅ Configured' : '❌ Not configured'}`);
    if (oauthConfig.google) console.log('     • Google: Configured');
    if (oauthConfig.github) console.log('     • GitHub: Configured');

    // Exit with appropriate code
    if (result.errors.length > 0) {
      console.log('\n❌ Environment validation failed! Please fix the above errors.\n');
      process.exit(1);
    } else if (result.warnings.length > 0) {
      console.log('\n⚠️  Environment validation passed with warnings\n');
      process.exit(0);
    } else {
      console.log('\n✅ Environment validation passed!\n');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Error running environment validation:', error.message);
    console.error('Falling back to basic validation...\n');
    fallbackValidation();
  }
}

/**
 * Fallback validation using JavaScript (if TypeScript module fails to load)
 */
function fallbackValidation() {
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const isProduction = NODE_ENV === 'production';
  const isStaging = NODE_ENV === 'staging';
  const isProductionLike = isProduction || isStaging;
  
  console.log(`🔍 Basic Environment Validation: ${NODE_ENV.toUpperCase()}\n`);
  
  const errors = [];
  const warnings = [];
  
  // Core required variables
  const coreRequired = [
    'DATABASE_URL',
    'NEXT_PUBLIC_APP_URL',
  ];
  
  // Production/staging required variables
  const productionRequired = [
    'AUTH_SECRET',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ];
  
  // Check core variables
  coreRequired.forEach(varName => {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  });
  
  // Check production variables
  if (isProductionLike) {
    productionRequired.forEach(varName => {
      if (!process.env[varName]) {
        errors.push(`Missing required environment variable for ${NODE_ENV}: ${varName}`);
      }
    });
    
    // Production-specific checks
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost')) {
      errors.push('DATABASE_URL contains localhost in production/staging environment');
    }
    
    if (!process.env.UPSTASH_REDIS_REST_URL && !process.env.DISABLE_REDIS) {
      warnings.push('Redis caching not configured for production - performance may be degraded');
    }
    
    if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.includes('sk_test_')) {
      warnings.push('Using Stripe test keys in production environment');
    }
  }
  
  // Development checks
  if (NODE_ENV === 'development' && process.env.DATABASE_URL) {
    if (process.env.DATABASE_URL.includes('railway') || 
        process.env.DATABASE_URL.includes('neon') ||
        process.env.DATABASE_URL.includes('supabase') ||
        process.env.DATABASE_URL.includes('planetscale')) {
      warnings.push('Using production/cloud database in development environment');
    }
  }
  
  // OAuth provider checks
  const googleComplete = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
  const githubComplete = process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET;
  
  if (process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_SECRET) {
    errors.push('GOOGLE_CLIENT_SECRET is required when GOOGLE_CLIENT_ID is set');
  }
  if (process.env.GITHUB_CLIENT_ID && !process.env.GITHUB_CLIENT_SECRET) {
    errors.push('GITHUB_CLIENT_SECRET is required when GITHUB_CLIENT_ID is set');
  }
  
  console.log('📋 Basic Configuration:');
  console.log(`   - NODE_ENV: ${NODE_ENV}`);
  console.log(`   - Database: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
  console.log(`   - Auth: ${process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET ? 'Configured' : 'Not configured'}`);
  console.log(`   - Redis: ${process.env.UPSTASH_REDIS_REST_URL ? 'Configured' : 'Not configured'}`);
  console.log(`   - Google OAuth: ${googleComplete ? 'Configured' : 'Not configured'}`);
  console.log(`   - GitHub OAuth: ${githubComplete ? 'Configured' : 'Not configured'}`);
  console.log(`   - AI (OpenAI): ${process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured'}`);
  console.log(`   - AI (Anthropic): ${process.env.ANTHROPIC_API_KEY ? 'Configured' : 'Not configured'}`);
  console.log(`   - Media (Cloudinary): ${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ? 'Configured' : 'Not configured'}`);
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
  }
  
  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(error => console.error(`   - ${error}`));
    console.log('\n❌ Environment validation failed!\n');
    process.exit(1);
  } else if (warnings.length > 0) {
    console.log('\n⚠️  Environment validation passed with warnings\n');
    process.exit(0);
  } else {
    console.log('\n✅ Environment validation passed!\n');
    process.exit(0);
  }
}

// Run the validation
runValidation();