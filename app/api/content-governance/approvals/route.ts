import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-protection";

// TODO: Implement content approval system when models are ready
export const GET = withAuth(async (request: NextRequest) => {
  try {
    return NextResponse.json({ error: "Content approval system not yet implemented" }, { status: 501 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const POST = withAuth(async (request: NextRequest) => {
  try {
    return NextResponse.json({ error: "Content approval system not yet implemented" }, { status: 501 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
