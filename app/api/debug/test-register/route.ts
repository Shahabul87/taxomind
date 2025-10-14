import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  const logs: string[] = [];

  try {
    logs.push('1. Starting test registration');

    const body = await request.json();
    logs.push('2. Request body parsed successfully');

    const { email, password, name } = body;
    logs.push(`3. Received data - Email: ${email}, Name: ${name}`);

    // Test database connection
    logs.push('4. Testing database connection...');
    try {
      await db.$queryRaw`SELECT 1 as test`;
      logs.push('5. Database connection: SUCCESS');
    } catch (dbError) {
      logs.push(`5. Database connection: FAILED - ${dbError instanceof Error ? dbError.message : 'Unknown'}`);
      throw dbError;
    }

    // Check if user exists
    logs.push('6. Checking if user exists...');
    try {
      const existingUser = await db.user.findUnique({
        where: { email }
      });
      logs.push(`7. User exists check: ${existingUser ? 'User already exists' : 'User does not exist'}`);

      if (existingUser) {
        return NextResponse.json({
          success: false,
          error: 'Email already in use',
          logs
        }, { status: 400 });
      }
    } catch (userCheckError) {
      logs.push(`7. User check: FAILED - ${userCheckError instanceof Error ? userCheckError.message : 'Unknown'}`);
      throw userCheckError;
    }

    // Hash password
    logs.push('8. Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    logs.push('9. Password hashed successfully');

    // Try to create user
    logs.push('10. Attempting to create user...');
    try {
      const newUser = await db.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });
      logs.push(`11. User created successfully - ID: ${newUser.id}`);

      // Try to create verification token
      logs.push('12. Attempting to create verification token...');
      try {
        const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        const expires = new Date(Date.now() + 3600 * 1000); // 1 hour

        const verificationToken = await db.verificationToken.create({
          data: {
            email,
            token,
            expires
          }
        });
        logs.push(`13. Verification token created successfully`);

        // Try to create auth audit log
        logs.push('14. Attempting to create auth audit log...');
        try {
          await db.authAudit.create({
            data: {
              id: `audit-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              userId: newUser.id,
              email: email,
              action: 'ACCOUNT_CREATED',
              status: 'success',
              details: JSON.stringify({ name }),
              ipAddress: 'test',
              userAgent: 'test'
            }
          });
          logs.push('15. Auth audit log created successfully');
        } catch (auditError) {
          logs.push(`15. Auth audit log: FAILED (non-critical) - ${auditError instanceof Error ? auditError.message : 'Unknown'}`);
        }

        // Cleanup test data
        logs.push('16. Cleaning up test data...');
        await db.verificationToken.delete({
          where: { email_token: { email, token } }
        });
        await db.user.delete({
          where: { id: newUser.id }
        });
        logs.push('17. Test data cleaned up successfully');

        return NextResponse.json({
          success: true,
          message: 'Registration flow test completed successfully!',
          logs
        });

      } catch (tokenError) {
        logs.push(`13. Verification token creation: FAILED - ${tokenError instanceof Error ? tokenError.message : 'Unknown'}`);
        logs.push(`Error code: ${(tokenError as any)?.code}`);

        // Cleanup user if token creation failed
        await db.user.delete({ where: { id: newUser.id } }).catch(() => {});

        throw tokenError;
      }

    } catch (createError) {
      logs.push(`11. User creation: FAILED - ${createError instanceof Error ? createError.message : 'Unknown'}`);
      logs.push(`Error code: ${(createError as any)?.code}`);
      throw createError;
    }

  } catch (error) {
    logs.push(`ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    logs.push(`Error code: ${(error as any)?.code}`);
    logs.push(`Error name: ${(error as any)?.name}`);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: (error as any)?.code,
      logs
    }, { status: 500 });
  }
}

// Also add GET endpoint for quick check
export async function GET() {
  return NextResponse.json({
    message: 'Test registration endpoint. Use POST with { email, password, name } to test registration flow.',
    example: {
      email: 'test@example.com',
      password: 'Test123!',
      name: 'Test User'
    }
  });
}