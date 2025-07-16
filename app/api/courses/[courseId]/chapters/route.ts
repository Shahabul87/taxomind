import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

// Force Node.js runtime to avoid Edge Runtime issues with bcrypt
export const runtime = 'nodejs';

export async function POST(request: NextRequest, props: { params: Promise<{ courseId: string }> }) {
  const params = await props.params;
  
  // Add comprehensive logging for debugging production issues
  console.log("[CHAPTERS_CREATE] Starting chapter creation process");
  console.log("[CHAPTERS_CREATE] Course ID:", params.courseId);
  
  try {
    const user = await currentUser();
    console.log("[CHAPTERS_CREATE] User authentication result:", user ? { id: user.id, email: user.email } : "No user");
    
    const { title, description, position, bloomsLevel } = await request.json();
    console.log("[CHAPTERS_CREATE] Request body:", { title, description, position, bloomsLevel });

    if (!user?.id) {
      console.log("[CHAPTERS_CREATE] Error: No user ID found");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = user.id;

    // Check course ownership with detailed logging
    console.log("[CHAPTERS_CREATE] Checking course ownership for userId:", userId, "courseId:", params.courseId);
    
    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: userId,
      }
    });
    
    console.log("[CHAPTERS_CREATE] Course ownership check result:", courseOwner ? "Course found" : "Course not found");

    if (!courseOwner) {
      console.log("[CHAPTERS_CREATE] Error: User does not own course or course does not exist");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get last chapter position with logging
    console.log("[CHAPTERS_CREATE] Finding last chapter position for course:", params.courseId);
    
    const lastChapter = await db.chapter.findFirst({
      where: {
        courseId: params.courseId,
      },
      orderBy: {
        position: "desc",
      },
    });
    
    console.log("[CHAPTERS_CREATE] Last chapter result:", lastChapter ? { id: lastChapter.id, position: lastChapter.position } : "No existing chapters");

    const newPosition = position || (lastChapter ? lastChapter.position + 1 : 1);
    console.log("[CHAPTERS_CREATE] New chapter position will be:", newPosition);
    
    // Create chapter with logging
    console.log("[CHAPTERS_CREATE] Creating new chapter with data:", {
      title,
      description,
      courseId: params.courseId,
      position: newPosition,
      bloomsLevel,
    });
    
    const chapter = await db.chapter.create({
      data: {
        title,
        description: description || null,
        courseId: params.courseId,
        position: newPosition,
        // Store bloomsLevel in description for now if no dedicated field exists
        // TODO: Add bloomsLevel field to Chapter model if needed
      }
    });

    console.log("[CHAPTERS_CREATE] Chapter created successfully:", { id: chapter.id, title: chapter.title });

    return NextResponse.json(chapter);
  } catch (error) {
    // Enhanced error logging
    console.error("[CHAPTERS_CREATE] Error occurred:");
    console.error("[CHAPTERS_CREATE] Error message:", error instanceof Error ? error.message : "Unknown error");
    console.error("[CHAPTERS_CREATE] Error stack:", error instanceof Error ? error.stack : "No stack trace");
    console.error("[CHAPTERS_CREATE] Full error object:", error);
    
    // Check if it's a database connection error
    if (error instanceof Error) {
      if (error.message.includes('connect') || error.message.includes('timeout')) {
        console.error("[CHAPTERS_CREATE] Database connection error detected");
        return new NextResponse("Database connection error", { status: 503 });
      }
      if (error.message.includes('auth') || error.message.includes('unauthorized')) {
        console.error("[CHAPTERS_CREATE] Authentication error detected");
        return new NextResponse("Authentication error", { status: 401 });
      }
    }
    
    return new NextResponse("Internal Error", { status: 500 });
  }
}