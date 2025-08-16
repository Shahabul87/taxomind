import { NextRequest, NextResponse } from "next/server";

// Force Node.js runtime
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  return NextResponse.json({
    message: "Test dynamic route GET is working",
    courseId,
    timestamp: new Date().toISOString(),
    method: "GET"
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  return NextResponse.json({
    message: "Test dynamic DELETE route is working!",
    courseId,
    timestamp: new Date().toISOString(),
    method: "DELETE",
    success: true,
    note: "This proves DELETE routes work - the issue is elsewhere"
  });
} 