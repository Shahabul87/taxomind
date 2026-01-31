import { NextRequest, NextResponse } from "next/server";
import { devOnlyGuard } from '@/lib/api/dev-only-guard';

// Force Node.js runtime
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

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
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

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