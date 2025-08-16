import { NextRequest, NextResponse } from "next/server";

// Force Node.js runtime
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Test route is working",
    timestamp: new Date().toISOString(),
    method: "GET"
  });
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({
    message: "DELETE route is working!",
    timestamp: new Date().toISOString(),
    method: "DELETE",
    success: true
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    message: "POST route is working",
    timestamp: new Date().toISOString(),
    method: "POST"
  });
} 