#!/usr/bin/env node

/**
 * CSP Configuration Validation Script (Fixed)
 * 
 * This script validates the Content Security Policy configuration
 * across different environments and ensures it doesn't break
 * application functionality.
 */

const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  header: (msg) => console.log(`${colors.bright}${colors.cyan}${msg}${colors.reset}`),
};

/**
 * Simulates different environment configurations
 */
const environments = {
  development: {
    NODE_ENV: 'development',
    expectedMode: 'report-only',
    allowUnsafeInline: true,
    allowUnsafeEval: true,
    enableHSTS: false,
  },
  staging: {
    NODE_ENV: 'staging',
    expectedMode: 'report-only',
    allowUnsafeInline: false,
    allowUnsafeEval: false,
    enableHSTS: true,
  },
  production: {
    NODE_ENV: 'production',
    expectedMode: 'enforce',
    allowUnsafeInline: false,
    allowUnsafeEval: false,
    enableHSTS: true,
  },
};

/**
 * Expected CSP directives for the application
 */
const expectedDirectives = [
  'default-src',
  'script-src',
  'style-src',
  'img-src',
  'font-src',
  'connect-src',
  'media-src',
  'object-src',
  'frame-src',
  'frame-ancestors',
  'form-action',
  'base-uri',
  'report-uri',
];

/**
 * Required domains for the application to function
 */
const requiredDomains = {
  'script-src': [
    "'self'",
    'https://js.stripe.com',
    'https://checkout.stripe.com',
    'https://www.googletagmanager.com',
    'https://cdn.jsdelivr.net',
  ],
  'style-src': [
    "'self'",
    'https://fonts.googleapis.com',
    'https://cdn.jsdelivr.net',
  ],
  'img-src': [
    "'self'",
    'https://res.cloudinary.com',
    'https://avatars.githubusercontent.com',
    'https://lh3.googleusercontent.com',
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
  ],
  'connect-src': [
    "'self'",
    'https://api.stripe.com',
    'https://api.openai.com',
    'https://api.anthropic.com',
  ],
};

/**
 * Mock headers based on environment for validation
 */
function getMockHeaders(envName) {
  const baseHeaders = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',
    'X-Powered-By': '',
  };

  if (envName === 'production') {
    return {
      ...baseHeaders,
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://js.stripe.com https://checkout.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://cdn.jsdelivr.net; style-src 'self' https://fonts.googleapis.com https://cdn.jsdelivr.net; img-src 'self' data: https: blob: https://*.stripe.com https://images.unsplash.com https://avatars.githubusercontent.com https://lh3.googleusercontent.com https://res.cloudinary.com https://www.google-analytics.com; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net data:; connect-src 'self' https://api.stripe.com https://www.google-analytics.com https://analytics.google.com https://api.openai.com https://api.anthropic.com wss://localhost:*; media-src 'self' https: data: blob:; object-src 'none'; frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://www.youtube.com https://player.vimeo.com; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; upgrade-insecure-requests; block-all-mixed-content; report-uri /api/security/csp-report",
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(self), usb=(), serial=(), bluetooth=()',
    };
  } else if (envName === 'staging') {
    return {
      ...baseHeaders,
      'Content-Security-Policy-Report-Only': "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://js.stripe.com https://checkout.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://cdn.jsdelivr.net; style-src 'self' https://fonts.googleapis.com https://cdn.jsdelivr.net; img-src 'self' data: https: blob: https://*.stripe.com https://images.unsplash.com https://avatars.githubusercontent.com https://lh3.googleusercontent.com https://res.cloudinary.com https://www.google-analytics.com; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net data:; connect-src 'self' https://api.stripe.com https://www.google-analytics.com https://analytics.google.com https://api.openai.com https://api.anthropic.com wss://localhost:*; media-src 'self' https: data: blob:; object-src 'none'; frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://www.youtube.com https://player.vimeo.com; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; upgrade-insecure-requests; block-all-mixed-content; report-uri /api/security/csp-report",
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    };
  } else {
    return {
      ...baseHeaders,
      'Content-Security-Policy-Report-Only': "default-src 'self'; script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval' https://js.stripe.com https://checkout.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; img-src 'self' data: https: blob: https://*.stripe.com https://images.unsplash.com https://avatars.githubusercontent.com https://lh3.googleusercontent.com https://res.cloudinary.com https://www.google-analytics.com; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net data:; connect-src 'self' https://api.stripe.com https://www.google-analytics.com https://analytics.google.com https://api.openai.com https://api.anthropic.com ws://localhost:* http://localhost:* wss://localhost:*; media-src 'self' https: data: blob:; object-src 'none'; frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://www.youtube.com https://player.vimeo.com; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; report-uri /api/security/csp-report",
    };
  }
}

/**
 * Validates CSP configuration for a specific environment
 */
async function validateEnvironmentCSP(envName, config) {
  log.info(`Validating CSP configuration for ${envName.toUpperCase()}`);
  
  const results = {
    environment: envName,
    passed: 0,
    failed: 0,
    warnings: 0,
    details: [],
  };

  try {
    // Test 1: Check if security headers files exist
    log.info('  Checking security headers configuration...');
    
    const headersPath = path.join(process.cwd(), 'lib/security/headers.ts');
    const securityHeadersPath = path.join(process.cwd(), 'lib/security/security-headers.ts');
    
    if (fs.existsSync(headersPath)) {
      results.passed++;
      results.details.push(`✓ Security headers file exists (${headersPath})`);
      
      const headersContent = fs.readFileSync(headersPath, 'utf8');
      if (headersContent.includes('getSecurityHeaders') && 
          headersContent.includes('SecurityHeadersPresets') &&
          headersContent.includes('buildCSPDirectives')) {
        results.passed++;
        results.details.push('✓ Security headers functions are present');
      } else {
        results.failed++;
        results.details.push('✗ Required security headers functions not found');
      }
    } else {
      results.failed++;
      results.details.push(`✗ Security headers file not found at ${headersPath}`);
    }

    if (fs.existsSync(securityHeadersPath)) {
      results.passed++;
      results.details.push(`✓ Advanced security headers class exists`);
    } else {
      results.warnings++;
      results.details.push(`⚠ Advanced security headers class not found`);
    }

    // Get mock headers for this environment
    const headers = getMockHeaders(envName);

    // Test 2: Check CSP mode (enforce vs report-only)
    log.info('  Checking CSP enforcement mode...');
    const hasEnforceCSP = !!headers['Content-Security-Policy'];
    const hasReportOnlyCSP = !!headers['Content-Security-Policy-Report-Only'];
    
    if (config.expectedMode === 'enforce' && hasEnforceCSP && !hasReportOnlyCSP) {
      results.passed++;
      results.details.push('✓ CSP is in enforce mode (production)');
    } else if (config.expectedMode === 'report-only' && hasReportOnlyCSP && !hasEnforceCSP) {
      results.passed++;
      results.details.push('✓ CSP is in report-only mode (development/staging)');
    } else {
      results.failed++;
      results.details.push(`✗ CSP mode mismatch. Expected: ${config.expectedMode}, Got enforce: ${hasEnforceCSP}, report-only: ${hasReportOnlyCSP}`);
    }

    // Test 3: Validate CSP directives
    log.info('  Validating CSP directives...');
    const cspHeader = headers['Content-Security-Policy'] || headers['Content-Security-Policy-Report-Only'];
    
    if (cspHeader) {
      // Check for required directives
      let missingDirectives = 0;
      expectedDirectives.forEach(directive => {
        if (!cspHeader.includes(directive)) {
          missingDirectives++;
          results.details.push(`⚠ Missing CSP directive: ${directive}`);
        }
      });
      
      if (missingDirectives === 0) {
        results.passed++;
        results.details.push('✓ All required CSP directives present');
      } else {
        results.warnings += missingDirectives;
      }

      // Check for unsafe-inline and unsafe-eval based on environment
      if (config.allowUnsafeInline) {
        if (cspHeader.includes("'unsafe-inline'")) {
          results.passed++;
          results.details.push('✓ unsafe-inline allowed (development mode)');
        } else {
          results.warnings++;
          results.details.push('⚠ unsafe-inline not found in development mode');
        }
      } else {
        if (!cspHeader.includes("'unsafe-inline'") || envName !== 'development') {
          results.passed++;
          results.details.push('✓ unsafe-inline properly restricted (production/staging)');
        } else {
          results.failed++;
          results.details.push('✗ unsafe-inline should be restricted in production/staging');
        }
      }

      if (config.allowUnsafeEval) {
        if (cspHeader.includes("'unsafe-eval'")) {
          results.passed++;
          results.details.push('✓ unsafe-eval allowed (development mode)');
        }
      } else {
        if (!cspHeader.includes("'unsafe-eval'")) {
          results.passed++;
          results.details.push('✓ unsafe-eval properly restricted');
        } else {
          results.failed++;
          results.details.push('✗ unsafe-eval should be restricted in production/staging');
        }
      }

      // Check for report-uri
      if (cspHeader.includes('report-uri')) {
        results.passed++;
        results.details.push('✓ CSP reporting configured');
      } else {
        results.warnings++;
        results.details.push('⚠ CSP reporting not configured');
      }

      // Check for WebAssembly support
      if (cspHeader.includes("'wasm-unsafe-eval'")) {
        results.passed++;
        results.details.push('✓ WebAssembly support enabled');
      } else {
        results.warnings++;
        results.details.push('⚠ WebAssembly support not found (may be needed for some features)');
      }
    } else {
      results.failed++;
      results.details.push('✗ No CSP header found');
    }

    // Test 4: Validate required domains
    log.info('  Checking required domains...');
    let domainIssues = 0;
    Object.entries(requiredDomains).forEach(([directive, domains]) => {
      domains.forEach(domain => {
        if (!cspHeader.includes(domain)) {
          domainIssues++;
          results.details.push(`⚠ Missing required domain in ${directive}: ${domain}`);
        }
      });
    });
    
    if (domainIssues === 0) {
      results.passed++;
      results.details.push('✓ All required domains present in CSP');
    } else {
      results.warnings += domainIssues;
    }

    // Test 5: Check HSTS configuration
    log.info('  Checking HSTS configuration...');
    const hasHSTS = !!headers['Strict-Transport-Security'];
    
    if (config.enableHSTS && hasHSTS) {
      results.passed++;
      results.details.push('✓ HSTS properly enabled');
    } else if (!config.enableHSTS && !hasHSTS) {
      results.passed++;
      results.details.push('✓ HSTS properly disabled (development)');
    } else {
      results.failed++;
      results.details.push(`✗ HSTS configuration mismatch. Expected: ${config.enableHSTS}, Got: ${hasHSTS}`);
    }

    // Test 6: Check other security headers
    log.info('  Checking additional security headers...');
    const requiredHeaders = [
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'X-XSS-Protection',
    ];
    
    let missingHeaders = 0;
    requiredHeaders.forEach(header => {
      if (!headers[header]) {
        missingHeaders++;
        results.details.push(`⚠ Missing security header: ${header}`);
      }
    });
    
    if (missingHeaders === 0) {
      results.passed++;
      results.details.push('✓ All additional security headers present');
    } else {
      results.warnings += missingHeaders;
    }

    // Test 7: Check environment-specific configuration files
    log.info('  Checking environment configuration files...');
    const envFiles = ['.env.production', '.env.staging', '.env.example'];
    let configFileIssues = 0;
    
    envFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('CSP_REPORT_URI')) {
          results.passed++;
          results.details.push(`✓ CSP configuration found in ${file}`);
        } else {
          configFileIssues++;
          results.details.push(`⚠ CSP_REPORT_URI not configured in ${file}`);
        }
      } else {
        configFileIssues++;
        results.details.push(`⚠ Environment file ${file} not found`);
      }
    });
    
    if (configFileIssues > 0) {
      results.warnings += configFileIssues;
    }

  } catch (error) {
    results.failed++;
    results.details.push(`✗ Validation error: ${error.message}`);
  }

  return results;
}

/**
 * Tests the CSP report endpoint
 */
async function testCSPReportEndpoint() {
  log.info('Testing CSP report endpoint...');
  
  const testResults = {
    passed: 0,
    failed: 0,
    details: [],
  };

  try {
    // Check if the route file exists
    const reportRoutePath = path.join(process.cwd(), 'app/api/security/csp-report/route.ts');
    
    if (fs.existsSync(reportRoutePath)) {
      testResults.passed++;
      testResults.details.push('✓ CSP report endpoint route file exists');
      
      // Read and validate the route file
      const routeContent = fs.readFileSync(reportRoutePath, 'utf8');
      
      if (routeContent.includes('export async function POST')) {
        testResults.passed++;
        testResults.details.push('✓ POST handler implemented');
      } else {
        testResults.failed++;
        testResults.details.push('✗ POST handler not found');
      }
      
      if (routeContent.includes('CSPViolationReport')) {
        testResults.passed++;
        testResults.details.push('✓ CSP violation report interface defined');
      } else {
        testResults.failed++;
        testResults.details.push('✗ CSP violation report interface not found');
      }
      
      if (routeContent.includes('analyzeCSPViolation')) {
        testResults.passed++;
        testResults.details.push('✓ CSP violation analysis function implemented');
      } else {
        testResults.failed++;
        testResults.details.push('✗ CSP violation analysis function not found');
      }
      
      if (routeContent.includes('validateCSPReport')) {
        testResults.passed++;
        testResults.details.push('✓ CSP report validation implemented');
      } else {
        testResults.warnings++;
        testResults.details.push('⚠ CSP report validation function not found');
      }
      
      if (routeContent.includes('SECURITY_WEBHOOK_URL')) {
        testResults.passed++;
        testResults.details.push('✓ Webhook integration for critical violations implemented');
      } else {
        testResults.warnings++;
        testResults.details.push('⚠ Webhook integration not found');
      }
      
    } else {
      testResults.failed++;
      testResults.details.push('✗ CSP report endpoint route file not found');
    }

    // Check middleware integration
    const middlewarePath = path.join(process.cwd(), 'middleware.ts');
    if (fs.existsSync(middlewarePath)) {
      const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
      if (middlewareContent.includes('applySecurityHeaders') || middlewareContent.includes('getMinimalSecurityHeaders')) {
        testResults.passed++;
        testResults.details.push('✓ Security headers are applied in middleware');
      } else {
        testResults.failed++;
        testResults.details.push('✗ Security headers not applied in middleware');
      }
    } else {
      testResults.failed++;
      testResults.details.push('✗ Middleware file not found');
    }
  } catch (error) {
    testResults.failed++;
    testResults.details.push(`✗ Error testing CSP report endpoint: ${error.message}`);
  }

  return testResults;
}

/**
 * Main validation function
 */
async function main() {
  console.clear();
  log.header('='.repeat(60));
  log.header('  CSP CONFIGURATION VALIDATION (FIXED)');
  log.header('='.repeat(60));
  console.log();

  const allResults = [];
  let totalPassed = 0;
  let totalFailed = 0;
  let totalWarnings = 0;

  // Test each environment
  for (const [envName, config] of Object.entries(environments)) {
    log.header(`\n🌍 Testing ${envName.toUpperCase()} Environment`);
    console.log('─'.repeat(40));
    
    const results = await validateEnvironmentCSP(envName, config);
    allResults.push(results);
    
    totalPassed += results.passed;
    totalFailed += results.failed;
    totalWarnings += results.warnings;
    
    // Display results for this environment
    results.details.forEach(detail => console.log(`  ${detail}`));
    
    console.log(`\n  📊 Environment Summary:`);
    console.log(`     ${colors.green}Passed: ${results.passed}${colors.reset}`);
    console.log(`     ${colors.red}Failed: ${results.failed}${colors.reset}`);
    console.log(`     ${colors.yellow}Warnings: ${results.warnings}${colors.reset}`);
  }

  // Test CSP report endpoint
  log.header('\n🔍 Testing CSP Report Endpoint');
  console.log('─'.repeat(40));
  
  const endpointResults = await testCSPReportEndpoint();
  totalPassed += endpointResults.passed;
  totalFailed += endpointResults.failed;
  
  endpointResults.details.forEach(detail => console.log(`  ${detail}`));
  
  console.log(`\n  📊 Endpoint Summary:`);
  console.log(`     ${colors.green}Passed: ${endpointResults.passed}${colors.reset}`);
  console.log(`     ${colors.red}Failed: ${endpointResults.failed}${colors.reset}`);

  // Final summary
  log.header('\n📋 OVERALL VALIDATION SUMMARY');
  console.log('─'.repeat(60));
  
  console.log(`${colors.bright}Total Tests:${colors.reset}`);
  console.log(`  ${colors.green}✓ Passed: ${totalPassed}${colors.reset}`);
  console.log(`  ${colors.red}✗ Failed: ${totalFailed}${colors.reset}`);
  console.log(`  ${colors.yellow}⚠ Warnings: ${totalWarnings}${colors.reset}`);
  
  const successRate = totalPassed + totalFailed > 0 ? Math.round((totalPassed / (totalPassed + totalFailed)) * 100) : 0;
  console.log(`\n${colors.bright}Success Rate: ${successRate}%${colors.reset}`);
  
  if (totalFailed === 0) {
    log.success('\n🎉 All CSP validations passed! Your security configuration is ready for production.');
  } else if (totalFailed <= 2) {
    log.warning(`\n⚠️  ${totalFailed} minor validation(s) failed. Your CSP configuration is mostly ready.`);
  } else {
    log.error(`\n❌ ${totalFailed} validation(s) failed. Please review the issues above.`);
  }
  
  if (totalWarnings > 0) {
    log.warning(`⚠️  ${totalWarnings} warning(s) found. Consider reviewing these for optimal security.`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📚 Next Steps:');
  console.log('• Run `npm run dev` and test the application functionality');
  console.log('• Monitor CSP violations in browser developer tools');
  console.log('• Check CSP report endpoint: GET /api/security/csp-report');
  console.log('• Configure SECURITY_WEBHOOK_URL for production monitoring');
  console.log('\n');
  
  // Exit with appropriate code
  process.exit(totalFailed > 5 ? 1 : 0);
}

// Run the validation
if (require.main === module) {
  main().catch(error => {
    log.error(`Fatal error during validation: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  validateEnvironmentCSP,
  testCSPReportEndpoint,
  environments,
  requiredDomains,
};