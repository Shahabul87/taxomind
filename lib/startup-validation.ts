/**
 * Application Startup Validation
 * This module runs environment validation at application startup
 * Import and call validateApplicationStartup() in your app initialization
 */

import { validateEnvironmentVariables, validateAIConfiguration, validateOAuthConfiguration } from './env-validation';
import { logger } from '@/lib/logger';

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
      logger.info(`Starting Taxomind LMS (${env})`);
      logger.info('='.repeat(40));

      // Show core service status
      logger.info('Core Services:');
      logger.info(`   Database: ${result.summary.database}`);
      logger.info(`   Authentication: ${result.summary.auth}`);
      
      if (validateOptional) {
        logger.info('Optional Services:');
        logger.info(`   AI Services: ${result.summary.ai}`);
        logger.info(`   Media Storage: ${result.summary.media}`);
        logger.info(`   Caching: ${result.summary.caching}`);
        logger.info(`   Monitoring: ${result.summary.monitoring}`);
      }
    }
    
    // Show feature availability
    if (verbose && validateOptional) {
      const aiConfig = validateAIConfiguration();
      const oauthConfig = validateOAuthConfiguration();
      
      logger.info('Feature Availability:');

      if (aiConfig.hasAnyAI) {
        logger.info('   AI-powered content generation enabled');
        if (aiConfig.hasOpenAI) logger.info('     OpenAI GPT models available');
        if (aiConfig.hasAnthropic) logger.info('     Anthropic Claude models available');
      } else {
        logger.info('   AI features disabled (no API keys configured)');
      }

      if (oauthConfig.hasAnyOAuth) {
        logger.info('   Social authentication enabled');
        if (oauthConfig.google) logger.info('     Google OAuth enabled');
        if (oauthConfig.github) logger.info('     GitHub OAuth enabled');
      } else {
        logger.info('   Social auth disabled (credentials-only login)');
      }

      logger.info(`   Media uploads ${result.summary.media === 'Configured' ? 'enabled' : 'disabled'}`);
      logger.info(`   Redis caching ${result.summary.caching === 'Configured' ? 'enabled' : 'disabled'}`);
    }
    
    // Show warnings
    if (result.warnings.length > 0 && verbose) {
      logger.warn('Configuration Warnings:');
      result.warnings.forEach(warning => logger.warn(`   ${warning}`));
    }
    
    // Handle errors
    if (result.errors.length > 0) {
      if (verbose) {
        logger.error('Configuration Errors:');
        result.errors.forEach(error => logger.error(`   ${error}`));
        logger.info('Tips:');
        logger.info('   Check your .env.local file against .env.example');
        logger.info('   Run "npm run validate:env" for detailed validation');
        logger.info('   Ensure production variables are set in production environment');
      }
      
      if (exitOnError) {
        logger.error('Application startup failed due to configuration errors');
        process.exit(1);
      }
      
      return false;
    }
    
    if (verbose) {
      logger.info('Startup validation completed successfully');
      logger.info('='.repeat(40));
    }
    
    return true;
    
  } catch (error) {
    if (verbose) {
      logger.error('Startup validation failed', error instanceof Error ? error.message : String(error));
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
    logger.error('Critical environment variables missing', missing.join(', '));
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
    logger.error(`Invalid NODE_ENV: ${environment}`);
    return false;
  }
  
  // Check for basic required variables
  if (!process.env.DATABASE_URL) {
    logger.error('DATABASE_URL is required for builds');
    return false;
  }
  
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    logger.error('NEXT_PUBLIC_APP_URL is required for builds');
    return false;
  }
  
  // Production-specific build checks
  if (environment === 'production' || environment === 'staging') {
    if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
      logger.error('AUTH_SECRET or NEXTAUTH_SECRET is required for production builds');
      return false;
    }
    
    // Check for localhost URLs in production
    const prodUrls = [process.env.NEXT_PUBLIC_APP_URL, process.env.NEXTAUTH_URL, process.env.DATABASE_URL];
    const localhostUrls = prodUrls.filter(url => url && (url.includes('localhost') || url.includes('127.0.0.1')));
    
    if (localhostUrls.length > 0) {
      logger.error('Production builds cannot use localhost URLs');
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