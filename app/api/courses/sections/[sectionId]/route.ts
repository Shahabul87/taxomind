import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from '@/lib/logger';
import { ApiResponses } from '@/lib/api/api-responses';

export async function GET(req: Request, props: { params: Promise<{ sectionId: string }> }) {
  const params = await props.params;
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return ApiResponses.unauthorized();
    }

    const section = await db.section.findUnique({
      where: {
        id: params.sectionId,
      },
      include: {
        chapter: {
          include: {
            course: true
          }
        },
        videos: true,
        blogs: true,
        articles: true,
        notes: true,
        codeExplanations: true,
      },
    });

    if (!section) {
      return ApiResponses.notFound("Section not found");
    }

    return NextResponse.json(section);
  } catch (error) {
    logger.error("[SECTION_GET]", error);
    return ApiResponses.internal();
  }
} 