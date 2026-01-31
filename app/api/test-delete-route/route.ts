import { NextRequest, NextResponse } from "next/server";
import { devOnlyGuard } from '@/lib/api/dev-only-guard';

// Force Node.js runtime
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  return NextResponse.json({
    message: "Test route is working",
    timestamp: new Date().toISOString(),
    method: "GET"
  });
}

export async function DELETE(request: NextRequest) {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  return NextResponse.json({
    message: "DELETE route is working!",
    timestamp: new Date().toISOString(),
    method: "DELETE",
    success: true
  });
}

export async function POST(request: NextRequest) {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  return NextResponse.json({
    message: "POST route is working",
    timestamp: new Date().toISOString(),
    method: "POST"
  });
} 