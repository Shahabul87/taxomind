import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApiResponses } from '@/lib/api/api-responses';

// Force Node.js runtime
export const runtime = 'nodejs';

export async function PATCH(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string; explanationId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();
    const { title, code, explanation } = await req.json();

    if (!user?.id) {
      return ApiResponses.unauthorized();
    }

    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: user.id,
      }
    });

    if (!courseOwner) {
      return ApiResponses.unauthorized();
    }

    const updatedExplanation = await db.codeExplanation.update({
      where: {
        id: params.explanationId,
        sectionId: params.sectionId,
      },
      data: {
        title,
        code,
        explanation,
      }
    });

    return NextResponse.json(updatedExplanation);
  } catch (error) {

    return ApiResponses.internal();
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string; explanationId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id) {
      return ApiResponses.unauthorized();
    }

    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: user.id,
      }
    });

    if (!courseOwner) {
      return ApiResponses.unauthorized();
    }

    const deletedExplanation = await db.codeExplanation.delete({
      where: {
        id: params.explanationId,
        sectionId: params.sectionId,
      }
    });

    return NextResponse.json(deletedExplanation);
  } catch (error) {

    return ApiResponses.internal();
  }
}

export async function GET(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string; explanationId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();

    if (!user?.id) {
      return ApiResponses.unauthorized();
    }

    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: user.id,
      }
    });

    if (!courseOwner) {
      return ApiResponses.unauthorized();
    }

    const explanation = await db.codeExplanation.findUnique({
      where: {
        id: params.explanationId,
        sectionId: params.sectionId,
      }
    });

    return NextResponse.json(explanation);
  } catch (error) {

    return ApiResponses.internal();
  }
} 