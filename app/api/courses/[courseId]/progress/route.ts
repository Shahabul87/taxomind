import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";


// TODO: Implement user progress tracking when UserProgress model is ready
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    return NextResponse.json({ error: "User progress tracking not yet implemented" }, { status: 501 });
  } catch (error) {
    console.error('[COURSE_PROGRESS] PUT Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    return NextResponse.json({ error: "User progress tracking not yet implemented" }, { status: 501 });
  } catch (error) {
    console.error('[COURSE_PROGRESS] GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
