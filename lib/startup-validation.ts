/**
 * Application Startup Validation
 * This module runs environment validation at application startup
 * Import and call validateApplicationStartup() in your app initialization
 */

import { validateEnvironmentVariables, validateAIConfiguration, validateOAuthConfiguration } from './env-validation';

interface StartupValidationOptions {
  /**
   * Whether to exit the process on validation failure
   * Set to false in test environments
   */
  exitOnError?: boolean;
  
  /**
   * Whether to log validation results to console
   * Set to false to suppress startup logs
   */
  verbose?: boolean;
  
  /**
   * Whether to validate optional services
   * Set to false for minimal validation
   */
  validateOptional?: boolean;
}

/**
 * Comprehensive application startup validation
 * Call this at the beginning of your app initialization
 */
export function validateApplicationStartup(options: StartupValidationOptions = {}): boolean {
  const {
    exitOnError = true,
    verbose = true,
    validateOptional = true
  } = options;

  try {
    // Run environment validation
    const result = validateEnvironmentVariables(false);
    
    if (verbose) {
      const env = result.summary.environment.toUpperCase();
      console.log(`\n🚀 Starting Taxomind LMS (${env})`);
      console.log('='.repeat(40));
      
      // Show core service status
      console.log('📋 Core Services:');
      console.log(`   ${result.summary.database === 'Configured' ? '✅' : '❌'} Database: ${result.summary.database}`);
      console.log(`   ${result.summary.auth === 'Configured' ? '✅' : '❌'} Authentication: ${result.summary.auth}`);
      
      if (validateOptional) {
        console.log('\n🔧 Optional Services:');
        console.log(`   ${result.summary.ai === 'Configured' ? '✅' : '🔸'} AI Services: ${result.summary.ai}`);
        console.log(`   ${result.summary.media === 'Configured' ? '✅' : '🔸'} Media Storage: ${result.summary.media}`);
        console.log(`   ${result.summary.caching === 'Configured' ? '✅' : '🔸'} Caching: ${result.summary.caching}`);
        console.log(`   ${result.summary.monitoring === 'Configured' ? '✅' : '🔸'} Monitoring: ${result.summary.monitoring}`);
      }
    }
    
    // Show feature availability
    if (verbose && validateOptional) {
      const aiConfig = validateAIConfiguration();
      const oauthConfig = validateOAuthConfiguration();
      
      console.log('\n⚡ Feature Availability:');
      
      if (aiConfig.hasAnyAI) {
        console.log('   ✅ AI-powered content generation');
        if (aiConfig.hasOpenAI) console.log('     • OpenAI GPT models available');
        if (aiConfig.hasAnthropic) console.log('     • Anthropic Claude models available');
      } else {
        console.log('   🔸 AI features disabled (no API keys configured)');
      }
      
      if (oauthConfig.hasAnyOAuth) {
        console.log('   ✅ Social authentication');
        if (oauthConfig.google) console.log('     • Google OAuth enabled');
        if (oauthConfig.github) console.log('     • GitHub OAuth enabled');
      } else {
        console.log('   🔸 Social auth disabled (credentials-only login)');
      }
      
      console.log(`   ${result.summary.media === 'Configured' ? '✅' : '🔸'} Media uploads ${result.summary.media === 'Configured' ? 'enabled' : 'disabled'}`);
      console.log(`   ${result.summary.caching === 'Configured' ? '✅' : '🔸'} Redis caching ${result.summary.caching === 'Configured' ? 'enabled' : 'disabled'}`);
    }
    
    // Show warnings
    if (result.warnings.length > 0 && verbose) {
      console.log('\n⚠️  Configuration Warnings:');
      result.warnings.forEach(warning => console.warn(`   • ${warning}`));
    }
    
    // Handle errors
    if (result.errors.length > 0) {
      if (verbose) {
        console.log('\n❌ Configuration Errors:');
        result.errors.forEach(error => console.error(`   • ${error}`));
        console.log('\n💡 Tips:');
        console.log('   • Check your .env.local file against .env.example');
        console.log('   • Run "npm run validate:env" for detailed validation');
        console.log('   • Ensure production variables are set in production environment');
      }
      
      if (exitOnError) {
        console.error('\n🛑 Application startup failed due to configuration errors');
        process.exit(1);
      }
      
      return false;
    }
    
    if (verbose) {
      console.log('\n✅ Startup validation completed successfully');
      console.log('='.repeat(40));
    }
    
    return true;
    
  } catch (error) {
    if (verbose) {
      console.error('\n❌ Startup validation failed:', error instanceof Error ? error.message : String(error));
    }
    
    if (exitOnError) {
      process.exit(1);
    }
    
    return false;
  }
}

/**
 * Quick validation for minimal startup checks
 * Only validates critical environment variables
 */
export function validateMinimalStartup(): boolean {
  const criticalVars = [
    'DATABASE_URL',
    'NEXT_PUBLIC_APP_URL',
  ];
  
  // Add production-specific critical vars
  if ((process.env.NODE_ENV as string) === 'production' || (process.env.NODE_ENV as string) === 'staging') {
    criticalVars.push('AUTH_SECRET', 'NEXTAUTH_URL');
  }
  
  const missing = criticalVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Critical environment variables missing:', missing.join(', '));
    return false;
  }
  
  return true;
}

/**
 * Runtime environment check for build processes
 * Ensures safe build environment without full app initialization
 */
export function validateBuildEnvironment(): boolean {
  const environment = (process.env.NODE_ENV as 'development' | 'staging' | 'production' | 'test') || 'development';
  
  // Check if we're in a valid build environment
  if (!['development', 'staging', 'production', 'test'].includes(environment)) {
    console.error(`❌ Invalid NODE_ENV: ${environment}`);
    return false;
  }
  
  // Check for basic required variables
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is required for builds');
    return false;
  }
  
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    console.error('❌ NEXT_PUBLIC_APP_URL is required for builds');
    return false;
  }
  
  // Production-specific build checks
  if (environment === 'production' || environment === 'staging') {
    if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
      console.error('❌ AUTH_SECRET or NEXTAUTH_SECRET is required for production builds');
      return false;
    }
    
    // Check for localhost URLs in production
    const prodUrls = [process.env.NEXT_PUBLIC_APP_URL, process.env.NEXTAUTH_URL, process.env.DATABASE_URL];
    const localhostUrls = prodUrls.filter(url => url && (url.includes('localhost') || url.includes('127.0.0.1')));
    
    if (localhostUrls.length > 0) {
      console.error('❌ Production builds cannot use localhost URLs');
      return false;
    }
  }
  
  return true;
}

/**
 * Next.js middleware validation hook
 * Lightweight validation for middleware execution
 */
export function validateMiddlewareEnvironment(): boolean {
  // Only check essential variables for middleware
  const essential = ['NEXT_PUBLIC_APP_URL'];
  
  if (process.env.NODE_ENV === 'production') {
    essential.push('AUTH_SECRET');
  }
  
  return essential.every(varName => Boolean(process.env[varName]));
}

// Export validation results interface for external use
export interface ValidationSummary {
  isValid: boolean;
  environment: string;
  features: {
    ai: boolean;
    oauth: boolean;
    media: boolean;
    caching: boolean;
    monitoring: boolean;
  };
  warnings: string[];
  errors: string[];
}

/**
 * Get current environment validation summary
 * Useful for admin dashboards and health checks
 */
export function getValidationSummary(): ValidationSummary {
  try {
    const result = validateEnvironmentVariables(false);
    const aiConfig = validateAIConfiguration();
    const oauthConfig = validateOAuthConfiguration();
    
    return {
      isValid: result.isValid,
      environment: result.summary.environment,
      features: {
        ai: aiConfig.hasAnyAI,
        oauth: oauthConfig.hasAnyOAuth,
        media: result.summary.media === 'Configured',
        caching: result.summary.caching === 'Configured',
        monitoring: result.summary.monitoring === 'Configured',
      },
      warnings: result.warnings,
      errors: result.errors,
    };
  } catch (error) {
    return {
      isValid: false,
      environment: process.env.NODE_ENV || 'unknown',
      features: {
        ai: false,
        oauth: false,
        media: false,
        caching: false,
        monitoring: false,
      },
      warnings: [],
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}