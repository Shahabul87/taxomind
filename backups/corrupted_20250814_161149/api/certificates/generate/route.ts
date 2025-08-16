import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { certificateService } from "@/lib/certificate/service";
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { courseId, templateId } = await request.json();

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    const result = await certificateService.generateCertificate(
      session.user.id,
      courseId,
      templateId
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      certificate: result.certificate
    });

  } catch (error: any) {
    logger.error("Certificate generation API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}