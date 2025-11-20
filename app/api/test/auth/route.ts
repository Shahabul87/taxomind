import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Authentication testing endpoint
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const test = searchParams.get('test') || 'session';
  
  try {
    const results: any = {
      test,
      timestamp: new Date().toISOString(),
    };
    
    switch (test) {
      case 'session':
        // Test current session
        const session = await auth();
        results.hasSession = !!session;
        results.sessionData = session ? {
          userId: session.user?.id,
          email: session.user?.email,
          name: session.user?.name,
          role: session.user?.role,
          expires: session.expires,
        } : null;
        break;
        
      case 'providers':
        // List available auth providers
        results.providers = {
          credentials: true,
          google: !!process.env.GOOGLE_CLIENT_ID,
          github: !!process.env.GITHUB_CLIENT_ID,
          facebook: !!process.env.FACEBOOK_CLIENT_ID,
        };
        results.authConfig = {
          hasSecret: !!process.env.NEXTAUTH_SECRET,
          hasUrl: !!process.env.NEXTAUTH_URL,
          environment: process.env.NODE_ENV,
        };
        break;
        
      case 'jwt':
        // Test JWT functionality
        const testPayload = {
          userId: 'test-user-123',
          email: 'test@example.com',
          timestamp: Date.now(),
        };
        
        if (process.env.NEXTAUTH_SECRET) {
          const token = jwt.sign(
            testPayload,
            process.env.NEXTAUTH_SECRET,
            { expiresIn: '1h' }
          );
          
          const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
          
          results.jwtTest = {
            success: true,
            tokenLength: token.length,
            decoded: decoded,
          };
        } else {
          results.jwtTest = {
            success: false,
            error: 'NEXTAUTH_SECRET not configured',
          };
        }
        break;
        
      case 'bcrypt':
        // Test password hashing
        const testPassword = 'TestPassword123!';
        const hashedPassword = await bcrypt.hash(testPassword, 10);
        const isValid = await bcrypt.compare(testPassword, hashedPassword);
        const isInvalid = await bcrypt.compare('WrongPassword', hashedPassword);
        
        results.bcryptTest = {
          hashLength: hashedPassword.length,
          validPassword: isValid,
          invalidPassword: !isInvalid,
          success: isValid && !isInvalid,
        };
        break;
        
      case 'permissions':
        // Test role-based permissions
        const currentSession = await auth();

        if (currentSession?.user) {
          const user = await db.user.findUnique({
            where: { id: currentSession.user.id },
            select: {
              id: true,
              email: true,
              createdAt: true,
            },
          });

          // Check if user is admin - admins are now in AdminAccount table
          const adminAccount = await db.adminAccount.findUnique({
            where: { id: currentSession.user.id },
          });
          const isAdmin = adminAccount?.role === 'ADMIN' || adminAccount?.role === 'SUPERADMIN';

          results.userPermissions = {
            isAuthenticated: true,
            isAdmin,
            isUser: !isAdmin,
            canAccessDashboard: true,
            canAccessAdmin: isAdmin,
            canCreateCourse: true, // All authenticated users can create courses
          };
          results.userData = {
            ...user,
            adminRole: adminAccount?.role || null,
          };
        } else {
          results.userPermissions = {
            isAuthenticated: false,
            isAdmin: false,
            isUser: false,
            canAccessDashboard: false,
            canAccessAdmin: false,
            canCreateCourse: false,
          };
        }
        break;
        
      case 'cookies':
        // Test auth cookies
        const cookies = req.cookies.getAll();
        const authCookies = cookies.filter(c => 
          c.name.includes('auth') || 
          c.name.includes('session') || 
          c.name.includes('token')
        );
        
        results.cookies = {
          total: cookies.length,
          authRelated: authCookies.length,
          details: authCookies.map(c => ({
            name: c.name,
            hasValue: !!c.value,
            valueLength: c.value?.length || 0,
          })),
        };
        break;
        
      case 'headers':
        // Test auth headers
        const authHeader = req.headers.get('authorization');
        const sessionHeader = req.headers.get('x-session-token');
        
        results.headers = {
          hasAuthorizationHeader: !!authHeader,
          authorizationType: authHeader?.split(' ')[0],
          hasSessionHeader: !!sessionHeader,
          referer: req.headers.get('referer'),
          userAgent: req.headers.get('user-agent'),
        };
        break;
        
      default:
        results.error = 'Unknown test type';
        results.availableTests = [
          'session - Check current session',
          'providers - List auth providers',
          'jwt - Test JWT functionality',
          'bcrypt - Test password hashing',
          'permissions - Check user permissions',
          'cookies - Inspect auth cookies',
          'headers - Check auth headers',
        ];
    }
    
    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        test,
        error: error instanceof Error ? error.message : 'Auth test failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// POST endpoint for auth operations testing
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { operation = 'validate' } = body;
    
    let result;
    
    switch (operation) {
      case 'validate':
        // Validate credentials format
        const { email, password } = body;
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        
        result = {
          operation: 'validate',
          validations: {
            email: {
              provided: !!email,
              valid: emailRegex.test(email || ''),
            },
            password: {
              provided: !!password,
              valid: passwordRegex.test(password || ''),
              requirements: 'Min 8 chars, 1 uppercase, 1 lowercase, 1 number',
            },
          },
        };
        break;
        
      case 'hash':
        // Test password hashing
        const { plainPassword } = body;
        
        if (!plainPassword) {
          result = {
            operation: 'hash',
            success: false,
            error: 'Password required',
          };
        } else {
          const hashed = await bcrypt.hash(plainPassword, 10);
          result = {
            operation: 'hash',
            success: true,
            originalLength: plainPassword.length,
            hashedLength: hashed.length,
            hash: hashed.substring(0, 20) + '...',
          };
        }
        break;
        
      case 'token':
        // Generate test token
        const { userId, expiresIn = '1h' } = body;
        
        if (!process.env.NEXTAUTH_SECRET) {
          result = {
            operation: 'token',
            success: false,
            error: 'NEXTAUTH_SECRET not configured',
          };
        } else {
          const token = jwt.sign(
            {
              userId: userId || 'test-user',
              timestamp: Date.now(),
              test: true,
            },
            process.env.NEXTAUTH_SECRET,
            { expiresIn }
          );
          
          result = {
            operation: 'token',
            success: true,
            token: token.substring(0, 50) + '...',
            tokenLength: token.length,
            expiresIn,
          };
        }
        break;
        
      default:
        result = {
          operation,
          success: false,
          error: 'Unknown operation',
          availableOperations: ['validate', 'hash', 'token'],
        };
    }
    
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Auth operation failed',
      },
      { status: 500 }
    );
  }
}