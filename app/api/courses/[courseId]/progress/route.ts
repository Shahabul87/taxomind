import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";


// TODO: Implement user progress tracking when UserProgress model is ready
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const user = await currentUser();
  if (!user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  return NextResponse.json({ error: "User progress tracking not yet implemented" }, { status: 501 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const user = await currentUser();
  if (!user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  return NextResponse.json({ error: "User progress tracking not yet implemented" }, { status: 501 });
}