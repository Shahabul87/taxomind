import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ApiResponses } from '@/lib/api/api-responses';

// Force Node.js runtime
export const runtime = 'nodejs';

// Handle batch update of all learning objectives
export async function PATCH(req: Request, props: { params: Promise<{ courseId: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();
    const { whatYouWillLearn } = await req.json();

    if (!session?.user?.id) {
      return ApiResponses.unauthorized();
    }

    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: session.user.id,
      },
    });

    if (!course) {
      return ApiResponses.notFound();
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

    return ApiResponses.internal();
  }
}

// Add a new learning objective
export async function POST(req: Request, props: { params: Promise<{ courseId: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();
    const { value } = await req.json();

    if (!session?.user?.id) {
      return ApiResponses.unauthorized();
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
      return ApiResponses.notFound();
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

    return ApiResponses.internal();
  }
} 