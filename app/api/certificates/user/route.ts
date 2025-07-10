import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { certificateService } from "@/lib/certificate/service";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const certificates = await certificateService.getUserCertificates(session.user.id);

    return NextResponse.json({
      success: true,
      certificates
    });

  } catch (error) {
    console.error("Get user certificates API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}