import { NextResponse } from "next/server";

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    message: "Deployment test successful",
    timestamp: new Date().toISOString(),
    nextjsVersion: "15",
    paramsPattern: "Promise<params> - FIXED",
    deploymentId: Math.random().toString(36).substring(7)
  });
} 