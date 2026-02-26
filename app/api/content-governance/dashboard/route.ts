import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-protection";

// TODO: Implement content governance dashboard when models are ready
export const GET = withAuth(async (request: NextRequest) => {
  try {
    return NextResponse.json({ error: "Content governance dashboard not yet implemented" }, { status: 501 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
