import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";

export const runtime = 'nodejs';

/**
 * SECURITY FIX: Environment check endpoint
 * - Blocked in production for security
 * - Requires ADMIN authentication in development
 * - Never exposes actual environment variable values
 */
export async function GET() {
  try {
    // SECURITY: Block completely in production
    if (process.env.NODE_ENV === 'production') {
      return new NextResponse('Not Found', { status: 404 });
    }

    // SECURITY: Require admin authentication even in development
    const user = await currentUser();
    if (!user || user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // SECURITY: Only return boolean checks, never actual values
    const envCheck = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      checks: {
        database: !!process.env.DATABASE_URL,
        nextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        nextAuthUrl: !!process.env.NEXTAUTH_URL,
        publicAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
        encryptionKey: !!process.env.ENCRYPTION_MASTER_KEY,
        cloudinary: !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        stripe: !!process.env.STRIPE_SECRET_KEY,
        resend: !!process.env.RESEND_API_KEY,
      },
      runtime: 'nodejs',
      // Only show partial info for debugging
      vercelEnv: process.env.VERCEL_ENV || 'not-vercel',
    };

    return NextResponse.json(envCheck);
  } catch (error: any) {
    // SECURITY: Don't expose stack traces in error responses
    return NextResponse.json({
      error: true,
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 