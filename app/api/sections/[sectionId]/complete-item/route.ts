import { NextRequest, NextResponse } from "next/server";

// Temporarily disabled - needs schema update for completedItems field
export async function POST(
  request: NextRequest,
  { params }: { params: { sectionId: string } }
) {
  return NextResponse.json(
    { error: "Feature temporarily disabled - under maintenance" },
    { status: 503 }
  );
}
