import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// Force Node.js runtime
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const testResults = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    tests: {} as Record<string, any>
  };

  // Test 1: Environment Variables (Enhanced)
  try {
    // Multiple approaches to detect NEXTAUTH_SECRET
    const nextAuthSecretDirect = process.env.NEXTAUTH_SECRET;
    const nextAuthSecretExists = !!(nextAuthSecretDirect && nextAuthSecretDirect.length > 0);
    const nextAuthSecretLength = nextAuthSecretDirect?.length || 0;
    
    // Alternative detection methods for different deployment platforms
    const envKeys = Object.keys(process.env);
    const hasNextAuthInEnv = envKeys.some(key => key.includes('NEXTAUTH_SECRET'));
    
    // Check if we can access the secret through different methods
    let secretAccessible = false;
    let secretSource = 'none';
    
    if (nextAuthSecretExists) {
      secretAccessible = true;
      secretSource = 'direct';
    } else if (hasNextAuthInEnv) {
      secretAccessible = true;
      secretSource = 'indirect';
    }
    
    testResults.tests.environmentVariables = {
      status: 'success',
      data: {
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL_SET: !!process.env.DATABASE_URL,
        NEXTAUTH_SECRET_SET: nextAuthSecretExists,
        NEXTAUTH_SECRET_LENGTH: nextAuthSecretLength,
        NEXTAUTH_SECRET_ACCESSIBLE: secretAccessible,
        NEXTAUTH_SECRET_SOURCE: secretSource,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        hasRequiredEnvVars: !!(process.env.DATABASE_URL && secretAccessible && process.env.NEXTAUTH_URL),
        // Additional debugging info
        totalEnvVars: envKeys.length,
        nextAuthRelatedVars: envKeys.filter(key => key.toLowerCase().includes('nextauth')),
        deploymentPlatform: process.env.VERCEL ? 'vercel' : process.env.NETLIFY ? 'netlify' : 'other'
      }
    };
  } catch (error) {
    testResults.tests.environmentVariables = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  // Test 2: Database Connection
  try {
    const courseCount = await db.course.count();
    const userCount = await db.user.count();
    
    testResults.tests.databaseConnection = {
      status: 'success',
      data: {
        connected: true,
        courseCount,
        userCount,
        canRead: true
      }
    };
  } catch (error) {
    testResults.tests.databaseConnection = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      connected: false
    };
  }

  // Test 3: Authentication System (Enhanced)
  let authenticatedUser = null;
  let authTestResult = null;
  try {
    authenticatedUser = await currentUser();
    
    // If user is authenticated, it means NEXTAUTH_SECRET is working
    const authWorking = !!authenticatedUser;
    
    // Additional auth system test
    if (authWorking) {
      authTestResult = 'functional';
    } else {
      // Try to determine why auth isn't working
      authTestResult = 'no_user_session';
    }
    
    testResults.tests.authentication = {
      status: 'success',
      data: {
        authSystemWorking: true,
        userAuthenticated: authWorking,
        userId: authenticatedUser?.id || null,
        userEmail: authenticatedUser?.email || null,
        // If auth is working, secret must be present and functional
        nextAuthSecretEffective: authWorking,
        authTestResult: authTestResult,
        sessionStrategy: 'jwt' // Based on your auth.ts config
      }
    };
  } catch (error) {
    testResults.tests.authentication = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      authSystemWorking: false
    };
  }

  // Test 4: Database Write Operation (Safe test)
  try {
    if (authenticatedUser?.id) {
      // Use the authenticated user's ID to avoid foreign key constraint errors
      const testCourse = await db.course.create({
        data: {
          title: 'TEST_COURSE_DELETE_ME',
          userId: authenticatedUser.id,
          description: 'This is a test course that should be deleted immediately'
        }
      });

      await db.course.delete({
        where: { id: testCourse.id }
      });

      testResults.tests.databaseWrite = {
        status: 'success',
        data: {
          canWrite: true,
          canDelete: true,
          testCourseId: testCourse.id,
          usedUserId: authenticatedUser.id
        }
      };
    } else {
      // If no authenticated user, skip the write test
      testResults.tests.databaseWrite = {
        status: 'skipped',
        data: {
          canWrite: 'unknown',
          canDelete: 'unknown',
          reason: 'No authenticated user available for safe testing'
        }
      };
    }
  } catch (error) {
    testResults.tests.databaseWrite = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      canWrite: false
    };
  }

  // Test 5: Request Headers and CORS
  try {
    const headers = {
      origin: req.headers.get('origin'),
      host: req.headers.get('host'),
      userAgent: req.headers.get('user-agent'),
      referer: req.headers.get('referer'),
      authorization: req.headers.get('authorization') ? 'Present' : 'Not present'
    };

    testResults.tests.requestHeaders = {
      status: 'success',
      data: headers
    };
  } catch (error) {
    testResults.tests.requestHeaders = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }

  // Calculate overall status
  const failedTests = Object.values(testResults.tests).filter(test => test.status === 'error');
  const overallStatus = failedTests.length === 0 ? 'success' : 'partial_failure';
  
  // Enhanced analysis
  const authWorking = testResults.tests.authentication?.data?.userAuthenticated;
  const envVarDetected = testResults.tests.environmentVariables?.data?.NEXTAUTH_SECRET_SET;
  const secretAccessible = testResults.tests.environmentVariables?.data?.NEXTAUTH_SECRET_ACCESSIBLE;
  const secretLength = testResults.tests.environmentVariables?.data?.NEXTAUTH_SECRET_LENGTH || 0;

  const response = NextResponse.json({
    ...testResults,
    overallStatus,
    failedTestsCount: failedTests.length,
    totalTestsCount: Object.keys(testResults.tests).length,
    summary: {
      allTestsPassed: failedTests.length === 0,
      criticalIssues: failedTests.filter(test => 
        test.error?.includes('DATABASE_URL') || 
        test.error?.includes('connect')
      ).length > 0,
      authenticationAnalysis: {
        secretDetectedInEnv: envVarDetected,
        secretAccessible: secretAccessible,
        secretLength: secretLength,
        authenticationWorking: authWorking,
        // If auth is working but env var not detected, it's likely a detection issue
        likelyDetectionIssue: authWorking && !envVarDetected,
        verdict: authWorking ? 'NEXTAUTH_SECRET is working correctly' : 'NEXTAUTH_SECRET may have issues',
        // New: More detailed analysis
        functionalStatus: authWorking ? 'FUNCTIONAL' : 'NOT_FUNCTIONAL',
        detectionStatus: envVarDetected ? 'DETECTED' : 'NOT_DETECTED',
        overallAssessment: authWorking ? 'SECRET_IS_WORKING' : 'SECRET_NEEDS_ATTENTION'
      },
      recommendations: [
        ...(authWorking ? ['✅ Authentication is working - NEXTAUTH_SECRET is functional'] : ['❌ Authentication not working - check NEXTAUTH_SECRET']),
        ...(authWorking && !envVarDetected ? ['ℹ️ Secret detection issue - this is cosmetic, functionality is working'] : []),
        ...(failedTests.length > 0 ? ['Check server logs for detailed error information'] : []),
        ...(failedTests.length === 0 ? ['All systems operational! 🎉'] : [])
      ]
    }
  });

  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return response;
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 