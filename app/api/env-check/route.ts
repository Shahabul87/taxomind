import { NextResponse } from "next/server";
import { devOnlyGuard } from "@/lib/api/dev-only-guard";
import { adminAuth } from "@/auth.admin";

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
    const blocked = devOnlyGuard();
    if (blocked) return blocked;

    // SECURITY: Require admin authentication even in development
    const adminSession = await adminAuth();
    if (!adminSession?.user) {
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
  } catch (error: unknown) {
    // SECURITY: Don't expose stack traces in error responses
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      error: true,
      message: process.env.NODE_ENV === 'development' ? message : 'Internal server error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 