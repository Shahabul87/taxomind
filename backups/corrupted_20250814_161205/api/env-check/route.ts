import { NextResponse } from "next/server";

export const runtime = 'nodejs';

export async function GET() {
  try {
    const envCheck = {
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      hasDatabase: !!process.env.DATABASE_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      nextAuthUrl: process.env.NEXTAUTH_URL,
      hasPublicAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
      publicAppUrl: process.env.NEXT_PUBLIC_APP_URL,
      vercelEnv: process.env.VERCEL_ENV,
      vercelUrl: process.env.VERCEL_URL,
      runtime: 'nodejs'
    };

    return NextResponse.json(envCheck);
  } catch (error: any) {
    return NextResponse.json({
      error: true,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 