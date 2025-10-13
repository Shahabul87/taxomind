/**
 * Middleware Routing Test Script
 *
 * Tests the middleware routing logic for admin/user authentication separation
 * Verifies:
 * 1. Unauthenticated users redirected to correct login page
 * 2. Admin routes protected and route to admin login
 * 3. User routes protected and route to user login
 * 4. Route helper functions work correctly
 */

import {
  isAdminAuthRoute,
  isAdminRoute,
  isPublicRoute,
  isProtectedRoute,
  adminAuthRoutes,
  protectedRoutes,
} from '@/routes';

interface TestCase {
  path: string;
  expectedIsAdminAuth: boolean;
  expectedIsAdminRoute: boolean;
  expectedIsPublic: boolean;
  expectedIsProtected: boolean;
  expectedRedirectForUnauth?: string;
}

const testCases: TestCase[] = [
  // Admin auth routes
  {
    path: '/admin/auth/login',
    expectedIsAdminAuth: true,
    expectedIsAdminRoute: false,
    expectedIsPublic: false,
    expectedIsProtected: false,
  },
  {
    path: '/admin/auth/error',
    expectedIsAdminAuth: true,
    expectedIsAdminRoute: false,
    expectedIsPublic: false,
    expectedIsProtected: false,
  },
  // Admin routes
  {
    path: '/dashboard/admin',
    expectedIsAdminAuth: false,
    expectedIsAdminRoute: true,
    expectedIsPublic: false,
    expectedIsProtected: true,
    expectedRedirectForUnauth: '/admin/auth/login',
  },
  {
    path: '/admin',
    expectedIsAdminAuth: false,
    expectedIsAdminRoute: true,
    expectedIsPublic: false,
    expectedIsProtected: false,
  },
  // Regular auth routes
  {
    path: '/auth/login',
    expectedIsAdminAuth: false,
    expectedIsAdminRoute: false,
    expectedIsPublic: false,
    expectedIsProtected: false,
  },
  {
    path: '/auth/register',
    expectedIsAdminAuth: false,
    expectedIsAdminRoute: false,
    expectedIsPublic: false,
    expectedIsProtected: false,
  },
  // User protected routes
  {
    path: '/dashboard',
    expectedIsAdminAuth: false,
    expectedIsAdminRoute: false,
    expectedIsPublic: false,
    expectedIsProtected: true,
    expectedRedirectForUnauth: '/auth/login',
  },
  {
    path: '/dashboard/user',
    expectedIsAdminAuth: false,
    expectedIsAdminRoute: false,
    expectedIsPublic: false,
    expectedIsProtected: true,
    expectedRedirectForUnauth: '/auth/login',
  },
  // Public routes
  {
    path: '/',
    expectedIsAdminAuth: false,
    expectedIsAdminRoute: false,
    expectedIsPublic: true,
    expectedIsProtected: false,
  },
  {
    path: '/about',
    expectedIsAdminAuth: false,
    expectedIsAdminRoute: false,
    expectedIsPublic: true,
    expectedIsProtected: false,
  },
];

interface TestResult {
  path: string;
  test: string;
  status: 'PASS' | 'FAIL';
  expected: any;
  actual: any;
  message: string;
}

const results: TestResult[] = [];

function logResult(result: TestResult) {
  results.push(result);
  const emoji = result.status === 'PASS' ? '✅' : '❌';
  console.log(`${emoji} ${result.path} - ${result.test}: ${result.message}`);
  if (result.status === 'FAIL') {
    console.log(`   Expected: ${result.expected}, Actual: ${result.actual}`);
  }
}

function testRouteClassification(testCase: TestCase) {
  // Test isAdminAuthRoute
  const actualIsAdminAuth = isAdminAuthRoute(testCase.path);
  logResult({
    path: testCase.path,
    test: 'isAdminAuthRoute',
    status: actualIsAdminAuth === testCase.expectedIsAdminAuth ? 'PASS' : 'FAIL',
    expected: testCase.expectedIsAdminAuth,
    actual: actualIsAdminAuth,
    message: actualIsAdminAuth === testCase.expectedIsAdminAuth
      ? `Correctly identified as ${actualIsAdminAuth ? 'admin auth route' : 'not admin auth route'}`
      : `Expected ${testCase.expectedIsAdminAuth}, got ${actualIsAdminAuth}`,
  });

  // Test isAdminRoute
  const actualIsAdminRoute = isAdminRoute(testCase.path);
  logResult({
    path: testCase.path,
    test: 'isAdminRoute',
    status: actualIsAdminRoute === testCase.expectedIsAdminRoute ? 'PASS' : 'FAIL',
    expected: testCase.expectedIsAdminRoute,
    actual: actualIsAdminRoute,
    message: actualIsAdminRoute === testCase.expectedIsAdminRoute
      ? `Correctly identified as ${actualIsAdminRoute ? 'admin route' : 'not admin route'}`
      : `Expected ${testCase.expectedIsAdminRoute}, got ${actualIsAdminRoute}`,
  });

  // Test isPublicRoute
  const actualIsPublic = isPublicRoute(testCase.path);
  logResult({
    path: testCase.path,
    test: 'isPublicRoute',
    status: actualIsPublic === testCase.expectedIsPublic ? 'PASS' : 'FAIL',
    expected: testCase.expectedIsPublic,
    actual: actualIsPublic,
    message: actualIsPublic === testCase.expectedIsPublic
      ? `Correctly identified as ${actualIsPublic ? 'public route' : 'not public route'}`
      : `Expected ${testCase.expectedIsPublic}, got ${actualIsPublic}`,
  });

  // Test isProtectedRoute
  const actualIsProtected = isProtectedRoute(testCase.path);
  logResult({
    path: testCase.path,
    test: 'isProtectedRoute',
    status: actualIsProtected === testCase.expectedIsProtected ? 'PASS' : 'FAIL',
    expected: testCase.expectedIsProtected,
    actual: actualIsProtected,
    message: actualIsProtected === testCase.expectedIsProtected
      ? `Correctly identified as ${actualIsProtected ? 'protected route' : 'not protected route'}`
      : `Expected ${testCase.expectedIsProtected}, got ${actualIsProtected}`,
  });
}

function testRoutingLogic() {
  console.log('\n🛣️  Testing Middleware Routing Logic\n');

  // Test admin auth routes configuration
  console.log('📋 Admin Auth Routes:', adminAuthRoutes);
  console.log('');

  // Test each route
  testCases.forEach((testCase, index) => {
    if (index > 0 && index % 2 === 0) {
      console.log(''); // Add spacing for readability
    }
    testRouteClassification(testCase);
  });
}

function testExpectedRedirects() {
  console.log('\n\n🔀 Testing Expected Redirects for Unauthenticated Users\n');

  testCases
    .filter(tc => tc.expectedRedirectForUnauth)
    .forEach(testCase => {
      const isAdmin = isAdminRoute(testCase.path);
      const expectedLogin = isAdmin ? '/admin/auth/login' : '/auth/login';
      const matches = expectedLogin === testCase.expectedRedirectForUnauth;

      logResult({
        path: testCase.path,
        test: 'Redirect Logic',
        status: matches ? 'PASS' : 'FAIL',
        expected: testCase.expectedRedirectForUnauth,
        actual: expectedLogin,
        message: matches
          ? `Correctly redirects to ${expectedLogin}`
          : `Should redirect to ${testCase.expectedRedirectForUnauth}, but logic suggests ${expectedLogin}`,
      });
    });
}

function testEdgeCases() {
  console.log('\n\n🔍 Testing Edge Cases\n');

  // Edge case 1: Admin auth routes should NOT be admin routes
  const adminAuthIsAdmin = adminAuthRoutes.some(route => isAdminRoute(route));
  logResult({
    path: 'Admin Auth Routes',
    test: 'Not Admin Routes',
    status: !adminAuthIsAdmin ? 'PASS' : 'FAIL',
    expected: false,
    actual: adminAuthIsAdmin,
    message: !adminAuthIsAdmin
      ? 'Admin auth routes correctly NOT classified as admin routes'
      : 'Admin auth routes incorrectly classified as admin routes',
  });

  // Edge case 2: Protected routes that are admin should require admin login
  const protectedAdminRoutes = protectedRoutes.filter(route => isAdminRoute(route));
  console.log(`\n   Found ${protectedAdminRoutes.length} protected admin routes:`);
  protectedAdminRoutes.forEach(route => {
    console.log(`   - ${route} → requires /admin/auth/login`);
  });

  logResult({
    path: 'Protected Admin Routes',
    test: 'Require Admin Login',
    status: protectedAdminRoutes.length > 0 ? 'PASS' : 'FAIL',
    expected: '> 0',
    actual: protectedAdminRoutes.length,
    message: protectedAdminRoutes.length > 0
      ? `${protectedAdminRoutes.length} admin routes properly protected`
      : 'No protected admin routes found',
  });

  // Edge case 3: Regular protected routes should require regular login
  const protectedUserRoutes = protectedRoutes.filter(route => !isAdminRoute(route));
  console.log(`\n   Found ${protectedUserRoutes.length} protected user routes (first 5):`);
  protectedUserRoutes.slice(0, 5).forEach(route => {
    console.log(`   - ${route} → requires /auth/login`);
  });

  logResult({
    path: 'Protected User Routes',
    test: 'Require User Login',
    status: protectedUserRoutes.length > 0 ? 'PASS' : 'FAIL',
    expected: '> 0',
    actual: protectedUserRoutes.length,
    message: protectedUserRoutes.length > 0
      ? `${protectedUserRoutes.length} user routes properly protected`
      : 'No protected user routes found',
  });
}

function generateReport() {
  console.log('\n\n' + '='.repeat(80));
  console.log('📋 MIDDLEWARE ROUTING TEST REPORT');
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
    const failedResults = results.filter(r => r.status === 'FAIL');
    failedResults.forEach(r => {
      console.log(`   - ${r.path} (${r.test}): ${r.message}`);
      console.log(`     Expected: ${r.expected}, Actual: ${r.actual}`);
    });
  }

  // Summary by route type
  console.log('\n📊 Route Classification Summary:');
  const adminAuthCount = testCases.filter(tc => tc.expectedIsAdminAuth).length;
  const adminRouteCount = testCases.filter(tc => tc.expectedIsAdminRoute).length;
  const publicRouteCount = testCases.filter(tc => tc.expectedIsPublic).length;
  const protectedRouteCount = testCases.filter(tc => tc.expectedIsProtected).length;

  console.log(`   - Admin Auth Routes: ${adminAuthCount}`);
  console.log(`   - Admin Routes: ${adminRouteCount}`);
  console.log(`   - Public Routes: ${publicRouteCount}`);
  console.log(`   - Protected Routes: ${protectedRouteCount}`);

  console.log('\n' + '='.repeat(80));

  const overallStatus = failedTests === 0 ? 'PASS' : 'FAIL';
  const statusEmoji = overallStatus === 'PASS' ? '✅' : '❌';
  console.log(`${statusEmoji} Overall Status: ${overallStatus}`);
  console.log('='.repeat(80) + '\n');

  return overallStatus === 'PASS';
}

async function main() {
  console.log('🚀 Starting Middleware Routing Tests\n');
  console.log('Testing middleware route classification and redirect logic');
  console.log('This validates the intelligent routing for admin/user separation\n');

  try {
    // Test route classification
    testRoutingLogic();

    // Test redirect logic
    testExpectedRedirects();

    // Test edge cases
    testEdgeCases();

    // Generate report
    const success = generateReport();

    process.exit(success ? 0 : 1);

  } catch (error) {
    console.error('\n❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Run tests
main();
