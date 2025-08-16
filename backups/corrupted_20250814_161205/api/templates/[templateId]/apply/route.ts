import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { ContentVersioningService } from "@/lib/content-versioning";
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user || !user.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { templateId } = await params;
    const body = await request.json();
    const { contentType, contentId, customizations = {} } = body;

    if (!contentType || !contentId) {
      return NextResponse.json(
        { error: "Content type and content ID are required" },
        { status: 400 }
      );
    }

    // Apply the template using the versioning service
    const version = await ContentVersioningService.applyTemplate(
      templateId,
      contentType,
      contentId,
      customizations
    );

    // Get the template for response
    const template = await db.aIContentTemplate.findUnique({
      where: { id: templateId },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json({
      version,
      template,
      message: "Template applied successfully"
    });

  } catch (error: any) {
    logger.error("Template apply error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to apply template" },
      { status: 500 }
    );
  }
}