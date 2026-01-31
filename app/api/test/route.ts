import { NextRequest, NextResponse } from "next/server";
import { devOnlyGuard } from '@/lib/api/dev-only-guard';

// Simple test endpoint that always returns success
export async function GET(req: NextRequest) {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  return NextResponse.json({ success: true, message: "API endpoint is working" });
}

export async function POST(req: NextRequest) {
  const blocked = devOnlyGuard();
  if (blocked) return blocked;

  try {
    const body = await req.json();
    return NextResponse.json({ 
      success: true, 
      message: "API endpoint is working",
      receivedData: body
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: "Error parsing request body",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 400 });
  }
} 