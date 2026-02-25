import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";

// Temporarily disabled - needs schema updates for user_progress model
export async function POST(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
) {
  const user = await currentUser();
  if (!user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  return NextResponse.json(
    { error: "Feature temporarily disabled - under maintenance" },
    { status: 503 }
  );
}
