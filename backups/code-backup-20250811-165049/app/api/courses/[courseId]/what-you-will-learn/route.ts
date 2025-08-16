import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// Force Node.js runtime
export const runtime = 'nodejs';

// Handle batch update of all learning objectives
export async function PATCH(req: Request, props: { params: Promise<{ courseId: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();
    const { whatYouWillLearn } = await req.json();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: session.user.id,
      },
    });

    if (!course) {
      return new NextResponse("Not found", { status: 404 });
    }

    const updatedCourse = await db.course.update({
      where: {
        id: params.courseId,
        userId: session.user.id,
      },
      data: {
        whatYouWillLearn,
      },
    });

    return NextResponse.json(updatedCourse);
  } catch (error) {

    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Add a new learning objective
export async function POST(req: Request, props: { params: Promise<{ courseId: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();
    const { value } = await req.json();

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: session.user.id,
      },
      select: {
        id: true,
        userId: true,
        whatYouWillLearn: true,
      }
    });

    if (!course) {
      return new NextResponse("Not found", { status: 404 });
    }

    // Add the new objective to the existing array
    const currentObjectives = course.whatYouWillLearn || [];
    const updatedObjectives = [...currentObjectives, value];

    const updatedCourse = await db.course.update({
      where: {
        id: params.courseId,
        userId: session.user.id,
      },
      data: {
        whatYouWillLearn: updatedObjectives,
      },
    });

    return NextResponse.json(updatedCourse);
  } catch (error) {

    return new NextResponse("Internal Error", { status: 500 });
  }
} 