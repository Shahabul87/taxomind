import { NextResponse } from "next/server";

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    message: "Simple test endpoint working",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    runtime: 'nodejs'
  });
}

export async function POST(req: Request) {
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