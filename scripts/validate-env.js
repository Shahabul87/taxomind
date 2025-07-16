#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load environment variables based on NODE_ENV
const { loadEnvironment } = require('./load-env');
loadEnvironment();

const requiredEnvVars = {
  common: [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'AUTH_SECRET',
    'NEXT_PUBLIC_APP_URL',
  ],
  production: [
    'REDIS_URL',
    'RESEND_API_KEY',
    'EMAIL_FROM',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRICT_ENV_MODE',
  ],
  staging: [
    'REDIS_URL',
    'RESEND_API_KEY',
    'EMAIL_FROM',
    'STRICT_ENV_MODE',
    'BLOCK_CROSS_ENV',
    'AUDIT_ENABLED',
  ],
  development: [
    // Development has fewer requirements
  ],
};

const NODE_ENV = process.env.NODE_ENV || 'development';

console.log(`\n🔍 Validating environment: ${NODE_ENV}\n`);

// Check common required variables
const missingVars = [];
const warnings = [];

// Check common variables
requiredEnvVars.common.forEach(varName => {
  if (!process.env[varName]) {
    missingVars.push(varName);
  }
});

// Check environment-specific variables
const envSpecificVars = requiredEnvVars[NODE_ENV] || [];
envSpecificVars.forEach(varName => {
  if (!process.env[varName]) {
    missingVars.push(varName);
  }
});

// Safety checks
if (NODE_ENV === 'production' || NODE_ENV === 'staging') {
  // Check for localhost in database URL
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost')) {
    warnings.push('DATABASE_URL contains localhost in production/staging environment!');
  }
  
  // Check for development/test keys
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.includes('sk_test_')) {
    warnings.push('Using test Stripe keys in production/staging environment');
  }
  
  // Check STRICT_ENV_MODE
  if (process.env.STRICT_ENV_MODE !== 'true') {
    warnings.push('STRICT_ENV_MODE is not enabled - production data safety features are disabled');
  }
  
  // Check for missing Redis
  if (!process.env.REDIS_URL && NODE_ENV === 'production') {
    warnings.push('Redis is not configured for production - caching and rate limiting disabled');
  }
}

// Cross-environment contamination check
if (NODE_ENV === 'development' && process.env.DATABASE_URL) {
  if (process.env.DATABASE_URL.includes('railway') || 
      process.env.DATABASE_URL.includes('neon') ||
      process.env.DATABASE_URL.includes('supabase')) {
    warnings.push('⚠️  Using production/cloud database in development environment!');
  }
}

// Report results
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\n');
}

if (warnings.length > 0) {
  console.warn('⚠️  Environment warnings:');
  warnings.forEach(warning => {
    console.warn(`   - ${warning}`);
  });
  console.warn('\n');
}

// Additional checks
console.log('📋 Environment configuration:');
console.log(`   - NODE_ENV: ${NODE_ENV}`);
console.log(`   - Database: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
console.log(`   - Redis: ${process.env.REDIS_URL ? 'Configured' : 'Not configured'}`);
console.log(`   - Strict mode: ${process.env.STRICT_ENV_MODE === 'true' ? 'Enabled' : 'Disabled'}`);
console.log(`   - Auth providers: ${process.env.GOOGLE_CLIENT_ID ? 'Google' : ''} ${process.env.GITHUB_CLIENT_ID ? 'GitHub' : ''}`);

// Build-time safety features
if (NODE_ENV === 'production' || NODE_ENV === 'staging') {
  console.log('\n🛡️  Safety features:');
  console.log(`   - Cross-env blocking: ${process.env.BLOCK_CROSS_ENV === 'true' ? 'Enabled' : 'Disabled'}`);
  console.log(`   - Audit logging: ${process.env.AUDIT_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`);
  console.log(`   - Strict environment mode: ${process.env.STRICT_ENV_MODE === 'true' ? 'Enabled' : 'Disabled'}`);
}

// Exit with error if critical issues found
if (missingVars.length > 0) {
  console.error('\n❌ Environment validation failed!\n');
  process.exit(1);
} else if (warnings.length > 0) {
  console.warn('\n⚠️  Environment validation passed with warnings\n');
  process.exit(0);
} else {
  console.log('\n✅ Environment validation passed!\n');
  process.exit(0);
}