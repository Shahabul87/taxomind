import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";

// TODO: Implement user progress tracking when UserProgress model is ready
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  return NextResponse.json({ error: "User progress tracking not yet implemented" }, { status: 501 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  return NextResponse.json({ error: "User progress tracking not yet implemented" }, { status: 501 });
}