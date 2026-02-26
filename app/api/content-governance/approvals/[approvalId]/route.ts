import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-protection";

// TODO: Implement content approval system when models are ready
export const GET = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ approvalId: string }> }
) => {
  return NextResponse.json({ error: "Content approval system not yet implemented" }, { status: 501 });
});

export const PATCH = withAuth(async (
  request: NextRequest,
  { params }: { params: Promise<{ approvalId: string }> }
) => {
  return NextResponse.json({ error: "Content approval system not yet implemented" }, { status: 501 });
});
