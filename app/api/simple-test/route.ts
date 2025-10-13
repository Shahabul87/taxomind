import { NextResponse } from "next/server";
import { debugGuard } from "@/lib/debug-guard";

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
  } catch (error: any) {
    return NextResponse.json({
      error: "Failed to parse JSON",
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }
} 