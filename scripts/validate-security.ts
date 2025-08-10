#!/usr/bin/env ts-node

/**
 * Security Validation Script for Taxomind LMS
 * 
 * This script validates all security components and configurations
 * to ensure they are properly set up and functioning correctly.
 * 
 * Usage:
 * npx ts-node scripts/validate-security.ts
 * 
 * Features:
 * - Validates encryption configuration
 * - Tests field encryption functionality
 * - Validates security headers configuration
 * - Tests security middleware components
 * - Checks environment variables
 * - Validates crypto utilities
 * - Tests CSP configuration
 * - Performance benchmarks
 */

import { performance } from 'perf_hooks';
import chalk from 'chalk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import security components
import { DataEncryption, EncryptionUtils } from '../lib/security/encryption';
import { FieldEncryption, fieldEncryption } from '../lib/security/field-encryption';
import { SecurityHeaders, SecurityHeadersPresets } from '../lib/security/security-headers';
import { SecurityMiddleware, SecurityMiddlewarePresets } from '../lib/middleware/security';
import { CryptoUtils, CryptoHelpers } from '../lib/security/crypto-utils';

interface ValidationResult {
  component: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
  duration?: number;
}

class SecurityValidator {
  private results: ValidationResult[] = [];

  /**
   * Adds a validation result
   */
  private addResult(component: string, status: ValidationResult['status'], message: string, details?: any, duration?: number) {
    this.results.push({
      component,
      status,
      message,
      details,
      duration,
    });
  }

  /**
   * Logs a result with appropriate formatting
   */
  private logResult(result: ValidationResult) {
    const statusIcon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    const statusColor = result.status === 'pass' ? chalk.green : result.status === 'fail' ? chalk.red : chalk.yellow;
    const durationText = result.duration ? ` (${result.duration.toFixed(2)}ms)` : '';
    
    console.log(`${statusIcon} ${statusColor(result.component)}: ${result.message}${durationText}`);
    
    if (result.details && result.status !== 'pass') {
      console.log(`   ${chalk.gray(JSON.stringify(result.details, null, 2))}`);
    }
  }

  /**
   * Validates environment variables
   */
  async validateEnvironment(): Promise<void> {
    console.log(chalk.blue.bold('\n🔍 Validating Environment Configuration...\n'));

    const requiredVars = [
      'ENCRYPTION_MASTER_KEY',
    ];

    const optionalVars = [
      'SECURITY_ENVIRONMENT',
      'SECURITY_WEBHOOK_URL',
      'CSP_REPORT_URI',
      'SECURITY_IP_WHITELIST',
      'SECURITY_IP_BLACKLIST',
    ];

    // Check required variables
    for (const varName of requiredVars) {
      if (process.env[varName]) {
        if (varName === 'ENCRYPTION_MASTER_KEY' && process.env[varName].length < 32) {
          this.addResult('Environment', 'fail', `${varName} is too short (minimum 32 characters)`, {
            length: process.env[varName].length,
            minimum: 32,
          });
        } else {
          this.addResult('Environment', 'pass', `${varName} is configured`);
        }
      } else {
        this.addResult('Environment', 'fail', `${varName} is missing`);
      }
    }

    // Check optional variables
    for (const varName of optionalVars) {
      if (process.env[varName]) {
        this.addResult('Environment', 'pass', `${varName} is configured`);
      } else {
        this.addResult('Environment', 'warning', `${varName} is not configured (optional)`);
      }
    }

    // Validate NODE_ENV
    const nodeEnv = process.env.NODE_ENV;
    if (['development', 'staging', 'production'].includes(nodeEnv || '')) {
      this.addResult('Environment', 'pass', `NODE_ENV is valid: ${nodeEnv}`);
    } else {
      this.addResult('Environment', 'warning', `NODE_ENV is not standard: ${nodeEnv}`);
    }
  }

  /**
   * Validates encryption components
   */
  async validateEncryption(): Promise<void> {
    console.log(chalk.blue.bold('\n🔐 Validating Encryption Components...\n'));

    try {
      const start = performance.now();

      // Test basic encryption configuration
      const configValidation = EncryptionUtils.validateConfig();
      if (configValidation.isValid) {
        this.addResult('Encryption Config', 'pass', 'Configuration is valid');
      } else {
        this.addResult('Encryption Config', 'fail', 'Configuration is invalid', {
          errors: configValidation.errors,
        });
      }

      // Test data encryption
      const encryption = new DataEncryption();
      const testData = 'This is a test string for encryption validation';
      
      const encrypted = await encryption.encrypt(testData);
      const decrypted = await encryption.decrypt(encrypted);
      
      if (decrypted === testData) {
        const duration = performance.now() - start;
        this.addResult('Data Encryption', 'pass', 'Encrypt/decrypt cycle successful', null, duration);
      } else {
        this.addResult('Data Encryption', 'fail', 'Encrypt/decrypt cycle failed', {
          original: testData,
          decrypted: decrypted,
        });
      }

      // Test object encryption
      const testObject = { id: 1, name: 'Test User', email: 'test@example.com' };
      const encryptedObj = await encryption.encryptObject(testObject);
      const decryptedObj = await encryption.decryptObject(encryptedObj);
      
      if (JSON.stringify(decryptedObj) === JSON.stringify(testObject)) {
        this.addResult('Object Encryption', 'pass', 'Object encrypt/decrypt successful');
      } else {
        this.addResult('Object Encryption', 'fail', 'Object encrypt/decrypt failed');
      }

      // Test hash generation and verification
      const hash = encryption.generateHash(testData);
      const hashValid = encryption.verifyHash(testData, hash);
      
      if (hashValid) {
        this.addResult('Hash Functions', 'pass', 'Hash generation and verification working');
      } else {
        this.addResult('Hash Functions', 'fail', 'Hash verification failed');
      }

    } catch (error) {
      this.addResult('Encryption', 'fail', 'Encryption test failed', { error: error.message });
    }
  }

  /**
   * Validates field encryption
   */
  async validateFieldEncryption(): Promise<void> {
    console.log(chalk.blue.bold('\n🏷️ Validating Field Encryption...\n'));

    try {
      const start = performance.now();

      // Validate field encryption configuration
      const configValidation = fieldEncryption.validateFieldEncryption();
      if (configValidation.isValid) {
        this.addResult('Field Encryption Config', 'pass', 'Configuration is valid');
      } else {
        this.addResult('Field Encryption Config', 'fail', 'Configuration is invalid', {
          errors: configValidation.errors,
        });
      }

      // Test PII field encryption
      const testEmail = 'user@example.com';
      const encryptedEmail = await fieldEncryption.encryptField('email', testEmail, { auditLog: false });
      const decryptedEmail = await fieldEncryption.decryptField(encryptedEmail, { auditLog: false });
      
      if (decryptedEmail === testEmail) {
        const duration = performance.now() - start;
        this.addResult('PII Field Encryption', 'pass', 'PII field encryption working', null, duration);
      } else {
        this.addResult('PII Field Encryption', 'fail', 'PII field encryption failed');
      }

      // Test searchable field hashing
      if (encryptedEmail.hash) {
        const searchHash = await fieldEncryption.createSearchHash('email', testEmail);
        if (searchHash === encryptedEmail.hash) {
          this.addResult('Searchable Hashing', 'pass', 'Searchable field hashing working');
        } else {
          this.addResult('Searchable Hashing', 'fail', 'Searchable field hashing failed');
        }
      } else {
        this.addResult('Searchable Hashing', 'warning', 'Email field should be searchable but no hash generated');
      }

      // Test user data encryption
      const userData = {
        email: 'test@example.com',
        phone: '+1234567890',
        name: 'Test User',
        age: 30,
      };

      const encryptedUserData = await fieldEncryption.encryptUserFields(userData, { auditLog: false });
      const decryptedUserData = await fieldEncryption.decryptUserFields(encryptedUserData, { auditLog: false });

      if (decryptedUserData.email === userData.email && decryptedUserData.phone === userData.phone) {
        this.addResult('User Data Encryption', 'pass', 'User data encryption working');
      } else {
        this.addResult('User Data Encryption', 'fail', 'User data encryption failed');
      }

    } catch (error) {
      this.addResult('Field Encryption', 'fail', 'Field encryption test failed', { error: error.message });
    }
  }

  /**
   * Validates crypto utilities
   */
  async validateCryptoUtils(): Promise<void> {
    console.log(chalk.blue.bold('\n🔧 Validating Crypto Utilities...\n'));

    try {
      const start = performance.now();

      // Validate crypto configuration
      const configValidation = CryptoUtils.validateCryptoConfig();
      if (configValidation.isValid) {
        this.addResult('Crypto Config', 'pass', 'Crypto configuration is valid');
      } else {
        this.addResult('Crypto Config', 'fail', 'Crypto configuration is invalid', {
          errors: configValidation.errors,
        });
      }

      // Test secure token generation
      const token = await CryptoUtils.generateSecureToken(32);
      if (token && token.length === 64) { // 32 bytes = 64 hex characters
        this.addResult('Token Generation', 'pass', 'Secure token generation working');
      } else {
        this.addResult('Token Generation', 'fail', 'Secure token generation failed');
      }

      // Test HMAC operations
      const data = 'test data for HMAC';
      const secret = 'secret key';
      const hmac = await CryptoUtils.createHMAC(data, secret);
      const hmacValid = await CryptoUtils.verifyHMAC(data, hmac, secret);
      
      if (hmacValid) {
        this.addResult('HMAC Operations', 'pass', 'HMAC create/verify working');
      } else {
        this.addResult('HMAC Operations', 'fail', 'HMAC verification failed');
      }

      // Test password hashing
      const password = 'testPassword123';
      const { hash, salt } = await CryptoHelpers.hashPassword(password);
      const passwordValid = await CryptoHelpers.verifyPassword(password, hash, salt);
      
      if (passwordValid) {
        const duration = performance.now() - start;
        this.addResult('Password Hashing', 'pass', 'Password hash/verify working', null, duration);
      } else {
        this.addResult('Password Hashing', 'fail', 'Password verification failed');
      }

      // Test API key generation
      const apiKey = await CryptoUtils.generateAPIKey('tx');
      const apiKeyValid = CryptoUtils.validateAPIKey(apiKey, 'tx');
      
      if (apiKeyValid) {
        this.addResult('API Key Generation', 'pass', 'API key generation/validation working');
      } else {
        this.addResult('API Key Generation', 'fail', 'API key validation failed');
      }

    } catch (error) {
      this.addResult('Crypto Utils', 'fail', 'Crypto utilities test failed', { error: error.message });
    }
  }

  /**
   * Validates security headers
   */
  async validateSecurityHeaders(): Promise<void> {
    console.log(chalk.blue.bold('\n🛡️ Validating Security Headers...\n'));

    try {
      // Test different environment presets
      const environments: Array<'development' | 'staging' | 'production'> = ['development', 'staging', 'production'];
      
      for (const env of environments) {
        const headers = env === 'development' 
          ? SecurityHeadersPresets.development
          : env === 'staging' 
            ? SecurityHeadersPresets.staging 
            : SecurityHeadersPresets.production;

        const validation = headers.validateConfiguration();
        if (validation.isValid) {
          this.addResult(`Security Headers (${env})`, 'pass', `${env} headers configuration is valid`);
        } else {
          this.addResult(`Security Headers (${env})`, 'warning', `${env} headers have warnings`, {
            errors: validation.errors,
          });
        }
      }

      // Test CSP header generation
      const productionHeaders = SecurityHeadersPresets.production;
      const mockResponse = {
        headers: new Map(),
        set: function(key: string, value: string) { this.headers.set(key, value); return this; }
      } as any;

      productionHeaders.apply(mockResponse);
      
      const cspHeader = mockResponse.headers.get('Content-Security-Policy');
      if (cspHeader && cspHeader.includes('default-src')) {
        this.addResult('CSP Generation', 'pass', 'CSP header generation working');
      } else {
        this.addResult('CSP Generation', 'fail', 'CSP header not generated properly');
      }

      // Validate specific security headers
      const expectedHeaders = [
        'Content-Security-Policy',
        'X-Frame-Options',
        'X-Content-Type-Options',
        'Referrer-Policy',
      ];

      let missingHeaders = [];
      for (const header of expectedHeaders) {
        if (mockResponse.headers.has(header)) {
          this.addResult('Header Presence', 'pass', `${header} header is present`);
        } else {
          missingHeaders.push(header);
        }
      }

      if (missingHeaders.length > 0) {
        this.addResult('Header Presence', 'fail', 'Some security headers are missing', {
          missingHeaders,
        });
      }

    } catch (error) {
      this.addResult('Security Headers', 'fail', 'Security headers test failed', { error: error.message });
    }
  }

  /**
   * Validates security middleware
   */
  async validateSecurityMiddleware(): Promise<void> {
    console.log(chalk.blue.bold('\n🚨 Validating Security Middleware...\n'));

    try {
      // Test different environment presets
      const environments: Array<'development' | 'staging' | 'production'> = ['development', 'staging', 'production'];
      
      for (const env of environments) {
        let middleware: SecurityMiddleware;
        
        try {
          middleware = env === 'development' 
            ? SecurityMiddlewarePresets.development
            : env === 'staging' 
              ? SecurityMiddlewarePresets.staging 
              : SecurityMiddlewarePresets.production;

          const validation = middleware.validateConfiguration();
          if (validation.isValid) {
            this.addResult(`Security Middleware (${env})`, 'pass', `${env} middleware configuration is valid`);
          } else {
            this.addResult(`Security Middleware (${env})`, 'warning', `${env} middleware has warnings`, {
              errors: validation.errors,
            });
          }
        } catch (error) {
          this.addResult(`Security Middleware (${env})`, 'fail', `Failed to initialize ${env} middleware`, {
            error: error.message,
          });
        }
      }

      // Test rate limiting logic (without actually making requests)
      const devMiddleware = SecurityMiddlewarePresets.development;
      const stats = devMiddleware.getSecurityStats();
      
      this.addResult('Middleware Stats', 'pass', 'Security middleware stats accessible', {
        totalEvents: stats.totalEvents,
        eventTypes: Object.keys(stats.eventsByType).length,
      });

    } catch (error) {
      this.addResult('Security Middleware', 'fail', 'Security middleware test failed', { error: error.message });
    }
  }

  /**
   * Runs performance benchmarks
   */
  async runPerformanceBenchmarks(): Promise<void> {
    console.log(chalk.blue.bold('\n⚡ Running Performance Benchmarks...\n'));

    try {
      const iterations = 100;
      
      // Benchmark encryption
      const encryption = new DataEncryption();
      const testData = 'Performance test data string for encryption benchmarking';
      
      const encryptStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        await encryption.encrypt(testData);
      }
      const encryptDuration = (performance.now() - encryptStart) / iterations;
      
      if (encryptDuration < 10) { // Less than 10ms average
        this.addResult('Encryption Performance', 'pass', `Encryption: ${encryptDuration.toFixed(2)}ms avg`);
      } else {
        this.addResult('Encryption Performance', 'warning', `Encryption slow: ${encryptDuration.toFixed(2)}ms avg`);
      }

      // Benchmark field encryption
      const fieldEncryptStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        await fieldEncryption.encryptField('email', 'test@example.com', { auditLog: false });
      }
      const fieldEncryptDuration = (performance.now() - fieldEncryptStart) / iterations;
      
      if (fieldEncryptDuration < 15) { // Less than 15ms average
        this.addResult('Field Encryption Performance', 'pass', `Field encryption: ${fieldEncryptDuration.toFixed(2)}ms avg`);
      } else {
        this.addResult('Field Encryption Performance', 'warning', `Field encryption slow: ${fieldEncryptDuration.toFixed(2)}ms avg`);
      }

      // Benchmark crypto utilities
      const tokenStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        await CryptoUtils.generateSecureToken(32);
      }
      const tokenDuration = (performance.now() - tokenStart) / iterations;
      
      if (tokenDuration < 5) { // Less than 5ms average
        this.addResult('Token Generation Performance', 'pass', `Token generation: ${tokenDuration.toFixed(2)}ms avg`);
      } else {
        this.addResult('Token Generation Performance', 'warning', `Token generation slow: ${tokenDuration.toFixed(2)}ms avg`);
      }

    } catch (error) {
      this.addResult('Performance Benchmarks', 'fail', 'Performance benchmarks failed', { error: error.message });
    }
  }

  /**
   * Displays final summary
   */
  displaySummary(): void {
    console.log(chalk.blue.bold('\n📊 Validation Summary\n'));

    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    const total = this.results.length;

    console.log(`${chalk.green('✅ Passed')}: ${passed}/${total}`);
    console.log(`${chalk.red('❌ Failed')}: ${failed}/${total}`);
    console.log(`${chalk.yellow('⚠️ Warnings')}: ${warnings}/${total}`);

    if (failed > 0) {
      console.log(chalk.red.bold('\n🚨 Critical Issues Found:'));
      this.results
        .filter(r => r.status === 'fail')
        .forEach(result => {
          console.log(`   ${chalk.red('•')} ${result.component}: ${result.message}`);
        });
    }

    if (warnings > 0) {
      console.log(chalk.yellow.bold('\n⚠️ Warnings:'));
      this.results
        .filter(r => r.status === 'warning')
        .forEach(result => {
          console.log(`   ${chalk.yellow('•')} ${result.component}: ${result.message}`);
        });
    }

    const overallStatus = failed === 0 ? 'PASS' : 'FAIL';
    const statusColor = failed === 0 ? chalk.green : chalk.red;
    
    console.log(`\n${statusColor.bold(`Overall Status: ${overallStatus}`)}`);
    
    if (failed === 0) {
      console.log(chalk.green('🎉 All security components are properly configured and working!'));
    } else {
      console.log(chalk.red('🔧 Please address the failed validations before deploying to production.'));
    }
  }

  /**
   * Runs all validations
   */
  async runAll(): Promise<void> {
    console.log(chalk.blue.bold('🔒 Taxomind LMS Security Validation'));
    console.log(chalk.gray('Testing all security components and configurations...\n'));

    const start = performance.now();

    // Run all validation steps
    for (const result of this.results) {
      this.logResult(result);
    }

    await this.validateEnvironment();
    for (const result of this.results.slice(-10)) { // Show last 10 results
      this.logResult(result);
    }

    await this.validateEncryption();
    for (const result of this.results.slice(-10)) {
      this.logResult(result);
    }

    await this.validateFieldEncryption();
    for (const result of this.results.slice(-10)) {
      this.logResult(result);
    }

    await this.validateCryptoUtils();
    for (const result of this.results.slice(-10)) {
      this.logResult(result);
    }

    await this.validateSecurityHeaders();
    for (const result of this.results.slice(-10)) {
      this.logResult(result);
    }

    await this.validateSecurityMiddleware();
    for (const result of this.results.slice(-10)) {
      this.logResult(result);
    }

    await this.runPerformanceBenchmarks();
    for (const result of this.results.slice(-10)) {
      this.logResult(result);
    }

    const duration = performance.now() - start;
    console.log(chalk.gray(`\nValidation completed in ${duration.toFixed(2)}ms\n`));

    this.displaySummary();
  }
}

/**
 * Main execution
 */
async function main() {
  const validator = new SecurityValidator();
  
  try {
    await validator.runAll();
    
    // Exit with appropriate code
    const hasFailures = validator['results'].some(r => r.status === 'fail');
    process.exit(hasFailures ? 1 : 0);
    
  } catch (error) {
    console.error(chalk.red.bold('\n💥 Validation script failed:'));
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { SecurityValidator };

/**
 * Usage Examples:
 * 
 * # Run all validations
 * npx ts-node scripts/validate-security.ts
 * 
 * # Run in CI/CD pipeline
 * npm run security:validate
 * 
 * # Add to package.json:
 * {
 *   "scripts": {
 *     "security:validate": "ts-node scripts/validate-security.ts"
 *   }
 * }
 */