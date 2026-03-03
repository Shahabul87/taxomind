import { NextResponse } from "next/server";

import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ApiResponses } from '@/lib/api/api-responses';

// Force Node.js runtime
export const runtime = 'nodejs';

export async function POST(
  req: Request,
  props: { params: Promise<{ courseId: string; chapterId: string; sectionId: string }> }
) {
  const params = await props.params;
  try {
    const user = await currentUser();
    const { title, code, explanation } = await req.json();

    if (!user?.id) {
      return ApiResponses.unauthorized();
    }

    const sectionOwner = await db.section.findUnique({
      where: {
        id: params.sectionId,
        chapter: {
          courseId: params.courseId
        }
      }
    });

    if (!sectionOwner) {
      return ApiResponses.unauthorized();
    }

    const codeExplanation = await db.codeExplanation.create({
      data: {
        title,
        code,
        explanation,
        sectionId: params.sectionId,
      }
    });

    return NextResponse.json(codeExplanation);
  } catch (error) {

    return ApiResponses.internal();
  }
} 