/**
 * Test utility for verifying rate limiting implementation
 * This file can be used to test rate limiting functionality during development
 */

import { rateLimitAuth, AuthEndpoint, AUTH_RATE_LIMITS } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

interface RateLimitTestResult {
  endpoint: AuthEndpoint;
  identifier: string;
  success: boolean;
  remaining: number;
  reset: number;
  retryAfter?: number;
  testNumber: number;
}

/**
 * Test rate limiting for a specific endpoint
 * @param endpoint - The authentication endpoint to test
 * @param identifier - The identifier to use for testing
 * @param numberOfRequests - Number of requests to make for testing
 */
export async function testRateLimit(
  endpoint: AuthEndpoint,
  identifier: string,
  numberOfRequests: number = 10
): Promise<RateLimitTestResult[]> {
  const results: RateLimitTestResult[] = [];
  const config = AUTH_RATE_LIMITS[endpoint];
  
  logger.info(`Testing rate limiting for ${endpoint}`, {
    endpoint,
    identifier,
    numberOfRequests,
    limit: config.requests,
    window: config.window
  });
  
  for (let i = 1; i <= numberOfRequests; i++) {
    try {
      const result = await rateLimitAuth(endpoint, `test:${identifier}`);
      
      const testResult: RateLimitTestResult = {
        endpoint,
        identifier,
        success: result.success,
        remaining: result.remaining,
        reset: result.reset,
        retryAfter: result.retryAfter,
        testNumber: i
      };
      
      results.push(testResult);
      
      logger.debug(`Test ${i}/${numberOfRequests}`, testResult);
      
      // Add a small delay between requests to simulate real usage
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error: any) {
      logger.error(`Test ${i} failed:`, error);
    }
  }
  
  return results;
}

/**
 * Test all authentication endpoints with rate limiting
 */
export async function testAllEndpoints(): Promise<Record<AuthEndpoint, RateLimitTestResult[]>> {
  const results: Record<AuthEndpoint, RateLimitTestResult[]> = {
    login: [],
    register: [],
    reset: [],
    verify: [],
    twoFactor: [],
    'mfa-recovery': [],
    'mfa-disable': [],
    'mfa-setup': [],
    'mfa-verify': []
  };
  
  const testIdentifier = `test-user-${Date.now()}`;
  
  for (const endpoint of Object.keys(AUTH_RATE_LIMITS) as AuthEndpoint[]) {
    const config = AUTH_RATE_LIMITS[endpoint];
    const testRequests = config.requests + 3; // Test beyond the limit
    
    logger.info(`Testing ${endpoint} endpoint...`);
    results[endpoint] = await testRateLimit(endpoint, testIdentifier, testRequests);
  }
  
  return results;
}

/**
 * Display test results in a readable format
 * @param results - Test results to display
 */
export function displayTestResults(results: Record<AuthEndpoint, RateLimitTestResult[]>): void {
  console.log('\n=== Rate Limiting Test Results ===\n');
  
  for (const [endpoint, endpointResults] of Object.entries(results)) {
    const config = AUTH_RATE_LIMITS[endpoint as AuthEndpoint];
    console.log(`📊 ${endpoint.toUpperCase()} (${config.requests} requests per ${config.window}):`);
    
    let successCount = 0;
    let firstFailure = -1;
    
    endpointResults.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      const retryInfo = result.retryAfter ? ` (retry in ${result.retryAfter}s)` : '';
      
      console.log(`  ${result.testNumber}: ${status} Remaining: ${result.remaining}${retryInfo}`);
      
      if (result.success) {
        successCount++;
      } else if (firstFailure === -1) {
        firstFailure = index + 1;
      }
    });
    
    console.log(`  📈 Summary: ${successCount}/${endpointResults.length} requests succeeded`);
    if (firstFailure > 0) {
      console.log(`  🚫 First failure at request #${firstFailure}`);
    }
    console.log('');
  }
}

/**
 * Run a comprehensive rate limiting test
 */
export async function runRateLimitingTests(): Promise<void> {
  logger.info('Starting comprehensive rate limiting tests...');
  
  try {
    const results = await testAllEndpoints();
    displayTestResults(results);
    
    // Test recovery after rate limit expires (for endpoints with short windows)
    logger.info('Testing rate limit recovery for twoFactor endpoint (5 minute window)...');
    console.log('\n🔄 Testing rate limit recovery (this may take a few minutes)...');
    
    // Make requests to exceed the limit
    const testId = `recovery-test-${Date.now()}`;
    await testRateLimit('twoFactor', testId, 7); // Exceed the 5 request limit
    
    console.log('Waiting 30 seconds for partial recovery...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Test if some requests are allowed after partial time window
    const recoveryResults = await testRateLimit('twoFactor', testId, 2);
    console.log('\n📊 Recovery test results:');
    recoveryResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`  Request: ${status} Remaining: ${result.remaining}`);
    });
    
    logger.info('Rate limiting tests completed successfully');
  } catch (error: any) {
    logger.error('Rate limiting tests failed:', error);
  }
}

// Helper function to run tests from command line or development environment
if (require.main === module) {
  runRateLimitingTests().catch(console.error);
}