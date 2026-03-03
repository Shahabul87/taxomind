import { NextResponse } from "next/server";
import { debugGuard } from "@/lib/debug-guard";
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

/**
 * SECURITY FIX: Debug endpoint - only accessible in development or to admins
 * This endpoint is for testing purposes and should not be available in production
 */
export async function GET() {
  // SECURITY: Gate debug endpoint
  const guardResult = await debugGuard();
  if (guardResult) return guardResult;

  return NextResponse.json({
    message: "Simple test endpoint working",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    runtime: 'nodejs'
  });
}

export async function POST(req: Request) {
  // SECURITY: Gate debug endpoint
  const guardResult = await debugGuard();
  if (guardResult) return guardResult;

  try {
    const body = await req.json();
    return NextResponse.json({
      message: "POST request received",
      receivedData: body,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      runtime: 'nodejs'
    });
  } catch (error) {
    logger.error('[SIMPLE_TEST]', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({
      error: "Failed to parse JSON",
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }
} 