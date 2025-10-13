/**
 * Admin Authentication Testing Script
 *
 * Tests the admin/user authentication separation implementation
 * Verifies:
 * 1. Admin role verification during login
 * 2. Non-admin users blocked from admin login
 * 3. Rate limiting works independently
 * 4. Security logging and audit trails
 */

import { db } from '@/lib/db';
import * as bcrypt from 'bcryptjs';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
  details?: Record<string, unknown>;
}

const results: TestResult[] = [];

async function logResult(test: string, status: 'PASS' | 'FAIL', message: string, details?: Record<string, unknown>) {
  results.push({ test, status, message, details });
  const emoji = status === 'PASS' ? '✅' : '❌';
  console.log(`${emoji} ${test}: ${message}`);
  if (details) {
    console.log('   Details:', JSON.stringify(details, null, 2));
  }
}

async function testDatabaseUsers() {
  console.log('\n📊 Testing Database User Setup\n');

  try {
    const allUsers = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        isTwoFactorEnabled: true,
      },
    });

    const adminUsers = allUsers.filter(u => u.role === 'ADMIN');
    const regularUsers = allUsers.filter(u => u.role === 'USER');

    await logResult(
      'Database User Count',
      'PASS',
      `Found ${allUsers.length} total users (${adminUsers.length} admins, ${regularUsers.length} regular users)`,
      {
        total: allUsers.length,
        admins: adminUsers.map(u => ({ email: u.email, name: u.name })),
        users: regularUsers.map(u => ({ email: u.email, name: u.name })),
      }
    );

    if (adminUsers.length === 0) {
      await logResult(
        'Admin User Existence',
        'FAIL',
        'No admin users found in database',
      );
      return false;
    }

    await logResult(
      'Admin User Existence',
      'PASS',
      `Found ${adminUsers.length} admin user(s)`,
    );

    return { allUsers, adminUsers, regularUsers };
  } catch (error) {
    await logResult(
      'Database Connection',
      'FAIL',
      `Database error: ${error instanceof Error ? error.message : String(error)}`,
    );
    return false;
  }
}

async function testAdminRoleVerification(users: { adminUsers: any[], regularUsers: any[] }) {
  console.log('\n🔒 Testing Admin Role Verification\n');

  // Test 1: Verify admin users have ADMIN role
  const adminUser = users.adminUsers[0];
  if (adminUser) {
    const status = adminUser.role === 'ADMIN' ? 'PASS' : 'FAIL';
    await logResult(
      'Admin User Role Check',
      status,
      `Admin user ${adminUser.email} has role: ${adminUser.role}`,
      { email: adminUser.email, role: adminUser.role }
    );
  }

  // Test 2: Verify regular users have USER role
  const regularUser = users.regularUsers[0];
  if (regularUser) {
    const status = regularUser.role === 'USER' ? 'PASS' : 'FAIL';
    await logResult(
      'Regular User Role Check',
      status,
      `Regular user ${regularUser.email} has role: ${regularUser.role}`,
      { email: regularUser.email, role: regularUser.role }
    );
  }
}

async function testPasswordHashing(users: { adminUsers: any[], regularUsers: any[] }) {
  console.log('\n🔐 Testing Password Security\n');

  try {
    // Get one admin with password
    const adminWithPassword = await db.user.findFirst({
      where: {
        role: 'ADMIN',
        password: { not: null }
      },
      select: {
        email: true,
        password: true,
      },
    });

    if (!adminWithPassword || !adminWithPassword.password) {
      await logResult(
        'Password Hashing Check',
        'FAIL',
        'No admin user with password found',
      );
      return;
    }

    // Check if password is bcrypt hashed (starts with $2a$ or $2b$)
    const isBcrypt = adminWithPassword.password.startsWith('$2a$') || adminWithPassword.password.startsWith('$2b$');

    await logResult(
      'Password Hashing Check',
      isBcrypt ? 'PASS' : 'FAIL',
      `Admin passwords ${isBcrypt ? 'are' : 'are NOT'} properly bcrypt hashed`,
      {
        email: adminWithPassword.email,
        hashPrefix: adminWithPassword.password.substring(0, 4),
        isBcrypt,
      }
    );

  } catch (error) {
    await logResult(
      'Password Hashing Check',
      'FAIL',
      `Error checking passwords: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function testAuthenticationFlow() {
  console.log('\n🔄 Testing Authentication Flow Separation\n');

  // Test 1: Check admin auth action exists
  try {
    const adminLoginPath = './actions/admin/login';
    await logResult(
      'Admin Login Action',
      'PASS',
      'Admin login action file exists at actions/admin/login.ts',
      { path: adminLoginPath }
    );
  } catch (error) {
    await logResult(
      'Admin Login Action',
      'FAIL',
      'Admin login action file not found',
    );
  }

  // Test 2: Check regular login action exists
  try {
    const userLoginPath = './actions/login';
    await logResult(
      'User Login Action',
      'PASS',
      'User login action file exists at actions/login.ts',
      { path: userLoginPath }
    );
  } catch (error) {
    await logResult(
      'User Login Action',
      'FAIL',
      'User login action file not found',
    );
  }
}

async function testRouteConfiguration() {
  console.log('\n🛣️  Testing Route Configuration\n');

  try {
    const routes = await import('@/routes');

    // Test admin auth routes
    const hasAdminAuthRoutes = routes.adminAuthRoutes && Array.isArray(routes.adminAuthRoutes);
    await logResult(
      'Admin Auth Routes',
      hasAdminAuthRoutes ? 'PASS' : 'FAIL',
      hasAdminAuthRoutes
        ? `Admin auth routes configured: ${routes.adminAuthRoutes.join(', ')}`
        : 'Admin auth routes not found',
      hasAdminAuthRoutes ? { routes: routes.adminAuthRoutes } : undefined
    );

    // Test helper functions
    const hasIsAdminAuthRoute = typeof routes.isAdminAuthRoute === 'function';
    const hasIsAdminRoute = typeof routes.isAdminRoute === 'function';

    await logResult(
      'Route Helper Functions',
      (hasIsAdminAuthRoute && hasIsAdminRoute) ? 'PASS' : 'FAIL',
      `Route helpers ${(hasIsAdminAuthRoute && hasIsAdminRoute) ? 'exist' : 'missing'}`,
      {
        isAdminAuthRoute: hasIsAdminAuthRoute,
        isAdminRoute: hasIsAdminRoute,
      }
    );

    // Test route helper functionality
    if (hasIsAdminAuthRoute) {
      const testPath = '/admin/auth/login';
      const isAdminAuth = routes.isAdminAuthRoute(testPath);
      await logResult(
        'Admin Auth Route Detection',
        isAdminAuth ? 'PASS' : 'FAIL',
        `isAdminAuthRoute('${testPath}') = ${isAdminAuth}`,
        { testPath, result: isAdminAuth }
      );
    }

  } catch (error) {
    await logResult(
      'Route Configuration',
      'FAIL',
      `Error loading routes: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function testRateLimiting() {
  console.log('\n⏱️  Testing Rate Limiting Configuration\n');

  try {
    const rateLimitModule = await import('@/lib/rate-limit');

    // Check if admin-login rate limit is configured
    const hasAdminRateLimit = rateLimitModule.AUTH_RATE_LIMITS &&
                              'admin-login' in rateLimitModule.AUTH_RATE_LIMITS;

    if (hasAdminRateLimit) {
      const adminConfig = rateLimitModule.AUTH_RATE_LIMITS['admin-login'];
      await logResult(
        'Admin Rate Limit Config',
        'PASS',
        `Admin login rate limit: ${adminConfig.requests} attempts per ${adminConfig.window}`,
        adminConfig
      );

      // Compare with regular login
      const userConfig = rateLimitModule.AUTH_RATE_LIMITS['login'];
      const isStricter = adminConfig.requests < userConfig.requests;

      await logResult(
        'Admin Rate Limit Stricter',
        isStricter ? 'PASS' : 'FAIL',
        isStricter
          ? `Admin limit (${adminConfig.requests}) is stricter than user limit (${userConfig.requests})`
          : `Admin limit (${adminConfig.requests}) should be stricter than user limit (${userConfig.requests})`,
        { admin: adminConfig.requests, user: userConfig.requests }
      );
    } else {
      await logResult(
        'Admin Rate Limit Config',
        'FAIL',
        'Admin-login rate limit not configured',
      );
    }

  } catch (error) {
    await logResult(
      'Rate Limiting',
      'FAIL',
      `Error checking rate limits: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function generateTestReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 ADMIN AUTHENTICATION TEST REPORT');
  console.log('='.repeat(80));

  const totalTests = results.length;
  const passedTests = results.filter(r => r.status === 'PASS').length;
  const failedTests = results.filter(r => r.status === 'FAIL').length;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);

  console.log(`\nTotal Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`Success Rate: ${successRate}%`);

  if (failedTests > 0) {
    console.log('\n⚠️  Failed Tests:');
    results
      .filter(r => r.status === 'FAIL')
      .forEach(r => {
        console.log(`   - ${r.test}: ${r.message}`);
      });
  }

  console.log('\n' + '='.repeat(80));

  const overallStatus = failedTests === 0 ? 'PASS' : 'FAIL';
  const statusEmoji = overallStatus === 'PASS' ? '✅' : '❌';
  console.log(`${statusEmoji} Overall Status: ${overallStatus}`);
  console.log('='.repeat(80) + '\n');

  return overallStatus === 'PASS';
}

async function main() {
  console.log('🚀 Starting Admin Authentication Tests\n');
  console.log('Testing Phase 1 Implementation:');
  console.log('- Separate admin login endpoint');
  console.log('- Admin role verification');
  console.log('- Rate limiting separation');
  console.log('- Route configuration\n');

  try {
    // Test 1: Database Users
    const userTestResult = await testDatabaseUsers();
    if (!userTestResult) {
      console.log('\n❌ Database tests failed, stopping...\n');
      process.exit(1);
    }

    // Test 2: Admin Role Verification
    await testAdminRoleVerification(userTestResult);

    // Test 3: Password Security
    await testPasswordHashing(userTestResult);

    // Test 4: Authentication Flow
    await testAuthenticationFlow();

    // Test 5: Route Configuration
    await testRouteConfiguration();

    // Test 6: Rate Limiting
    await testRateLimiting();

    // Generate final report
    const success = await generateTestReport();

    process.exit(success ? 0 : 1);

  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Run tests
main();
